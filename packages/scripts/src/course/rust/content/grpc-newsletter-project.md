The fault-tolerance section left delivery in its mature shape: `POST /admin/newsletters` stores the issue and enqueues one `issue_delivery_queue` row per confirmed subscriber, all in a single transaction with the idempotency record, and the worker claims rows with `FOR UPDATE SKIP LOCKED`, sends, and deletes. The table is still the contract. This project replaces it with the gRPC service this section has been assembling, both ends, and then judges the trade with no thumb on the scale.

## The contract

```proto
syntax = "proto3";
package delivery;

message EnqueueIssueRequest {
  string issue_id = 1;
  string title = 2;
  string html_content = 3;
  string text_content = 4;
}

message EnqueueReply { bool accepted = 1; }
message WatchRequest { string issue_id = 1; }

message DeliveryProgress {
  string issue_id = 1;
  uint32 sent = 2;
  uint32 failed = 3;
  uint32 remaining = 4;
}

service Delivery {
  rpc EnqueueIssue(EnqueueIssueRequest) returns (EnqueueReply);
  rpc WatchDelivery(WatchRequest) returns (stream DeliveryProgress);
}
```

Unary for the hand-off, server-streaming for live progress: the two shapes this workload actually has.

## The worker end

The worker becomes a server. `EnqueueIssue` re-parses at the boundary, the rule from the delivery section (bytes from another process are input, not truth), then hands the job to the delivery pool over the bounded channel from the worker pools lesson. `WatchDelivery` is last lesson's `ReceiverStream` fed by the pool's progress events.

```rust
async fn enqueue_issue(
    &self,
    request: Request<EnqueueIssueRequest>,
) -> Result<Response<EnqueueReply>, Status> {
    let job = DeliveryJob::try_from(request.into_inner())
        .map_err(|e| Status::invalid_argument(e.to_string()))?;
    self.jobs
        .send(job)
        .await
        .map_err(|_| Status::unavailable("delivery pool is shutting down"))?;
    Ok(Response::new(EnqueueReply { accepted: true }))
}
```

## The API end

One `DeliveryClient<Channel>` built at startup and stored in application state, cloned per request: a `Channel` is cheap to clone and multiplexes internally, the same reasoning the email client lesson used for reqwest. Each call sets a deadline, and `Status` maps into the publish path's error enum the way the error handling section taught.

```rust
let mut client = state.delivery.clone();
let mut request = Request::new(issue.into());
request.set_timeout(Duration::from_secs(3));
client.enqueue_issue(request).await.map_err(PublishError::Delivery)?;
```

## The honest comparison

What improved: the contract compiles, so drift is a build failure instead of a 3 a.m. incident; hand-off is immediate, no poll interval; `WatchDelivery` gives the admin live progress the table could only offer by polling a status column; deadlines and typed status codes replace implicit table semantics.

What broke is more instructive:

1. Atomicity. The old commit made "issue stored" and "delivery enqueued" one fact. Now it is a dual write: store then call (a crash between means stored, never delivered) or call then store (delivered, never stored). The standard fix is writing an outbox row in the same transaction and draining it later. An outbox is a queue table. You would be rebuilding what you deleted.
2. Durability. `accepted: true` now means "in a channel, in worker memory". The queue's rows survived every crash by sitting in Postgres and doing nothing, which was the entire ch11 design.
3. Availability. The table let the worker be down for an hour, and delivery simply resumed. Now worker downtime turns into enqueue errors the API must surface or buffer, and buffering by hand is a worse queue.

Verdict: this workload is asynchronous, durable, retryable background work, and that shape wants a queue, whether this table or the brokers in the queues section. gRPC earns its place on the other edge: `WatchDelivery` is genuinely better than polling, and synchronous internal questions that need answers now are what RPC is for. Keep the table for the hand-off, keep the stream for the dashboard. The two designs compose; they were never really competing.

## Predict, then verify

A deploy restarts the worker while 40 accepted-but-unsent jobs sit in its channel. Compare the two systems: what is lost, and what does each do on startup?

Answer: the table system loses nothing. The rows are still in `issue_delivery_queue`, the new process's first `SKIP LOCKED` claim resumes delivery, and nobody is paged: crash-safety by keeping state in Postgres rather than process memory. The gRPC worker loses all 40, because the channel died with the process and the API was already told `accepted`, so no retry will ever fire. Making the RPC version safe means persisting each job before acking, at which point you have rebuilt the queue behind a network hop. Sometimes the legacy design is the right one, and the value of this exercise is being able to say precisely why.
