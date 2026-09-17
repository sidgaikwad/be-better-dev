The image is small, cache-friendly, and configurable from the outside. What remains is a machine to run it, TLS at the front door, a database that is not your laptop, and a redeploy on every push to main: continuous deployment, the chapter's actual goal. The book buys all of it from a managed platform, DigitalOcean's App Platform, chosen in 2020 for developer experience rather than uniqueness. Fly.io, Railway, and Render sell the same shape today, and the shape is what transfers.

You describe the deployment declaratively, in a spec file at the repo root:

```yaml
# spec.yaml
name: zero2prod
region: fra
services:
  - name: zero2prod
    dockerfile_path: Dockerfile
    source_dir: .
    github:
      branch: main
      deploy_on_push: true
      repo: <USERNAME>/zero-to-production
    health_check:
      http_path: /health_check
    http_port: 8000
    instance_count: 1
    instance_size_slug: basic-xxs
databases:
  - engine: PG
    name: newsletter
    num_nodes: 1
    size: db-s-dev-database
    version: "12"
```

`doctl apps create --spec spec.yaml` submits it. The platform clones the repo, builds the Dockerfile (layer caching now saves real minutes on their builders), provisions HTTPS in front of port 8000, and starts pinging `/health_check`: the endpoint from the getting-started section is now load-bearing, because a deployment whose health check never passes is abandoned while the old version keeps serving. `deploy_on_push: true` is the continuous deployment part. Field names in this file have drifted since the book, and `"12"` should be a current Postgres major, but the concepts have not moved. Note that the meter runs, around 20 dollars a month for this setup: tear it down when you stop.

## Secrets through the seam

The managed Postgres comes with credentials that must never enter git or the image. The spec injects them as environment variables at runtime, interpolating values the platform knows:

```yaml
envs:
  - key: APP_DATABASE__PASSWORD
    scope: RUN_TIME
    value: ${newsletter.PASSWORD}
  - key: APP_DATABASE__HOST
    scope: RUN_TIME
    value: ${newsletter.HOSTNAME}
  # ...username, port, and database name follow the same pattern
```

`scope: RUN_TIME` marks variables the container needs when it runs, as opposed to during the image build, where sqlx is offline precisely so that no credentials are required. The names should look familiar: this is the previous lesson's `APP` plus double-underscore convention, and it is the entire integration surface between platform and binary. The platform knows nothing about Rust; it sets strings in an environment.

## TLS to the database

The connection string on the dashboard ends in `sslmode=require`: managed Postgres traffic crosses shared networks, so transport encryption is mandatory, where locally it was irrelevant. That is one more per-environment delta. `DatabaseSettings` grows a `require_ssl: bool`, true in `production.yaml` and false in `local.yaml`, and connection setup moves from hand-assembled strings to `PgConnectOptions`:

```rust
let ssl_mode = if self.require_ssl {
    PgSslMode::Require
} else {
    PgSslMode::Prefer // try TLS, fall back to plaintext
};
PgConnectOptions::new()
    .host(&self.host)
    .username(&self.username)
    .password(self.password.expose_secret())
    .port(self.port)
    .ssl_mode(ssl_mode)
```

Here the runtime image's `ca-certificates` pays off: verifying the database's certificate needs a CA store. One thing the platform will not do is run your migrations. You run them yourself against the managed instance: fetch the connection string, temporarily loosen the database's trusted-sources firewall, then `DATABASE_URL=<connection string> sqlx migrate run`, and lock it back down. Fancier setups run migrations from CI, but the principle stands: migrations are a deliberate step, not a side effect of boot.

## Predict, then verify

You push a commit where `production.yaml` has a typo, so `get_configuration` panics at startup. `deploy_on_push` is true. What do users of the running service experience?

Answer: nothing. The platform builds the image, starts the new container, and waits for `/health_check` to pass; a process that panics on boot never answers, so the deployment fails and traffic stays on the previous version. Health-gated rollouts convert a bad push into a failed deploy instead of an outage, which is what makes deploying every commit a sane default rather than a dare.
