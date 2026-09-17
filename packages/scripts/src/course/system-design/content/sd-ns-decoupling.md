Start with one notification server. Services call it, it builds payloads and calls the providers. It works, and it has three problems worth naming precisely, because each one points at a different fix.

## What is wrong with one server

**It is a single point of failure.** Every notification in the company flows through it.

**It cannot be scaled in pieces.** Rendering an email template, querying user settings and waiting on a provider are different workloads with different bottlenecks, and one process means scaling all of them together.

**It has a performance ceiling made of other people's latency.** Building HTML and waiting on third-party responses is slow, and a server doing that synchronously spends most of its time blocked. At peak, work arrives faster than it drains and the server falls over.

## The fix

Three changes:

1. Move the database and cache out of the notification server.
2. Run many notification servers behind a load balancer, autoscaled.
3. Put message queues between the servers and the work.

The flow becomes:

1. A service calls the notification API.
2. A notification server validates the request, and fetches user info, device tokens and settings from cache or database.
3. It puts an event on the queue for that channel.
4. Workers pull events from queues.
5. Workers call the third-party providers.
6. Providers deliver to devices.

## One queue per channel

The most important detail, and the one that is easy to miss. iOS push, Android push, SMS and email each get their own queue.

The reason is failure isolation. With one shared queue, SendGrid having a bad hour means email events pile up at the head, workers block on them, and push notifications sit behind email that cannot be delivered. One slow provider degrades every channel.

With separate queues, a SendGrid outage backs up the email queue and nothing else. Push and SMS are unaffected, because they are drained by different workers reading different queues.

This is the same reasoning as back queues in the crawler: separate the things that fail independently so one failure cannot occupy the shared resource.

## What the queue buys

Beyond isolation, the queue does what it did in Part 1:

- **The API returns immediately.** The caller does not wait on a provider.
- **Bursts become depth rather than failure.** A million-recipient campaign is a queue that drains over minutes.
- **Producers and consumers scale separately.** Notification servers scale with API traffic, workers scale with queue depth.

## What it costs

The API can no longer tell the caller whether delivery succeeded, only that the request was accepted. That is a real change to the contract, and it has to be honest: the response is `202 Accepted`, not `200 OK`, and anything needing to know the outcome learns it from a callback or by polling a status endpoint.

## Predict, then verify

You run one worker pool that reads from all four queues in round robin. Twilio starts timing out at 30 seconds per call. What happens to email?

Answer: email is delayed badly, even though nothing is wrong with email. Round robin across queues means each worker takes an SMS event roughly a quarter of the time, and each of those blocks it for 30 seconds. With 100 workers, a quarter of them are blocked on Twilio at any moment, and as the SMS queue grows that share rises, so throughput on every other channel collapses. The separate queues bought you nothing because the workers were shared, which is the point: isolation requires separating the scarce resource, and here the scarce resource is worker threads rather than queues. The fix is a separate worker pool per channel, sized independently, so SMS workers can all be blocked on Twilio while email workers keep draining. The general form is that a bulkhead only works if it is drawn around the thing that actually runs out, and a shared thread pool behind separate queues is a bulkhead drawn in the wrong place.
