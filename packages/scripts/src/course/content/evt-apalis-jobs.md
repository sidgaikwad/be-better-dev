Chapter 11's worker earned its keep, but count what it cost: a queue table, a claim query, a polling loop, an error policy, and `tokio::select!` wiring next to the API. It also runs exactly one kind of job. The webhook lesson just created a second kind (deliveries with backoff), and product wants a third (a digest email at 09:00 daily). You could copy the pattern twice more. apalis is the crate that is that pattern, generalized.

## Jobs are types, workers are functions

```toml
[dependencies]
apalis = { version = "0.7", features = ["retry"] }
apalis-sql = { version = "0.7", features = ["postgres"] }
```

A warning before the code: apalis reshaped its API more than once between 0.4 and 0.7 (an older `Job` trait with a name constant is gone; jobs are now plain serde types). This corner moves fast; pin your version and read the changelog when you upgrade. The shape below is the 0.7 line.

A job is any type that serializes; a worker is an async function that takes one:

```rust
use apalis::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct DeliverWebhook {
    endpoint_id: Uuid,
    event_id: Uuid,
}

async fn deliver(job: DeliverWebhook, client: Data<WebhookClient>) -> Result<(), Error> {
    client.send(job.endpoint_id, job.event_id).await?; // Err means "retry me"
    Ok(())
}
```

`Data<WebhookClient>` is dependency injection in the extractor style you know from actix and the axum port: declared in the signature, provided at construction. Wiring is a builder plus a monitor:

```rust
PostgresStorage::setup(&pool).await?; // apalis' own migrations
let storage: PostgresStorage<DeliverWebhook> = PostgresStorage::new(pool);

Monitor::new()
    .register(
        WorkerBuilder::new("webhook-delivery")
            .data(client)
            .retry(RetryPolicy::retries(5))
            .backend(storage.clone())
            .build_fn(deliver),
    )
    .run()
    .await?;
```

The API enqueues with `storage.push(DeliverWebhook { .. }).await?`. Everything you hand-built is inside: the Postgres backend claims jobs with the same skip-locked idea, tracks attempts, heartbeats workers, and re-queues jobs whose worker died mid-run. Retries, timeouts, and rate limits are tower layers, the same middleware machinery the axum port put in front of HTTP handlers; a worker is literally a tower `Service` whose requests are jobs. Backends are a choice: `apalis-redis` for throughput, `apalis-sql` (Postgres, MySQL, SQLite) when "the database we already operate" is worth more than raw speed, which for most teams it is. Cron is just another backend, a stream of ticks instead of a table:

```rust
let schedule = Schedule::from_str("0 0 9 * * *")?; // sec min hour: 09:00 daily
WorkerBuilder::new("daily-digest")
    .backend(CronStream::new(schedule))
    .build_fn(send_digest); // the job value is built from the tick's timestamp
```

## Where the hand-built worker still wins

`storage.push` runs on its own connection, outside your business transaction. Read that again with the outbox lesson in mind. Chapter 11's queue had a property so quiet it was easy to miss: the enqueue was an insert inside the same transaction as the newsletter issue, so job and state committed atomically. With an external push, "row committed, push failed" is back: the dual-write problem in a work-queue hat. The fixes are the ones you already know: write an outbox row in the transaction and let a relay feed apalis, or accept the gap and reconcile. And execution is still at-least-once (a worker can die after the side effect, before the ack), so handlers stay idempotent. A job library replaces your loop, not your guarantees.

## Predict, then verify

`subscribe` commits its transaction, then calls `storage.push(SendWelcomeEmail { .. })`, and the connection to the queue's database drops for two seconds. The push returns `Err`. What is the state of the system, and where have you seen it?

Answer: the subscriber exists and no job does, and nothing will retry the push: the request already committed, and an in-process retry loop dies with a crash. It is the commit-then-publish gap from the outbox lesson wearing new clothes. Record the intent inside the transaction (an outbox row, or your own job row) and let a relay do the pushing. Libraries move the toil; the transactional boundary is still yours to draw.
