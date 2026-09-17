One billion clicks a day is about 12,000 per second average, and peaks are far higher. Scaling the pipeline is routine; proving the number is right is not.

## Scaling the aggregation

Aggregation is map-reduce: map partitions events by `ad_id`, reduce sums each partition's counts.

Two ways to raise throughput:

**Threads per node.** Assign different `ad_id` ranges to different threads within a process. Easy, no dependencies, and bounded by one machine.

**More nodes on a resource manager**, YARN or equivalent. More operational machinery, and it scales by adding computers rather than cores.

Option 2 is what gets used, because the ceiling matters more than the setup cost.

Partition the queue by `ad_id` so all events for one ad reach one aggregator and its running count lives in one place. That is the keying rule from the message queue section, and here it is a correctness requirement rather than an optimization: counts for one ad split across two aggregators would each be partial.

## The hot ad

Keying by `ad_id` means a single extremely popular ad is one partition on one aggregator, and a Super Bowl campaign can be orders of magnitude above the median.

This is the celebrity problem from Part 1 in a new costume, and the fix rhymes: split the hot key. Append a random suffix to make `ad_id_1` through `ad_id_N`, aggregate each independently across N partitions, and sum the N partial counts at query time.

The cost is that reading a count for a hot ad becomes N reads instead of one, and you must know which ads are split. Apply it only to ads measured as hot rather than to everything, which means the system needs to detect hotness and adjust, since which ad is hot changes by the hour.

## Reconciliation

The hard part, and the reason correctness is a section rather than a sentence.

Banks reconcile against the counterparty's records. Here there is no second party: nobody else counted your clicks, so there is nothing external to compare against.

What you can do is compare two computations over the same raw data. At end of day, run a batch job that sorts raw events by event time per partition and recomputes the totals, then compare against what the real-time path published.

The two will not match exactly, and that is expected rather than a bug: the real-time path used watermarks and missed the late tail, while the batch job sees everything that ever arrived. The discrepancy should be small and stable, and the useful signal is when it changes. A reconciliation gap that is normally 0.3% and jumps to 4% means something broke, and that is a much better alert than any individual metric.

For higher accuracy, reconcile hourly rather than daily, which narrows how long a problem can go unnoticed.

## Monitoring the data, not just the system

Standard infrastructure metrics tell you the aggregators are up. They say nothing about whether the numbers are right.

Track the aggregation itself: end-to-end latency from event time to published result, how many events arrive after their watermark, the reconciliation gap, and the total event count against the same hour last week. A pipeline can be perfectly healthy by every system metric while silently dropping a partition's worth of events, and only a data-level metric catches that.

## Predict, then verify

Reconciliation shows the batch total is 2% higher than the real-time total, every day, consistently. Is something broken?

Answer: probably not, and the consistency is what tells you. A stable gap in one direction, with batch always higher, is the expected signature of watermarks: the real-time path publishes before the late tail arrives and the batch job counts everything, so batch should always be the larger number by roughly the late-event rate. A 2% late rate is plausible for mobile traffic with intermittent connectivity. What would indicate a bug is a gap that changes shape: a sudden jump, a gap that reverses so real-time exceeds batch, which can only mean double counting, or a gap that varies wildly day to day. So the metric to alert on is not the gap itself but its deviation from its own baseline, which is the same reasoning as the notification system's delivery rate: a slow monotonic number is context, and a change in it is the signal. Worth adding that if the 2% is genuinely late events, the billing figure should be the batch number, and the real-time dashboard should say it is provisional.
