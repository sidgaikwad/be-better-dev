The delivery worker's first job is to load every confirmed subscriber. `fetch_all(&pool).await` returns a `Vec` of rows, which is fine at fifty subscribers and a liability at five million: the entire result set sits in memory before the first email goes out. sqlx offers `fetch` for exactly this case, and its return type is a `Stream`: the async sequence, the fourth cell in a grid you have been filling in for two parts.

## One trait, two axes

From the Iterators and closures section: `Iterator::next` returns `Option<Item>`, one value at a time until `None`. From the Async from scratch section: `Future::poll` returns `Poll<Output>`, `Pending` until the value exists. `Stream` is both at once:

```rust
pub trait Stream {
    type Item;
    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>)
        -> Poll<Option<Self::Item>>;
}
```

`Poll<Option<Item>>` reads exactly as its parts suggest:

- `Poll::Pending`: no item yet; the waker inside `cx` will fire when one might exist.
- `Poll::Ready(Some(item))`: here is the next item.
- `Poll::Ready(None)`: the stream is finished, the async end-of-sequence.

The `self: Pin<&mut Self>` is the Pinning section's rule again: a stream is a suspended state machine that may borrow across its own suspension points, so it promises not to move once polling begins.

`Stream` is not in the standard library. It lives in `futures_core` and reaches tokio users through the `tokio-stream` crate; std carries an unstable `AsyncIterator` that is this same trait inching toward stabilization under a new name.

## while let is the async for loop

You never call `poll_next` by hand, for the same reason you never called `poll`: an extension trait does it. `StreamExt::next()` returns a future that resolves to `Option<Item>`:

```rust
use tokio_stream::StreamExt;

let mut rows = sqlx::query_as::<_, Subscriber>(
    "SELECT email FROM subscriptions WHERE status = 'confirmed'",
)
.fetch(&pool);

while let Some(subscriber) = rows.next().await {
    let subscriber = subscriber?;    // each item is a Result
    send_issue(&email_client, &subscriber).await?;
}
```

Rows are handled as Postgres produces them; memory holds a row at a time instead of the table.

Notice what is absent: `for subscriber in rows`. A `for` loop desugars to `IntoIterator` and a synchronous `next`, and the language has no async version of that desugaring yet; `async for` has been designed several times and stabilized never. So `while let Some(x) = stream.next().await` is the idiom, three moves in one line: build the next-item future, await it, match the option.

## The adapter vocabulary carries over

`StreamExt` deliberately mirrors the iterator vocabulary: `map`, `filter`, `filter_map`, `take`, `skip`, `chain`, `fold`, `collect` all exist and mean what they meant. Async-only verbs join them, like `throttle`, `merge`, and `chunks_timeout`:

```rust
let batches = rows
    .filter_map(|row| row.ok())
    .map(|sub| sub.email)
    .chunks_timeout(100, Duration::from_secs(1));
```

Batches of up to 100 addresses, flushed at least once per second: the shape a bulk email endpoint wants. Laziness carries over unchanged, too: adapters wrap the source in a bigger state machine and do nothing until the end of the chain is polled.

## Deeper: the pull model

When Postgres has no row buffered, `poll_next` returns `Pending` and the tokio section's machinery takes over: the connection's socket is registered with the reactor, the task suspends, the waker fires on readability. Nothing buffers ahead unless an adapter explicitly says so. The consumer pulls; a slow consumer simply polls less often, and unread data waits in the socket and in Postgres rather than growing a queue in your process. This is backpressure by default, and the Concurrency patterns section builds its explicit version on top of it.

## Predict, then verify

```rust
let s = tokio_stream::iter([1, 2, 3]).map(|n| {
    println!("mapped {n}");
    n * 10
});
```

The program compiles and exits without touching `s` again. What does it print?

Answer: nothing. `map` stores the closure inside a new stream and returns it; only polling runs a stream, and nothing here polls. Make the binding `mut` and add a `while let Some(x) = s.next().await` loop, and three `mapped` lines appear, one per item pulled: exactly the lazy behavior the Iterators and closures section promised for their synchronous cousins.
