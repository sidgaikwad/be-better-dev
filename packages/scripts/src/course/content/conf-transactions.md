`POST /subscriptions` used to make one database write. The confirmation flow makes it two: insert the subscriber, then insert the freshly generated token.

```rust
let subscriber_id = insert_subscriber(&pool, &new_subscriber).await?;
store_token(&pool, subscriber_id, &subscription_token).await?;
```

Two independent queries mean the application can die between them: a crash, a redeploy (the rolling-updates lesson made those routine), a dropped connection. Count the possible end states: both rows written; subscriber written but no token; nothing written. The middle state is poison. That subscriber is parked at `pending_confirmation` with no token row, so no valid confirmation link can ever reach them, and no normal flow will repair the row. Add a third query and there are four end states, then five: the reasoning rots combinatorially.

## A unit of work

Relational databases answer with transactions: group related statements, and the database guarantees the group is all-or-nothing. You never observe the effect of only a subset. In SQL it is bracketing, and we already shipped one inside the previous lesson's backfill migration:

```sql
BEGIN;
    UPDATE subscriptions SET status = 'confirmed' WHERE status IS NULL;
    ALTER TABLE subscriptions ALTER COLUMN status SET NOT NULL;
COMMIT;
```

Fail anywhere before `COMMIT` and the database rolls back every prior effect; `ROLLBACK` triggers the same retreat explicitly. Wrap our two inserts and the end states collapse from three to two: everything, or nothing. Nothing is a fine state, the user gets a 500 and can try again.

## Transaction in sqlx

sqlx makes the transaction a value with ownership, not a string of SQL:

```rust
let mut transaction = pool.begin().await?;
let subscriber_id = insert_subscriber(&mut transaction, &new_subscriber).await?;
store_token(&mut transaction, subscriber_id, &subscription_token).await?;
transaction.commit().await?;
```

`pool.begin()` checks a connection out of the pool and issues `BEGIN` on it. The returned `Transaction` is the ticket: in the book's sqlx, `&mut Transaction` implements the `Executor` trait, the same trait `&PgPool` implements, so `insert_subscriber` and `store_token` merely retype their executor parameter to `&mut Transaction<'_, Postgres>`. Every query executed through it rides the one checked-out connection, which is precisely what membership in the transaction means. (Since sqlx 0.7 the `Executor` impl moved to the dereferenced connection, so calls read `.execute(&mut *transaction)`; the shape of the code is otherwise unchanged.)

The chapter then hits an instructive wall: wire this up without the final `commit`, and previously green tests fail. `subscribe` returns `200 OK`, both inserts report success, and the test's `SELECT` finds no subscriber.

## Drop is the safety net

The explanation sits in `Transaction`'s `Drop` implementation. A transaction carries an `open` flag, set by `begin`, cleared by `commit` or `rollback`. Drop the value while it is still open and sqlx queues a rollback that runs the next time that connection is touched, including when it returns to the pool. Ownership from Part 1 doing production work: forgetting to finish a transaction cannot leak one; the worst case is discarding writes you never promised anyone.

Why queue the rollback instead of performing it in `drop`? Rolling back is an `await`, and Rust destructors cannot await: the language has no async `Drop` (the `AsyncDrop` debate has run for years without landing). Every async database library picks a workaround; sqlx picks deferred rollback, a trade-off worth knowing you have made.

One more property rides along: until `COMMIT`, none of the transaction's changes are visible to other connections, so no concurrent request ever observes the subscriber-without-token state even mid-flight. How strictly simultaneous transactions are separated is tunable (isolation levels), and the book's pointer for depth is "Designing Data-Intensive Applications". The fault-tolerance section at the end of this Part leans on exactly that machinery.

## Predict, then verify

Comment out `transaction.commit().await?;` and run the suite. `subscribe` still returns `200 OK`. Which tests fail, and what did the database do with the two "successful" inserts?

Answer: every test that asserts on persisted state, like `subscribe_persists_the_new_subscriber`, fails to find the row, while pure status-code tests stay green. Both inserts executed inside the transaction and reported success, but the `Transaction` dropped while still open, so sqlx queued a rollback and Postgres discarded the uncommitted work as the connection went back to the pool. Success at the statement level, oblivion at the transaction level: `commit` is what makes it real.
