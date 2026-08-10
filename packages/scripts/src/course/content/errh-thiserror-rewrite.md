Count what the last two lessons hand-wrote for `SubscribeError` and `StoreTokenError`: a Display match with an arm per variant, an `Error` impl with a `source()` match, a stack of `From` impls, the chain-printing Debug. Roughly 90 lines, and not one of them is a decision: every line is mechanically determined by the shape of the enum. Mechanically determined code is what derive macros are for.

```toml
[dependencies]
thiserror = "1"
```

(The book pins 1.x; thiserror 2 is current and the attribute language below is unchanged.) The same type, regenerated:

```rust
#[derive(thiserror::Error)]
pub enum SubscribeError {
    #[error("{0}")]
    ValidationError(String),
    #[error("Failed to acquire a Postgres connection from the pool")]
    PoolError(#[source] sqlx::Error),
    #[error("Failed to insert new subscriber in the database.")]
    InsertSubscriberError(#[source] sqlx::Error),
    #[error("Failed to store the confirmation token for a new subscriber.")]
    StoreTokenError(#[from] StoreTokenError),
    #[error("Failed to commit SQL transaction to store a new subscriber.")]
    TransactionCommitError(#[source] sqlx::Error),
    #[error("Failed to send a confirmation email.")]
    SendEmailError(#[from] reqwest::Error),
}

// Still bespoke: the derive does not do chain reports
impl std::fmt::Debug for SubscribeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        error_chain_fmt(self, f)
    }
}
```

21 lines where 90 stood, and the sabotage test's log output is identical. Each attribute maps onto an artifact you already wrote by hand (Part 1's thiserror lesson has the general contract):

- `#[error("...")]` is the Display arm for its variant. `{0}` interpolates field 0 using tuple-struct field syntax, so `ValidationError` displays its message, exactly like the `write!(f, "{}", e)` arm it replaces.
- `#[source]` is the `source()` match arm: this field is the cause, reachable by `error_chain_fmt` and anything else that walks chains.
- `#[from]` is the `From` impl, and it implies `#[source]` too, so `StoreTokenError` and `reqwest::Error` keep flowing through bare `?`.

Just as instructive is what did not change, because the constraints were never about typing effort:

- `PoolError`, `InsertSubscriberError`, and `TransactionCommitError` carry `#[source]`, not `#[from]`. `#[from]` expands to `impl From<sqlx::Error> for SubscribeError`; three of those is the same coherence conflict as before. The `map_err(SubscribeError::PoolError)` call sites stay.
- `ValidationError` carries neither attribute: `String` does not implement `Error`, so it can be neither a source nor an auto-converted cause. With the old `impl From<String>` gone, the handler converts explicitly:

```rust
let new_subscriber = form.0.try_into().map_err(SubscribeError::ValidationError)?;
```

- Debug stays hand-written. thiserror would happily let the standard derive print structure, but the operator report wants the `Caused by:` walk, and a macro cannot guess that preference.

## What the macro actually does

`#[derive(thiserror::Error)]` is a procedural macro. At compile time it receives the enum definition as a stream of tokens and emits new Rust source, plain `impl Display`, `impl Error`, and `impl From` blocks that compile into the binary like anything you typed. There is no runtime component, no reflection, and no special dispensation: the generated impls obey coherence, the orphan rule, and the borrow checker exactly as hand-written ones do. `cargo expand` will print the output if you want to read it. The derive changes who writes the boilerplate, not what exists in the compiled program.

## Predict, then verify

What do these two lines print?

```rust
println!("{}", SubscribeError::ValidationError("name cannot be empty".into()));
println!("{}", SubscribeError::PoolError(pool_timeout));
```

Answer: `name cannot be empty` and `Failed to acquire a Postgres connection from the pool`. The first interpolates field 0 through `#[error("{0}")]`; the second prints its fixed message, and the wrapped `sqlx::Error` appears nowhere in it. That is deliberate: Display is one layer's one-line summary, and the underlying cause is reachable only through `source()`, which is how it lands in the `Caused by:` chain of the Debug report rather than the top line.
