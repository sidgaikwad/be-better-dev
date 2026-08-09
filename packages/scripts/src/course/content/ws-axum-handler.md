The handler that serves the delivery dashboard's socket does almost nothing, and that is the first surprising thing about it:

```rust
use axum::{
    extract::{ws::WebSocketUpgrade, Path, State},
    response::Response,
};

async fn progress_ws(
    ws: WebSocketUpgrade,
    Path(issue_id): Path<Uuid>,
    State(state): State<AppState>,
    _admin: AdminUser,      // the session guard from the securing-api section
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, state, issue_id))
}
```

`WebSocketUpgrade` is an ordinary `FromRequestParts` extractor. It checks the method, the `Upgrade` and `Connection` headers, and `Sec-WebSocket-Version: 13`, then computes the `Sec-WebSocket-Accept` the last lesson described. `on_upgrade` returns a 101 response and the handler is done. The closure has not run: hyper writes the 101, stops speaking HTTP on that socket, and only then hands the raw IO to a task that calls your closure. The handler decides whether the upgrade may happen; the connection's life happens somewhere else. Because that decision is a normal HTTP request, `_admin` runs first and a stranger gets a 401 with no upgrade at all.

The module is behind a feature flag, which is the first compile error everyone hits:

```toml
[dependencies]
axum = { version = "0.8", features = ["ws"] }
futures-util = "0.3"
```

Underneath, axum does the HTTP half and tokio-tungstenite does everything after. The upgraded IO becomes a `WebSocketStream` in server role: it parses frames, unmasks client payloads, rejects invalid UTF-8 in text, and enforces the size limits. `axum::extract::ws::Message` is a thin mirror of tungstenite's enum.

## Two halves, two tasks

A `WebSocket` is a single value that is both a `Stream<Item = Result<Message, Error>>` and a `Sink<Message>`. One value means one `&mut`, which means one task alternating between reading and writing. `StreamExt::split` breaks it into two separately owned halves that can move into different tasks:

```rust
use futures_util::{SinkExt, StreamExt};
use tokio::sync::mpsc;

async fn handle_socket(socket: WebSocket, state: AppState, issue_id: Uuid) {
    let (mut sink, mut stream) = socket.split();
    let (tx, mut rx) = mpsc::channel::<Message>(32);
    let conn = state.hub.register(issue_id, tx);

    let mut writer = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sink.send(msg).await.is_err() {
                break;
            }
        }
    });
    let mut reader = tokio::spawn(async move {
        // The dashboard sends almost nothing. What arrives is Close, or an error.
        while let Some(Ok(_msg)) = stream.next().await {}
    });

    tokio::select! {
        _ = &mut writer => reader.abort(),
        _ = &mut reader => writer.abort(),
    }
    state.hub.unregister(conn);
}
```

Look at what is in front of the sink: an `mpsc::Sender`. This is the actor lesson's shape, applied to a socket. The socket is a resource exactly one task may touch, the `Sender` is the cloneable handle everyone else holds, and dropping the last handle closes the inbox so the writer drains and exits. Nothing anywhere holds an `Arc<Mutex<WebSocket>>`, and the publisher never learns which task owns which file descriptor.

You can also skip `split` and run one task with `tokio::select!` over `socket.recv()` and `rx.recv()`, which some codebases prefer. It costs you a cancel-safety obligation on both branches, per the cancel-safety lesson, and it buys you one fewer task.

One version note: axum 0.7 carried `Message::Text(String)` and `Message::Binary(Vec<u8>)`. axum 0.8 follows tungstenite 0.26 and uses `Message::Text(Utf8Bytes)` and `Message::Binary(Bytes)`, with `Ping`/`Pong` payloads as `Bytes` and `CloseFrame` losing its lifetime parameter. `Utf8Bytes` converts from `String`, so `Message::Text(json.into())` compiles under either.

## One level deeper: what a client can make you allocate

Frame limits are not academic. axum's defaults allow a 64 MB message assembled from 16 MB frames, and tungstenite buffers a message until it is complete before handing it to you. One connection sending a fragmented 64 MB text message is 64 MB of your heap, held on your say-so. Ten of them is your instance. The dashboard's clients send nothing larger than a close frame, so cap them:

```rust
ws.max_message_size(64 * 1024).max_frame_size(16 * 1024)
    .on_upgrade(move |socket| handle_socket(socket, state, issue_id))
```

Limits are the only reason an open socket has a bounded cost, and they are the cheapest hardening in this section.

## Predict, then verify

Suppose you delete the channel and store `Arc<tokio::sync::Mutex<WebSocket>>` in the hub instead, so the publisher writes to each socket directly. It compiles. What happens in production?

Answer: the publisher takes each connection's lock and holds it across `sink.send(msg).await`, so the fan-out serializes behind the slowest socket, and one admin on hotel Wi-Fi sets the latency for every other dashboard. Worse, nothing else can ever get that lock: the half that reads the socket cannot run, so a `Close` frame is never observed, tungstenite never gets polled to send its automatic pong, and the connection is invisible to the liveness machinery of the next lesson. It is the exact trap the actor lesson opened with, and the mpsc queue in front is the exact fix.
