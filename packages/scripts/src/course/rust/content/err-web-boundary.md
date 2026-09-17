`SubscribeError` now says exactly two things: the input was bad, or something unexpected happened. The last step is teaching the edge what each one means in HTTP. In actix-web, the framework asks the error itself, through the `ResponseError` trait:

```rust
use actix_web::http::StatusCode;
use actix_web::ResponseError;

impl ResponseError for SubscribeError {
    fn status_code(&self) -> StatusCode {
        match self {
            SubscribeError::ValidationError(_) => StatusCode::BAD_REQUEST,
            SubscribeError::UnexpectedError(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

pub async fn subscribe(
    form: web::Form<FormData>,
    // ...
) -> Result<HttpResponse, SubscribeError> {
    // every ? in here now produces the right response
}
```

The handler returns `Result`; on `Err`, actix-web builds the response using this impl. `ResponseError` ships default methods that answer 500 for everything, which is exactly the bug the book's test suite caught: with the defaults in place, a form with an empty name came back as a 500 instead of a 400. The match is where the decision is actually made, and the rule for making it falls straight out of the two-audiences lesson:

- **400 Bad Request** for failures the user caused and can fix: a malformed email, a missing field. The body should help them fix it.
- **500 Internal Server Error** for everything they cannot act on: pool timeouts, broken schemas, the email provider being down. The body stays empty; the details belong to the log, not the user.

Because the match is exhaustive, the mapping is future-proof in the way the match lesson promised: add a `RateLimited` variant next quarter and this impl stops compiling until someone decides its status code. A boundary decision cannot silently default.

(The book targets the actix-web 4 betas; the trait is unchanged in actix-web 4 stable. The pattern is not actix-specific either: implementing axum's `IntoResponse` for your error type plays the same role.)

## Who logs?

Sabotage the database again and count the `ERROR`-level records emitted for one failing request:

1. the `tracing::error!` inside `insert_subscriber`, logging before propagating;
2. a record from actix-web itself, emitted while converting the error into a response;
3. a record from the telemetry middleware wrapping the request.

Three records, one incident. An operator now has to guess: three different errors, or one error three times? Duplicates are not just noise. They corrupt error-rate dashboards and defeat the deduplication that alerting tools rely on.

The rule of thumb: **errors should be logged when they are handled.** A function that propagates with `?` is not handling the error, so it should not log it; its contribution is context, wrapping with a `source` (thiserror) or `.context()` (anyhow) so the eventual record is rich. In a web service the handler propagates too. The one place that actually handles a request failure is the telemetry middleware at the top of the stack, which logs status, latency, and `exception.details` with the full source chain, once. So delete the `tracing::error!` calls buried in the storage functions and let the middleware speak. (The duplicate record actix-web itself emitted was removed in later releases, closing the loop.)

One failure, one error event, chain attached, at the boundary: that is the finished shape of everything this section built. Enums and From carry failures upward, `source` keeps the roots, the status code speaks to the client, and a single log record speaks for the operator.

## Predict, then verify

With the final design in place, `pool.begin()` fails with `sqlx::Error::PoolTimedOut` during a subscribe request. The `.context("Failed to acquire a Postgres connection from the pool")` wrapping feeds it into `UnexpectedError`. What does the user receive, and what appears in the logs?

Answer: the user gets a 500 with an empty body. A pool timeout is nothing they can act on, so the edge omits it by design; the 500 itself is the machine-readable signal a client can script a retry against. The logs get exactly one error-level record, at the middleware, whose details read like a story: failed to acquire a Postgres connection from the pool, caused by pool timed out. No record from the storage layer and none from the handler; both only added context on the way up. If you expected the storage function to log too, that was yesterday's design, and its record would have been the duplicate.
