Strip actix-web from the dependency tree and the error modules complain first: every `impl ResponseError for SubscribeError` names a trait that no longer exists. The handler signatures from the last lesson promised `Result<StatusCode, SubscribeError>`, and that return type only satisfies axum if the error half knows how to become a response. There is no error trait to migrate to. axum has exactly one opinion about responses, and errors get no exemption from it.

## The error side of Result

```rust
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

impl IntoResponse for SubscribeError {
    fn into_response(self) -> Response {
        tracing::error!("{:?}", self); // the operator's copy: the full chain
        match self {
            Self::ValidationError(_) => StatusCode::BAD_REQUEST,
            Self::UnexpectedError(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
        .into_response()
    }
}
```

Everything feeding this impl survives the error-handling section intact: the `thiserror` derive, the `#[from]` conversions, `error_chain_fmt` walking `source()`. Two responsibilities did move. Logging: actix could still observe the error value after the handler returned it, which is how the `Debug` chain reached the logs; in axum the error becomes a response before the framework ever touches it, so the operator-facing log line moves inside `into_response`, the last place the full chain exists. And the body: actix's default `error_response` wrote the `Display` text into a `text/plain` body, so keeping internals out of responses meant overriding it. axum's default is that there is no default. The response carries exactly what you build, and the 401 challenge that needed a bespoke `error_response` in the securing section is now just a tuple with a `WWW-Authenticate` header array in it.

## Middleware becomes layers

```rust
let app = Router::new()
    .merge(public_routes)
    .nest("/admin", admin_routes)
    .layer(SessionManagerLayer::new(session_store))
    .layer(TraceLayer::new_for_http().make_span_with(|req: &Request| {
        tracing::info_span!("http_request",
            request_id = %Uuid::new_v4(),
            method = %req.method(),
            uri = %req.uri())
    }));
```

`TracingLogger` exists only for actix; `TraceLayer` from `tower-http` does the same job one level lower, against the `Service` trait itself, and `make_span_with` rebuilds the root span with the `request_id` the telemetry section taught you to demand. One rule keeps stacks like this honest: chained `.layer` calls wrap outward, so the last layer added is outermost, sees the request first, and touches the response last. `TraceLayer` comes last here on purpose: its span opens before anything else runs, so even the session store's Redis round trip happens inside the request's span.

The admin guard ports nearly word for word:

```rust
async fn reject_anonymous_users(session: Session, req: Request, next: Next) -> Response {
    match session.get::<Uuid>("user_id").await {
        Ok(Some(_)) => next.run(req).await,
        _ => Redirect::to("/login").into_response(),
    }
}

let admin_routes = Router::new()
    .route("/dashboard", get(admin_dashboard))
    .route("/logout", post(log_out))
    .route_layer(middleware::from_fn(reject_anonymous_users));
```

`middleware::from_fn` is the direct heir of the actix `from_fn` you used for this exact function: extractors first, then the request and a `Next` handle. Two current-axum notes: `Next` lost its `<B>` type parameter in 0.7 when the body type was fixed, so older snippets need their generics deleted, and `route_layer` applies only to routes that matched, so `/admin/typo` earns a plain 404 rather than a login redirect.

## Sessions without actix-session

actix-session's role goes to `tower-sessions`: the `SessionManagerLayer` above, a Redis-backed store, a `Session` extractor, and a familiar verb set with one visible change:

- `session.insert("user_id", id)?` grows an `.await`
- `session.get::<Uuid>("user_id")?` likewise
- `session.renew()` becomes `session.cycle_id().await`: the fixation defense from the login lesson, under a more literal name
- `session.purge()` becomes `session.flush().await`: data cleared, record deleted, cookie expired

The awaits are not decoration. actix-session loaded session state eagerly in its middleware, before your handler ran; tower-sessions loads the record lazily on first touch, so the first `insert` or `get` is a real Redis round trip and the signature admits it. The `TypedSession` wrapper ports directly, still keeping the `"user_id"` string in exactly one file, and flash messages lose their dedicated actix crate to become a small pattern over the same session: write on failure, read-and-remove on the next render.

## Predict, then verify

A refactor registers the guard globally instead of on the admin router:

```rust
let app = Router::new()
    .merge(public_routes)
    .nest("/admin", admin_routes)
    .layer(SessionManagerLayer::new(session_store))
    .layer(middleware::from_fn(reject_anonymous_users));
```

Two distinct bugs now exist. Predict both.

Answer: added last, the `from_fn` layer is outermost and runs before `SessionManagerLayer` has attached a session to the request, so its `Session` extractor fails every request with a 500 (tower-sessions' error message asks whether the layer is enabled). Swap the two `.layer` calls and the 500s stop, which exposes the second bug: the guard now fronts everything, so `GET /health_check` and `POST /subscriptions` redirect anonymous callers to `/login` and the public API is gone. Note what the port did not buy you: state registration moved into the type system last lesson, but layers are values composed at runtime, and no compiler checks that you stacked them in a runnable order. That check is still yours.
