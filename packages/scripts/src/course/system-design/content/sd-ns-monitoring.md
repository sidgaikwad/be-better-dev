A notification system fails quietly. Nothing crashes, no error rate spikes, and notifications simply arrive late or not at all, which nobody reports because nobody knows what they did not receive. Instrumentation is how you find out.

## Queue depth is the vital sign

The single most useful metric is the number of queued notifications per channel.

It is a direct statement about whether workers are keeping up. Depth near zero means capacity exceeds arrival. Depth growing steadily means the opposite, and the growth rate tells you by how much.

This is the queue-depth reasoning from Part 1, and the same caveat applies: depth alone says something is wrong and not what. Depth plus time-per-message distinguishes the cases. Arrival up with processing time flat is a traffic increase, so add workers. Arrival flat with processing time up is a regression or a slow provider, and adding workers treats the symptom.

Alert on depth, and alert on the derivative. A queue holding 50,000 and draining is fine; a queue holding 5,000 and growing at 500 a minute is an incident that has not happened yet.

## Per-provider health

Track success rate, latency and error codes per provider separately, because they fail separately.

Provider latency is worth watching at percentiles for the reason the observability lesson gave: an average that looks fine hides the case where 2% of calls take 30 seconds, and 30-second calls are what occupy your workers.

Error codes are worth parsing rather than counting. An invalid device token is a data problem you fix by deleting a row. A 429 is a rate limit you fix by slowing down. A 500 is the provider's problem and you retry. Counting them all as "errors" loses the distinction that tells you what to do.

## Delivery, not sending

Your system knows it handed a notification to APNs. That is not the same as the notification reaching a phone, and the gap is where the interesting failures live.

Track what the providers tell you: bounces and spam complaints for email, undeliverable numbers for SMS, invalid tokens for push. A rising bounce rate is a deliverability problem that will eventually get your sending domain blocked, and it is invisible in any metric that stops at "sent".

## Engagement

Open rate, click rate, and how often users disable notifications after receiving one.

That last one is the metric the whole previous lesson was about, and it is the one most systems do not track. Opt-out rate per notification category tells you which of your notifications is costing you the channel. A campaign with a good click rate and a terrible opt-out rate is not a success, and only one of those numbers is usually on the dashboard.

## Predict, then verify

Push delivery rate has fallen from 98% to 91% over three months. Queue depth is normal, worker latency is normal, and the error rate is unchanged. What is happening?

Answer: dead device tokens are accumulating, exactly as the first lesson predicted. Every metric on your side is healthy because your side is healthy: you build the payload, call APNs, and get a response, all promptly. The responses increasingly say the token is invalid, and if you count that as a normal response rather than as an error, your error rate does not move. Meanwhile the denominator of "delivery rate" includes sends to installations that no longer exist, so the ratio drifts down at whatever rate users reinstall or replace phones. The diagnosis follows from the shape: a slow, monotonic decline with no operational symptom is almost always an accumulating data problem rather than a system one. The fix is to act on invalid-token responses by deleting the row, and the lesson is that a third-party response is data to be processed, not a status code to be checked.
