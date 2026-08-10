The empty log record has an obvious fix: stop discarding the error and hand it to the framework. actix-web builds its own `actix_web::Error` out of anything implementing the `ResponseError` trait, and the response it generates defaults to exactly the 500 we were constructing by hand. First attempt:

```rust
use actix_web::ResponseError;

impl ResponseError for sqlx::Error {}
```

```text
error[E0117]: only traits defined in the current crate
              can be implemented for arbitrary types
  = note: define and implement a trait or new type instead
```

The orphan rule: foreign trait for a foreign type is forbidden, so two of your dependencies can never install competing implementations behind your back. The rejection is also good design advice. "This maps to a 500" is not a fact about every `sqlx::Error` in the program; it is a fact about this failure, failing to store a subscription token. So take the compiler's note literally and wrap it:

```rust
#[derive(Debug)]
pub struct StoreTokenError(sqlx::Error);

impl std::fmt::Display for StoreTokenError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "A database failure was encountered while \
            trying to store a subscription token."
        )
    }
}

impl ResponseError for StoreTokenError {}
```

The derive and the Display impl are not decoration. Without them the `ResponseError` impl dies with `E0277`: the trait is declared `ResponseError: fmt::Debug + fmt::Display`, the two audiences written as a trait bound. Debug owes the operator a faithful structural dump; Display owes a human a brief account of what failed. (The Error-trait lesson in Part 1 covers the split in full.)

`store_token` now returns `Result<(), StoreTokenError>`, wrapping the cause in its `map_err`, and the handler stops swallowing:

```rust
pub async fn subscribe(/* ... */) -> Result<HttpResponse, actix_web::Error> {
    // [...]
    // ? converts StoreTokenError into actix_web::Error via actix-web's
    // blanket impl: From<T> for Error where T: ResponseError + 'static
    store_token(&mut transaction, subscriber_id, &subscription_token).await?;
    // [...]
}
```

Rerun the sabotage test and read the END record:

```text
INFO: [HTTP REQUEST - END]
    exception.details= StoreTokenError(Database(PgDatabaseError {
        code: "42703",
        message: "column 'subscription_token' of relation
                  'subscription_tokens' does not exist", ...}))
    exception.message= "A database failure was encountered while
                        trying to store a subscription token.",
    http.status_code=500
```

One record now answers both questions: what we were doing (`exception.message`, from Display) and what actually broke (`exception.details`, where the derived Debug prints the wrapped `sqlx::Error`, structure and all).

## Making the cause official

Look closely at why the root cause is visible: only because it happens to be field `.0` and derived Debug is faithful. The causal link is implicit, an accident of layout. The standard library's `Error` trait makes it explicit and walkable:

```rust
impl std::error::Error for StoreTokenError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        // The compiler casts &sqlx::Error to &dyn Error transparently
        Some(&self.0)
    }
}
```

Once causes are reachable through `source()`, generic code can iterate a chain of types it knows nothing about. The chapter writes that iterator once and points a bespoke Debug at it:

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

// Replaces #[derive(Debug)]
impl std::fmt::Debug for StoreTokenError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        error_chain_fmt(self, f)
    }
}
```

`exception.details` turns from nested type soup into a readable report, one `Caused by:` line per level, and `error_chain_fmt` gets reused by every error type the rest of the chapter defines.

## Predict, then verify

With the bespoke Debug in place, what exactly does `println!("{:?}", err)` print for a `StoreTokenError` wrapping the 42703 failure, and what stops the loop?

Answer: the wrapper's own Display line ("A database failure was encountered while trying to store a subscription token."), a blank line, then `Caused by:` and the database error's Display ("error returned from database: column 'subscription_token' of relation 'subscription_tokens' does not exist"). The loop walks `source()` until a level returns `None`: the root cause. Notice the Debug output is assembled entirely from Display representations, one per link: the operator's report is a stack of each layer's one-line summary.
