The delivery worker gets its first real issue to send: 50,000 confirmed subscribers. The obvious loop compiles, and works in staging, where the list is 40 rows:

```rust
for subscriber in confirmed_subscribers {
    tokio::spawn(send_email(subscriber, issue.clone()));
}
```

In production it opens 50,000 concurrent requests against the email provider. The provider starts returning 429 Too Many Requests a few hundred in, file descriptors run out, and memory holds fifty thousand in-flight futures and response buffers at once. Nothing in the code said "all at once". Nothing said otherwise, either. Concurrency limits you do not choose still exist; they are chosen by whichever resource fails first.

## Bounded channels: the producer waits

`tokio::sync::mpsc::channel(32)` builds a queue with capacity 32. `send(job).await` returns immediately while there is room and waits when there is not. That wait is the feature. A full queue is information: the consumer is behind. A bounded channel delivers that information to the producer as delay, pacing production to the speed of consumption. The pressure travels backward through the pipeline, which is where the name backpressure comes from.

`unbounded_channel()` destroys the information instead. `send` always succeeds instantly, so the producer measures itself as healthy while the queue absorbs the overload. The bill arrives later:

- memory: every queued item is live heap, and a queue quietly absorbing ten million jobs is gigabytes
- latency: a new item waits behind the entire queue, so queue growth is delay growth
- diagnosis: the failure surfaces minutes later as an OOM kill, far from the loop that caused it

An unbounded queue does not remove the limit. It relocates the limit to the OOM killer and reports success to the producer in the meantime.

## Semaphore: bounding work in flight

A channel bounds jobs that are waiting. A `Semaphore` bounds jobs that are running:

```rust
use std::sync::Arc;
use tokio::sync::Semaphore;

let limit = Arc::new(Semaphore::new(10));
for subscriber in confirmed_subscribers {
    let permit = limit.clone().acquire_owned().await?;
    tokio::spawn(async move {
        let _permit = permit;         // slot held while sending
        send_email(subscriber).await; // permit drops here: slot freed
    });
}
```

At most ten sends in flight, ever; the loop itself parks at `acquire_owned` when all permits are out. If the pipeline is a stream, the streams section already gave you the one-line spelling of the same idea: `.buffer_unordered(10)`.

Choosing the number is arithmetic, not faith. Ten concurrent sends at roughly 100 ms each is about 100 emails per second, so 50,000 subscribers take around eight minutes. Too slow? Raise the limit deliberately, checked against the provider's documented rate limits, instead of deleting it.

## One level deeper

What does waiting cost? The async-from-scratch section built the machinery: `send` against a full channel stores the task's waker and returns `Poll::Pending`; the task is parked, holding a few hundred bytes and burning no CPU. When the receiver takes an item, exactly one waiting sender is woken. Backpressure at rest is nearly free, which is why bounded is the sensible default rather than a tuning trick applied after an incident.

## Predict, then verify

A producer pushes 1,000 jobs into `mpsc::channel(32)`; the single consumer takes 100 ms per job. Two seconds after the start, where are the 1,000 jobs?

Answer: about 20 are done, about 32 sit in the channel, and the remaining 948 or so do not exist yet. The producer is parked inside `send().await` holding the next job, and everything behind that is still unread database rows. That is the promise of backpressure: work not yet admitted costs nothing. With an unbounded channel, all 1,000 would already be on the heap, the producer would have finished long ago, and the queue would drain for another minute and a half no matter what the process learned about its consumer in the meantime.
