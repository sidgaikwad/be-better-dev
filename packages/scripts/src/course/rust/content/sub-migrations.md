The sqlx lesson left a demanding fact standing: `cargo check` now needs a running Postgres with the right schema. That is only tolerable if the schema is reproducible on demand, one command from a blank machine to a database the macros can interrogate. The book's answer is a bash script plus sqlx's migration tooling.

```bash
#!/usr/bin/env bash
# scripts/init_db.sh (trimmed)
set -x
set -eo pipefail

DB_USER=${POSTGRES_USER:=postgres}
DB_PASSWORD="${POSTGRES_PASSWORD:=password}"
DB_NAME="${POSTGRES_DB:=newsletter}"
DB_PORT="${POSTGRES_PORT:=5432}"

if [[ -z "${SKIP_DOCKER}" ]]; then
  docker run \
    -e POSTGRES_USER=${DB_USER} -e POSTGRES_PASSWORD=${DB_PASSWORD} \
    -e POSTGRES_DB=${DB_NAME} -p "${DB_PORT}":5432 \
    -d postgres postgres -N 1000
fi

export PGPASSWORD="${DB_PASSWORD}"
until psql -h "localhost" -U "${DB_USER}" -p "${DB_PORT}" -d "postgres" -c '\q'; do
  >&2 echo "Postgres is still unavailable - sleeping"
  sleep 1
done

export DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}
sqlx database create
sqlx migrate run
```

Four details carry the design. Environment variables with defaults make every knob overridable without editing the script. `-N 1000` raises Postgres's max connections, because the test suite is about to open a pool per test. The `until psql` loop closes the gap between "container started" and "Postgres accepts connections": `docker run -d` returns at the first moment, and commands fail until the second (that distinction, process-up versus service-ready, is exactly what `/health_check` exposes for an orchestrator). And `SKIP_DOCKER` runs only the migration half against a Postgres you already have, in CI or after the first boot; without it, a second run dies when `-p 5432` finds the port already claimed. The full script also refuses to start unless `psql` and `sqlx` are installed: scripts have dependencies too, and failing loudly up front beats crashing halfway through.

## Migrations

`sqlx-cli` arrives with `cargo install sqlx-cli` (the book pins 0.5.7 with `--features postgres`; current releases want `--features rustls,postgres`). Then:

```bash
sqlx migrate add create_subscriptions_table
```

creates `migrations/{timestamp}_create_subscriptions_table.sql`, and the schema goes in as plain SQL:

```sql
CREATE TABLE subscriptions(
   id uuid NOT NULL,
   PRIMARY KEY (id),
   email TEXT NOT NULL UNIQUE,
   name TEXT NOT NULL,
   subscribed_at timestamptz NOT NULL
);
```

The book flags each choice: a synthetic uuid primary key rather than the natural key `email`; `TEXT` because no length limit is actually required; `NOT NULL` on every column; `UNIQUE` on email so the database itself guarantees no duplicates. Constraints are the last line of defense against application bugs, and they bill you in write throughput: `UNIQUE` maintains a B-tree index that every INSERT, UPDATE and DELETE must update. At newsletter scale, the book notes, needing to care would be a good problem to have.

`sqlx migrate run` applies every pending file in timestamp order and records each one in a bookkeeping table, `_sqlx_migrations` (version, checksum, applied-at). This is why migrations are code in the strongest sense: the schema's whole history lives in the repository, gets reviewed like any other diff, and replays identically on a laptop, in CI, and in production. The ledger turns a folder of SQL files into a converging process: any database, from any starting point, applies exactly the migrations it has not seen and lands on the same schema.

One more consumer: `sqlx::migrate!("./migrations")` embeds those same files into a Rust binary, which is how the next lesson's test suite migrates its throwaway databases without shelling out to bash.

## Predict, then verify

The database is fully migrated. You run `sqlx migrate run` again. What happens, and what would happen if you had first edited the already-applied SQL file?

Answer: nothing, cleanly. The runner consults `_sqlx_migrations`, finds every version recorded, and exits, which is why deploy pipelines can run it unconditionally. Editing an applied file is the one unforgivable move: the stored checksum no longer matches and sqlx reports the migration as modified rather than re-running it. Applied history is immutable; schema change means appending a new migration, exactly like commits.
