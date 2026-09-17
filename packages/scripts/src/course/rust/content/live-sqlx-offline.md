The Docker build dies inside `sqlx::query!` because the macro's whole value is that it talks to a real database at compile time: it asks Postgres to describe each query and checks your SQL and your Rust types against the answer. That was a feature on your laptop, where `DATABASE_URL` pointed at a running container. Inside a hermetic build it is a contradiction: the compile needs a database, and the build environment has none.

There are two honest ways out. You can give the build a database: `docker build --network host` can reach a Postgres on the host machine, and CI pipelines sometimes do exactly that, since they run one for the integration tests anyway. But it couples image builds to machine state, behaves differently across operating systems, and gives up reproducibility. The better option is to make the check work offline.

## Prepared query metadata

The sqlx CLI, in the project since migrations arrived in the first-subscriber section, can run the describe step ahead of time against your development database and save the results:

```bash
cargo sqlx prepare --workspace
```

At the book's sqlx version (0.5) this required an `offline` feature flag and wrote a single `sqlx-data.json`. Since sqlx 0.7 offline support is built in, and the output is a `.sqlx/` directory with one JSON file per query, which merges far better in git. Either way, the instruction printed on the terminal is the same: check the result into version control.

Each file records the query's SQL, the inferred type of every input parameter, and the name, type, and nullability of every output column, keyed by a hash of the SQL string. With that on disk the macros no longer need a server: they look up their own SQL by hash and typecheck against the recorded answer. Setting `SQLX_OFFLINE=true` forces this path even when a `DATABASE_URL` is present, which is what you want in a Dockerfile: builds should not change behavior because a database happened to be reachable.

```dockerfile
COPY . .
ENV SQLX_OFFLINE=true
RUN cargo build --release
```

The build succeeds. The trade is explicit: compile-time checking now trusts a snapshot, and a snapshot can lie once the schema or the queries move on. The fix is mechanical: `cargo sqlx prepare --check --workspace` exits nonzero when the committed metadata no longer matches the code, and it belongs in the CI pipeline from the ci-from-day-one lesson, next to `cargo fmt --check`.

## It builds. Does it run?

`docker run zero2prod` panics at startup: `main` calls `PgPool::connect`, which awaits a working database before the server even binds. Swapping in `connect_lazy` creates the pool without connecting; the first query pays the cost instead, and fails fast only if you also lower the pool's `acquire_timeout` (`connect_timeout` in the book's sqlx) from its 30 second default. The health check endpoint from the getting-started section touches no database, so the API can now boot and report healthy.

Publish the port, `docker run -p 8000:8000 zero2prod`, and curl the health check from the host: connection refused, still. The port mapping is fine. The problem is which address the app binds inside the container, and fixing it properly is the configuration lesson's job.

## Predict, then verify

A teammate adds a migration plus a new `sqlx::query!` call, runs the migration against their local database, and commits without running `cargo sqlx prepare`. What does the offline Docker build do with their branch?

Answer: it fails to compile, with an error along the lines of `failed to find data for query`, because the new query's hash has no entry under `.sqlx/`. The existing queries still compile from their saved records, so the failure is precise rather than cascading. This is the drift that the `--check` step in CI exists to catch earlier and with a clearer message: the metadata is source code now, and it has to move in the same commit as the SQL it describes.
