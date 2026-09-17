Chapter 3 picked sqlx after a one-page comparison and moved on. Fair for a book with a service to ship; less fair to you, who will one day join a team that chose differently. Here is the same query, three ways: every confirmed subscriber's email.

sqlx, the book's choice. SQL is the interface, checked as you saw in the previous lesson:

```rust
let rows = sqlx::query!(
    "SELECT email FROM subscriptions WHERE status = 'confirmed'"
)
.fetch_all(&pool)
.await?;
```

diesel builds queries out of Rust items generated into `schema.rs` by its CLI:

```rust
use diesel::prelude::*;
use crate::schema::subscriptions;

let emails: Vec<String> = subscriptions::table
    .filter(subscriptions::status.eq("confirmed"))
    .select(subscriptions::email)
    .load(&mut conn)?;
```

sea-orm works with generated entity types and a runtime query builder:

```rust
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};

let confirmed = subscription::Entity::find()
    .filter(subscription::Column::Status.eq("confirmed"))
    .all(&db)
    .await?;
```

## What each is actually promising

diesel's promise is that the compiler owns your queries. `subscriptions::email` is a real Rust item; a typo is an unresolved name, and a type mismatch between a filter and a column is a trait error, with no database anywhere near the build. Query fragments are typed values, so a half-built filter can be factored into a function and reused, which raw SQL strings cannot do. The costs: the API is synchronous (blocking IO, so in an async app you reach for the separate `diesel-async` crate or `spawn_blocking` from Part 2), the Postgres backend links the C library libpq (remember the static-linking pain from the Docker section), and its trait-heavy errors are famously long.

sea-orm's promise is ORM ergonomics with async natively: entities generated from a live database by `sea-orm-cli`, `ActiveModel` for inserts and updates, relations you traverse by name, migrations written in Rust. It is built on top of sqlx, which supplies the drivers and the pool underneath. The cost is that queries are assembled at runtime: column names are enum variants so typos still fail to compile, but a semantically wrong query (a bad join, an impossible filter) surfaces only when it runs.

sqlx's promise is the whole database, immediately. Chapter 11's `FOR UPDATE SKIP LOCKED` needed no escape hatch because SQL is not behind an abstraction. The cost is the mirror image of diesel: dynamic queries built from optional filters are painful (`QueryBuilder` exists and is unchecked), and refactors are grep-driven because the compiler does not know that two SQL strings mention the same column.

## A decision framework

Ask, in order:

1. Do you think in SQL and need the database's full surface (locks, CTEs, `jsonb`)? Raw sqlx.
2. Should the compiler own the schema, and can you live with sync or `diesel-async`? diesel.
3. Is the app CRUD-shaped, with relations and filters assembled from user input, on async? sea-orm.
4. Still tied? The team's SQL fluency decides. All three are mature; none is a wrong answer for a newsletter-sized service.

One level deeper: every "compile-time checked" claim is really "checked against a snapshot". sqlx online checks the live database; sqlx offline checks `.sqlx/`; diesel checks `schema.rs`; sea-orm checks generated entities. Three of those four are files that can silently fall behind the real schema, which is why each CLI has a regenerate step and why CI should run the check that detects drift, like `cargo sqlx prepare --check` from the offline lesson.

## Predict, then verify

A migration renames `email` to `email_address`. Nobody regenerates `schema.rs`, entities, or `.sqlx`. For each of the three snippets above, does the build fail, or does the program fail at runtime?

Answer: only sqlx with a live `DATABASE_URL` fails the build, because the macro asks the real database and the real database says no such column. diesel still compiles, since `schema.rs` still declares `email`, and fails at runtime; sea-orm's stale entity does the same; sqlx in offline mode trusts the stale `.sqlx` recording and also fails at runtime. Compile-time safety is only as fresh as its source of truth, and only the live-database check cannot go stale.
