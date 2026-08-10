Two tests bracket the feature: spam nobody, deliver to the confirmed. The implementation that satisfies both is deliberately plain, and everything it needs already exists: `PgPool` and `EmailClient` sit in the application state, and chapter 8 made new error types cheap. The work is assembly.

## The body schema

What must a request carry to describe an issue? A title for the subject line, and the content twice, HTML and plain text, because email clients in the wild are split on which they render. Two structs deriving `serde::Deserialize` encode it:

```rust
//! src/routes/newsletters.rs
#[derive(serde::Deserialize)]
pub struct BodyData {
    title: String,
    content: Content,
}

#[derive(serde::Deserialize)]
pub struct Content {
    html: String,
    text: String,
}
```

`POST /subscriptions` took `application/x-www-form-urlencoded` because a browser form was the caller. Here the caller is an API client, so the body is JSON and the extractor is `web::Json<BodyData>`. The chapter adds a trust-but-verify test, `newsletters_returns_400_for_invalid_data`, posting bodies with the title or content missing, and it passes against a handler that still does nothing: the extractor rejects malformed input before the handler runs. Test-side, the request-firing boilerplate moves into a `post_newsletters` helper on `TestApp`, the same consolidation `post_subscriptions` got.

## Fetch the confirmed subscribers

The recipient list is one query away; the `status` column added for double opt-in is the filter:

```rust
struct ConfirmedSubscriber {
    email: String,
}

#[tracing::instrument(name = "Get confirmed subscribers", skip(pool))]
async fn get_confirmed_subscribers(
    pool: &PgPool,
) -> Result<Vec<ConfirmedSubscriber>, anyhow::Error> {
    let rows = sqlx::query_as!(
        ConfirmedSubscriber,
        r#"SELECT email FROM subscriptions WHERE status = 'confirmed'"#,
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
}
```

`sqlx::query_as!` maps each row onto the type named as its first argument, sparing the by-hand field copying. Note what the struct does not contain: `SELECT email`, nothing else. Fetch only the columns the job needs; it is invisible at ten subscribers and real money at a million.

Calling this with `?` inside `publish_newsletter` refuses to compile: the `?` operator needs a function that returns `Result` or `Option`, and the handler returns bare `HttpResponse`. So the handler grows a real signature, `Result<HttpResponse, PublishError>`, and `PublishError` is the chapter 8 recipe executed in a few lines: a `thiserror` enum with a single `#[error(transparent)] UnexpectedError(#[from] anyhow::Error)` variant, the chain-walking `Debug` via `error_chain_fmt`, and a `ResponseError` impl mapping it to 500. One variant is over-engineering today, as the book admits; the enum is future-proofing, and chapter 10 will fill it.

## The loop

`EmailClient` comes out of application state through `web::Data`, exactly like the pool, and the send is a plain `for` loop:

```rust
for subscriber in subscribers {
    email_client
        .send_email(
            subscriber.email,
            &body.title,
            &body.content.html,
            &body.content.text,
        )
        .await
        .with_context(|| {
            format!("Failed to send newsletter issue to {}", subscriber.email)
        })?;
}
Ok(HttpResponse::Ok().finish())
```

`with_context` is the lazy sibling of chapter 8's `context`. Both convert the error into `anyhow::Error` and layer a message on top; the difference is when the message is built. `context` takes a value, so the `format!` would run on every iteration, one heap allocation per subscriber, paid on sends that succeed. `with_context` takes a closure invoked only on the error path. Static context: either. Context with a runtime cost: always the closure.

One send at a time, each awaited to completion before the next begins: within this handler there is never more than one email in flight. Hold that thought for the limitations lesson.

`cargo check` says almost. Among the errors: expected struct `SubscriberEmail`, found struct `String`, at `subscriber.email`. The email client demands the proven domain type from the type-driven section; the database handed back a raw string. That gap is the next lesson.

## Predict, then verify

The handler is still the do-nothing dummy, but its signature reads `publish_newsletter(_body: web::Json<BodyData>)`. The invalid-data test posts `{"title": "Newsletter!"}` with no content field. What status comes back, and which code produced it?

Answer: 400, and the handler never ran. actix-web drives extractors before the handler body; `web::Json<BodyData>` tries to deserialize the payload, `serde` fails on the missing `content` field, and the framework converts that rejection into a 400 Bad Request on its own. This is the same boundary discipline as `web::Form` in the subscribe flow: by the time a handler holds a `BodyData`, the shape is already proven, which is why a function that ignores its argument can still enforce the schema.
