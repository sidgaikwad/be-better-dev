09:07, the pager fires: fast burn on the delivery SLO (99% of issue emails delivered within 10 minutes, 30-day window). The dashboard shows end-to-end delivery latency p99 climbing past 10 minutes between 09:00 and 09:10, and the panel's history shows the same wall, every morning, for nine days. Nothing was deployed nine days ago. You will diagnose this from telemetry alone: each step is a hypothesis, the query that tests it, and the evidence, which mostly says no. The disconfirmations are not waste; each one prices a fix you now know not to buy.

## Step 1: Postmark is slow in the morning

Everyone sends newsletters at 09:00; maybe the provider is drowning. Query the per-call service time:

```promql
histogram_quantile(0.99,
  sum by (le) (rate(email_send_duration_seconds_bucket[5m])))
```

Evidence: a flat 210ms through the spike, identical to 03:00. Disconfirmed. This is the metrics lesson's distinction doing work: end-to-end latency includes waiting, send duration is pure service time. The time is not being spent inside the sends.

## Step 2: failures and retries

Retries would inflate end-to-end latency while individual attempts stay fast. Query: `rate(newsletter_send_failures_total[5m])`, and the API error ratio. Evidence: zero all morning. Disconfirmed. Whatever this is, nothing is erroring, which also rules out the retry-storm shapes from the fault tolerance section.

## Step 3: workers starved of connections

The workers share a pool; maybe the 09:00 API traffic starves them. Query the acquire-wait histogram around `pool.acquire()`. Evidence: p99 acquire wait rises from 3ms to 9ms during the window. This is the trap step: a graph that moves during the incident looks guilty. But hold it against the effect: we are hunting minutes, and this accounts for milliseconds, five orders of magnitude short. A cause must be commensurate with its effect. Disconfirmed, and the "double the pool size" fix is priced at worthless before anyone spends a sprint on it.

## Step 4: nobody is slow, so someone is waiting

Service time flat, errors zero: latency must be queueing. Query the gauge: `delivery_queue_depth`. Evidence, finally: flat at zero all night, a vertical wall to 52,000 at 09:00 (the daily digest publishes on the hour, one enqueued task per subscriber), then a straight-line drain hitting zero at 09:10:20. The drain slope is about 84 tasks per second, exactly 16 worker sends at ~190ms each, the concurrency chosen back in the worker pools lesson. Arithmetic closes the case: 52,000 / 84 ≈ 620 seconds. The last emails wait ten minutes because they stand behind 51,999 others. The p99 is the queue, nothing else.

## Step 5: one trace to confirm the absence

Click an exemplar dot from the slowest delivery-latency bucket at 09:09. The trace, stitched across both processes by the traceparent column: `publish_issue` span at 09:00:07, `enqueue` 41ms, then nothing for 9 minutes 24 seconds, then `claim` 6ms, `send_email` 213ms. No span is slow. The latency lives in the gap where no code was running on this task at all. That is the disconfirming evidence for the last tempting hypothesis, "something inside the worker got slower": queue wait is invisible as work and visible only as absence.

Why nine days ago? The subscriber count crossed roughly 50,400, the population where drain time exceeds 600 seconds. Nothing broke. A number grew past a threshold nobody had computed.

The fixes now aim at the actual mechanism, each one a slope or an arrival curve: raise send concurrency (more slope), autoscale workers on oldest-task age (the symptom itself), spread the digest send over a window (flatten the wall), or batch API calls to Postmark (cheaper per send). And the alert did its job: it fired on the symptom while every cause-shaped graph except the right one stayed innocent.

## Predict, then verify

The team doubles send concurrency from 16 to 32. Tomorrow at 09:00, what does the queue-depth panel look like, and does the SLO hold at 60,000 subscribers?

Answer: the same 60,000-task wall (arrivals have not changed), drained at ~168/s: empty in about 6 minutes, p99 near 6 minutes, SLO green with headroom to roughly 100,000 subscribers. The shape stays a sawtooth; only the slope doubled. That is the discipline the whole section was building: capacity fixes are arithmetic you verify against the objective before shipping, using the same three signals that found the problem.
