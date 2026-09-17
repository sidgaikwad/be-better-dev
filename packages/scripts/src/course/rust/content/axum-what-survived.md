The port compiles. Before running the tests, read the diff, because the diff is the measurement this section promised in its first lesson. Here is the inventory, module by module:

- `src/domain/`: zero lines changed. `SubscriberName`'s grapheme checks, `SubscriberEmail`, parse-don't-validate: pure Rust from the type-driven section.
- `migrations/` and every `sqlx::query!`, the transactions, the `FOR UPDATE SKIP LOCKED` delivery queue: zero.
- `src/email_client.rs`: zero. reqwest talking to Postmark has no opinion about who routed the request.
- `src/telemetry.rs`: zero, including `spawn_blocking_with_tracing`. It was tokio and tracing all along, exactly as the spawn_blocking lesson said.
- Password auth: `verify_password_hash`, PHC parsing, the dummy-hash timing defense: zero. Only the code reading the `Authorization` header changes, actix's request type traded for axum's `HeaderMap`.
- `issue_delivery_worker.rs`: zero. The loop is sqlx plus tokio, and the `tokio::select!` in `main` racing it against the API future keeps its shape; only the API future behind it is new.
- The honest asterisk: `src/idempotency/`. It persists HTTP responses, so it names response types. Status and headers translate one to one, both frameworks building on the `http` crate's vocabulary (different major versions of it), and the `MessageBody` collection detour becomes `axum::body::to_bytes`. The SQL, the composite header type, and the save-and-replay logic survive.

Ten chapters of book, and the framework-shaped residue concentrates in `startup.rs`, handler signatures, and two middleware suppliers. Most of what you built was never actix.

## The referee

`tests/api` never imported actix. It imports reqwest and `spawn_app`, which was the bet placed all the way back in the black-box testing lesson: "rewrite the service in another framework tomorrow, swap that one function, keep the whole suite." Tomorrow arrived. The `spawn_app` diff:

```rust
// before
let listener = std::net::TcpListener::bind("127.0.0.1:0")?;
// after
let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
```

The port-0 trick is untouched, `Application::run_until_stopped` now awaits `axum::serve(self.listener, self.router)`, and the `tokio::spawn(application.run_until_stopped())` line is character-identical. Login and admin flows pass untouched too: reqwest's cookie jar does not care who minted the session cookie.

One test goes red:

```text
test subscribe_returns_a_400_when_data_is_missing ... FAILED
  left: `400`, right: `422`
```

The extractors lesson called it: a missing `email` field is now the extractor's 422, where actix said 400. That assertion had encoded the framework's opinion, not the service's contract. Your options: assert 422 and release-note the API change, loosen the assertion to `is_client_error()`, or write a custom rejection that preserves 400 for existing clients. Any of the three is defensible. The point is that the suite caught the only externally visible behavior change in the entire port, and stayed silent about everything that did not matter. A suite that speaks HTTP judged an actix service and an axum service by the same law and found one clause different. No stronger argument for the book's testing philosophy exists.

## So which framework

For a new service today: both are production-grade, actively maintained, and for I/O-bound work like this one, within measuring noise of each other; a benchmark that separates them is measuring something your Postgres round-trip will bury. Reach for actix-web when a team already owns actix expertise or an actix codebase; it is mature, fast, and ships more in the box. Reach for axum for the tokio project's gravity: tower middleware shared with tonic and friends, the extractor model, and the place most new ecosystem crates land first.

Then notice how little rode on the choice. The domain never heard about it. The worker never heard about it. The tests arbitrated it. That is not luck; it is the architecture the book quietly enforced: framework at the edge, domain in the middle, contract pinned by black-box tests. Teams with that shape argue about frameworks over lunch; teams without it schedule the argument as a quarter-long migration. You did not spend ten sections learning actix. You learned to build a service where the framework is a detail.

## Predict, then verify

Before running the ported suite, predict the outcome of these four tests: `health_check_works`, `subscribe_returns_a_400_when_data_is_missing`, `newsletters_are_not_delivered_to_unconfirmed_subscribers`, `changing_password_works`.

Answer: three pass, one fails. The health check is trivially green. The delivery test drives the worker loop, which the port never touched. The password flow exercises argon2, sessions, and the 303 redirects, all reprovisioned but honoring the same HTTP surface, so it passes. Only the 400 assertion fails, with 422, for the extractor-opinion reason above: the one place the old suite had quietly tested actix instead of the service.
