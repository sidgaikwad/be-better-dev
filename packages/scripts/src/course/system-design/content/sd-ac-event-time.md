Counting clicks sounds like incrementing a number. It is one of the hardest systems in this part, because the count decides how much money changes hands and the events do not arrive in the order they happened.

## Scope

- Input: log files on many servers, appended with `ad_id, click_timestamp, user_id, ip, country`
- 1 billion clicks per day, 2 million ads, growing 30% a year
- Three queries: clicks for an ad in the last M minutes; the top 100 ads in the past minute; both filterable by ip, user or country
- A few minutes of end-to-end latency is acceptable

That last point is worth contrasting. Real-time bidding must answer in under a second. Aggregation is for billing and reporting, so minutes are fine, and being explicit about which one you are designing prevents solving a much harder problem than asked.

The non-functional requirement that dominates: correctness. A few percent of error is millions of dollars.

## Two timestamps

Every event has two times, and confusing them is the central bug of stream processing.

**Event time.** When the click happened, according to the client.

**Processing time.** When your system received it.

|                 | For                                              | Against                                                      |
| --------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| Event time      | The client knows exactly when the click happened | Client clocks are wrong, and the value can be forged         |
| Processing time | Server-side and reliable                         | Meaningless if the event arrives much later than it occurred |

Use event time. Billing has to attribute a click to the minute it happened, not the minute the network delivered it, and a mobile client that was offline for an hour must not have its clicks counted against the hour it reconnected. That is the same conclusion as the Google Maps location stream, where using ingestion time would report traffic from two minutes ago as current.

The cost is real: client clocks are wrong and can be manipulated, so event times need sanity bounds, and manipulation is a fraud problem rather than an aggregation one.

## Events arrive late

Choosing event time creates the problem the rest of the section is about. Aggregating into one-minute windows by event time means an event with event time 0:59 arriving at 1:03 belongs to a window that has already been computed and published.

Late arrival is normal, not exceptional: a phone with no signal, a retried request, a server that buffered. There is no arrival deadline.

So you must decide when a window is finished, knowing that more data for it may still come.

## The architecture

**Lambda** runs a batch layer and a streaming layer in parallel, with the serving layer merging them. Two code paths computing the same thing, which means two implementations to keep in agreement, and every bug fix applied twice.

**Kappa** runs one streaming path, and reprocesses history by replaying it through the same code.

Take Kappa. One implementation, and recalculation is replay through the path you already trust. When a bug is found in aggregation, you fix it once and replay the raw data from the point the bug appeared, which is only possible because raw events are retained.

Route the replay through a dedicated aggregation instance rather than the live one, so historical reprocessing does not compete with current traffic.

## Predict, then verify

An event's client-supplied timestamp says it happened three hours in the future. What do you do?

Answer: reject or clamp it, and count it in a monitoring metric rather than silently dropping it. The clock is wrong or the value was forged, and both have the same consequence if you accept it: the event lands in a window three hours ahead, which will eventually be published with an inflated count that no reconciliation will explain, because the raw data says it happened then. Accepting future-dated events also gives anyone who can forge a timestamp direct control over which billing period a click lands in. The bound is easy, since an event cannot legitimately have happened after it arrived, so anything more than a small skew allowance into the future is invalid. The reason to count them rather than drop them quietly is that a sudden rise in rejections means something real: a client with a broken clock, a bad SDK release, or someone probing. This is the general rule for any system ingesting client-supplied time: validate against the server's clock, and treat the rejection rate as a signal rather than as noise.
