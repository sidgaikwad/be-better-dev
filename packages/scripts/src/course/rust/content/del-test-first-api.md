Delivery begins with a test for what must _not_ happen. The previous lesson found the seam: all outgoing email is an HTTP call to Postmark, and in tests Postmark is a wiremock server. No request, no email.

```rust
//! tests/api/newsletter.rs
#[tokio::test]
async fn newsletters_are_not_delivered_to_unconfirmed_subscribers() {
    // Arrange
    let app = spawn_app().await;
    create_unconfirmed_subscriber(&app).await;

    Mock::given(any())
        .respond_with(ResponseTemplate::new(200))
        // Not a single request must reach Postmark.
        .expect(0)
        .mount(&app.email_server)
        .await;

    // Act
    let newsletter_request_body = serde_json::json!({
        "title": "Newsletter title",
        "content": {
            "text": "Newsletter body as plain text",
            "html": "<p>Newsletter body as HTML</p>",
        }
    });
    let response = reqwest::Client::new()
        .post(&format!("{}/newsletters", &app.address))
        .json(&newsletter_request_body)
        .send()
        .await
        .expect("Failed to execute request.");

    // Assert
    assert_eq!(response.status().as_u16(), 200);
    // The mock verifies on drop that no newsletter email went out.
}
```

From the wiremock lessons you know where the verdict lands: expectations are checked when the mock server drops, so `.expect(0)` turns "we spammed nobody" into a test outcome with no assert in sight. The first run fails with 404 against the expected 200, because `POST /newsletters` has no handler. A dummy `publish_newsletter` returning `HttpResponse::Ok().finish()`, registered with `.route("/newsletters", web::post().to(publish_newsletter))`, makes it green: doing nothing sends nothing, so the business rule is already pinned.

## Seed state through the front door

The Arrange step needs one unconfirmed subscriber in an otherwise empty database. The tempting shortcut is a raw `INSERT INTO subscriptions ...` from the test. The book refuses: tests drive application state through the public API, the same black-box discipline the testing section established.

```rust
async fn create_unconfirmed_subscriber(app: &TestApp) {
    let body = "name=le%20guin&email=ursula_le_guin%40gmail.com";

    let _mock_guard = Mock::given(path("/email"))
        .and(method("POST"))
        .respond_with(ResponseTemplate::new(200))
        .named("Create unconfirmed subscriber")
        .expect(1)
        .mount_as_scoped(&app.email_server)
        .await;
    app.post_subscriptions(body.into())
        .await
        .error_for_status()
        .unwrap();
}
```

A hand-written INSERT would freeze today's column layout into every test and quietly bypass the code that actually creates subscribers. The API call exercises the real write path, so when the subscribe flow changes shape these tests keep passing, or fail for honest reasons.

## Scoped mocks

Calling `POST /subscriptions` has a side effect: it sends a confirmation email, so the helper must answer `POST /email` or the subscribe call fails. But the test body mounts its own mock on the same server, and overlapping mocks would corrupt each other's counts. Hence `mount_as_scoped`: instead of installing behavior for the server's lifetime, it returns a `MockGuard`. When the guard drops at the end of the helper, two things happen: wiremock withdraws the behavior, and the scoped mock's expectations are verified eagerly, right then. The helper's mocking stays local to the helper, and if the application ever stops sending that confirmation email, the helper fails loudly instead of rotting into dead scaffolding.

## The happy path, red

Reworked to return the `ConfirmationLinks` it scrapes from the mock server's received requests, `create_unconfirmed_subscriber` composes into a second helper: `create_confirmed_subscriber` calls it, then issues a GET to the confirmation link. The mirror test, `newsletters_are_delivered_to_confirmed_subscribers`, arranges one confirmed subscriber, mounts `Mock::given(path("/email"))` with `.expect(1)`, posts the same body, and fails exactly as it should: expected 1 matching request, received 0. One test forbids the spam, one demands the delivery. The implementation now has rails on both sides.

## Predict, then verify

Suppose the helper had used `.mount(...)` instead of `.mount_as_scoped(...)`, and the application code is completely correct. What happens when the happy-path test runs?

Answer: it fails anyway. The helper's `POST /email` mock outlives the helper, and wiremock hands each request to the first matching mock in mount order, so the newsletter send during Act is swallowed by the leftover mock: its count reaches 2 against an expectation of exactly 1, while the test's own mock sits at 0 against an expectation of 1. Verification at drop reports both, a false alarm produced entirely by leaked scaffolding. Scoping is what keeps a helper's assumptions from contaminating the test's.
