In most stacks, cancellation is a protocol you must remember to follow. Go threads a `context.Context` through every function signature and checks it at every juncture; TypeScript threads an `AbortSignal` into every fetch and listener. Both are cooperative: the code being cancelled has to keep agreeing to look, and any stretch that forgets a check is uncancellable for its duration.

You have already cancelled Rust futures twice this section without any of that. `timeout` dropped the email send; losing `select!` branches were dropped every pass. No signal parameter, no checks. Cancellation in async Rust is not an API. It is `Drop`.

## Futures are values, so cancelling is dropping

The Async from scratch section built the fact this rests on: an `async fn` compiles to an inert state machine value that only advances when polled. Stop polling it and it is frozen; drop it and its current state is destroyed, running destructors for whatever it holds. That is the entire mechanism. Any future can be cancelled at any await point by whoever owns it, with zero cooperation from its author: every `.await` you write is implicitly a place where the rest of the function might never happen.

The cancellers you now know: a `timeout` whose timer wins, every losing `select!` branch, and, for whole tasks, `JoinHandle::abort()`, which has the runtime drop the task's future at its next yield point. One famous non-canceller: dropping a `JoinHandle` cancels nothing; the tokio section's spawned tasks just detach and run on, unowned.

## What runs, and what never does

```rust
async fn deliver_batch(pool: &PgPool, job: &Job) -> Result<(), Error> {
    let mut tx = pool.begin().await?;
    let subs = due_subscribers(&mut tx, job).await?;
    for sub in &subs {
        send_issue(sub).await?;        // suppose cancellation lands here
    }
    mark_delivered(&mut tx, job).await?;
    tx.commit().await?;
    Ok(())
}
```

The worker wraps each attempt in a thirty second timeout, and this one fires mid-loop. Two lists:

Runs: the destructors of every live local, in reverse declaration order, exactly as the Drop lesson in Part 1 promised. `tx` is dropped, and a sqlx `Transaction` never committed rolls back: `drop` cannot await, so sqlx flags the connection and issues the actual `ROLLBACK` before the pool hands that connection out again. Buffers free, sockets close, guards release.

Skips: every line after the await where cancellation landed. `mark_delivered` and `tx.commit` do not run, not later, not ever. There is no `finally`. Code after an await is code, and code is not data: only data survives long enough to be dropped.

So under cancellation, correctness must come entirely from destructors plus a design that tolerates stopping at any await. `deliver_batch` qualifies: the uncommitted transaction evaporates, the job stays unmarked, the next attempt redoes the batch. Its progress lives inside a transaction, so abandoning it anywhere is clean.

## The rough edges

Cancellation only lands at await points. The synchronous stretch between two awaits always runs to its end once entered, so a task that never awaits can never be cancelled: `abort()` on a spin loop does nothing, the same pathology as the blocking-pitfalls lesson in the tokio section. `spawn_blocking` closures are entirely beyond abort once running, because threads cannot be safely killed (the Threads, Send and Sync section). And since `Drop::drop` is synchronous, with no async version in today's Rust, cleanup that itself needs IO must follow sqlx's pattern: leave a marker for the next owner rather than trying to await in a destructor.

That is the shape of the trade. Superpower: deadlines and shutdown compose from the outside, with no signal parameter contaminating every signature in the codebase. Footgun: your function can end between two awaits its author thought of as one step, say after the provider accepted an email but before the row recording that fact. Whether a given await tolerates being the last line has a name, cancellation safety, and it is the next lesson.

## Predict, then verify

```rust
struct Loud(&'static str);
impl Drop for Loud {
    fn drop(&mut self) { println!("dropped {}", self.0); }
}

async fn work() {
    let _a = Loud("a");
    tokio::time::sleep(Duration::from_secs(60)).await;
    let _b = Loud("b");
    println!("finished");
}

let _ = timeout(Duration::from_millis(10), work()).await;
```

What prints?

Answer: only `dropped a`. Cancellation lands at the sleep, where `_a` is live, so its destructor runs. `_b` is never constructed and `finished` never prints. Swap `Loud` for a lock guard and the lock is released; move cleanup into a plain line after the sleep and it is silently skipped. Values are cleaned up, code is skipped: that asymmetry is drop-based cancellation in one example.
