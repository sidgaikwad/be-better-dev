The port compiles. Before the test suite gets its say, take the measurement the first lesson promised: `git diff --stat`, read as an inventory with two columns.

## The unchanged column

The changed column holds the files the last three lessons walked through: `startup.rs` rebuilt around `Router`, the handlers' edges (extractor signatures, `IntoResponse` impls), the middleware stack, the `main.rs` wiring. Now the column with zero lines of diff:

- `domain/`: `SubscriberName`, `SubscriberEmail`, `NewSubscriber`. Parse-don't-validate never mentioned HTTP.
- `email_client.rs`: reqwest with its timeout, and the wiremock tests beside it. One HTTP client does not care which HTTP server imports it.
- `telemetry.rs`: the subscriber stack and `spawn_blocking_with_tracing`. The function everyone assumes is framework glue is a handful of lines of tokio and tracing, and the argon2 verification it shelters ports byte for byte. CPU-bound hashing never knew a web framework existed.
- `issue_delivery_worker.rs`: the delivery loop is sqlx queries, `tokio::time::sleep`, and the `ExecutionOutcome` enum. The `tokio::select!` in `main` racing the API against the worker: unchanged.
- `configuration.rs`, the migrations directory, and every `sqlx::query!` in between.

One near-miss proves the rule. The idempotency module from the fault-tolerance section did need edits, and the reason is instructive: it persists whole HTTP responses, status and headers and body, into Postgres. Code that stores framework-shaped data ends up holding framework types, so the save and load paths that named actix's `HttpResponse` now name axum's `Response`. The SQL, the `header_pair` composite type, the try-insert-first concurrency design: untouched. The leak followed the data, not the chapter.

Tally the columns and the section's opening claim becomes arithmetic: the actix-specific residue of ten chapters is one startup file, the edges of the handlers, three trait impls, and a middleware stack. The rest was Rust and architecture wearing an actix costume.

## The referee

The suite never imported actix, so it needs no port, only a new `spawn_app`:

```rust
let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
let port = listener.local_addr().unwrap().port();
tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
```

Port 0 still means "any free port"; the news is the async bind and the closing async block. `axum::serve` returns a `Serve` value implementing `IntoFuture` rather than `Future`. An `.await` performs that conversion silently; `tokio::spawn` is an ordinary function and does not, so `tokio::spawn(axum::serve(listener, app))` is the port's one famous compile error.

Then run it. The confirmation flow, the idempotency retries, the wiremock'd deliveries, login and logout through reqwest's cookie jar: green on the first run, assertions untouched, because they speak HTTP at a real socket and HTTP did not change. A small handful of tests do fail, and they are the exercise below.

## Choosing a framework, after the fact

So, axum or actix-web for the next service? actix-web is mature, fast, and self-contained; nothing in this port found it lacking, and a team running it has no emergency. axum's case is positional: maintained within the tokio project, built on tower so middleware is shared with tonic and the rest of that ecosystem, and the place where new crates tend to land first, tower-sessions being this section's specimen. For a new service today, axum is the default recommendation. A default, not a verdict.

The better answer is the diff you just measured. This framework decision was cheap to revisit because the architecture kept the framework at the edges: domain types that parse at the boundary, a worker that owns its loop, tests that speak the protocol instead of calling handlers. In a codebase that lets the framework into every module, picking one is a wedding. Here it was a section. Whichever you choose, build so it stays a section.

## Predict, then verify

Two early tests, unchanged from the book: `subscribe_returns_a_400_when_data_is_missing` posts `name=le%20guin` with no email field; `subscribe_returns_a_400_when_fields_are_present_but_invalid` posts an empty name. One fails after the port. Which one, with what status, and what does the failure mean?

Answer: the missing-field test fails with 422. A well-formed body that will not deserialize is axum `Form`'s 422 Unprocessable Entity, where actix said 400; the extractor lesson filed this distinction away for exactly this moment. The empty-name test passes: that body deserializes fine and dies in our `TryInto` validation, so its 400 comes from `SubscribeError`, our code, ported with its status intact. Update the assertion and keep the law it teaches: after a framework swap, a failing test was testing the framework, and a passing one was testing your service. The suite could referee the whole migration because the book made it black-box in chapter 3, and that decision just paid for itself in full.
