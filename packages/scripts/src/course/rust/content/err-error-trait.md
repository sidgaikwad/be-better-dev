Sabotage the newsletter database (drop the `subscription_token` column), run the subscribe test, and read the logs. Deep inside `store_token`, a `tracing::error!` faithfully records the sqlx error. But the record that matters, the one emitted where the request finishes, says this:

```
ERROR: [HTTP REQUEST - END]
    exception.details="",
    exception.message="",
    http.status_code=500
```

The handler turned the failure into `HttpResponse::InternalServerError().finish()` and dropped the error value, so the request-level record knows a 500 happened and nothing else. The root cause existed thirty lines down; it did not survive the trip up. Rust's answer to "carry the cause upward without knowing its concrete type" is the standard library's `Error` trait.

## The trait

```rust
pub trait Error: Debug + Display {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        None
    }
}
```

`Result` does not require it: any type can sit in the E slot. Implementing `Error` is a semantic marker, and a contract that the type can serve both audiences from the previous lesson:

- `Debug` is the programmer-facing representation, as faithful to the underlying structure as possible. Usually derived.
- `Display` is the human-facing one: a brief description of what failed, written by you.

Same value, two renderings, one per audience.

## source(): the chain

`source` returns the lower-level cause of this error, if any. It is what lets a wrapping error add meaning without destroying what it wrapped:

```rust
#[derive(Debug)]
pub struct StoreTokenError(sqlx::Error);

impl std::fmt::Display for StoreTokenError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "A database failure was encountered while trying \
                   to store a subscription token.")
    }
}

impl std::error::Error for StoreTokenError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        Some(&self.0)
    }
}
```

`StoreTokenError` states what the operation meant in domain terms. Its source is the `sqlx::Error`, whose own source may be a Postgres driver error, and so on down to the root. Any code can walk that chain generically:

```rust
fn error_chain_fmt(
    e: &impl std::error::Error,
    f: &mut std::fmt::Formatter<'_>,
) -> std::fmt::Result {
    writeln!(f, "{}\n", e)?;
    let mut current = e.source();
    while let Some(cause) = current {
        writeln!(f, "Caused by:\n\t{}", cause)?;
        current = cause.source();
    }
    Ok(())
}
```

The `while let` is the patterns lesson at work. Use this as the `Debug` impl for your error types and the request-end record becomes:

```
exception.details=
    "A database failure was encountered while trying to store
     a subscription token.

    Caused by:
        error returned from database: column 'subscription_token'
        of relation 'subscription_tokens' does not exist"
```

Every layer's meaning, root cause last. This is the rule the whole section builds on: wrapping must preserve the chain. An error type that swallows its cause turns the operator's report back into "something went wrong".

## One level deeper: dyn Error

The return type `Option<&(dyn Error + 'static)>` deserves a closer look. `dyn Error` is a trait object: a value about which you know nothing except that it implements `Error`. The reference is two words in memory, a pointer to the value plus a pointer to a vtable, and every call through it is dynamic dispatch, resolved at runtime. That opacity is the design: generic code gets the chain (formatting, telemetry, one `downcast_ref` escape hatch for recovering a concrete type) while learning nothing about concrete error types. The `'static` bound means the trait object does not borrow from short-lived data, so chains can be stored and shipped around freely. Trait objects get their full treatment in the traits section; for now, read `dyn Error` as "some error, exact type unknown until runtime".

## Predict, then verify

A teammate wraps an error but leaves the default `source` in place:

```rust
impl std::error::Error for StoreTokenError {}
```

Everything compiles, and `Debug` still derives. What does `error_chain_fmt` print for this error now?

Answer: the top-level `Display` line and nothing else. The default `source` returns `None`, so the `while let` never runs and no `Caused by:` lines appear. The sqlx error is still physically inside the struct, and the derived `Debug` would show it as nested data, but every _generic_ consumer of the chain (your formatter, tracing integrations, anyhow's report printer) sees the chain end at the top. Wrapping without wiring `source` severs the chain for the whole ecosystem, which is why the thiserror lesson makes declaring the source a one-attribute habit.
