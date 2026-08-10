`subscribe` is a pipeline: validate the form, open a transaction, insert the subscriber, store a token, send the confirmation email. Written the way the Result lesson promised, it should read top to bottom:

```rust
pub async fn subscribe(/* ... */) -> Result<HttpResponse, SubscribeError> {
    let new_subscriber = form.0.try_into()?;              // Err(String)
    let mut transaction = pool.begin().await?;            // Err(sqlx::Error)
    let id = insert_subscriber(&mut transaction, &new_subscriber).await?;
    store_token(&mut transaction, id, &token).await?;     // Err(StoreTokenError)
    send_confirmation_email(&email_client, new_subscriber, &token).await?;
    Ok(HttpResponse::Ok().finish())
}
```

`cargo check` produces an avalanche of one complaint: `?` couldn't convert the error to `SubscribeError`. Four different error types flow out of those calls, and `?` only converts where a `From` impl exists.

## A variant per failure mode

The enums lesson called an enum one-of-several-shapes. A layer's failure is exactly that:

```rust
#[derive(Debug)]
pub enum SubscribeError {
    ValidationError(String),
    PoolError(sqlx::Error),
    InsertSubscriberError(sqlx::Error),
    StoreTokenError(StoreTokenError),
    SendEmailError(reqwest::Error),
}

impl From<reqwest::Error> for SubscribeError {
    fn from(e: reqwest::Error) -> Self {
        Self::SendEmailError(e)
    }
}
// ... From<StoreTokenError>, From<String> ...
```

With the From impls in place, every `?` composes, exactly as the Result lesson described: unwrap the Ok, or convert and return the Err. Add a `Display` message and a `source` match arm per variant (previous lesson) and the report chain survives too.

## Where From runs out

`PoolError` and `InsertSubscriberError` both wrap `sqlx::Error`. Try writing both conversions:

```rust
impl From<sqlx::Error> for SubscribeError { /* -> PoolError */ }
impl From<sqlx::Error> for SubscribeError { /* -> InsertSubscriberError */ }
```

The compiler rejects the second: conflicting implementations of `From<sqlx::Error>`. From dispatches on the type alone, and the type alone does not say which operation failed. Acquiring a connection, inserting a row, committing the transaction: all fail as `sqlx::Error`, and the operator's report must distinguish them. Where the type is ambiguous, name the operation at the call site:

```rust
let mut transaction = pool.begin().await.map_err(SubscribeError::PoolError)?;
```

Enum variant constructors are plain functions, so `map_err(SubscribeError::PoolError)` passes the constructor directly. The `?` still propagates; only the conversion became explicit.

## Layer by layer

The shape that emerges is this section's core discipline. Each layer owns an error vocabulary at its own altitude: `store_token` speaks storage (`StoreTokenError`), `subscribe` speaks subscription flow (`SubscribeError`), and each wraps the layer below as a variant with `source` wired, so root causes ride along. Conversions live at the edges, in From impls or a `map_err`, and `?` does the carrying.

Could you skip the ceremony and bolt response behavior straight onto `sqlx::Error`? No, twice over. The orphan rule forbids implementing a foreign trait for a foreign type (your crate owns neither actix-web's `ResponseError` nor `sqlx::Error`), precisely so that two dependencies can never install competing impls. And it would be wrong anyway: whether a storage failure becomes a 500 is the request handler's decision, and encoding it in the storage layer leaks one layer's concern into another. New layer, new type.

## One level deeper

`?` desugars to roughly:

```rust
match expr {
    Ok(v) => v,
    Err(e) => return Err(From::from(e)),
}
```

Every conversion is resolved at compile time and inlined; there is no reflection, no exception-table unwinding machinery, no runtime cost beyond the match you would have written by hand. The layered structure is ordinary enums and ordinary calls, which is also why exhaustiveness keeps working for it: add a variant to `SubscribeError` and, as the match lesson promised, every non-wildcard match over it becomes a compile error, a complete worklist of decision points.

## Predict, then verify

A teammate, tired of typing `map_err`, adds a single `impl From<sqlx::Error> for SubscribeError` mapping every database failure to one reused `DatabaseError(sqlx::Error)` variant, then deletes the `map_err` calls. It compiles. What got worse?

Answer: the report. Pool acquisition, row insertion, and commit failures now all collapse into `DatabaseError`, and its `Display` has one string to describe three different operations. The operator reading the log can no longer tell which step died without spelunking through sqlx internals. The type system did not object because the types are identical; the information that distinguished the cases lived in the call sites, and the `map_err` calls were where it was captured. Convenience traded away the report's precision. The next lesson removes the typing cost without repeating this trade.
