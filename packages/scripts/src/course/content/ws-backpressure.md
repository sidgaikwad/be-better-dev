The first version of the hub is the one everybody writes:

```rust
type Hub = Arc<Mutex<HashMap<Uuid, Vec<mpsc::UnboundedSender<Message>>>>>;
```

Unbounded, so publishing never fails and never waits. From Part 2's backpressure lesson you know the ending: an unbounded queue does not remove a limit, it relocates the limit to the OOM killer and reports success in the meantime.

Here is the shape it takes. One admin is asleep, inside the twenty-minute window the liveness lesson measured. Every progress event for that issue is cloned into their queue and none come out. The bound is not a number you chose; it is however many events the worker publishes before TCP gives up. Fifty thousand sends is fifty thousand messages of live heap for a browser that is gone, and every other dashboard stays healthy right up until the process is killed.

## A bounded queue, and a decision you cannot avoid

```rust
let (tx, rx) = mpsc::channel::<Message>(32);
```

Thirty-two slots per connection. Now publishing can fail, and the failure is the information you wanted:

```rust
match tx.try_send(msg) {
    Ok(()) => {}
    Err(TrySendError::Closed(_)) => hub.unregister(id),
    Err(TrySendError::Full(_)) => { /* policy goes here */ }
}
```

There are exactly three policies, and picking one is a product decision.

**Await the send.** `tx.send(msg).await` is correct backpressure in a pipeline, where the producer should slow down. It is wrong in a fan-out, because the publisher is shared: making it wait on the slowest of five hundred sockets sets every fast client's latency to the worst one's. Head-of-line blocking, promoted from one connection to the whole application.

**Drop the message.** Correct when a newer message supersedes older ones, which progress ticks are. Log a counter so a dropping connection shows up in the observability section's metrics, then move on.

**Disconnect the client.** Correct when every message matters and the client can resynchronize. Close with a code that says so, and let the client reconnect and fetch a snapshot:

```rust
let _ = tx.try_send(Message::Close(Some(CloseFrame {
    code: 1013,                     // Try Again Later
    reason: "fell behind".into(),
})));
```

Memory stays bounded and the client learns it lost data instead of quietly seeing a gap. For a chat transcript or an audit feed this is the only honest option.

## For a progress bar, coalesce instead

The dashboard's entire state is one number. Queuing thirty-two copies of an obsolete number is thirty-one wasted slots, so use a channel that stores one value and lets receivers skip:

```rust
use tokio::sync::watch;

let (tx, mut rx) = watch::channel(Progress { sent: 0, total: 0 });

tx.send_replace(Progress { sent, total });          // publisher: never waits, never grows

while rx.changed().await.is_ok() {                   // one per connection
    let latest = *rx.borrow_and_update();
    let json = serde_json::to_string(&latest)?;
    sink.send(Message::Text(json.into())).await?;
}
```

A slow client silently skips intermediate values and receives the latest whenever it drains. Memory per connection is one `Progress`. This is the liveness lesson's design rule cashing out: because each event carries absolute counts rather than deltas, dropping the ones in between is free.

`tokio::sync::broadcast` is the same idea with a short history: a ring buffer of `capacity` messages, cloned to each receiver. A receiver more than `capacity` behind gets `Err(RecvError::Lagged(n))` on its next `recv` and is fast-forwarded to the oldest retained value. That is not a failure you can configure away, it is the design, and it is why memory stays at `capacity` times the message size however many receivers stall. Surface `Lagged(n)` to the client as "you missed n events, resync".

## One level deeper: where the bytes actually sit

There are four queues between a progress event and a pixel, and you chose the size of one:

1. your `mpsc` or `watch`, sized by you
2. tungstenite's write buffer, 128 KiB by default
3. the kernel socket send buffer, typically a few hundred KB with autotuning
4. the network's in-flight window

`sink.send(msg).await` returns as soon as the message lands somewhere in that stack, not when the browser saw it, so a client that stopped reading absorbs hundreds of kilobytes before any write reports trouble. That is why the bound has to be yours: the other three are invisible, differently sized on every machine, and fail minutes late. Yours fails immediately, at a threshold you picked.

## Predict, then verify

The hub uses `broadcast::channel(16)`. One dashboard's task is wedged for ten seconds while the worker publishes forty events. What does that receiver see, and what happened to memory?

Answer: the ring holds sixteen, so twenty-four events were overwritten as they arrived. The receiver's next `recv()` returns `Err(RecvError::Lagged(24))`, and the one after that yields the oldest of the sixteen still in the ring; the publisher never waited a microsecond, and memory never moved from the sixteen slots allocated at construction. With an unbounded mpsc, all forty would be on the heap and every one would eventually arrive: a ten-second-late burst of numbers the dashboard must animate through to reach a truth it could have been told in one frame. Bounded discarded messages nobody needed and kept memory flat, which for latest-value-wins data is the correct behavior, not a compromise.
