The newsletter service stores a confirmation token right after inserting a subscriber:

```rust
pub async fn store_token(
    transaction: &mut Transaction<'_, Postgres>,
    subscriber_id: Uuid,
    subscription_token: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query!(/* INSERT INTO subscription_tokens ... */)
        .execute(transaction)
        .await?;
    Ok(())
}
```

`execute` can fail: the connection to Postgres drops, the insert violates a constraint, the pool times out. The Result lesson covered the mechanics of carrying that failure. The question this section opens with is different: who is the error _for_? There are two consumers, and they want opposite things.

## The caller reacts

The first consumer is code. The caller of `store_token` must decide what happens next: retry, give up, propagate with `?`. That decision needs machine-readable structure, which is why `sqlx::Error` is an enum, straight from the enums lesson: one of several shapes, matched exhaustively:

```rust
pub enum Error {
    Configuration(/* */),
    Database(/* */),
    Io(/* */),
    PoolTimedOut,
    RowNotFound,
    ColumnNotFound(/* */),
    // ...
}
```

A `PoolTimedOut` is worth retrying; a `ColumnNotFound` means the schema is wrong and retrying is pointless. If reaction were the only purpose and there were only one failure mode, `Result<(), ()>` would technically do: Err happened, react.

## The operator troubleshoots

`Err(())` fails the second consumer completely: the human paged when the endpoint starts returning 500s. Control flow is long over by then. They are reading logs after the fact, reconstructing the failure from whatever context the error carried:

```rust
.map_err(|e| {
    tracing::error!("Failed to execute query: {:?}", e);
    e
})?;
```

For the operator, an error is a report. It should carry as much context as possible: what the operation meant, the database's own message, the chain of causes. A log line that says "something went wrong" costs a debugging session; one that says `column "subscription_token" does not exist` costs a migration.

## The user at the edge

There is a third party: the person behind the browser POSTing to /subscriptions. They get both kinds of signal too, in HTTP's vocabulary. The status code is the machine-parsable half, control flow at the edge: a client can script a retry off a 500. The response body is the report half, and here the audiences split sharply. On an internal failure the body should be empty: the user has no mental model of your database, cannot act on its details, and leaking internals is a gift to attackers. On invalid input, the user is exactly the person who can fix it, so the body should say what is wrong with their email address.

One table holds the model, location against purpose:

|                  | Internal               | At the edge   |
| ---------------- | ---------------------- | ------------- |
| **Control flow** | Types, methods, fields | Status codes  |
| **Reporting**    | Logs and traces        | Response body |

The rest of this section fills in those four cells: the Error trait and source chains for reports, per-layer enums and From for internal control flow, and the mapping to status codes at the boundary.

One blurry line worth knowing about: user and operator can be the same person wearing different hats. A CLI's `--verbose` flag is exactly that, the user declaring they want the operator-grade report.

## Predict, then verify

The subscribe handler currently does this when token storage fails:

```rust
if store_token(&mut transaction, subscriber_id, &token).await.is_err() {
    return HttpResponse::InternalServerError().finish();
}
```

The user receives a 500 with an empty body. Which audience is served well here, and which badly?

Answer: the user is served correctly: an internal failure they cannot act on, details omitted by design. The operator is served badly: `is_err()` checks the variant and throws the error value away, so nothing about the root cause reaches the response path, and the request-level log will record a 500 with no idea why. The caller is served adequately but crudely: every failure collapses into the same branch. Fixing the operator's half without breaking the user's half is the work of the next two lessons.
