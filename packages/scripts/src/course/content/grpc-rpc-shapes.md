Every RPC so far returns one message for one request. The contract language has one more keyword, `stream`, and where you place it selects one of four call shapes:

```proto
service Delivery {
  rpc EnqueueIssue(NewsletterIssue) returns (EnqueueReply);              // unary
  rpc WatchDelivery(WatchRequest) returns (stream DeliveryProgress);     // server-streaming
  rpc ImportSubscribers(stream SubscriberRow) returns (ImportSummary);   // client-streaming
  rpc Relay(stream WorkerEvent) returns (stream ControlCommand);         // bidirectional
}
```

None of these require new concepts. Each streaming direction is a tokio `Stream`, the async iterator from Part 2, crossing a process boundary.

## stream on the response

The generated trait grows an associated type per server-streaming method, and the standard implementation is the bounded-channel pattern you already know:

```rust
use tokio_stream::wrappers::ReceiverStream;

type WatchDeliveryStream = ReceiverStream<Result<DeliveryProgress, Status>>;

async fn watch_delivery(
    &self,
    request: Request<WatchRequest>,
) -> Result<Response<Self::WatchDeliveryStream>, Status> {
    let mut events = self.progress.subscribe(request.into_inner().issue_id);
    let (tx, rx) = tokio::sync::mpsc::channel(16);
    tokio::spawn(async move {
        while let Some(event) = events.recv().await {
            if tx.send(Ok(event)).await.is_err() {
                break; // the client went away
            }
        }
    });
    Ok(Response::new(ReceiverStream::new(rx)))
}
```

`mpsc::channel(16)` is the backpressure lesson verbatim: a slow client eventually makes `tx.send(...).await` wait, which pauses the producer instead of buffering without bound.

## stream on the request

The handler receives `Streaming<T>`, which implements `Stream`; consuming it is the `while let` idiom from the streams lesson:

```rust
async fn import_subscribers(
    &self,
    request: Request<tonic::Streaming<SubscriberRow>>,
) -> Result<Response<ImportSummary>, Status> {
    let mut rows = request.into_inner();
    let mut imported = 0;
    while let Some(row) = rows.message().await? {
        // validate and store, one row at a time
        imported += 1;
    }
    Ok(Response::new(ImportSummary { imported }))
}
```

`message()` returning `Ok(None)` is `Poll::Ready(None)` wearing a network coat: the client has finished sending. Bidirectional combines both halves, and in practice you split it into a reading loop and a writing task, the same two-task split the concurrency sections used for anything full-duplex.

## Choosing a shape

- Unary is the default, and correctly so: it is the easiest to retry, cache, balance, and reason about.
- Server-streaming fits when the answer is a feed: delivery progress, a watch on changing state, log tailing. It replaces the poll loop, not the request.
- Client-streaming fits bulk ingestion where only the aggregate answer matters, like a subscriber CSV import. Be honest about the alternative: a `repeated` field in one unary call is simpler until the payload stops fitting in memory or in a request deadline.
- Bidirectional is for genuine conversations, where either side may speak at any time. You immediately start designing a protocol inside the protocol (message ordering, correlation ids), so reach for it only when interruption in both directions is the product.

## One level deeper: HTTP/2 underneath

Each in-flight RPC is one HTTP/2 stream, and every stream on a channel multiplexes over a single TCP connection with interleaved frames. Per-stream flow-control windows give you transport-level backpressure: a client that stops reading stops sending window updates, the server's send side stalls, your channel fills, and the producer's `send(...).await` parks. Bounded behavior end to end, without writing any of it. Cancellation rides the same rails: a client dropping its response stream sends RST_STREAM, and on the server your handler's future is dropped, exactly the cancellation semantics Part 2 taught.

## Predict, then verify

An admin opens the delivery dashboard, which calls `WatchDelivery`. Three progress events render, then the admin closes the tab, dropping the client stream. The spawned producer task on the server calls `tx.send(Ok(event))` a fourth time. What does that call return, and what should the task do?

Answer: it returns `Err(SendError)`, because tonic dropped the `ReceiverStream` when the HTTP/2 stream was reset, and a channel with no receiver refuses new messages. The task should treat that error as "nobody is listening" and exit its loop, which is why the example breaks on send failure. Server-streaming producers must expect their audience to vanish mid-sentence; the closed channel is how they find out.
