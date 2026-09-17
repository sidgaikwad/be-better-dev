On three servers you can read the logs. On three hundred you cannot, and the question "is the site healthy" stops having an answer you can obtain by looking. Logging, metrics and automation are not optional extras at that size; they are how you know anything at all.

## Logs

Logs are the per-event record: this request came in, this query ran, this exception was thrown. Their value is in answering "what happened to this specific request", which nothing else can answer.

Their problem is volume and location. An error log on one of three hundred machines is invisible, and the machine may be gone by the time you look. So logs go to a centralized service, aggregated and searchable, rather than living on the box that wrote them.

The thing that makes aggregated logs useful rather than merely large is a request id: one identifier generated at the edge and attached to every log line that request produces, across every service it touches. Without it you have three hundred machines' worth of true statements and no way to assemble them into a story. With it, one search returns the whole path of one failure.

## Metrics

Metrics are aggregates over time: not "this request took 340 ms" but "the 99th percentile was 340 ms this minute". Three levels are worth separating:

- **Host level.** CPU, memory, disk I/O, network. Tells you a machine is sick.
- **Aggregated level.** The database tier's throughput, the cache hit rate, queue depth. Tells you a tier is sick, which is what you usually want, since any individual machine being sick is normal at scale.
- **Business level.** Daily active users, signups, revenue. Tells you the system is failing in a way the technical metrics did not catch, which happens more often than engineers expect.

Watch percentiles, not averages. An average response time of 100 ms is consistent with everyone getting 100 ms, and equally consistent with 99% of users getting 50 ms and 1% getting 5 seconds. Those are different systems, and only the second one has angry users. The average is the one number that reliably hides your worst outcomes, and at a million requests a day the 99th percentile is ten thousand people.

## Automation

At three hundred servers, anything done by hand is done inconsistently and eventually done wrong.

Continuous integration verifies every commit automatically, so a break is attributed to the change that caused it while that change is still fresh in someone's head. Automated build, test and deploy removes the class of failure where production differs from staging because a step was skipped at 2am.

The multi-region lesson made this concrete: two data centers that drift apart produce bugs that reproduce for half your users. The only defense is that the same automation puts the same thing in both.

## What this actually buys

The honest framing is time to detect. Most outages are not mysterious, they are ordinary failures that nobody noticed for forty minutes. Instrumentation does not prevent a failure; it changes a forty-minute outage into a four-minute one, and it turns "the site feels slow" into "the 99th percentile on the checkout endpoint tripled at 14:02, right after deploy 8817".

Build it before you need it, because the moment you need it is an outage, and an outage is the worst possible time to discover you cannot see anything.

## Predict, then verify

Average response time is flat at 120 ms all week. Support tickets about slowness are rising sharply. Both observations are accurate. What is happening?

Answer: a small fraction of requests got much slower and the average is absorbing it. If 2% of requests went from 120 ms to 3 seconds, the average moves to about 178 ms, and if that 2% grew from a base where some requests were always slow, the average may barely move at all. Meanwhile the 99th percentile went from around 300 ms to 3 seconds, and the users in that tail are the ones filing tickets. The diagnosis follows from what correlates with the slow tail: one endpoint, one shard, one cache node, one region, one customer whose data grew past some threshold. This is the standard case for percentile metrics, and the reason the first question about any latency number is which percentile it is.
