One error stands between the loop and a green suite: `send_email` expects `SubscriberEmail`, the query produced `String`. The obvious fix, declare `ConfirmedSubscriber::email` as `SubscriberEmail` and let `sqlx::query_as!` map it, just moves the error into the macro: sqlx has no idea how to convert a `TEXT` column into your domain type, and teaching it (custom type support) is a lot of trouble for a minor upside.

The chapter reaches instead for the pattern `POST /subscriptions` established: one struct for the wire layout, one for the domain, a parse in between. A `Row { email: String }` mirrors the query; `ConfirmedSubscriber { email: SubscriberEmail }` is what the rest of the code sees; the mapping calls `SubscriberEmail::parse`.

## Old rows, new rules

The first draft of that mapping is `SubscriberEmail::parse(r.email).unwrap()`, and it comes with a seductive argument: every insert went through this exact parse, so every stored email is valid, so the unwrap can never fire.

The argument is sound only if the software never changes. Data in Postgres creates a temporal coupling between old and new versions of the application: each row was declared valid by whichever binary wrote it, and the binary reading it today may disagree. Suppose you discover the validation is too lenient, junk addresses are getting through, and you ship a stricter `parse`. The moment it deploys, `get_confirmed_subscribers` panics on the first old row that fails the new rules, and delivery is down entirely, taken out by data your own previous version wrote. At high deployment frequency, the writer and the reader of a row are almost never the same version.

So stored data gets validated too, but the failure response is a judgment call. Sometimes processing an invalid record is unacceptable and the routine should halt for an operator. Sometimes you process everything and assume nothing (`String` is the safest type for analytics). Delivery can meet in the middle: skip the invalid row, send to everyone else, and emit a warning so somebody eventually repairs the data. A `filter_map` with a `tracing::warn!` in the `Err` arm does exactly that.

## Whose decision is it?

It works, but look at who decided. Skip versus abort is a business-level call about the delivery workflow, and it is currently buried in a storage adapter. `get_confirmed_subscribers` should translate rows into domain types and report what it found; `publish_newsletter`, the driving routine, should choose. The signature that expresses this is:

```rust
async fn get_confirmed_subscribers(
    pool: &PgPool,
) -> Result<Vec<Result<ConfirmedSubscriber, anyhow::Error>>, anyhow::Error>
```

Outer `Result`: the query itself can fail. Inner `Result`, one per row: each row individually can fail the parse. The caller can no longer forget either case, and the compiler proves it, starting at the call site: no field `email` on type `Result<ConfirmedSubscriber, anyhow::Error>`. The loop becomes a `match`: `Ok(subscriber)` sends the email; `Err(error)` logs a warning with `error.cause_chain = ?error` and the message that a confirmed subscriber's stored contact details are invalid, then carries on.

## Follow the compiler

The rest of the refactor is a guided walk, one error at a time. The `with_context` closure formats `subscriber.email`, and `SubscriberEmail` has no `Display`: implement it by forwarding to the wrapped string, `self.0.fmt(f)`. Then the borrow checker objects, which is the predict below. Last, a look back at the query: the nested `Row` struct is now pulling no weight for a one-column query, so `query_as!` drops back to `query!` and the mapping reads `r.email` directly. Everything else compiles untouched.

The principle under the whole lesson: a database read is input crossing a trust boundary, the same as an HTTP body, because rows outlive binaries. `SubscriberEmail::parse` is where the type's proof gets established, and the read side re-establishes it instead of assuming the write side's word still holds. Parse, don't validate, applied to your own storage.

## Predict, then verify

`Display` is implemented. The loop reads:

```rust
Ok(subscriber) => {
    email_client
        .send_email(subscriber.email, &body.title, &body.content.html, &body.content.text)
        .await
        .with_context(|| {
            format!("Failed to send newsletter issue to {}", subscriber.email)
        })?;
}
```

What does `cargo check` say, and what are the two ways out?

Answer: E0382, borrow of partially moved value: `subscriber`. `send_email` takes the email by value, moving it out of `subscriber`; the closure then tries to use `subscriber.email` again after the move. Way out one: `.clone()` the email at the first use and pay for a copy. Way out two, the one the book takes: ask whether `send_email` needs ownership at all. It only ever calls `.as_ref()` on the recipient, so its signature changes to `recipient: &SubscriberEmail`, the loop passes `&subscriber.email`, nothing moves, and the compiler points out the few other call sites that need a `&`. When a move fights you, check whether the callee really needed the value before reaching for clone.
