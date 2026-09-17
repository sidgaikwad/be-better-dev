The delivery worker should drain its queue until shutdown is requested. The natural shape is a `select!` loop that keeps one shutdown future alive across iterations:

```rust
async fn worker(mut queue: IssueQueue) {
    let mut shutdown = shutdown_signal();   // an async fn, so: a state machine
    loop {
        tokio::select! {
            _ = &mut shutdown => break,
            issue = queue.next_issue() => deliver(issue).await,
        }
    }
}
```

The compiler rejects it (trimmed):

```
error[E0277]: `impl Future<Output = ()>` cannot be unpinned
  = note: consider using the `pin!` macro
          consider using `Box::pin` if you need to access the
          pinned value outside of the current scope
  = note: required for `&mut impl Future<Output = ()>` to implement `Future`
```

Decode it with last lesson's impl: `select!` must poll `&mut shutdown`, and `&mut F` is only a future when `F: Unpin`. `shutdown` is an async machine, so it is not. What the error really says is: **you are lending this future around by reference, so first park it at an address it will never leave.** Both notes name a tool for doing exactly that.

## pin!: pinning to the stack

```rust
let shutdown = shutdown_signal();
tokio::pin!(shutdown);                  // std::pin::pin! works the same way
loop {
    tokio::select! {
        _ = &mut shutdown => break,
        issue = queue.next_issue() => deliver(issue).await,
    }
}
```

`pin!` nails the machine into the current stack frame and rebinds the name as a `Pin<&mut F>`, shadowing the original so no later code can move the value out from under the promise. And `Pin<&mut F>` is itself `Unpin` (it is only a reference), so `&mut shutdown` now satisfies `select!`. Note the other branch never needed help: futures passed to `select!` by value are pinned by the macro internally. Manual pinning exists for the borrow-so-it-survives-iterations pattern, which is precisely what a shutdown future needs.

## Box::pin: pinning to the heap

`pin!` costs nothing but dies with its scope. When a future must outlive a scope, cross an API boundary, or sit in a struct, pin it to the heap instead:

```rust
struct Worker {
    in_flight: Pin<Box<dyn Future<Output = ()> + Send>>,
}
```

`Box::pin` moves the future into a heap allocation that will hold it, untouched, until drop. The fact worth memorizing: `Pin<Box<F>>` is itself `Unpin` even when `F` is not, because moving the pinned box moves only the box's pointer; the pinned bytes never go anywhere. One owner per value again: the handle moves, the allocation stays. One allocation buys back full freedom of movement, which also makes `Box::pin` the standard fix for recursive `async fn`s and for storing futures as trait objects.

## The same story for streams

`StreamExt::next` carries a `where Self: Unpin` bound, so a loop over confirmed subscribers:

```rust
while let Some(subscriber) = confirmed.next().await { /* send the issue */ }
```

fails with the same `cannot be unpinned` error whenever `confirmed` is a `!Unpin` stream (many combinator-built and `async_stream` streams are). Same fix: `pin!` it first, or `Box::pin` it if it must travel. And if you ever implement `Stream` yourself, `poll_next` receives `self: Pin<&mut Self>`. Writing a manual `Future` or `Stream` impl, or hand-polling one in a test, is roughly the only place application developers touch a `Pin` receiver directly, and many go years without doing either.

## Predict, then verify

Replace `tokio::pin!(shutdown)` with `let mut shutdown = Box::pin(shutdown_signal());`. Does the worker loop compile, and what changed?

Answer: it compiles. `Pin<Box<F>>` implements `Future` and is `Unpin`, so `&mut shutdown` is a valid `select!` branch. The only observable change is one heap allocation at worker startup. Inside a single function `pin!` gets the same result allocation-free, which is why it is the default; `Box::pin` earns its allocation when the future must leave the scope that created it.
