Before the newsletter can sign anyone up, the book builds a stepping stone: `GET /health_check` returns `200 OK` with an empty body. No business logic is the point: every moving part you meet here carries over to every endpoint the service will ever have.

```rust
//! src/main.rs
use actix_web::{web, App, HttpResponse, HttpServer, Responder};

async fn health_check() -> impl Responder {
    HttpResponse::Ok()
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new().route("/health_check", web::get().to(health_check))
    })
    .bind("127.0.0.1:8000")?
    .run()
    .await
}
```

`cargo run`, then `curl -v http://127.0.0.1:8000/health_check`: `HTTP/1.1 200 OK`, `content-length: 0`. (The book adds dependencies with the cargo-edit extension; since Rust 1.62, `cargo add actix-web` and `cargo add tokio --features macros,rt-multi-thread` ship with cargo itself.)

## Three nested layers

`HttpServer` handles everything transport: which address and port to bind, how many concurrent connections to allow, TLS or not. It answers "how do bytes arrive".

`App` is where application logic lives: routing, middleware, shared state. It answers "given a request, which code runs". It is the builder pattern in the wild: `App::new()`, then chained `.route(...)` calls, each returning the App with one more entry in its table.

`Route` is one entry in that table: a path template plus guards. `web::get()` is shorthand for `Route::new().guard(guard::Get())`: match only if the HTTP method is GET. On each request, App walks its routes until path and guards both accept, then calls the handler. A handler is an async function returning `impl Responder`, anything convertible into an `HttpResponse`. `HttpResponse::Ok()` is a response builder primed with status 200, and builders themselves implement `Responder`, so returning one bare is enough.

Notice the handler takes no arguments. An earlier draft took `req: HttpRequest` and the compiler flagged it unused; deleting the parameter entirely still compiles, because actix-web accepts a whole family of handler signatures. The machinery that makes that legal (extractors) is two lessons away.

## The runtime under the floor

Delete `#[tokio::main]` and `cargo check` refuses:

```
error[E0752]: `main` function is not allowed to be `async`
```

The async-from-scratch section said why: a future is inert until something calls `poll` on it, and Rust ships no runtime in the standard library. Someone synchronous has to stand at the process entry point and drive.

`cargo +nightly expand` shows who. The macro rewrites `main` into:

```rust
fn main() -> std::io::Result<()> {
    let body = async move { /* your async main, verbatim */ };
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .expect("Failed building the Runtime")
        .block_on(body)
}
```

No magic, only code generation: a synchronous `main` builds the multi-threaded, work-stealing runtime from the tokio section and blocks on your async body. `HttpServer::run` hands back a future; awaiting it parks the accept loop on that runtime until shutdown. The hand-made executor you built in Part 2 and this production stack differ in sophistication, not in kind.

## Predict, then verify

The routing table has exactly one entry: `.route("/health_check", web::get().to(health_check))`. What status does `curl -X POST http://127.0.0.1:8000/health_check` receive, and why that one rather than the other plausible candidate?

Answer: `404 Not Found`, not `405 Method Not Allowed`. Guards are filters, not validators: when the `Get` guard rejects a POST, that route simply does not match, App keeps scanning, runs out of entries, and falls back to its default not-found response. Producing a proper 405 requires giving actix more information (registering the other methods on that resource) so it can tell "unknown path" apart from "known path, wrong method".
