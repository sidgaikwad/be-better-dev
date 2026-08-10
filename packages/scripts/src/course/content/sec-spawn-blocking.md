Turn on log capture for the auth tests and read the span timings: `[VERIFY PASSWORD HASH - END] (elapsed_milliseconds=11, ...)`. Ten milliseconds of pure computation per login attempt, and that number is a feature: argon2id is priced to hurt attackers. The problem is _where_ those milliseconds run.

## Ten milliseconds is an eternity for poll

From Part 2's tokio section: an `async fn` compiles to a state machine with one state per `.await`, and the executor drives thousands of those machines on a handful of worker threads by polling each to its next yield point. The contract that makes this work is that `poll` returns fast; tokio maintainer Alice Ryhl's guideline is 10 to 100 microseconds. A task that computes for 10ms between yield points does not merely slow itself down, it freezes every other task scheduled on that worker thread. Requests that have nothing to do with login stall, their completed I/O sitting undelivered, because the thread never returns to the executor.

Waiting on I/O is not the issue: awaiting Postgres yields. Argon2 verification is CPU-bound with no await point inside it. It blocks by construction, at 100x the guideline.

## spawn_blocking, and the 'static wall

tokio's escape hatch is a separate thread pool reserved for exactly this:

```rust
tokio::task::spawn_blocking(move || {
    verify_password_hash(expected_password_hash, credentials.password)
})
.await // JoinHandle: spawning is itself fallible, hence a nested Result
.context("Failed to spawn blocking task.")??;
```

The first attempt does not compile. `spawn_blocking` requires its closure to be `'static`: the pool thread may outlive the async task that spawned it, so the closure may not borrow anything from the caller's stack. And `PasswordHash<'a>` is a _parsed view_ borrowing the PHC string it came from, so passing `&expected_password_hash` across is rejected. The fix is to move the owned `Secret<String>` values in and parse on the other side:

```rust
fn verify_password_hash(
    expected_password_hash: Secret<String>,
    password_candidate: Secret<String>,
) -> Result<(), AuthError> {
    let expected = PasswordHash::new(expected_password_hash.expose_secret())?; // parse here
    Argon2::default()
        .verify_password(password_candidate.expose_secret().as_bytes(), &expected)
        .map_err(|_| AuthError::InvalidCredentials(anyhow::anyhow!("Invalid password.")))
}
```

Ownership moved, lifetime problem gone: the same move-the-owner pattern as `thread::spawn` back in the threads section, because under the sugar this _is_ a thread handoff.

## The span that lost its parents

Run the tests again and the "verify password hash" span appears in the logs stripped bare: no `request_id`, no `http.route`, none of the properties inherited from the request's root span. tracing's "current span" means _the active span of the current thread_; the subscriber tracks that context in thread-local storage. Our closure runs on a pool thread where no span has ever been entered, so the span it opens becomes an orphaned root.

The handoff must be explicit: capture the span on the async side, enter it on the worker:

```rust
// src/telemetry.rs
pub fn spawn_blocking_with_tracing<F, R>(f: F) -> JoinHandle<R>
where
    F: FnOnce() -> R + Send + 'static,
    R: Send + 'static,
{
    let current_span = tracing::Span::current(); // captured on the request's thread
    tokio::task::spawn_blocking(move || current_span.in_scope(f))
}
```

`Span` is a cheap handle and safe to move across threads; `in_scope` makes it the thread's current span for the closure's duration, so child spans link back into the request tree. The helper earns its place in `telemetry.rs`: every future CPU-heavy offload in the project reaches for it, password hashing today, hash _computation_ in the password-change flow later.

## Predict, then verify

Suppose you use plain `spawn_blocking` without the span handoff. The code compiles, every test passes, logins work. What did you lose, and when will you notice?

Answer: only telemetry. The verification span detaches from its request: no request id to correlate by, no route, no user field. You notice during your first production incident, grepping for one slow login and finding password-hash spans that belong to nobody, which is exactly when telemetry must work (the lesson of the telemetry section, ch. 4). Correctness bugs fail tests; observability bugs fail investigations.
