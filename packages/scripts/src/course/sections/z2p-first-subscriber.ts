import type { SectionSeed } from "../types"

// Part 3, chapter 3 of Zero to Production: the /health_check stepping stone,
// the black-box test harness, POST /subscriptions, and Postgres via sqlx.

export const z2pFirstSubscriber: SectionSeed = {
  slug: "z2p-first-subscriber",
  title: "Sign up a new subscriber (ch. 3)",
  description: "actix-web anatomy, integration tests, forms, sqlx, Postgres, migrations.",
  badgeIcon: "📮",
  badgeTitle: "First endpoint",
  units: [
    {
      slug: "a-health-check-first",
      title: "A health check first",
      description: "One trivial endpoint to meet the framework and build the test harness.",
      lessons: [
        {
          slug: "sub-health-check",
          title: "The health check: actix-web's anatomy",
          summary: "HttpServer, App, Route, and the tokio runtime the macro writes for you.",
          contentFile: "sub-health-check.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which of these is HttpServer's job rather than App's?",
              options: [
                "Matching /health_check to its handler",
                "Deciding which address to bind and whether to use TLS",
                "Running middleware around each request",
                "Converting handler return values into responses",
              ],
              answer: 1,
              explanation:
                "HttpServer owns transport-level concerns: address, connection limits, TLS. Routing, middleware, and response conversion all live in App and its handlers.",
            },
            {
              kind: "predict",
              prompt:
                "You delete `#[tokio::main]` but leave `main` async. What does `cargo check` say?",
              options: [
                "It compiles; main's future just never runs",
                "error[E0752]: `main` function is not allowed to be `async`",
                "It compiles but panics at runtime: no reactor running",
                "A warning about an unused future, then success",
              ],
              answer: 1,
              explanation:
                "Nothing would ever call poll on main's future, so Rust rejects async main outright. The macro exists to write the synchronous wrapper that builds a runtime and calls block_on.",
            },
            {
              kind: "mcq",
              prompt: "What does `#[tokio::main]` actually generate?",
              options: [
                "A compiler flag that legalizes async main",
                "A synchronous main that builds a multi-thread tokio runtime and calls block_on on your async body",
                "A new OS thread per incoming request",
                "An event loop owned by HttpServer",
              ],
              answer: 1,
              explanation:
                "cargo expand shows Builder::new_multi_thread().enable_all().build().block_on(body). Macros are code generation; the runtime is ordinary library code you could write by hand.",
            },
          ],
        },
        {
          slug: "sub-spawn-app",
          title: "spawn_app: black-box integration tests",
          summary: "Launch the real app on a random port and test it over plain HTTP.",
          contentFile: "sub-spawn-app.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why does `zero2prod::run` return a `Server` instead of awaiting it internally?",
              options: [
                "The server future only resolves on shutdown, so the caller chooses: main awaits it, tests tokio::spawn it",
                "A Server cannot be awaited more than once",
                "actix-web requires startup functions to be synchronous",
                "Returning it is the only way to propagate bind errors",
              ],
              answer: 0,
              explanation:
                "Awaiting inside run would block forever: the server listens until shutdown. Handing the future back lets main drive it while spawn_app parks it on the runtime as a background task.",
            },
            {
              kind: "predict",
              prompt:
                "spawn_app still hard-codes port 8000 and two tests run in parallel. What happens?",
              options: [
                "Both pass; the OS multiplexes the port",
                'One test panics when its bind fails with "address already in use"',
                "Both fail with connection refused",
                "cargo test detects the conflict and serializes them",
              ],
              answer: 1,
              explanation:
                "Only one listener can bind a port; the second bind returns AddrInUse and the expect panics. Binding port 0 exists so the kernel hands each test its own free port.",
            },
            {
              kind: "mcq",
              prompt: "What does the [lib]/[[bin]] split in Cargo.toml buy the test suite?",
              options: [
                "Faster incremental compiles",
                "Files under tests/ link the library crate like an external dependency, so they can call zero2prod::run",
                "It lets cargo run start two servers at once",
                "It hides private handlers from the tests",
              ],
              answer: 1,
              explanation:
                "tests/ files are separate binaries with outsider access only, as Part 1's testing section showed, and a binary crate's internals cannot be imported at all. The library carries the startup logic both main and the tests share.",
            },
          ],
        },
      ],
    },
    {
      slug: "post-subscriptions",
      title: "POST /subscriptions",
      description: "Typed form parsing with serde, then the database crate decision.",
      lessons: [
        {
          slug: "sub-form-extractor",
          title: "Form data: serde and the Form extractor",
          summary: "urlencoded bodies, serde, and how FromRequest feeds handlers typed data.",
          contentFile: "sub-form-extractor.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "A POST /subscriptions body is missing `name`. Where does the 400 come from?",
              options: [
                "subscribe inspects an Option field and returns it",
                "Form::from_request fails during extraction, the error becomes the response, and subscribe never runs",
                "The router rejects the request before reading the body",
                "serde panics and actix catches the panic",
              ],
              answer: 1,
              explanation:
                "Extractors run before the handler; a failed extraction short-circuits into an error response. The handler body only ever sees fully typed data.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does the same `#[derive(serde::Deserialize)]` on FormData work for urlencoded bodies and JSON alike?",
              options: [
                "The derive inspects the request's Content-Type",
                "serde defines a format-independent data model; the derive maps FormData onto it once, and each format crate implements the parsing side",
                "It cannot; each format needs its own derive",
                "actix converts every body to JSON first",
              ],
              answer: 1,
              explanation:
                "Deserialize speaks serde's data model, and serde_urlencoded or serde_json speak the wire format. Either half composes with any implementation of the other, with monomorphization erasing the cost.",
            },
            {
              kind: "predict",
              prompt:
                "Same endpoint, body `email=ursula_le_guin%40gmail.com&name=le%20guin` (fields swapped). Status?",
              options: [
                "400: field order must match the struct",
                "200: serde matches by key name, not position",
                "500: ambiguous parse",
                "415: unsupported media type",
              ],
              answer: 1,
              explanation:
                "Urlencoded pairs form a map and Deserialize matches struct fields by name, so order is irrelevant. Validity is another matter: an empty or garbage email still deserializes, which chapter 6 fixes with types.",
            },
          ],
        },
        {
          slug: "sub-choosing-sqlx",
          title: "Choosing sqlx: queries checked at build time",
          summary: "The decision matrix, and query! verifying SQL against a live schema.",
          contentFile: "sub-choosing-sqlx.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In the book's decision matrix, what disqualifies diesel for this project?",
              options: [
                "No compile-time checking of queries",
                "It only supports MySQL",
                "No async interface, plus queries in a crate-specific DSL rather than SQL",
                "It cannot express INSERT statements",
              ],
              answer: 2,
              explanation:
                "diesel is compile-time checked but synchronous, with no async support planned at the time, and the book prefers portable SQL over a DSL. sqlx offers checks, SQL, and async together.",
            },
            {
              kind: "mcq",
              prompt: "What does `sqlx::query!` need at compile time that ordinary code does not?",
              options: [
                "A DATABASE_URL pointing at a running database with the migrated schema, so it can prepare the statement and learn column types",
                "The nightly compiler",
                "A build.rs that generates structs from the schema",
                "Superuser access for the postgres role",
              ],
              answer: 0,
              explanation:
                "The macro asks Postgres to describe the query, then generates an anonymous record type per column and type-checks every bind. No reachable database, no build, until offline mode in the going-live section.",
            },
            {
              kind: "predict",
              prompt:
                "In the INSERT, you swap the first two binds: `form.email` where the uuid `$1` goes, `Uuid::new_v4()` for `$2`. What happens?",
              options: [
                "It compiles; Postgres coerces the values at runtime",
                "A 500 on the first POST /subscriptions",
                "cargo check fails: the macro knows $1 is uuid and a String does not satisfy it",
                "The row is inserted with the two columns swapped",
              ],
              answer: 2,
              explanation:
                "Prepared-statement metadata gives every placeholder a SQL type, and query! checks each bind against it. The mistake dies at build time instead of corrupting data or failing per-request.",
            },
          ],
        },
      ],
    },
    {
      slug: "postgres-and-state",
      title: "Postgres, state, and isolation",
      description: "Migrations as code, a pool shared through Data, tests that never collide.",
      lessons: [
        {
          slug: "sub-migrations",
          title: "Postgres, init_db, and migrations as code",
          summary: "One script to a running Postgres; sqlx migrate makes schema history code.",
          contentFile: "sub-migrations.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does init_db.sh loop on `psql ... -c '\\q'` after `docker run`?",
              options: [
                "To create the newsletter database",
                "docker run returns when the container starts, not when Postgres accepts connections; the loop waits for service-ready",
                "To keep the container from exiting",
                "To warm up the connection pool",
              ],
              answer: 1,
              explanation:
                "Container-started and ready-for-queries are different moments, and racing them makes sqlx database create flake. It is the same distinction /health_check exposes for an orchestrator.",
            },
            {
              kind: "predict",
              prompt:
                "The database is fully migrated and you run `sqlx migrate run` again. What happens?",
              options: [
                "Every migration re-runs and wipes the data",
                "Nothing to apply: it consults _sqlx_migrations and exits cleanly",
                "It fails: the subscriptions table already exists",
                "It prompts before continuing",
              ],
              answer: 1,
              explanation:
                "Each applied migration is recorded with version and checksum in _sqlx_migrations, so the runner only applies the delta. That bookkeeping is what makes running it on every deploy safe.",
            },
            {
              kind: "mcq",
              prompt:
                "You need to change the schema created by an already-applied migration. The right move is:",
              options: [
                "Edit the applied .sql file in place",
                "Add a new migration file containing the ALTER TABLE",
                "Truncate _sqlx_migrations and re-run everything",
                "Change the table by hand in psql",
              ],
              answer: 1,
              explanation:
                "Applied files are checksummed history: edit one and every database that ran it now disagrees with the repo, which sqlx reports as an error. Schema evolves by appending migrations, like commits.",
            },
          ],
        },
        {
          slug: "sub-app-state",
          title: "web::Data, PgPool, and one database per test",
          summary: "State is an Arc handed to every worker; every test gets its own database.",
          xp: 25,
          contentFile: "sub-app-state.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does HttpServer require application state to be cloneable?",
              options: [
                "actix rebuilds the App on every request",
                "HttpServer::new takes a closure and each worker (one per core) calls it to build its own App, so captured state is duplicated per worker",
                "tokio::spawn requires Clone on everything it runs",
                "So handlers can mutate their own copy freely",
              ],
              answer: 1,
              explanation:
                "The runtime model is one App per worker, all built from the same closure. web::Data makes the copy cheap: an Arc clone is a pointer copy plus an atomic increment.",
            },
            {
              kind: "predict",
              prompt:
                "You wrap a single PgConnection in web::Data and call `.execute(connection.get_ref())`. What stops you?",
              options: [
                "Nothing; it works",
                "A deadlock at runtime",
                "The compiler: &PgConnection does not implement Executor; only &mut PgConnection does, and Data never hands out &mut",
                "Postgres rejects the second concurrent query",
              ],
              answer: 2,
              explanation:
                "sqlx will not interleave queries on one connection, so it demands exclusive access: the one-writer rule applied to a socket. A shared &PgPool qualifies because the pool checks out a connection per query internally.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does spawn_app create a brand-new logical database per test instead of wrapping each test in a rolled-back transaction?",
              options: [
                "Transactions are slower than creating databases",
                "The app runs queries on connections from its own pool, which the test's transaction cannot capture; a fresh database isolates at a level the app cannot escape",
                "Postgres cannot roll back DDL",
                "Migrations refuse to run inside a transaction",
              ],
              answer: 1,
              explanation:
                "Rollback isolation only works when test and application share the transaction's connection, and a black-box test shares nothing. The book trades speed for the bluntest isolation: a database that exists for one test.",
            },
          ],
        },
      ],
    },
  ],
}
