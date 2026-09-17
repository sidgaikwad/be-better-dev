The health check worked because we ran the app and poked it with `curl` by hand. Manual checks rot: the point of the pipeline from the ci-from-day-one lesson is that every change re-verifies every assumption automatically. So before any real feature, the book builds the testing strategy the rest of the project stands on.

The principle: an API's endpoints are its contract, so test them the way a client uses them. A unit test that called `health_check()` directly would keep passing after you deleted the route or moved it to POST, because it never touches routing. The book wants black-box tests: launch the real application, send real HTTP, assert only on what comes back.

Part 1's testing section gave Rust's three test homes: embedded `#[cfg(test)]` modules, the external `tests/` folder, and doc tests. Files under `tests/` each compile into a separate binary that links your crate exactly like an outside dependency would. That enforced distance is usually a restriction; for black-box tests it is precisely the coupling you want.

One obstacle: the project is a binary crate, and a binary's internals cannot be imported by anything. The fix is the lib/bin split:

```toml
# Cargo.toml
[lib]
path = "src/lib.rs"

[[bin]]
path = "src/main.rs"
name = "zero2prod"
```

All logic moves into the library; `main` shrinks to a shim calling `zero2prod::run()`. And `run` stops awaiting the server, handing it back so each caller decides what to do with it:

```rust
//! src/lib.rs
pub fn run(listener: TcpListener) -> Result<Server, std::io::Error> {
    let server = HttpServer::new(|| {
        App::new().route("/health_check", web::get().to(health_check))
    })
    .listen(listener)?
    .run();
    Ok(server) // no .await here
}
```

Now the harness:

```rust
//! tests/health_check.rs
fn spawn_app() -> String {
    let listener = TcpListener::bind("127.0.0.1:0").expect("Failed to bind random port");
    let port = listener.local_addr().unwrap().port();
    let server = zero2prod::run(listener).expect("Failed to bind address");
    let _ = tokio::spawn(server);
    format!("http://127.0.0.1:{}", port)
}

#[tokio::test]
async fn health_check_works() {
    let address = spawn_app();
    let client = reqwest::Client::new();
    let response = client
        .get(&format!("{}/health_check", &address))
        .send()
        .await
        .expect("Failed to execute request.");
    assert!(response.status().is_success());
    assert_eq!(Some(0), response.content_length());
}
```

Each line is doing a job:

- Awaiting the server would never return; it listens until shutdown. `tokio::spawn` hands the future to the runtime to poll in the background, concurrently with the test body: the same spawn semantics you met in the tokio section.
- Port `0` is an OS contract: bind it and the kernel assigns a free ephemeral port. `cargo test` runs tests in parallel; hard-code 8000 and the second bind dies. We bind the `TcpListener` ourselves, read back `local_addr().port()`, then hand the listener to `HttpServer::listen`: whoever performs the bind is the only one who knows the port.
- `reqwest`, a dev-dependency, speaks plain HTTP. `spawn_app` is the only line coupled to our code: rewrite the service in another framework tomorrow, swap that one function, keep the whole suite.

Cleanup: none, deliberately. `#[tokio::test]` builds a fresh runtime per test; when it shuts down, spawned tasks are dropped, the listener closes, the port is released. The OS and the runtime are the teardown.

## Predict, then verify

You switch `run` to take a listener bound to port 0, but forget the client, which still targets `http://127.0.0.1:8000/health_check`. What does `cargo test` print?

Answer: a panic at `Failed to execute request.` wrapping a `ConnectionRefused` error. The app is healthy on some kernel-chosen port; nobody is listening on 8000, so the TCP connection attempt is refused (unless the kernel happened to pick 8000, the book's "lucky reader" footnote). The address a black-box test targets must flow out of `spawn_app`; any other source is a guess.
