The book's newsletter service gets its first endpoint, `GET /health_check`, and verifies it with `curl -v`. That works exactly once. Manual checks get more expensive with every endpoint, so the book immediately asks the real question: what is the most reliable way to know users have not been broken? Its answer sets the posture for the whole project: interact with the API the same exact way a user would, an HTTP request in, a response out, with no access to internals. The book calls this black box testing.

That rules out the obvious shortcut of calling the handler function directly. `health_check()` returning a 200 proves nothing about routing: not that the handler is mounted at `/health_check`, not that it answers GET. Both are part of the API contract, and both can regress while a handler-level test stays green.

## The tests directory

Unit tests live inside the module. Integration tests get their own top-level directory:

```
src/
tests/
Cargo.toml
```

Every file in `tests/` is compiled as its own crate that links against your library, exactly as if a stranger had added you as a dependency. It sees your public API and nothing else. That constraint is the feature: these tests exercise the crate the way the outside world does.

There is a catch, and the book runs you into it deliberately. The newsletter project is a binary, and a binary cannot be imported:

```
error[E0432]: unresolved import `zero2prod`
 --> tests/health_check.rs:1:5
  |
1 | use zero2prod::run;
  |     ^^^^^^^^^ use of undeclared crate or module `zero2prod`
```

The fix is the lib/bin split, building on target definitions from "Crates, editions, workspaces": declare both a `[lib]` and a `[[bin]]` in `Cargo.toml`, move all logic into `src/lib.rs`, and shrink `src/main.rs` to an entrypoint that calls `zero2prod::run()`. The binary stays deployable; the library becomes importable, by your tests and by anyone. Most of what makes Rust code testable is exactly this: logic in a library, executables as thin shells.

## Spawning the app for real

The test launches the application as a background task and speaks HTTP to it:

```rust
#[tokio::test]
async fn health_check_works() {
    let address = spawn_app();
    let client = reqwest::Client::new();

    let response = client
        .get(format!("{address}/health_check"))
        .send()
        .await
        .expect("Failed to execute request.");

    assert!(response.status().is_success());
    assert_eq!(Some(0), response.content_length());
}
```

`reqwest` sits under `[dev-dependencies]`, compiled for tests and examples only, never into the shipped binary. `spawn_app` binds the server to `127.0.0.1:0`: port 0 is special-cased by the OS, which scans for a free ephemeral port and binds it. The test reads the assigned port back and targets it. Hard-coding port 8000 would mean parallel tests fight over one port and fail whenever anything else holds it.

The book asks you to really look at this test: `spawn_app` is the only line coupled to your implementation. Rewrite the service in another framework, even another language, and the suite still works once `spawn_app` launches the new thing. Your regression suite survives your biggest refactors, which is precisely when you need it most.

## Predict, then verify

Your library has `pub fn run()` and a private `fn configure()`. A file in `tests/` calls `configure()`. What happens?

Answer: it fails to compile with `error[E0603]: function 'configure' is private`. A `tests/` file is a separate crate, so crate privacy applies with full force: only `pub` items are reachable, and `pub(crate)` items are not, because the test is not your crate. Unit tests inside the module can see private items; integration tests cannot, by construction. If an integration test needs `configure()`, that is a design signal to act on, not to bypass.
