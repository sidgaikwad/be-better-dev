The newsletter service sends confirmation emails through Postmark's REST API. Now test `EmailClient::send_email`. A test that calls the real Postmark on every `cargo test` is slow, needs credentials in CI, costs money, and emails strangers. Skipping the test means the one integration your product depends on is unverified. The way out is to keep the HTTP conversation and replace the counterparty.

First, the tests themselves must be async. You have seen the attribute since the integration lesson; the book names what it does: `tokio::test` is the testing equivalent of `tokio::main`, and it also spares you the `#[test]` attribute. Each test gets a fresh tokio runtime that is shut down when the test ends, and shutting down a runtime drops every task spawned on it. That is why `spawn_app` never leaks servers between tests: cleanup is the runtime's normal teardown, no logic required. (Curious what the macro expands to? `cargo expand --test health_check`, from the toolchain unit.)

## A real server, a fake Postmark

The `wiremock` crate starts an actual HTTP server on localhost and lets you script it:

```rust
use wiremock::matchers::{header_exists, method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

#[tokio::test]
async fn send_email_fires_a_request_to_base_url() {
    let mock_server = MockServer::start().await;
    let email_client = email_client(mock_server.uri());

    Mock::given(header_exists("X-Postmark-Server-Token"))
        .and(path("/email"))
        .and(method("POST"))
        .respond_with(ResponseTemplate::new(200))
        .expect(1)
        .mount(&mock_server)
        .await;

    let _ = email_client.send_email(&recipient(), "subject", "body", "body").await;

    // Expectations are verified when mock_server is dropped.
}
```

`MockServer::start` binds a random free port, the port 0 trick again, and `mock_server.uri()` becomes the client's `base_url`: the code under test does not know Postmark is not on the other end. `Mock::given(...)` chains matchers describing which requests to answer; anything unmatched gets a 404. `expect(1)` records an expectation: exactly one matching request. The kicker is where verification happens. Nothing in the test asserts. When `mock_server` goes out of scope, its cleanup logic checks every expectation and panics if one went unmet. That is `Drop` doing real work: from "Drop: deterministic cleanup" you know destruction runs at a deterministic point, so wiremock can hang test verdicts on it.

This test is exercising more than a stub would. The mock server is a real listener inside your test process, and requests genuinely cross the loopback TCP stack: `reqwest` configuration, URL joining, header encoding, JSON serialization, and status parsing all run for real. Only the remote party is simulated. An in-process fake of `EmailClient` would bypass all of it, and URL-joining bugs are exactly the kind that survive that bypass.

One production habit rides along: timeouts. The book's `EmailClient` first hard-codes a 10 second timeout, which means the test proving "we do not hang on a stalled server" takes 10 seconds to pass, using wiremock's `set_delay` on the response template. The fix is making the timeout configurable so tests inject 200ms. The previous lesson's warning in miniature: a slow test is a test people stop running.

This lesson is a preview. In Part 3 this exact toolkit, `spawn_app` on the shared startup path, `reqwest` against a random port, wiremock impersonating Postmark, becomes the standing test harness for the whole service: subscribe, confirm, deliver.

## Predict, then verify

A mock is mounted with `.expect(1)`, but the code under test has a bug and never sends the request. The test body runs to its last line without a single failed assert. What is the outcome, and at what moment is it decided?

Answer: the test fails, and the verdict lands after the last line, when `mock_server` is dropped at the end of scope. Its `Drop` implementation verifies all mounted expectations, finds zero matching requests where one was required, and panics with a report of the unmet expectation. Deterministic destruction is what makes this reliable: drop runs exactly when the value leaves scope, so verification cannot be forgotten or reordered, and a garbage-collected language could not promise this timing.
