Running the finished newsletter locally now means four things at once: Postgres, Redis for sessions, the API, and the delivery worker from chapter 11. Doing that with `docker run` means creating a network by hand, remembering four flag sets, and starting them in the right order. One file replaces the whole ritual.

```yaml
# compose.yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: newsletter
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d newsletter"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      retries: 10

  api:
    build: .
    ports: ["8000:8000"]
    environment:
      APP_ENVIRONMENT: production
      APP_APPLICATION__HOST: 0.0.0.0
      APP_DATABASE__HOST: postgres
      APP_REDIS_URI: redis://redis:6379
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }

  worker:
    build: .
    command: ["./zero2prod", "--worker"]
    environment:
      APP_ENVIRONMENT: production
      APP_DATABASE__HOST: postgres
    depends_on:
      postgres: { condition: service_healthy }

volumes:
  pgdata:
```

(No `version:` key. It was obsoleted by the Compose Spec and current `docker compose` warns about it. Note also that `docker compose` is the Go plugin; the old Python `docker-compose` reached end of life in 2023.)

## Service names are hostnames

Compose puts every service on one project network with an embedded DNS server at `127.0.0.11`, so `postgres` resolves to that container's address. Hence `APP_DATABASE__HOST: postgres` rather than a port number on `localhost`. The namespaces lesson explains why the naive version fails: each container has its own network namespace, so inside `api`, `localhost` is `api` and nothing else.

The same fact bites from the other side. The book's production config sets `application.host` to `0.0.0.0` because a server bound to `127.0.0.1` inside a network namespace is reachable only from that namespace, and `ports: 8000:8000` then publishes to a port where nobody is listening. Also note that environment values are always strings, which is why the book put `deserialize_number_from_string` on the port fields: `APP_APPLICATION__PORT: 8000` arrives as `"8000"`.

## depends_on and its three conditions

`service_started` is the default and it means almost nothing: the container's process exists. Postgres will happily be "started" while `initdb` is still creating the cluster, and your first connection is refused. `service_healthy` waits on the container's own healthcheck, which is why both stores define one. The third, `service_completed_successfully`, is for one-shot jobs, and it is how you gate on migrations:

```yaml
migrate:
  build: { context: ., dockerfile: Dockerfile.migrate }
  environment: { DATABASE_URL: "postgres://postgres:password@postgres/newsletter" }
  depends_on:
    postgres: { condition: service_healthy }
api:
  depends_on:
    migrate: { condition: service_completed_successfully }
```

Migrations need `sqlx-cli`, which the slim runtime image deliberately does not have, so this service gets its own image. The alternative is running `sqlx::migrate!()` at application startup, which trades a separate image for a slower boot and a race between replicas.

## One image, two processes

The book's `main` spawns the API and `run_worker_until_stopped` as tasks and joins them with `tokio::select!`, so one crash reports and exits both. Splitting them into two Compose services is a deployment decision, not a rewrite: same image, a different `command`. What you buy is independent scaling (`docker compose up --scale worker=3`) and blast radius, since a worker in a crash loop no longer takes the API with it. What you pay is two sets of logs, limits, and config to keep in step, and the worker has no port, so its healthcheck has to be something other than an HTTP probe.

## Predict, then verify

You gate `api` on `postgres: condition: service_healthy`. Hours later, Postgres is OOM-killed and takes 20 seconds to come back. What does Compose do to the running `api` container?

Answer: nothing. `depends_on` is startup ordering, evaluated once during `up`, not a supervision relationship. Compose can be told otherwise with `restart: true` on the dependency entry, which restarts `api` whenever `postgres` restarts, but that is the wrong instinct: a service that must be restarted when its database blinks will also fall over in production, where no such supervisor exists. The book already built the right answer. `PgPoolOptions::connect_lazy_with` means the pool never blocks startup, connections are re-established on demand, and a request during the outage fails with a 500 instead of killing the process.
