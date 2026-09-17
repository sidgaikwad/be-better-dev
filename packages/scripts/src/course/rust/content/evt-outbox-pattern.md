`confirm` now publishes `SubscriberConfirmed` to the broker. Where exactly does that line go?

```rust
let mut tx = pool.begin().await?;
confirm_subscriber(&mut tx, subscriber_id).await?;
tx.commit().await?;
// -- process dies here --
publisher.publish(&SubscriberConfirmed { subscriber_id, confirmed_at }).await?;
```

Crash in that gap and the row says confirmed while no consumer ever hears about it: no trial, no analytics, silently. Swap the order and the failure inverts: publish first, then the commit fails, and every consumer reacts to a confirmation that never happened, a ghost event. There is no third order. Postgres and RabbitMQ are two systems, and no transaction spans them; this is the dual-write problem. Retrying does not fix it either, because the retry loop dies with the process. (Two-phase commit does span systems, but most modern brokers do not offer it, and its operational failure modes are a chapter of their own.)

## Write the event where the transaction already is

The fix: let one system record both, then copy. Add a table:

```sql
CREATE TABLE outbox (
    id           uuid PRIMARY KEY,
    occurred_at  timestamptz NOT NULL,
    kind         text NOT NULL,
    payload      jsonb NOT NULL,
    published_at timestamptz
);
```

and write the fact in the same transaction as the business row:

```rust
let mut tx = pool.begin().await?;
confirm_subscriber(&mut tx, subscriber_id).await?;
sqlx::query!(
    "INSERT INTO outbox (id, occurred_at, kind, payload)
     VALUES ($1, now(), 'subscriber_confirmed', $2)",
    Uuid::new_v4(),
    serde_json::json!({ "subscriber_id": subscriber_id }),
)
.execute(&mut *tx)
.await?;
tx.commit().await?;
```

You have written this shape before. Chapter 11 inserted `issue_delivery_queue` rows in the same transaction as the newsletter issue: the transactional enqueue. The outbox is that idea generalized: instead of enqueueing work for your own worker, you record a fact for a relay to carry to the broker. Atomicity does all the guaranteeing. Commit, and the fact exists; roll back, and it never did. Neither lie is expressible.

## The relay, and what it guarantees

A relay loop, structurally chapter 11's worker, drains the table:

```rust
let mut tx = pool.begin().await?;
let rows = sqlx::query!(
    "SELECT id, kind, payload FROM outbox
     WHERE published_at IS NULL
     ORDER BY occurred_at
     LIMIT 50
     FOR UPDATE SKIP LOCKED"
)
.fetch_all(&mut *tx)
.await?;
// publish each row to the broker, then:
// UPDATE outbox SET published_at = now() WHERE id = ANY($1); tx.commit()
```

`FOR UPDATE SKIP LOCKED` is the same claim trick as chapter 11: two relays never fight over a row. Now inspect the crash windows again. Crash before publishing: rows stay unclaimed and the next pass retries. Crash after the broker acks but before `published_at` is set: the next pass publishes again. Duplicates are possible; loss is not. The pipeline is at-least-once end to end, which the message queues section taught you to expect, and it demands the same consumer discipline: dedup on the event `id`. The tidy version is an inbox: the consumer inserts the event id into a `processed_events` table with a unique constraint, in the same transaction as its own writes; a conflict means already handled, ack and move on. Chapter 11's idempotency keys, on the consuming side.

One level down, in production: polling costs latency, so relays add a trigger on `outbox` that fires `NOTIFY` and listen with sqlx's `PgListener`, keeping the poll as a fallback. At scale, change data capture removes the query entirely: Debezium tails the Postgres write-ahead log through logical replication and publishes outbox rows itself. Same pattern, different pump. And published rows need deleting eventually; an outbox is a buffer, not an archive.

## Predict, then verify

A row is published, `published_at` is set, the relay's transaction commits. The broker then loses the message before any consumer sees it (the queues section's unacked-crash case). Is the fact lost?

Answer: that now depends on the broker, not the outbox. The outbox guarantees the fact reaches the broker at least once; from there, message durability and consumer acks carry it, or fail to. Guarantees compose link by link, and the weakest link sets the total. The outbox fixed the first link, the only one your database controls.
