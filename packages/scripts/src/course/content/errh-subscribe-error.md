`impl ResponseError for StoreTokenError` bought a useful log, but look at what it welded together. `store_token` is a storage routine, blissfully unaware of REST, yet its error type now implements a trait from the web framework. Call it from a CLI someday, or from another endpoint that does not want a 500 for this failure, and the coupling bites. Choosing a status code is the request handler's concern; it should not leak elsewhere. The chapter deletes the impl and gives the handler its own failure type:

```rust
pub async fn subscribe(/* ... */) -> Result<HttpResponse, SubscribeError> {
```

`cargo check` responds with an avalanche of `` `?` couldn't convert the error to `SubscribeError` ``. Every fallible call in the handler returns a different type, and `?` needs a `From` path for each (the mechanism from the Result-basics lesson; the layering pattern is Part 1's one-error-type-per-layer lesson). The standard move is an enum, one variant per failure the handler meets:

```rust
#[derive(Debug)]
pub enum SubscribeError {
    ValidationError(String),
    DatabaseError(sqlx::Error),
    StoreTokenError(StoreTokenError),
    SendEmailError(reqwest::Error),
}

impl From<reqwest::Error> for SubscribeError {
    fn from(e: reqwest::Error) -> Self {
        Self::SendEmailError(e)
    }
}
// ...same shape for sqlx::Error, StoreTokenError, and String
```

The handler body collapses into straight-line `?`:

```rust
let new_subscriber = form.0.try_into()?;
let mut transaction = pool.begin().await?;
let subscriber_id = insert_subscriber(&mut transaction, &new_subscriber).await?;
let subscription_token = generate_subscription_token();
store_token(&mut transaction, subscriber_id, &subscription_token).await?;
transaction.commit().await?;
send_confirmation_email(/* ... */).await?;
Ok(HttpResponse::Ok().finish())
```

It compiles, and a previously green test goes red:

```text
thread 'subscribe_returns_a_400_when_fields_are_present_but_invalid'
panicked at 'assertion failed: `(left == right)`
  left: `400`,
  right: `500`'
```

`SubscribeError` is using `ResponseError`'s default implementation, and the default always answers 500. Bad input is not a server error: the user caused it and can fix it. This is where the enum earns its keep, control flow by match:

```rust
use actix_web::http::StatusCode;

impl ResponseError for SubscribeError {
    fn status_code(&self) -> StatusCode {
        match self {
            SubscribeError::ValidationError(_) => StatusCode::BAD_REQUEST,
            SubscribeError::DatabaseError(_)
            | SubscribeError::StoreTokenError(_)
            | SubscribeError::SendEmailError(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}
```

The endpoint's entire caller-facing policy now sits in one exhaustive match at the boundary. Add a variant next month and this match stops compiling until someone decides its status code: the web-boundary lesson's argument, enforced by rustc.

## The type is not enough

The logs are not done. `exception.message` now always reads "Failed to create a new subscriber.", whatever failed, and there is a subtler hole: `DatabaseError(sqlx::Error)` is reached from three different operations. Acquiring a connection from the pool, inserting the subscriber, committing the transaction: all arrive as `sqlx::Error`, and Display has one arm for the variant with no way to say which operation died. The wrapped type does not carry that information; the variant name has to. Split it:

```rust
PoolError(sqlx::Error),
InsertSubscriberError(sqlx::Error),
TransactionCommitError(sqlx::Error),
```

Now `From<sqlx::Error>` must go: three variants wrap the same type, and the type alone cannot pick one. The call sites decide, because only they know what was being attempted:

```rust
let mut transaction = pool.begin().await.map_err(SubscribeError::PoolError)?;
```

With per-variant Display text, `source()` returning the wrapped error for each (and `None` for `ValidationError`: a `String` is not an `Error`), and Debug delegated to `error_chain_fmt`, the END record finally reads like an incident report:

```text
exception.details="Failed to store the confirmation token for a new subscriber.

    Caused by:
        A database failure was encountered while trying to store a subscription token.
    Caused by:
        error returned from database: column 'subscription_token' of relation
        'subscription_tokens' does not exist"
exception.message="Failed to store the confirmation token for a new subscriber."
```

## Predict, then verify

You add an audit step to the handler, `record_signup(&mut transaction).await?`, where the new function returns `Result<(), sqlx::Error>`. Does it compile?

Answer: no. With `From<sqlx::Error>` deleted, `?` has no conversion path and rustc reports that the trait bound is not satisfied. You are forced into `map_err` with a named variant, which means deciding what this failure is called, what its Display says, and which status code it maps to. That compile error is the design working: "which operation failed" went from a detail you forget to log to something the program will not build without.
