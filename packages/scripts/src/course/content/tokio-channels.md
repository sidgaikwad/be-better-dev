Threads, Send and Sync ended with `std::sync::mpsc` and the advice to share by communicating. The idea survives contact with async; the implementation cannot: std's `recv()` blocks the calling thread, exactly what the cardinal sin lesson forbids. `tokio::sync` rebuilds channels with `.await` in the right places, and adds two new shapes worth knowing in their own right.

## mpsc: a stream of things

```rust
let (tx, mut rx) = tokio::sync::mpsc::channel::<Email>(100);

// many producers: clone tx into each handler task
tx.send(email).await.expect("delivery worker gone");

// one consumer
while let Some(email) = rx.recv().await {
    deliver(email).await;
}
```

The shape: many senders, one receiver, values arrive in order. This is the work queue. In the newsletter service, request handlers enqueue outgoing emails and a single delivery worker drains them.

The number is the important part. `channel(100)` is bounded: when 100 emails are waiting, `send(...).await` returns `Pending` and the producer parks, the waker dance from Async from scratch, until the consumer catches up. That is backpressure: a slow consumer slows producers instead of letting the queue eat the heap. An `unbounded_channel()` exists, and its send never waits; reach for it only when something else already bounds production, because its buffer is your RAM. Backpressure gets a full treatment in Concurrency patterns.

## oneshot: exactly one answer

```rust
let (tx, rx) = tokio::sync::oneshot::channel::<DeliveryStatus>();
```

One value, sent once, received once. `send` is synchronous, consumes the sender, and never waits: with capacity one and one producer, there is nothing to wait for. On its own it looks pointless; its purpose is to ride inside other messages as a reply envelope:

```rust
enum Command {
    Deliver {
        email: Email,
        reply: tokio::sync::oneshot::Sender<DeliveryStatus>,
    },
}
```

A caller builds the command, keeps the receiver, sends the command down an mpsc, then awaits its personal answer. This mpsc-of-commands-carrying-oneshots wiring is the actor pattern: one task owns a resource outright, the SMTP connection, the database handle, the "neither mutex" answer from the last lesson, and everyone else talks to it. Concurrency patterns builds a full actor; for now, recognize the wiring.

## watch: the latest value, and only the latest

```rust
let (tx, mut rx) = tokio::sync::watch::channel(Config::default());

// any number of readers:
while rx.changed().await.is_ok() {
    let cfg = rx.borrow().clone();
    apply(cfg);
}
```

One writer, many readers, and readers see only the most recent value: if the writer stores five configs while a reader is busy, the reader wakes once and sees the fifth. The lossiness is the feature. A queue answers "what happened, in order"; watch answers "what is true right now". Config reload and shutdown flags ("are we stopping yet?") are the canonical uses. Never put jobs in a watch: four of your five emails silently disappear.

For completeness, `broadcast` is the fourth shape: many senders, many receivers, every receiver sees every value, and a receiver that lags too far behind gets an error instead of unbounded buffering. It returns when streams do.

Choosing, in one breath: a stream of jobs with backpressure is `mpsc`; one question, one answer is `oneshot`, usually riding inside an mpsc command; the current value of something, history irrelevant, is `watch`.

One level down, there is nothing new here. A parked sender on a full mpsc, a receiver on an empty one, a reader in `changed()`: each is a stored waker, fired by the other side's next operation, the same mechanism your hand-built executor used for sockets. Channels are not runtime primitives; they are ordinary futures over shared state, which is why they compose with everything else.

## Predict, then verify

A watch writer stores 1, then 2, then 3 in quick succession while a single reader is parked in `changed()`. How many times does the reader wake, and what does it read? What would mpsc do?

Answer: somewhere between one and three wakes, and the final read is certainly 3. `changed()` means "a version you have not seen exists", not "one message per send": if all three stores land before the reader runs, it wakes once and `borrow()` shows 3. The same experiment over mpsc delivers 1, 2, 3, each exactly once. Neither behavior is better; they are different promises, and choosing a channel is choosing which promise the job needs.
