Events are aggregated into windows by event time, and events arrive late. Windowing is how you decide what belongs where, and watermarks are how you decide when to stop waiting.

## Two window types

**Tumbling windows** partition time into fixed, non-overlapping chunks. One-minute tumbling windows mean each event belongs to exactly one window, and this is the right shape for "clicks per ad per minute".

**Sliding windows** overlap and advance on an interval. A three-minute window running every minute answers "top 100 ads in the last 3 minutes", recomputed each minute.

The two queries in the requirements want different shapes, which is why both appear.

## Watermarks

A one-minute window ends at 1:00. An event with event time 0:59 arrives at 1:02. The window is closed, and the event belongs to it.

A **watermark** extends how long a window stays open after its nominal end. With a 15-second watermark, the 0:00 to 1:00 window accepts late events until 1:15 and only then publishes.

The tradeoff is direct:

- **Longer watermark**: catches more late events, more accurate, and every result is delayed by that much.
- **Shorter watermark**: results sooner, and more events miss their window.

There is no correct value, only a business decision. This design has minutes of latency budget, so 15 seconds is nearly free and catches the ordinary network jitter that causes most lateness.

## What watermarks do not fix

A watermark handles slightly late. It does nothing for an event delayed by an hour because a phone had no signal.

The right answer is to not try. Extending the watermark to an hour would delay every result by an hour to catch a tiny fraction of events, which is a terrible trade. Accept that a small number of events miss their window, and correct the total later with reconciliation.

That reasoning is worth stating in exactly those terms: watermarks are for the common case, reconciliation is for the tail, and building one mechanism to handle both makes it bad at the common case.

## Exactly once, here specifically

The message queue section argued that at-least-once plus idempotency is usually right. This system is the exception.

At-least-once means duplicates, duplicates mean over-counting, and over-counting means advertisers are billed for clicks that did not happen. A few percent is millions of dollars, so "a small percentage of duplicates is acceptable" is false here.

So exactly-once, with the cost acknowledged. Duplicates come from two sources:

- **The client**, resending an event. Mostly a fraud and risk problem rather than an aggregation one.
- **The system**, when an aggregator processes events from offset 100 to 110, sends the result downstream, then crashes before acknowledging the upstream offset. On restart it reprocesses 100 to 110 and emits the aggregate twice.

The fix for the second is to make the offset commit and the downstream write atomic, so the aggregate and the position advance together. That is the exactly-once machinery from the message queue lesson, and it is being paid for because billing justifies it.

## Predict, then verify

You use a 15-second watermark. An advertiser disputes a bill, saying their dashboard showed 1,050,000 clicks at the end of the day but they were billed 1,047,000. Who is right?

Answer: both numbers are correct measurements of different things, and the design should have made that explicit rather than letting a customer discover it. The real-time number is the sum of window results published with a 15-second watermark, so it excludes events that arrived later. The billing number comes from end-of-day reconciliation, a batch job over the raw events sorted by event time, which includes the late ones the watermark missed. That is a 0.3% difference, which is exactly the tail the previous section decided not to chase. The system is behaving as designed, and the failure is in presentation: a real-time dashboard should be labeled as provisional, the reconciled figure should be what billing uses and what the advertiser sees after close, and the two should never be presented as the same number. The general lesson is that any system with a fast approximate path and a slow exact path owes its users a clear statement of which one they are looking at, because otherwise every discrepancy becomes a support ticket that engineering has to re-derive.
