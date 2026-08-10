`send_email`'s entire job is a side effect on somebody else's server. There is no return value worth asserting on, and pointing tests at the real Postmark would cost money, flake with the network, and spam a real inbox. To test an HTTP client you need an HTTP server you control.

Part 1's "Async tests and mocking HTTP" lesson introduced wiremock's machinery; this chapter is where it earns its keep. (The book pins wiremock 0.5; today's 0.6 keeps the same surface.)

## A stand-in Postmark

```rust
let mock_server = MockServer::start().await;
let email_client = EmailClient::new(mock_server.uri(), sender, token, timeout);
```

`MockServer::start` asks the OS for a random free port and runs a real HTTP server in the background. `mock_server.uri()` becomes the client's `base_url`, and here the previous lesson's design pays off: because the Postmark URL was constructor-injected configuration from day one, the test swaps the internet out from under the client without touching its code.

Out of the box the mock answers `404` to everything. `Mock::given` teaches it what to accept:

```rust
Mock::given(header_exists("X-Postmark-Server-Token"))
    .and(header("Content-Type", "application/json"))
    .and(path("/email"))
    .and(method("POST"))
    .and(SendEmailBodyMatcher)
    .respond_with(ResponseTemplate::new(200))
    .expect(1)
    .mount(&mock_server)
    .await;
```

Read the chain as a contract: this is what a correct request to Postmark looks like, frozen into the suite. `.expect(1)` is the assertion. When the `MockServer` drops at the end of the test it verifies every mock matched as promised and panics otherwise; the drop-time mechanics are the Part 1 lesson's territory, no need to re-derive them.

`SendEmailBodyMatcher` is wiremock's `Match` trait implemented by hand: parse the body as JSON, check that `From`, `To`, `Subject`, `HtmlBody`, and `TextBody` are present. It caught a real bug the compiler could not: the struct serialized `from` and `to` in snake_case while Postmark demands PascalCase. The test failed until `#[serde(rename_all = "PascalCase")]` landed on `SendEmailRequest`.

Responses drive behavior too, not just matching. `respond_with(ResponseTemplate::new(500))` exposed that `reqwest`'s `send` returns `Ok` for any delivered response, including a `500`; chaining `.error_for_status()` is what turns server errors into `Err`. And `ResponseTemplate::new(200).set_delay(Duration::from_secs(180))` demonstrated the missing-timeout hang from the previous lesson before the `Client`-wide timeout fixed it.

## Fishing the confirmation link out

One layer up, the integration suite needs the same trick. `TestApp` (Part 1's "A test suite that scales") grows one field, `email_server: MockServer`, and `spawn_app` overrides the configuration's `email_client.base_url` with its uri. Every test now runs the full application against a private fake Postmark.

That unlocks the chapter's best move: the test reads the email. wiremock records everything it receives, so after firing `POST /subscriptions`:

```rust
let email_request = &app.email_server.received_requests().await.unwrap()[0];
let confirmation_links = app.get_confirmation_links(email_request);
```

The helper parses the intercepted body as JSON, runs `linkify::LinkFinder` over `HtmlBody` and `TextBody`, asserts each contains exactly one link, and returns both so the test can check they are identical. One wrinkle: the app built the link before knowing which random port the test server got, so the helper rewrites the URL's port, after asserting the host is `127.0.0.1` so a buggy link never sends the suite calling a random API on the open web.

Now the full journey runs end to end without one real email: subscribe, harvest the link from the intercepted request, `GET` it, assert `200`, and finally assert the row's status flipped to `confirmed`. The mock plays Postmark and the user's mailbox at once.

## Predict, then verify

Delete `#[serde(rename_all = "PascalCase")]` from `SendEmailRequest` and rerun `send_email_sends_the_expected_request`, the test that mounts the mock above and asserts nothing in its body. Where and how does the failure surface?

Answer: at the very end, when `mock_server` goes out of scope. The body matcher parses the JSON, finds `from` instead of `From`, and returns false; the unmatched request receives the default `404`, which the test body never checks. The mock's expectation does the catching: drop-time verification panics, reporting one expected matching request and zero received. The contract assertion lives in the mock, not the test body, so the test fails even though it asserts nothing explicitly.
