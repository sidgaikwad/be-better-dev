Chapter 3 built one `PgPool` at startup and handed clones of it to every handler. You have used it in every chapter since. This lesson is about what you were being protected from.

## What a fresh connection costs

Opening a Postgres connection is not opening a socket. It is a TCP handshake, usually a TLS handshake on top, then an authentication exchange: several network round trips before the first query. On the server it is heavier still: Postgres forks a dedicated backend process per connection, each holding several megabytes of memory plus catalog caches that warm over time. Single-digit milliseconds and real server RAM, per connection. Do that per request and the connection ceremony can outweigh the query.

A pool amortises the ceremony: a set of already-open connections, an `acquire()` that lends one out, and a return-on-`Drop` in the same spirit as `Transaction`'s rollback-on-drop from the chapter 7 transactions lesson. The fast path of `acquire` is popping an idle connection off a list: microseconds, no network. The slow path is the interesting one: every connection is busy, so the caller parks in a queue and waits for a release, up to `acquire_timeout`, then fails with `PoolTimedOut`.

That timeout is not a nuisance to be raised until it stops firing. It is backpressure, the same principle as the bounded channels in Part 2's backpressure lesson: when the database is saturated, an unbounded wait queue converts overload into latency for everyone, while a bounded wait converts it into fast errors for the excess. The book set it to two seconds for exactly this reason: a request that cannot get a connection in two seconds should fail now, not join a pile-up.

## Sizing is arithmetic, then judgment

Postgres ships with `max_connections = 100`, minus a few slots reserved for superusers, and every slot is a process. Pools do not coordinate across instances, so the arithmetic is fleet-wide:

```
4 API instances x 10  +  2 delivery workers x 5  +  migrations, psql, dashboards
= 50-something of 100
```

Leave headroom; hitting the cap means new connections are refused with `FATAL: sorry, too many clients already`.

The judgment part: more connections is not more throughput. Beyond a point near the server's core count, extra active queries just contend for CPU, locks, and IO; the Postgres wiki's starting heuristic is roughly `cores * 2 + spindles`, single digits to low tens on typical hardware. Big fleets fan hundreds of app connections into a few dozen server slots with a proxy like PgBouncer. Small fleets, like ours, just size honestly.

sqlx's knobs, with defaults: `max_connections` (10), `min_connections` (0, raise it to keep a warm floor so the first requests after a deploy do not pay connection setup), `acquire_timeout` (30s default, 2s in the book), `idle_timeout` (10 min), `max_lifetime` (30 min, rotation bounds server-side memory growth and lets connections re-point after a failover), and `test_before_acquire` (true: one liveness round trip per acquire, the price of never being handed a dead connection).

## Predict, then verify

The pool holds at most 5 connections. Five requests arrive at once, and each handler runs:

```rust
let mut tx = pool.begin().await?;      // acquires a connection
let n = helper(&pool).await?;          // helper takes &PgPool and queries through it
tx.commit().await?;
```

What happens, with and without an `acquire_timeout`?

Answer: deadlock, then rescue by timeout. Each `begin()` takes one connection, emptying the pool; each `helper` then waits to acquire a sixth connection that can only appear when some transaction commits, which is waiting on `helper`. Nobody progresses. With a timeout, all five helper acquires fail with `PoolTimedOut`, the transactions drop and roll back (chapter 7's safety net), and the pool recovers; without one, the service hangs forever. The fix is to pass the transaction itself, `&mut *tx`, so the helper rides the connection you already own. One logical unit of work should hold exactly one connection.
