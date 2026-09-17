Two decisions account for most of the throughput. Whether brokers push to consumers or consumers pull from brokers, and how aggressively everything is batched.

## Push

The broker sends messages to consumers as they arrive.

**For.** Lowest latency, since a message goes out the moment it is received.

**Against.** The broker sets the pace, and it has no idea what the consumer can handle. If consumption falls behind production, consumers are overwhelmed, and a mixed fleet with different processing speeds cannot all be served at one rate.

## Pull

Consumers ask for messages from their current offset.

**For.** The consumer controls the rate. Real-time consumers can poll constantly while a batch consumer reads once an hour, from the same topic. A consumer falling behind is not a crisis: it catches up, or you add consumers.

Pull is also what makes batching work. A consumer asks for everything after its offset up to a size limit, so it naturally receives a large block. Under push the broker sends one message at a time and a backed-up consumer just accumulates them in a buffer.

**Against.** A consumer with nothing to read polls anyway, burning requests on empty answers. Long polling fixes it: the request waits on the broker for up to some interval and returns as soon as anything arrives, so an idle consumer costs one held connection instead of a spin loop.

Take pull. Most message queues do, and the reason is consumer control: the broker cannot know what a consumer can absorb, and a system where the slow party sets the pace degrades gracefully while one where the fast party sets it does not.

## The consumer flow

1. A consumer joins group 1 and subscribes to topic A, finding its coordinator by hashing the group name.
2. The coordinator confirms membership and assigns it partition 2.
3. The consumer fetches from its last committed offset.
4. It processes the messages and commits the new offset.

The order of steps 3 and 4 relative to processing is what decides delivery semantics, which is two lessons away.

## Batching everywhere

Producers batch, brokers batch, consumers batch, and it is the single largest performance lever in the design.

**Network.** One request carrying 1,000 messages amortizes a round trip across all of them. At a few hundred microseconds per round trip, per-message round trips would dominate everything.

**Disk.** The broker appends large chunks rather than individual messages, producing longer sequential writes and larger contiguous regions in page cache. Both make the sequential throughput from the previous lesson achievable.

## The tradeoff

Batching trades latency for throughput, and the dial is the batch size.

A message waits for its batch to fill or for a timer to expire, so a larger batch means better throughput and higher latency for the first message in it. Tuned as a traditional low-latency queue, use small batches and accept worse disk throughput, compensating with more partitions. Tuned for log aggregation, use large batches and accept that a message may wait.

This is the one knob an interviewer is most likely to probe, because it is where "high throughput" and "low latency" in the requirements are in direct conflict, and the honest answer is that you cannot have both maximally and the batch size is where you choose.

## Predict, then verify

A producer batches for up to 100 ms or 64 KB. Traffic drops to one small message per second. What is the latency?

Answer: about 100 ms per message, because the size trigger never fires and every message waits out the full timer. The batching is doing nothing useful, since a batch of one amortizes nothing, and it is adding the maximum possible delay. That is the awkward property of a size-or-time batch: it behaves worst at low volume, which is the opposite of where you would expect tuning to hurt, and it is why a system that looks fast under load can look sluggish in a quiet test environment. The fix is to make the timer adaptive, sending immediately when the previous batch left the buffer empty and lengthening the window only when messages are actually queuing behind each other. That way the latency cost is paid only when there is throughput to gain, which is the right shape: batching should cost nothing when there is nothing to batch.
