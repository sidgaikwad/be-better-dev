The port starts where the framework is densest. `startup.rs` currently builds an `HttpServer` around a factory closure:

```rust
// actix: src/startup.rs (abridged)
let server = HttpServer::new(move || {
    App::new()
        .wrap(TracingLogger::default())
        .route("/health_check", web::get().to(health_check))
        .route("/subscriptions", web::post().to(subscribe))
        .app_data(db_pool.clone())
        .app_data(email_client.clone())
        .app_data(base_url.clone())
})
.listen(listener)?
.run();
```

The axum equivalent is a value, not a closure:

```rust
// axum: src/startup.rs
use axum::{routing::{get, post}, Router};

let app = Router::new()
    .route("/health_check", get(health_check))
    .route("/subscriptions", post(subscribe))
    .with_state(app_state);

axum::serve(listener, app).await
```

Same routes, same verbs. The two structural changes, the missing closure and the `with_state` call, are each a lesson about what sits underneath.

## Where the closure went

From the application-state lesson: actix wants a factory because every worker thread builds its own `App` and drives it on its own single-threaded runtime, and requests stay on the thread that accepted them. axum builds one `Router`, a plain value that clones cheaply, and `axum::serve` hands it to hyper on the shared work-stealing runtime from the tokio section: any worker may poll any request, and a task can migrate between polls.

That difference casts a type-level shadow. axum handler futures must be `Send`; actix's never had to be, because they never changed threads. The book's code is `Send` throughout (sqlx, reqwest, and tokio types all are), so the port sails past this. A codebase leaning on `Rc` or other `!Send` state across an `.await` would stop compiling right here, which is the honest version of a migration guide: the runtime models were always different, actix just never made you prove yours.

One version note before a search engine misleads you: tutorials from before late 2023 show `axum::Server::bind(&addr)`. That was a re-export of hyper 0.14's server, removed in axum 0.7. Today you bind a `tokio::net::TcpListener` yourself (an async bind, unlike `std`'s) and hand it to `axum::serve`.

## State the compiler can see

`web::Data<T>` was an `Arc` in a runtime type-map: register a value under its `TypeId`, look it up during extraction, and if nobody registered one, the lookup fails per request, as a 500, in production. axum moves that ledger into the type system. `Router<AppState>` names the state type it needs, `.with_state(app_state)` supplies the value, handlers ask for `State<T>`. Register nothing and the program does not compile.

One router carries one state type, so the three `app_data` calls become fields:

```rust
use axum::extract::FromRef;

#[derive(Clone, FromRef)]
pub struct AppState {
    pub db_pool: PgPool,
    pub email_client: EmailClient,
    pub base_url: ApplicationBaseUrl,
}
```

`FromRef` (behind axum's `macros` feature) generates one impl per field, so a handler can take `State<PgPool>` without ever naming `AppState`. The lookup is by type, exactly as `Data`'s was: two `String` fields would expand to two conflicting `impl FromRef<AppState> for String`, and the build fails until you reach for newtypes. The `ApplicationBaseUrl` newtype the book introduced to survive the type-map carries straight over, still earning its keep.

Cost check, in the spirit of the clone-judgment lesson: extraction clones the substate on every request, and that is fine because these are the cheap clones. `PgPool` and `reqwest::Client` are handles around `Arc`-managed internals; the per-request price is an atomic increment, not a second connection pool.

## Predict, then verify

Delete the `email_client` field from `AppState` but leave a handler taking `State<EmailClient>`. In actix, the equivalent mistake, forgetting one `.app_data` call, produced a binary that built, deployed, and returned 500 on the first request that needed the client. What happens here, and where does the message point?

Answer: `cargo check` fails at route registration: `subscribe` no longer implements the `Handler` trait for state `AppState`, because `EmailClient: FromRef<AppState>` cannot be satisfied. The error arrives as a trait-bound wall pointing at `post(subscribe)` rather than at the missing field; `#[axum::debug_handler]` on the handler rewrites it into a readable sentence. Same mistake in both frameworks; the port moved its discovery from production traffic to the compiler.
