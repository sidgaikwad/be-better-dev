Five algorithms are worth knowing. Two are bucket-shaped and cover most real deployments, so start there.

## Token bucket

A bucket holds tokens up to a capacity. Tokens are added at a fixed rate and overflow is discarded. Each request removes one token; if the bucket is empty, the request is refused.

Two parameters:

- **Bucket size**: the maximum tokens the bucket holds.
- **Refill rate**: tokens added per second.

Say the bucket holds 4 and refills at 2 per second. A client idle for a while has 4 tokens and can fire 4 requests instantly. After that they are limited to 2 per second, the refill rate. Stop for two seconds and the bucket is full again.

That behavior is the algorithm's defining feature: it permits bursts up to the bucket size while bounding the long-run average at the refill rate. The bucket size is a savings account for unused quota.

Amazon and Stripe both use it, and it should be your default. It is easy to implement, needs two numbers per client rather than a history, and the burst behavior matches how real clients behave: a page loads and fires eight requests at once, then the user reads for thirty seconds. An algorithm that refuses the eight is technically enforcing an average and practically breaking your product.

The cost is tuning. Two parameters interact, and picking them badly gives you either a limiter that never triggers or one that triggers on normal use.

## How many buckets

Depends on what you are limiting, and the answer is usually "more than you first think".

- Per endpoint per user: if a user may post once per second, add 150 friends per day and like 5 posts per second, that is three buckets per user.
- Per IP: one bucket per address, which for a large service is a lot of buckets.
- Global: one bucket for the whole system, when the limit is about total capacity rather than fairness.

Memory is the constraint. Two numbers per bucket is cheap; 100 million IP addresses times three rules is not, which is why buckets expire when idle.

## Leaking bucket

Requests enter a FIFO queue. If the queue is full, the request is refused. A worker pulls from the queue at a fixed rate.

Two parameters: queue size, and outflow rate.

The difference from token bucket is that the outflow is perfectly smooth. There is no burst, ever, because requests leave at exactly the configured rate. That is right when the thing downstream cannot absorb bursts: a legacy system, a payment processor, a device. Shopify uses this shape.

The cost is the queue. A burst fills it with old requests, and a request that arrives after the burst waits behind them, so a client can be throttled because of traffic that happened before it arrived. Worse, the requests that do get processed may be stale by the time they run.

## Choosing

Take token bucket unless you have a specific reason not to. It matches real client behavior and it degrades sensibly. Take leaking bucket when a smooth outflow is a hard requirement of what is downstream, and accept that you have introduced a queue with all the latency questions a queue brings.

## Predict, then verify

A token bucket holds 100 tokens and refills at 10 per second. A client makes exactly 10 requests per second forever. Are they ever throttled? Now they pause for a minute and resume at 30 per second. What happens?

Answer: never throttled in the first case, since consumption exactly matches refill and the bucket stays wherever it started. In the second, the pause refills the bucket to 100, not 600: overflow is discarded, so the bucket size caps how much credit can accumulate no matter how long the idle period. Resuming at 30 per second spends 30 and earns 10, a net drain of 20 per second, so the 100 saved tokens last 5 seconds. From then on the client is hard-limited to 10 per second. That 5-second window is exactly what the bucket size buys, and it is the parameter to reason about directly: bucket size is how long a client may exceed the limit, not an abstract capacity.
