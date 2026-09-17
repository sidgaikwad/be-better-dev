Chapter 11 left the newsletter with a queue made of a table:

```sql
SELECT newsletter_issue_id, subscriber_email
FROM issue_delivery_queue
FOR UPDATE SKIP LOCKED
LIMIT 1
```

Workers claim a row, send, delete the row; enqueueing happened inside the same transaction that created the issue. It works. This lesson migrates it to RabbitMQ, and the point of the exercise is as much what breaks as what improves.

## What improves

- **Latency and idle load.** `SKIP LOCKED` workers poll, so every empty poll is a query and the poll interval is a latency floor. With lapin, the broker pushes: a published job is inside a worker's handler within milliseconds, and an idle system is silent.
- **The database stops moonlighting.** Every delivered email was an INSERT plus a DELETE against the Postgres that also serves signups. Delete-heavy queue tables churn dead tuples and keep autovacuum busy; at volume, queue traffic and request traffic contend for the same buffer cache and disk. The broker takes that elsewhere.
- **Retries get vocabulary.** Chapter 11's worker logged a failed send and moved on; retry policy was an acknowledged gap. Redelivery flags, retry budgets, dead-letter queues: the hand-rolled TODO becomes configuration you learned two lessons ago.
- **Fan-out exists.** A second consumer of delivery events (analytics, a webhook notifier) is one binding away, not another `SKIP LOCKED` loop competing for rows.

## What breaks: the enqueue transaction

The chapter 11 enqueue was the quiet masterpiece:

```rust
let mut tx = pool.begin().await?;
insert_newsletter_issue(&mut tx, &issue).await?;
enqueue_delivery_tasks(&mut tx, issue_id).await?; // same transaction
tx.commit().await?;
```

Issue and jobs commit atomically; no state exists where one is present without the other. RabbitMQ cannot join a Postgres transaction. Publish before commit, and a rollback leaves workers delivering an issue that does not exist. Publish after commit, and a crash between commit and publish leaves an issue that will never deliver. No ordering of two systems closes the window. The standard repair is the **outbox pattern**: write the jobs to an outbox table inside the business transaction (chapter 11's table, back under a new name), and let a relay read the outbox, publish to the broker, and delete on confirm. You recover transactional enqueue; you pay one more moving part, and publishing itself becomes at-least-once, absorbed as always by the idempotent consumer. The event-driven section builds this properly.

A smaller version of the same loss sits on the consumer side: the old worker could record the delivery and delete the queue row in one transaction, while ack-to-broker and write-to-Postgres are two systems again. Nothing new is required, the idempotency record was already the answer to redelivery, but the count of failure windows went up, not down.

## The honest case for the table

- Transactional enqueue with the business write, no outbox, no relay.
- One system to operate, back up, monitor, and restore; the queue inherits your Postgres durability story.
- `SKIP LOCKED` sustains hundreds to thousands of jobs per second on ordinary hardware, orders of magnitude beyond a newsletter.
- The queue is queryable: depth is a `SELECT count(*)`, and an incident fix is an UPDATE, not broker tooling.

Migrate when a measurement says to: queue churn visibly degrading the request path, consumers in other services that should not share your database, real fan-out needs, or throughput past what row locking sustains. "Postgres is not a real queue" is not a measurement. At the newsletter's scale, the table is not the naive option; it is the option with the strongest guarantee and the smallest surface, and the broker is the trade you make knowingly when its specific gifts (push latency, retry vocabulary, fan-out, throughput) are the thing you lack.

## Predict, then verify

After migrating with publish-after-commit and no outbox, the API commits a new issue and the process is OOM-killed before `basic_publish` runs. What is the system's state in the chapter 11 design versus this one, and who notices?

Answer: in chapter 11 the state is unrepresentable: enqueue rows committed with the issue or nothing did. In the migrated design, the issue row exists, no message ever reaches RabbitMQ, workers idle, and every dashboard stays green; the failure is silent until an author asks why nobody received issue 42. A state the old design could not express is now reachable and invisible, which is exactly the gap the outbox pattern closes, and exactly the price of moving the queue out of the transaction's reach.
