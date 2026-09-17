The requirement is stated sharply: notifications may be delayed, they may arrive out of order, they may not be lost. That ranking is what the reliability design optimizes for, and it is worth getting the interviewer to confirm it, because a system that never loses anything and a system that never duplicates anything are different systems.

## Not losing data

Persist before you promise. When a notification event arrives, write it to a notification log database before acknowledging the request and before it goes on the queue.

That ordering is the whole guarantee. Queues can lose messages: a broker crash before the message is replicated, a consumer that acknowledges then dies before doing the work. If the log is written first, none of that is fatal, because the row exists and can be replayed. If the queue is the only record, a lost message is a notification that silently never happened.

The log also gives you a status per notification, which is what makes retries and support questions possible. "Did my customer get the email?" is answerable from a row and unanswerable from a drained queue.

## Retries

When a provider call fails, put the event back on the queue and try again.

Two things to get right:

**Back off.** Retrying immediately against a provider that is down adds load to something already struggling and burns your attempts in seconds. Exponential backoff with jitter spreads the retries out, and the jitter is what stops every failed notification retrying in the same instant.

**Give up.** Retries cannot be infinite. After a bounded number, move the event to a dead letter queue and alert. A notification retrying forever is a notification nobody will look at, and a queue that never drains.

## Exactly once does not exist

Recipients will occasionally get a notification twice, and no amount of care prevents it entirely.

The reason is the gap between doing the work and recording that you did it. A worker calls the provider, the provider delivers, and the worker crashes before marking it sent. On restart the event is still pending, so it sends again. Making the record and the send atomic is impossible because the provider is someone else's system: you cannot commit a transaction across it.

So you reduce duplicates rather than eliminate them. Give each event an id, check whether that id has been seen before sending, and record it after. The window between the provider call and the record is small, so duplicates are rare, and rare is what you are aiming for.

The design choice underneath: given that you cannot have both, prefer at-least-once delivery with deduplication over at-most-once. A duplicate notification is mildly annoying; a missing one can mean a missed flight or an unnoticed fraud alert. That asymmetry decides it, and it is the same asymmetry as the shopping-cart merge in the key-value section.

## Predict, then verify

You add deduplication by event id with a 24-hour window. A campaign sends the same event id to a million users. What happens?

Answer: one person gets it and 999,999 do not, because the dedup key is the event id alone and the second through millionth sends look like duplicates of the first. The bug is in what the key identifies: an event id names the thing that happened, while a notification is the pair of an event and a recipient, so the dedup key has to be both. Keyed on `(event_id, user_id)` the campaign works correctly and a genuine retry to one user is still caught. This is worth raising unprompted, because deduplication is usually added after a duplicate incident, usually under time pressure, and keying it on the wrong tuple converts a duplicate-delivery problem into a silent non-delivery problem, which is strictly worse and much harder to notice.
