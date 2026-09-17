`#[tracing::instrument]` has one default the book openly dislikes: it attaches every function argument to the span unless you `skip` it. Logging is opt-out, not opt-in. Today that is fine, `subscribe` skips `form` and `pool` and captures exactly the fields we chose. The risk arrives later: someone adds a `password: String` parameter to an instrumented function, forgets `skip`, and the value lands in every log record. Facebook once logged hundreds of millions of plaintext passwords by exactly this kind of accident. (The book notes a future tracing 0.2 might flip the default; it has not shipped, so opt-out it remains.)

## Mark secrets in the type system

The `secrecy` crate makes sensitivity explicit instead of remembered:

```rust
use secrecy::{ExposeSecret, Secret};

#[derive(serde::Deserialize)]
pub struct DatabaseSettings {
    pub password: Secret<String>,
    // ...
}
```

`Secret<T>` has a masked `Debug` implementation: `{:?}` prints `Secret([REDACTED String])`, so `instrument`'s capture-everything default can no longer leak it. It also does not implement `Display`, and that is the enforcement: `connection_string()` stops compiling with `` `Secret<String>` doesn't implement `std::fmt::Display` ``. A feature, not a bug: the error walks you to every use of the password and makes exposure a visible, greppable act, `self.password.expose_secret()`. It also prompts the right follow-up: the connection string embeds the password, so it becomes a `Secret<String>` as well, and `main` exposes it deliberately when connecting the pool. (`Zeroize` wiping the value from memory on drop is a bonus. Newer secrecy releases rename `Secret<String>` to `SecretString`; same idea.)

## One request id per request

The chapter still owes us its original promise: every record for a request, including the one with the response status, sharing one `request_id`. Rather than writing a middleware by hand and losing `Logger`'s structured extras, we swap in `tracing-actix-web`'s `TracingLogger`, a tracing-native drop-in replacement:

```rust
App::new()
    .wrap(TracingLogger::default())
    // ...
```

It opens one root span per request with `request_id`, `request_path`, and friends as fields; handler spans nest inside it, and `JsonStorageLayer` propagates the fields down. One bug remains, of our own making: `subscribe`'s `fields(request_id = %Uuid::new_v4())` from the instrument lesson mints a second id. Delete that field; the middleware owns the id now. Tom's next complaint takes minutes: search his email, read off the `request_id`, filter, and the request's whole story lines up.

## Telemetry in tests

The last consumer is the test suite. If logs are how you debug production, they should be how you debug a failing integration test; the book's benchmark is blunt: if you cannot debug it from logs, imagine debugging it in production. So `spawn_app` should initialise the same stack. But `init_subscriber` sets process-global state, and every test in the binary calls `spawn_app`: the second one panics with `Failed to set logger: SetLoggerError`. The fix is once-only initialisation:

```rust
use once_cell::sync::Lazy;

static TRACING: Lazy<()> = Lazy::new(|| {
    let subscriber = get_subscriber("test".into(), "debug".into());
    init_subscriber(subscriber);
});

async fn spawn_app() -> TestApp {
    Lazy::force(&TRACING);
    // ...
}
```

All tests in a binary share one process and run on parallel threads, which is precisely why the global may be set only once: the first `force` runs the closure, every later call returns immediately. (`std::sync::LazyLock` in today's standard library covers the same need; the book predates it.)

One annoyance left: green tests now print reams of JSON. `cargo test` already swallows `println!` output unless you pass `--nocapture`, so we build the equivalent: `get_subscriber` grows a `sink` parameter, and `TRACING` picks `std::io::stdout` when the `TEST_LOG` environment variable is set, `std::io::sink`, the void, otherwise. When a test fails:

```bash
TEST_LOG=true cargo test health_check_works | bunyan
```

`bunyan` (Rust port: `cargo install bunyan`) pretty-prints the JSON, and you read the failing request's story exactly as you would in production.

## Predict, then verify

Keep `fields(request_id = %Uuid::new_v4())` on `subscribe` and keep `TracingLogger`. One request arrives. How many distinct `request_id` values appear across its records?

Answer: two. The middleware's root span carries one id; `subscribe`'s span defines a field with the same name, which overrides the inherited value for that span and its children. Records from inside the handler show the function's id while the request-level records show the middleware's, so correlation quietly splits in half. Each field should be owned in exactly one place; the request id belongs to the request span.
