Chapter 8 starts from code the subscription flow already has. `store_token` inserts the confirmation token for a new subscriber, and its error handling looks reasonable at a glance:

```rust
pub async fn store_token(
    transaction: &mut Transaction<'_, Postgres>,
    subscriber_id: Uuid,
    subscription_token: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"INSERT INTO subscription_tokens (subscription_token, subscriber_id)
        VALUES ($1, $2)"#,
        subscription_token,
        subscriber_id
    )
    .execute(transaction)
    .await
    .map_err(|e| {
        tracing::error!("Failed to execute query: {:?}", e);
        e
    })?;
    Ok(())
}
```

The insert can fail: a network hiccup, a violated constraint. The handler reacts by checking for failure and building a response by hand:

```rust
if store_token(&mut transaction, subscriber_id, &subscription_token)
    .await
    .is_err()
{
    return HttpResponse::InternalServerError().finish();
}
```

The two-audiences lesson in Part 1 drew the line: the caller needs a machine-readable signal to decide what to do next, and the operator needs a report with enough context to troubleshoot after the fact. The chapter measures the second audience with a test that sabotages the database before subscribing:

```rust
#[tokio::test]
async fn subscribe_fails_if_there_is_a_fatal_database_error() {
    let app = spawn_app().await;
    let body = "name=le%20guin&email=ursula_le_guin%40gmail.com";
    // Break the table store_token writes to
    sqlx::query!("ALTER TABLE subscription_tokens DROP COLUMN subscription_token;")
        .execute(&app.db_pool)
        .await
        .unwrap();

    let response = app.post_subscriptions(body.into()).await;
    assert_eq!(response.status().as_u16(), 500);
}
```

It passes on the first run. The interesting part is the log the application emitted while it passed. An operator reads from the outcome backwards, and the outcome is the end-of-request record written by the telemetry middleware, tracing_actix_web's `TracingLogger`:

```text
INFO: [HTTP REQUEST - END]
    exception.details="",
    exception.message="",
    http.status_code=500
```

A 500, and two empty fields where the explanation should be. The one useful record is buried mid-request, emitted by that `map_err` inside `store_token`: an ERROR carrying a `PgDatabaseError` with code `42703`, column does not exist. Nothing links that record to this 500. At 3 a.m. you would be cloning the repository to check, by reading source, whether the line that logged sits on the path that failed.

## Why the middleware is blind

`TracingLogger` can only report what reaches it. `subscribe` checks `is_err()`, throws the `sqlx::Error` away, and hand-builds `HttpResponse::InternalServerError().finish()`: a status code attached to nothing. By the time the middleware writes the END record, the error value has already been dropped, so `exception.details` and `exception.message` have nothing to carry. The report died at the point of failure; only the verdict traveled.

Notice who is served correctly: the caller. A 500 is exactly the machine-parsable signal the edge owes a client (retry later, give up), and the empty body is deliberate: a user has no mental model of our internals and gets nothing they could act on. In the chapter's location-by-purpose table, three cells are already healthy. The broken cell is internal reporting, and the whole refactor ahead is about carrying the error value, intact, from the failure point to the middleware so one record tells the whole story. (The book pins beta releases, actix-web 4.0.0-beta.8 and tracing-actix-web 0.4.0-beta.8; everything in this section behaves the same on today's stable actix-web 4.)

## Predict, then verify

The same failure occurs in production. You filter the structured logs to the failing request and read its records in order. Which single record proves that the `42703` database error caused the 500 the user saw?

Answer: none does. The END record says 500 with empty exception fields, and the mid-request ERROR says a query failed, but the causal link between them exists only in your head after reading the code. An outcome record with no cause attached is the precise gap the next lesson's `StoreTokenError` exists to close.
