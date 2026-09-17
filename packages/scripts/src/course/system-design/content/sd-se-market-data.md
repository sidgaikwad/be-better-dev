The matching engine produces executions. Getting them to thousands of participants, at the same time, is its own problem, and the phrase "at the same time" is doing more work than it looks.

## Three levels of detail

- **L1**: best bid and best ask with their sizes. Enough to know the current price.
- **L2**: several price levels on each side with aggregate volume per level. Enough to see the shape of the book.
- **L3**: every individual order at every level. Enough to reconstruct the book exactly.

All three are projections of the same execution and order stream, which is the property that keeps them consistent: they are not separate queries against a database that could disagree, they are different amounts of detail from one source.

Volume differs enormously. L1 updates when the top of the book changes; L3 updates on every order and cancellation, which for an active symbol is orders of magnitude more. Participants subscribe to what they can consume.

## Fanout

One execution stream, many thousands of subscribers, and the latency budget from the previous lesson still applies: a feed delivering prices milliseconds late is worthless to anyone trading on it.

TCP to each subscriber does not work. A thousand subscribers means a thousand copies serialized by one publisher, so the last one is much later than the first, and lateness is a function of your position in a loop nobody chose.

So exchanges use **multicast**: publish once, and the network delivers to every subscriber. The publisher's work is constant in the number of subscribers, and every subscriber receives at essentially the same moment.

The cost is that multicast is unreliable, with no retransmission and no ordering guarantee. Feeds therefore carry sequence numbers, so a subscriber detecting a gap requests the missing messages over a separate recovery channel. That is the sequencer's numbering again, doing a third job: fairness, recovery, and now gap detection on a lossy transport.

## Fairness is a design requirement

An exchange is a venue whose value is that participants believe it is fair, so equal treatment is a functional requirement rather than an ethical aspiration.

Which makes several ordinary engineering practices unacceptable here:

- **No preferential ordering.** The sequencer assigns arrival order and matching follows it. A queue that favoured larger clients would be a different product, and in most jurisdictions an illegal one.
- **No preferential data.** Everyone gets the same feed at the same time. Publishing to some subscribers before others, even by microseconds, is a tradeable advantage.
- **Colocation is sold evenly.** Participants can rent rack space next to the exchange, and because proximity is an advantage, exchanges equalize it, famously by giving every colocated participant the same length of cable regardless of where their rack sits.

That last detail is worth knowing because it shows how literal the fairness requirement becomes: when the speed of light is a measurable share of your latency budget, cable length is a fairness parameter.

## What the gateway does

Between clients and the order manager sits the client gateway: authentication, protocol translation from whatever the broker speaks into the internal format, and per-client rate limiting.

It is on the critical path, so it is as thin as possible, and anything that can be done outside the path is. Rate limiting is Part 2's section applied where the limit protects fairness and capacity rather than cost.

## Predict, then verify

A market data subscriber detects a sequence gap: it received 5,001 and 5,003. What should it do, and what should it not do?

Answer: request 5,002 on the recovery channel, and critically, not act on 5,003 until the gap is filled. The temptation is to carry on, since one missing message out of thousands seems tolerable, and it is not: market data is cumulative, so an order book reconstructed from L3 updates is only correct if every update is applied in order. A missing message might have been a cancellation, so the subscriber's view now contains an order that no longer exists, and every subsequent update compounds the error silently. Nothing later announces the problem. That is why the sequence number matters more than the messages in a feed like this: it is the only mechanism that turns a silent, permanent divergence into a detectable, recoverable event. Serious subscribers run two independent feeds, usually from different network paths, and use whichever arrives first per sequence number, so a loss on one is covered by the other and recovery requests are rare. The general principle: any stream whose consumer maintains derived state needs gap detection, because otherwise a single lost message is indistinguishable from a message that never existed.
