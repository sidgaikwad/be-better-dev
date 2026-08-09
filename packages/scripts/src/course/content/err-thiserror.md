Count what `SubscribeError` cost by hand: the enum itself, a `Display` match with one message per variant, an `Error` impl with a `source` match, a stack of `From` impls. Roughly ninety lines, and every one mechanical: nothing in them is a decision, they follow from the shape of the enum. Mechanical code is what macros are for.

```toml
# Cargo.toml
[dependencies]
thiserror = "2"
```

The book pins thiserror 1; the derive surface is unchanged in 2.x.

```rust
#[derive(thiserror::Error, Debug)]
pub enum SubscribeError {
    #[error("{0}")]
    ValidationError(String),
    #[error("Failed to acquire a Postgres connection from the pool")]
    PoolError(#[source] sqlx::Error),
    #[error("Failed to insert new subscriber in the database.")]
    InsertSubscriberError(#[source] sqlx::Error),
    #[error("Failed to store the confirmation token for a new subscriber.")]
    StoreTokenError(#[from] StoreTokenError),
    #[error("Failed to send a confirmation email.")]
    SendEmailError(#[from] reqwest::Error),
}
```

A quarter of the code, and every remaining line is a decision (a message, a source, a conversion) rather than plumbing. Each attribute maps onto one piece of the hand-written version:

- `#[error("...")]` becomes the `Display` arm for that variant. `{0}` interpolates the first field, tuple-struct style, so `ValidationError` displays its message.
- `#[source]` marks the field returned by `Error::source`, the chain link from the Error-trait lesson.
- `#[from]` generates `impl From<StoreTokenError> for SubscribeError` and marks the field as the source as well: from implies source, no need to write both.
- `#[error(transparent)]`, not used here yet, forwards both `Display` and `source` to the inner error, for pure pass-through variants.

Two absences carry as much design as the attributes:

- `ValidationError(String)` has no `#[source]`. `String` does not implement `Error`, so it cannot sit in a chain; the validation message is its own root cause, the same reason the hand-written `source` match returned `None` for it.
- `PoolError` and `InsertSubscriberError` use `#[source]` but not `#[from]`. Two `#[from]` attributes on `sqlx::Error` fields would generate the two conflicting `From` impls the previous lesson watched the compiler reject. The macro writes exactly the code you would have written, so it inherits every rule; the `map_err(SubscribeError::PoolError)` call sites stay.

## What a derive macro actually is

`thiserror::Error` is a procedural macro. At compile time it receives your enum as a stream of tokens, runs ordinary Rust code to compute an output, and hands back new source text: the `Display`, `Error`, and `From` impls, which the compiler then compiles as if you had typed them. Run `cargo expand` and you can read the generated impls verbatim. Nothing exists at runtime: no reflection, no metadata, no registration, in contrast with the decorator-plus-reflection patterns of the TypeScript world. It is the same mechanism as `#[derive(Debug)]` and serde's `#[derive(Deserialize)]`, pointed at error plumbing.

When is this the right tool? thiserror is for **enumerated** errors: types whose callers are expected to look at the variants and behave differently. That means per-layer enums like `SubscribeError`, and public library error types especially, where you cannot know which failure modes your users care about. It makes an enumeration cheap to maintain. It does not answer whether enumeration is the right design; the next lesson is about the cases where it is not.

## Predict, then verify

```rust
#[derive(thiserror::Error, Debug)]
pub enum ConfigError {
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

let e = ConfigError::Io(std::io::Error::new(
    std::io::ErrorKind::NotFound,
    "config.toml missing",
));
println!("{e}");
```

What prints?

Answer: `config.toml missing`, the inner `io::Error`'s own `Display`, with no added prefix. `transparent` means the variant adds no vocabulary of its own: `Display` and `source` both delegate to the wrapped error, as if the layer were not there. Use it when a variant exists only to give a foreign error a slot in your enum; use `#[error("...")]` plus `#[source]` when the layer has something of its own to say, which, in a report worth reading, is most of the time.
