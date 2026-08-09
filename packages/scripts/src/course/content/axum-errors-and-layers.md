Remove actix-web from `Cargo.toml` and the first casualty in `routes/` is a trait: `impl ResponseError for SubscribeError` has nothing left to implement. Everything behind it survives: the enums from the error-handling section, the thiserror derives, the `error_chain_fmt` Debug that prints the `Caused by:` chain. What vanished is the adapter that turned them into HTTP. In axum that job belongs to the same trait the happy path already uses:

```rust
use axum::{http::StatusCode, response::{IntoResponse, Response}};

impl IntoResponse for SubscribeError {
    fn into_response(self) -> Response {
        let status = match &self {
            SubscribeError::ValidationError(_) => StatusCode::BAD_REQUEST,
            SubscribeError::UnexpectedError(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };
        if status.is_server_error() {
            tracing::error!(error.details = ?self, error.message = %self, "handler failed");
        }
        status.into_response()
    }
}
```

The match is `ResponseError::status_code` under a new name. The `tracing::error!` line is new, and load-bearing. In the book's stack, `tracing-actix-web` recorded `exception.details` on the root span whenever a handler returned `Err`. No axum middleware can do that for you: by the time any layer sees the response, `into_response` has already consumed the enum and produced a bare 500. This method is the last place the rich error exists, so the operator's record from the two-audiences lesson gets emitted here, full Debug chain, before the value dies. (The fancier pattern, stashing the error in the response's extensions for a layer to log later, obeys the same law: capture it before the type boundary or never.)

One absence to notice: actix had `actix_web::Error`, a boxed catch-all that every `ResponseError` converted into. axum has none; a handler's error type must itself implement `IntoResponse`, and `anyhow::Error` does not. The book's `e500` helper becomes the standard axum idiom instead: a small `AppError(anyhow::Error)` newtype with a `From` impl and an `IntoResponse` that answers 500.

## wrap becomes layer

Middleware keeps its shape and changes suppliers. actix middleware implements actix's `Transform` trait and runs only in actix; axum middleware is a tower `Layer`, and `tower-http` ships the generic ones:

```rust
use tower_http::trace::TraceLayer;

let app = Router::new()
    // ...routes...
    .layer(TraceLayer::new_for_http().make_span_with(|request: &Request<Body>| {
        tracing::info_span!(
            "HTTP request",
            request_id = %Uuid::new_v4(),
            method = %request.method(),
            uri = %request.uri(),
        )
    }))
    .with_state(app_state);
```

That is `TracingLogger` replaced: one root span per request, our `request_id` minted in `make_span_with`, handler spans nesting inside it, the entire telemetry section intact with one supplier swapped. `.layer` wraps every route registered before it; to stack several with readable ordering, `tower::ServiceBuilder` applies its list top to bottom. And because `TraceLayer` is written against tower's `Service` trait rather than against axum, the same layer can front the tonic gRPC server waiting in Part 4.

The book's `reject_anonymous_users` middleware, built with actix-web-lab's `from_fn`, ports to `axum::middleware::from_fn`: still an async function handed the request and a `next`, still deciding between forwarding and a redirect to `/login`.

## Sessions

actix-session's job moves to tower-sessions:

```rust
let session_layer = SessionManagerLayer::new(store).with_secure(true); // store: Redis via tower-sessions-redis-store
let app = router.layer(session_layer);

pub async fn admin_dashboard(session: Session, State(pool): State<PgPool>) -> Result<Html<String>, AppError> {
    let user_id: Option<Uuid> = session.get("user_id").await?;
    // ...
```

`Session` extracts from request parts, so it sits anywhere before the body consumer. Every operation is async because the store round-trip happens when you touch the data. The security section's ceremony maps one to one: `session.renew()` on login becomes `session.cycle_id().await`, same session-fixation defense, fresh id, data kept; `session.purge()` on logout becomes `session.flush().await`. The `TypedSession` wrapper is still worth having, now as a small extractor of your own wrapping `Session`. Flash messages do lose their crate, `actix-web-flash-messages` being actix-only: a signed cookie of your own is a short exercise, and the cookie-anatomy lesson already handed you every ingredient.

## Predict, then verify

You port everything above but forget the `tracing::error!` line in `into_response`. The sabotage test from the error-handling section breaks `store_token` again, and the suite runs. What do the logs show for that request, and does any test fail?

Answer: `TraceLayer`'s failure hook logs an error event with status, latency, and route, because it classifies 5xx responses as failures. The `Caused by:` chain is gone: the layer never held `SubscribeError`, only the finished response, so it can report that a failure happened but not why. And every test stays green, since the client-visible contract, a 500, is intact. Telemetry regressions do not fail tests; they fail investigations, the same verdict the spawn_blocking lesson delivered about orphaned spans.
