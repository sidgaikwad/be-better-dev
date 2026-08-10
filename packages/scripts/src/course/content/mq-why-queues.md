Chapter 9's first delivery implementation lived inside the request handler: POST a newsletter issue, and the handler looped over every confirmed subscriber, sending emails one by one while the HTTP client waited.

```rust
// POST /newsletters, the chapter 9 version
for subscriber in get_confirmed_subscribers(&pool).await? {
    email_client.send_email(&subscriber.email, &issue).await?;
}
```

At 40 subscribers in staging, fine. At 50,000 subscribers and 100 ms per send, the response takes 83 minutes. The load balancer gives up at 60 seconds. A crash at email 30,000 loses all progress, and retrying the POST starts over from subscriber one, double-sending 30,000 emails. Every one of those failures traces to a single implicit decision: the work's lifetime was tied to the request's lifetime.

## Split the loop, insert a buffer

A queue cuts that loop in half and puts a buffer between the halves:

- The **producer** (the handler) records what should happen: one enqueued job per subscriber. It finishes in milliseconds, and the 200 changes meaning, from "delivered" to "accepted".
- The **consumer** (a worker process) drains jobs at its own pace, with its own concurrency limit, its own retry policy, its own lifetime.

That one indirection buys four distinct things, and they are worth keeping distinct:

1. **Decoupled speeds.** The handler runs at Postgres speed; the worker runs at email-provider speed. Neither waits for the other.
2. **Absorbed spikes.** A launch-day burst becomes queue depth, not timeouts. Depth drains when the burst passes.
3. **Isolated retries.** A bounced send retries inside the worker, invisible to any request. One bad address no longer aborts a 50,000-email run.
4. **Reclassified work.** Anything that outlives a request (emails, exports, webhook deliveries) stops pretending to be request handling.

You have already built this buffer twice. Part 2's backpressure lesson used `mpsc::channel(32)` to pace a producer to its consumer inside one process. Chapter 11 rebuilt it across processes: the `issue_delivery_queue` table in Postgres, workers claiming rows with `FOR UPDATE SKIP LOCKED`. A message broker is the third form of the same idea: a buffer that lives outside your process, survives restarts, and serves many producers and consumers over a network. This section is about what dedicated brokers add, what they cost, and what each one actually promises.

## One level deeper: depth is the truth

The most honest number a queued system produces is depth over time. Flat near zero: consumers keep up. Sawtooth: bursts arrive and drain, the queue earning its keep. Climbing steadily: arrivals exceed drain rate, and no buffer fixes that, because a queue stores overload instead of serving it. The arithmetic is blunt: 120 jobs per second arriving against 100 drained accumulates 72,000 jobs in an hour, and every queued job adds its wait to the latency of everything behind it. Depth divided by drain rate tells you exactly how far behind your users the system is running, which makes it the first metric to graph and alert on. A queue makes overload visible, survivable, and measurable. It never adds capacity.

## Predict, then verify

A product launch drives 20,000 signups in five minutes; each signup enqueues one confirmation email; workers send 50 per second. What does queue depth do, and how late is the worst-off user's email?

Answer: the burst arrives at about 66 per second against a 50 per second drain, so depth grows by 16 per second for 300 seconds and peaks near 5,000 as the burst ends, then drains to zero in about 100 seconds. The worst-off user, enqueued at the peak, waits roughly 100 seconds for a confirmation email, and every signup request returned instantly. Now change one word: if signups held at 66 per second all day, depth would climb by almost 60,000 per hour with no ceiling. Spikes are the queue's job; a sustained deficit is a capacity problem, and a buffer cannot fix it.
