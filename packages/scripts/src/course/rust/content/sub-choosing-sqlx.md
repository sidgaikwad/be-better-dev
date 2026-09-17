`subscribe_returns_a_200_for_valid_form_data` passes while the application stores nothing. A black-box test can only inspect responses, and the response says nothing about the side effect we actually care about: a row, persisted. The book weighs two ways to verify it (call another public endpoint, or query the database directly inside the test) and picks the second reluctantly, because a `GET /subscriptions` endpoint would need authentication we are chapters away from having.

So the test will speak SQL, which forces the chapter's biggest decision: which crate talks to Postgres?

## The decision matrix

Three serious candidates as of the book's writing: `tokio-postgres`, `sqlx`, `diesel`. Three axes:

- Compile-time safety. A typo'd column, a mistyped comparison: caught when? `tokio-postgres` tells you at runtime, when Postgres rejects the query. `diesel` catches it at build time through `schema.rs`, Rust code its CLI generates from the database. `sqlx` catches it at build time by asking the database itself.
- Query interface. `tokio-postgres` and `sqlx` are SQL-first. `diesel` gives you a DSL: composable and reusable, but crate-specific knowledge, and complex queries can fall back to raw SQL anyway.
- Async. `sqlx` and `tokio-postgres` are async; `diesel` is synchronous with no async plans (a community `diesel-async` crate exists today; the book's matrix predates it).

`sqlx` sweeps the row that matters here: async to match actix-web's runtime, compile-time checked, and plain SQL, so no second query language to learn.

## query! at build time

The test assertion, using the book's first connection type (`PgConnection::connect`; a pool replaces it two lessons from now):

```rust
let saved = sqlx::query!("SELECT email, name FROM subscriptions",)
    .fetch_one(&mut connection)
    .await
    .expect("Failed to fetch saved subscription.");
assert_eq!(saved.email, "ursula_le_guin@gmail.com");
assert_eq!(saved.name, "le guin");
```

What type is `saved`? An anonymous record struct that appears nowhere in your source. At compile time the macro connects to the database named by the `DATABASE_URL` environment variable (a committed `.env` file holds `postgres://postgres:password@127.0.0.1:5432/newsletter`), asks Postgres to prepare the statement, reads back column names and types, and generates a struct with one typed field per column: `saved.email` is a `String` because Postgres said `email` is `TEXT`. No reachable database at build time and the build stops with "DATABASE_URL must be set to use query macros".

The INSERT for `subscribe` works the same way, plus bind parameters:

```rust
sqlx::query!(
    r#"
    INSERT INTO subscriptions (id, email, name, subscribed_at)
    VALUES ($1, $2, $3, $4)
    "#,
    Uuid::new_v4(),
    form.email,
    form.name,
    Utc::now()
)
// .execute(..) takes an Executor: the next two lessons' problem
```

`$1..$4` are Postgres placeholders: data travels separately from the SQL text, so injection is ruled out by construction, and `query!` verifies at compile time that the number and Rust types of the binds match what the prepared statement expects (the `uuid` and `chrono` feature flags teach sqlx those two mappings). The book pins sqlx 0.5 with features `runtime-actix-rustls, macros, postgres, uuid, chrono, migrate`; modern sqlx (0.7+) renamed the runtime story to `runtime-tokio` plus `tls-rustls`, and everything else reads the same.

If you have generated types from a live schema in TypeScript (pgtyped, prisma), the idea is familiar; the difference is that there is no generated artifact to drift out of date, because the check re-runs inside every `cargo check`. The cost is equally real: your build now depends on a running, migrated database, and CI feels it immediately (the book updates the pipeline; offline mode via `cargo sqlx prepare` arrives with the going-live section).

## Predict, then verify

A migration renames the column `email` to `subscriber_email`, but the INSERT above still says `email`. Where does the mistake surface first: `cargo check`, application startup, or the first `POST /subscriptions`?

Answer: `cargo check`. The macro prepares the statement against the live schema and Postgres answers that column "email" of relation "subscriptions" does not exist; the code never compiles, so there is no startup and no request to fail. That inversion, schema mismatches failing like type errors, is the entire pitch of `query!` over runtime-checked query strings.
