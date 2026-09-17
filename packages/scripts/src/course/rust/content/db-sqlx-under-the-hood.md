Here is a compile error you cannot get in TypeScript:

```
error: error returned from database: column "emial" of relation "subscriptions" does not exist
  --> src/routes/subscriptions.rs:27:5
```

`cargo build` failed because of a typo inside a SQL string. No test ran, no server started, yet something at compile time knew the schema of your database. Part 3 leaned on this constantly. This lesson is about how it can possibly work.

## The macro is a database client

```rust
let saved = sqlx::query!(
    "SELECT email, status FROM subscriptions WHERE id = $1",
    id
)
.fetch_one(&pool)
.await?;
```

When rustc expands `query!`, the macro code runs inside the compiler process and performs real IO:

1. It reads `DATABASE_URL` from the environment or a `.env` file.
2. It connects and asks Postgres to prepare and describe the statement, exactly as if it were about to run it.
3. Postgres parses the SQL against the live catalog and answers with metadata: the type of every `$n` parameter, plus the name, type, and nullability of every output column.
4. The macro generates an anonymous struct from that answer, here `{ email: String, status: String }`, along with decoding code for each field and a type check on the `id` argument.

The compiler never learned SQL. The macro outsources the question to the one system that actually knows the answer. Type mapping follows the catalog: `TEXT` becomes `String`, `UUID` becomes `uuid::Uuid`, `TIMESTAMPTZ` becomes `DateTime<Utc>`, and a nullable column wraps its type in `Option`. One wrinkle: a column that is an expression rather than a plain table column is always reported nullable, because Postgres does not track nullability through expressions. The alias override `AS "name!"` exists for when you know better, and `AS "name?"` for the opposite direction.

No database on the build machine? The Going live section's sqlx offline lesson covered the escape hatch: `cargo sqlx prepare` records each query's metadata as JSON under `.sqlx/`, keyed by a hash of the SQL, and `SQLX_OFFLINE=true` makes the macros read the recording instead of the wire.

## What actually crosses the wire

At runtime sqlx does not ship your SQL as one big string. It speaks the Postgres extended query protocol:

- `Parse`: the SQL with its `$1` placeholders becomes a prepared statement on the server, parsed once.
- `Bind`: parameter values are attached, in binary where possible, producing a portal.
- `Execute`, then `Sync`: run the portal, stream back rows, end with `ReadyForQuery`.

Two production consequences fall out. First, injection through parameters is structurally impossible: your `status` value travels inside a `Bind` message after parsing has already fixed what the statement means. No value can change the query's shape, and escaping is not involved because nothing is ever spliced into text. Second, sqlx caches prepared statements per connection, so a hot query pays `Parse` once per connection rather than once per call. That cache is session state on the server, which is why transaction-mode external poolers like PgBouncer historically broke prepared statements; PgBouncer only gained protocol-aware support for them in late 2023.

## Predict, then verify

`subscribed_at` is declared `TIMESTAMPTZ NOT NULL`. What is the Rust type of `latest` here, and why?

```rust
let row = sqlx::query!(
    "SELECT MAX(subscribed_at) AS latest FROM subscriptions"
)
.fetch_one(&pool)
.await?;
```

Answer: `Option<DateTime<Utc>>`, despite the `NOT NULL` on the column. `MAX(...)` is an expression, and expression columns are reported nullable, so the macro wraps the type. Here the caution is also correct for a deeper reason: over zero rows, `MAX` genuinely returns `NULL`. Forcing the type with `AS "latest!"` would compile and then panic at decode time the first time the table is empty. When you and the checker disagree, run the query in `psql` against the empty case before overruling it.
