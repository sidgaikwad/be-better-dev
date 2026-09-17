Three guarantees are possible about how many times a message is delivered, and the difference between them comes down to the order of two operations.

## At most once

The producer sends and does not retry. The consumer commits its offset before processing.

Messages can be lost and never duplicated. Producer `ack=0` gives this on the write side; committing before processing gives it on the read side, since a crash after the commit means the message is never reprocessed.

For monitoring, metrics and logs, where volume is enormous and a missing point changes no conclusion.

## At least once

The producer retries until acknowledged, with `ack=1` or `ack=all`. The consumer commits **after** processing succeeds.

Nothing is lost. Duplicates happen, in two places: a producer retry after an acknowledgement was lost in transit delivers the message twice, and a consumer that processes then crashes before committing reprocesses on restart.

This is the default and the one the requirements demanded. Combined with idempotent consumers, it is what most systems actually run: a unique key per message lets a duplicate be rejected at the database, which is the same conclusion the notification system reached.

## Exactly once

Every message processed once, no loss, no duplication. Expensive in both performance and complexity.

Expensive because it is not really a delivery guarantee. The network can always deliver twice, so what exactly-once systems actually do is deliver at least once and deduplicate atomically with the processing, which requires the consumer's side effect and its offset commit to happen in one transaction. That is straightforward when the side effect is a write to the same system holding offsets, and hard or impossible when it is a call to an external service.

For payments, trading and accounting, where duplication is unacceptable and the downstream cannot be made idempotent. When it can be made idempotent, at-least-once plus idempotency is cheaper and gets you the same outcome.

## The order of two operations

The consumer's semantics are decided by one ordering:

```text
commit offset, then process   -> at most once
process, then commit offset   -> at least once
process and commit atomically -> exactly once
```

Two lines of code in different orders, and a guarantee that changes what the system promises. Being able to say that plainly is most of the answer here.

## Configurable

The requirements asked for all three, selectable by the user, and the design supports it because the pieces are independent: producer ack setting and retry policy on one side, consumer commit ordering on the other. Different topics on one cluster can run different semantics, which matters because a real deployment carries payment events and debug logs on the same infrastructure.

## Predict, then verify

A consumer processes a message, writes to a database, and crashes before committing its offset. On restart it reprocesses. The database write was an `INSERT` of an order. What is the damage, and how do you prevent it?

Answer: a duplicate order, which is a real business problem rather than a tidiness one, and the queue cannot prevent it because the queue's job ended when it delivered the message twice, which is what at-least-once promised. The fix belongs in the consumer and is idempotency: give each message a stable id, make it the order's primary key or a unique constraint, and the second insert fails harmlessly. That turns an at-least-once queue into an effectively-exactly-once pipeline without any coordination, which is why it is the standard answer and why "make consumers idempotent" appears in the message queue lesson of Part 1. The alternative, real exactly-once, requires the insert and the offset commit to be one transaction, so the offsets would have to live in the same database as the orders rather than in the broker. That is a genuine design, and it costs you the broker's own offset management and ties your consumer to one database. Prefer the unique key.
