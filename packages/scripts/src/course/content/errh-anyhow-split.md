Look at the final `SubscribeError` with honest eyes. Six variants, and the caller of `subscribe` can react differently to exactly one of them. `ValidationError` maps to a 400; everything else maps to a 500, and nobody will ever branch on `InsertSubscriberError` versus `TransactionCommitError`: doing so would require understanding the subscription flow's internals, which is precisely what callers should not do. The enum mirrors the function body, one variant per fallible call, growing with every refactor. Part 1's anyhow lesson named this shape the ball-of-mud error enum. The chapter now applies the cure to real code: what does a caller of `subscribe` actually need to know? Two things.

```rust
#[derive(thiserror::Error)]
pub enum SubscribeError {
    #[error("{0}")]
    ValidationError(String),
    #[error(transparent)]
    UnexpectedError(#[from] Box<dyn std::error::Error>),
}
```

The `Box` is there because trait objects are unsized and cannot sit in a variant directly. The `status_code` match shrinks to two arms, every 500-bound call site becomes `.map_err(|e| SubscribeError::UnexpectedError(Box::new(e)))?`, tests pass. Then the chapter re-points the sabotage test at `insert_subscriber` (dropping the `email` column from `subscriptions`) and the log has regressed:

```text
exception.details:
    "error returned from database: column 'email' of
     relation 'subscriptions' does not exist"
```

No `Caused by:` chain, no operator-facing message. `#[error(transparent)]` forwards Display straight to the wrapped error, and `subscribe` no longer attaches any context about what it was attempting. The first patch is a second field, `UnexpectedError(#[source] Box<dyn std::error::Error>, String)` with `#[error("{1}")]`, and every `map_err` builds a `(Box::new(e), "Failed to insert new subscriber in the database.".into())` pair. It works; the closures are a mouthful.

The ecosystem already polished this. `anyhow::Error` is `Box<dyn std::error::Error>` upgraded: it additionally requires `Send + Sync + 'static`, guarantees a backtrace is captured, and is a narrow pointer, one word instead of a fat pointer's two.

```rust
#[error(transparent)]
UnexpectedError(#[from] anyhow::Error),
```

The extra `String` field disappears, because context is built in:

```rust
use anyhow::Context;

let mut transaction = pool
    .begin()
    .await
    .context("Failed to acquire a Postgres connection from the pool")?;
let subscriber_id = insert_subscriber(&mut transaction, &new_subscriber)
    .await
    .context("Failed to insert new subscriber in the database.")?;
```

`.context(...)` performs two jobs in one call: it converts the underlying error into `anyhow::Error`, and it layers the caller's message on top while keeping the original as `source`. The `Caused by:` chain returns to the log, and the handler reads as a list of intentions.

## Is it worth naming?

"anyhow for applications, thiserror for libraries" is the slogan; the chapter rejects it as the wrong axis. Reason about intent instead. Do you expect callers to behave differently depending on the failure mode? Then name the modes in an enum and let them match (thiserror just cuts the boilerplate). Do you expect them to give up and report to a human? Then hand over one opaque error: anyhow, or eyre if you prefer its API. `subscribe` lands on both in a single type: one named variant the boundary branches on, one anyhow variant for every failure whose only handler is a log line. Libraries lean toward enums because their authors cannot know callers' intent, and pay for the freedom with ten-variant lists users must sift.

## Who logs

One failure still produces three ERROR records: the `tracing::error!` inside `insert_subscriber`'s `map_err`, a record actix-web emitted while converting the error (the book notes it was slated for removal; current actix-web 4 no longer emits it), and `TracingLogger`'s END record. Three alarms, one incident. The chapter's rule of thumb: "errors should be logged when they are handled." A function propagating with `?` is not handling; its contribution is context, via wrapping or `.context(...)`. The handler of record here is the telemetry middleware, so the `map_err` log lines inside `insert_subscriber` and `store_token` are deleted, and each failure becomes exactly one authoritative record. The web-boundary lesson stated the rule; this is what enforcing it looks like in a working service.

## Predict, then verify

A new requirement arrives: when the Postgres pool is exhausted, callers of `subscribe` must shed load instead of treating the failure as a generic 500. Today that error drowns inside `UnexpectedError`. What is the right change?

Answer: the failure mode just became worth naming. Promote it out of `anyhow::Error` into its own variant so the `status_code` match (and any other caller) can branch on it, perhaps to a 503; everything else stays opaque. The enum-versus-anyhow line is not fixed at design time. It moves exactly when a caller acquires a reason to react differently, and "is it worth naming?" is the question that finds it.
