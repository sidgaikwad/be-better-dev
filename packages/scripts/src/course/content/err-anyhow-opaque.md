Look at `SubscribeError` with a designer's eye. Five variants, four of which are a tour of `subscribe`'s implementation: one variant per fallible call in the body. Rename a helper, add a retry, split the insert in two, and the public error type changes with it. Worse: what is a caller supposed to _do_ with the distinction between `StoreTokenError` and `TransactionCommitError`? They do not understand the subscription flow's internals, by design. This is the ball-of-mud error enum: every dependency's error stapled into one bag and exposed as API, informing no one and coupling everyone.

The test is abstraction. What does the caller of `subscribe` need to know? Two things: the input was rejected (so the edge can answer 400), or something unexpected went wrong (500). That is the whole contract:

```rust
#[derive(thiserror::Error, Debug)]
pub enum SubscribeError {
    #[error("{0}")]
    ValidationError(String),
    #[error(transparent)]
    UnexpectedError(#[from] anyhow::Error),
}
```

## anyhow::Error

`anyhow::Error` is the ecosystem's standard opaque error: behaviorally close to `Box<dyn Error + Send + Sync + 'static>`, a container for "some error", with three upgrades:

- it requires `Send + Sync + 'static`, so it crosses thread and task boundaries freely;
- it can capture a backtrace at the moment the error is created (enable with `RUST_BACKTRACE=1`);
- it is one machine word wide instead of two.

Opaque is the operative word. The holder gets `Display`, `Debug`, and the source chain, and nothing to match on. That is a feature: it states in the type system that this failure is for reporting, not reacting.

## .context()

Wrapping alone is not enough; the lesson of the source chain was that each layer should add meaning. anyhow's `Context` extension trait does both jobs in one call:

```rust
use anyhow::Context;

let mut transaction = pool
    .begin()
    .await
    .context("Failed to acquire a Postgres connection from the pool")?;

store_token(&mut transaction, subscriber_id, &subscription_token)
    .await
    .context("Failed to store the confirmation token for a new subscriber.")?;
```

`context` converts the underlying error into `anyhow::Error` and layers your message on top, keeping the original as `source`. The operator's log keeps its full `Caused by:` chain; the type no longer enumerates the function's insides. (`context` is bolted onto `Result` itself via an extension trait, a pattern you will meet across the ecosystem.)

## anyhow or thiserror?

The folk rule says anyhow is for applications, thiserror for libraries. It is a decent proxy for the real question, which is intent:

- Do you expect callers to behave differently per failure mode? Enumerate: an enum, with thiserror generating the boilerplate.
- Do you expect callers to give up and report? Go opaque: anyhow, or its cousin eyre.

Libraries usually cannot predict their callers' intent, so they enumerate and let users decide; that is why `sqlx::Error` carries a dozen-plus variants. Application layers usually can predict it, so they collapse to opaque early. But the axis is the caller's need, not the crate type: a library whose failures are never actionable is right to expose an opaque error too.

## One level deeper: one word

`Box<dyn Error>` is a fat pointer, two words, data plus vtable, as in the Error-trait lesson. `anyhow::Error` plays a representation trick: it stores the vtable pointer inside the heap allocation next to the error value, leaving a one-word narrow pointer on the stack. `Result<T, anyhow::Error>` therefore stays lean even as it threads through every function in the application. The cost of the scheme is one heap allocation per error, paid on the failure path, where you are about to do logging I/O anyway.

## Predict, then verify

```rust
fn load_config() -> anyhow::Result<Config> {
    let text = std::fs::read_to_string("config.toml")
        .context("failed to read config.toml")?;
    parse(&text).context("config.toml is not valid TOML")
}
```

A caller wants to fall back to defaults when the file simply does not exist, but propagate every other failure. Can they, and is it good design?

Answer: they can, awkwardly. `e.downcast_ref::<std::io::Error>()` recovers the concrete error, and `kind() == ErrorKind::NotFound` identifies the case. But needing to downcast routinely is the design smell anyhow's own docs warn about: a failure mode the caller reacts to is control flow, and control flow belongs in the type. The honest signature enumerates, for example a `ConfigError` enum with a `NotFound` variant. Opaque errors are for the modes nobody handles; the moment one becomes handleable, promote it out of the mud.
