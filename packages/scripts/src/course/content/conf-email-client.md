Chapter 7 starts the build with an interface, not an implementation. Before any HTTP exists, `EmailClient` gets the signature we wish we could call:

```rust
//! src/email_client.rs
use crate::domain::SubscriberEmail;

pub struct EmailClient {
    sender: SubscriberEmail,
}

impl EmailClient {
    pub async fn send_email(
        &self,
        recipient: SubscriberEmail,
        subject: &str,
        html_content: &str,
        text_content: &str,
    ) -> Result<(), String> {
        todo!()
    }
}
```

The sender lives on the struct because every email from one instance comes from the same address; both HTML and text bodies go out because some clients cannot render HTML. `Result<(), String>` is a placeholder spelled out loud: "I will think about error handling later." The error-handling chapter is where that bill comes due.

Sending means talking to Postmark's REST API rather than raw SMTP, and that needs an HTTP client: `reqwest`, the same crate the integration tests have used since Part 1, promoted from `[dev-dependencies]` to a runtime dependency with the `json` feature. The book pins 0.11; today's 0.12 keeps the same `Client` API.

## One Client, shared through app state

Establishing a connection is expensive: a TCP handshake, then TLS negotiation on top. Pay that per request and under load you accumulate half-open work everywhere, a failure mode called socket exhaustion. `reqwest::Client` answers with connection pooling: after a request completes, the connection is kept open and reused for the next request to the same server. The pool lives inside the `Client` behind shared ownership (the Arc lesson): `Client::clone` copies a pointer to the pool, never the pool itself.

Pooling only pays if everyone uses the same pool, so the `Client` must outlive any single request. In actix-web that means application state: build one `EmailClient` in `main` from configuration (`base_url`, sender, token, timeout), then hand it to the server exactly like the `PgPool`:

```rust
let email_client = Data::new(email_client);
// ...
App::new()
    .route("/subscriptions", web::post().to(subscribe))
    .app_data(email_client.clone())
```

`web::Data` is an `Arc` under another name. The alternative, deriving `Clone` and moving a full copy of `EmailClient` into each worker's `App`, would duplicate the `base_url` and `sender` strings once per thread; sharing one allocation is the better default here, and handlers extract it as `web::Data<EmailClient>`.

## The request itself

Postmark's contract: `POST {base_url}/email`, a JSON body with PascalCase field names, and a secret server token in a header.

```rust
self.http_client
    .post(&url)
    .header(
        "X-Postmark-Server-Token",
        self.authorization_token.expose_secret(),
    )
    .json(&request_body)
    .send()
    .await?;
```

Three details carry weight. `SendEmailRequest<'a>` borrows `&'a str` fields instead of owning `String`s, the slices lesson applied: serialization needs a view of the text, not five fresh allocations per email. The token is a `Secret<String>`, so a stray `Debug` log cannot leak it and only `expose_secret` hands out the value. And `.json` both serializes the struct and sets `Content-Type: application/json`.

## Timeouts are not optional

`reqwest` ships with no request timeout. If Postmark accepts the connection and then never answers, `send` waits forever: that connection stays busy, the next email opens another one, and a slow dependency quietly becomes your outage. The chapter's rule of thumb is blunt: every IO operation gets a timeout. The exact value is a judgment call (too low can hammer a struggling server with retries, too high degrades you), but a conservative bound always beats none:

```rust
let http_client = Client::builder()
    .timeout(std::time::Duration::from_secs(10))
    .build()
    .unwrap();
```

The value then moves into `EmailClientSettings`, so production reads 10 seconds from configuration while the test suite passes 200 milliseconds and fails fast.

## Predict, then verify

A colleague "simplifies" by constructing `reqwest::Client::new()` inside `send_email` on every call. Behavior is identical in a quick manual test. What changes at the OS level under a burst of 10,000 sends?

Answer: every call now pays a fresh TCP-plus-TLS handshake, because each new `Client` owns an empty pool that dies with it. Per-send latency grows, and the churn of short-lived connections piles up sockets, each one a file descriptor and an ephemeral port lingering in TIME_WAIT after close, marching toward socket exhaustion. The shared `Client` amortizes all of it: handshake once, then reuse a warm connection from the pool.
