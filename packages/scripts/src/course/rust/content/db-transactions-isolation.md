Chapter 11 reached for `FOR UPDATE SKIP LOCKED` to stop two workers claiming the same delivery task, and never once set an isolation level. Both choices were load-bearing. This lesson lays out the whole menu: what each isolation level actually permits, and which lock to reach for when a level is the wrong tool.

## Levels are named by what they allow

Isolation levels are best learned anomaly-first: each level is a promise about which concurrency bugs you have agreed to tolerate.

- Dirty read: seeing another transaction's uncommitted writes. Postgres never permits this at any level; MVCC keeps old row versions around, so readers always see committed data. `READ UNCOMMITTED` is accepted syntax that silently runs as `READ COMMITTED`.
- Non-repeatable read: read a row, someone else commits a change, read the same row again and get a different answer, inside one transaction. Permitted at `READ COMMITTED`, the default, because every statement gets a fresh snapshot.
- Phantom: same query, new rows the second time. Run `SELECT count(*) FROM subscriptions WHERE status = 'confirmed'` twice while a confirmation commits in between and the count moves. Permitted at `READ COMMITTED`. Postgres's `REPEATABLE READ` takes one snapshot at the transaction's first query and reads from it throughout, which prevents phantoms too, stronger than the SQL standard requires of that level.
- Write skew: two transactions each read, decide, and write disjoint rows, and the combined result could not have come from any serial order. Concretely: two admin processes each check "no delivery run is active for this issue", both see none, both insert one. No row was written by both, so nothing conflicts; `REPEATABLE READ` happily commits both. Only `SERIALIZABLE` catches it, by tracking read dependencies and aborting one transaction with error `40001`.

Setting a level in sqlx is the transaction's first statement:

```rust
let mut tx = pool.begin().await?;
sqlx::query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE")
    .execute(&mut *tx)
    .await?;
```

`SERIALIZABLE` and `REPEATABLE READ` both refuse to lie; their honesty arrives as `40001` serialization failures under contention. Code that uses them must loop: begin, try, and on `40001` retry from the top. No retry loop, no right to the level.

## Locks, for when you would rather wait than retry

`SELECT ... FOR UPDATE` locks the returned rows as if you had updated them, making read-decide-write safe pessimistically: the second transaction blocks at the `SELECT` until the first commits, then sees its committed result. Two refinements you now recognize: `NOWAIT` errors instead of blocking, and `SKIP LOCKED` skips contended rows entirely. Chapter 11's task queue is one instance of a general shape: any "many workers pull from one table" problem (outbox drains, batch claim, retry sweeps) is `FOR UPDATE SKIP LOCKED` plus a `LIMIT`. Locking multiple rows invites deadlock when two transactions lock in opposite orders; Postgres notices after `deadlock_timeout` (1s) and kills one with `40P01`, another retryable error. Locking rows in a consistent order (`ORDER BY id`) removes the possibility.

Advisory locks are the odd, useful cousin: locks on an application-chosen 64-bit key, attached to no row at all. `pg_try_advisory_lock(42)` returns a boolean and holds until the session releases it; `pg_advisory_xact_lock(42)` releases at commit automatically. They shine where there is no natural row to lock: exactly one instance runs startup migrations across N replicas (sqlx's own migrator does this), one cron leader per fleet, serialize all writes for one tenant. One pooling gotcha from the previous lesson: session-scoped advisory locks belong to the connection, and a pooled connection outlives your handler, so an unreleased session lock leaks to the connection's next borrower. In pooled apps, prefer the `xact` variant.

## Predict, then verify

Open two `psql` sessions. In A: `BEGIN; SELECT count(*) FROM subscriptions;`. In B, insert a subscriber and commit. Back in A, run the count again, once with A at `READ COMMITTED` and once with A at `REPEATABLE READ`. What does each show?

Answer: at `READ COMMITTED` the second count includes B's row, a phantom in action, because each statement snapshots afresh. At `REPEATABLE READ` both counts match: the whole transaction reads from the snapshot taken at its first query, so B's committed insert stays invisible until A ends. Neither behavior is wrong; they are different promises, and the bug is only in not knowing which one you asked for.
