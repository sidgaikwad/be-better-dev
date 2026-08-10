`subscribe` has typed form data and a compile-checked INSERT, and no way to run it: handlers receive what extractors produce, and extractors can only read the incoming request. A database connection is not in the request. It has to come from outside: application state, attached when the App is built.

First attempt: pass a `PgConnection` into `run` and register it with `.app_data(connection)`. The compiler stops it:

```
error[E0277]: the trait bound `PgConnection: std::clone::Clone`
is not satisfied in `[closure@src/startup.rs:8:34]`
```

Why would state need `Clone`? Look at what `HttpServer::new` takes: not an `App`, a closure that returns one. actix-web spins up one worker (an OS thread) per available core, and each worker calls that closure to build its own copy of the App. Anything captured inside must be duplicable, once per worker. A `PgConnection` sits on a TCP socket; cloning it is not a thing.

## Data is Arc in disguise

`web::Data<T>` is the smart-pointers section paying rent: it wraps your value in an `Arc`. Cloning an `Arc` copies a pointer and bumps an atomic reference count; eight workers end up with eight handles to one value.

```rust
//! src/startup.rs
pub fn run(listener: TcpListener, db_pool: PgPool) -> Result<Server, std::io::Error> {
    let db_pool = web::Data::new(db_pool);
    let server = HttpServer::new(move || {
        App::new()
            .route("/health_check", web::get().to(health_check))
            .route("/subscriptions", web::post().to(subscribe))
            .app_data(db_pool.clone())
    })
    .listen(listener)?
    .run();
    Ok(server)
}
```

`Data` doubles as an extractor. actix keeps state in a type-map (`TypeId` to `Any`): ask for `web::Data<PgPool>` in a signature and `from_request` looks up whatever was registered under that type. Dependency injection, keyed by types.

Why `PgPool` instead of the `PgConnection` we started with? sqlx's `execute` wants an `Executor`, and `&PgConnection` does not implement it; only `&mut PgConnection` does. sqlx refuses to interleave queries on one connection and states that in the API as exclusivity: the one-writer rule from the "&mut T: one writer, no readers" lesson, enforced on a socket. `Data` only ever hands out shared references. `&PgPool`, however, does implement `Executor`: interior mutability inside the pool checks out an idle connection per query, or opens one, or waits. Bonus: a slow query no longer stalls every other request.

```rust
pub async fn subscribe(form: web::Form<FormData>, pool: web::Data<PgPool>) -> HttpResponse {
    match sqlx::query!(/* the INSERT from the sqlx lesson */)
        .execute(pool.get_ref())
        .await
    {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(e) => {
            println!("Failed to execute query: {}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}
```

A `Result`, matched into 200 or 500, exactly as the "Result: failure as a value" lesson drew it. (The `println!` is a placeholder the telemetry section will be rude about.)

## One database per test

`cargo test`: green. Run it again: `duplicate key value violates unique constraint "subscriptions_email_key"`, a 500 where 200 was asserted. The database is a global variable shared by every test and every run: the first run inserted Le Guin, and the UNIQUE index from the migrations lesson did its job on the second.

Two standard isolation techniques: wrap each test in a transaction and roll it back (fast, but the app checks connections out of its own pool, beyond the test transaction's reach), or give every test its own logical database. The book takes the second. `spawn_app` randomizes the database name, then builds it:

```rust
configuration.database.database_name = Uuid::new_v4().to_string();

pub async fn configure_database(config: &DatabaseSettings) -> PgPool {
    let mut connection = PgConnection::connect(&config.connection_string_without_db())
        .await
        .expect("Failed to connect to Postgres");
    connection
        .execute(format!(r#"CREATE DATABASE "{}";"#, config.database_name).as_str())
        .await
        .expect("Failed to create database.");

    let connection_pool = PgPool::connect(&config.connection_string())
        .await
        .expect("Failed to connect to Postgres.");
    sqlx::migrate!("./migrations")
        .run(&connection_pool)
        .await
        .expect("Failed to migrate the database");
    connection_pool
}
```

Connecting without a database name targets the Postgres instance rather than any logical database inside it; `CREATE DATABASE` plus the embedded migrations rebuild the schema fresh, and `spawn_app` returns a `TestApp { address, db_pool }` so assertions query the same isolated database the app writes to. Nobody cleans up: near-empty databases pile up, and restarting a disposable instance is cheaper than teardown logic.

## Predict, then verify

Eight cores, so eight workers each run `.app_data(db_pool.clone())`. After startup, how many connection pools exist in the process, and what did each clone actually copy?

Answer: one pool. The clones are `Data` clones, meaning `Arc` clones: each copied an 8-byte pointer and incremented an atomic counter, leaving eight handles on one pool whose connections are shared by every worker. If each worker had truly duplicated the pool, you would have eight times `max_connections` sockets and no shared accounting. `Arc`, here wearing `web::Data` as a coat, is how "give everyone access" avoids meaning "give everyone a copy".
