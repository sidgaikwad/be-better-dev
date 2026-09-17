The newsletter API works on your machine because your machine has a Rust toolchain, `lld`, a running Postgres, and a `configuration.yaml` in the right spot. The server that will host it has none of that, and no reason to: a production box should run your software, not be a second development environment. The mainstream answer is to ship the environment together with the application, as a container image.

A Dockerfile is the recipe for that image: pick a base image, then run steps that each stack a new layer on the previous state. The simplest recipe that could plausibly build the project:

```dockerfile
FROM rust:1.85
WORKDIR /app
RUN apt update && apt install lld clang -y
COPY . .
RUN cargo build --release
ENTRYPOINT ["./target/release/zero2prod"]
```

The book pins `rust:1.59.0`; the shape has not changed since, so pin whatever stable you develop on. `ENTRYPOINT` is what `docker run` will execute.

```bash
docker build --tag zero2prod --file Dockerfile .
```

## The build context

The trailing `.` matters. A Docker build runs in isolation; the only files that exist for it are the ones you hand over, called the build context. `.` says "use the current directory", so Docker ships that directory's contents to the build, and `COPY . .` copies them into the image. Files outside the context, parent directories included, are simply invisible to `COPY`.

You rarely want the whole repository in there. A `.dockerignore` file at the root excludes what the build does not need:

```
.env
target/
tests/
scripts/
migrations/
Dockerfile
```

`target/` is the entry that pays rent. It grows to gigabytes on a dependency-heavy project, transfers slowly on every build, is useless inside the image (the container compiles from source anyway), and changes after every local `cargo` invocation, which quietly ruins layer reuse for `COPY . .`. `.env` is excluded for a different reason: it holds database credentials, and images get shared.

## The build that fails

Run the build and it dies partway through `cargo build --release`:

```
error: error communicating with the server:
Cannot assign requested address (os error 99)
  --> src/routes/subscriptions.rs:35:5
   = note: this error originates in a macro
```

A compile step is making network calls. Recall from the first-subscriber section that `sqlx::query!` verifies every query against a live database at compile time, connecting to whatever `DATABASE_URL` names. Inside the build there is no reachable Postgres: if a copied `.env` points at `127.0.0.1:5432`, the connection fails with the error above, and with no `DATABASE_URL` at all the macro fails asking for one. Either way, compile-time guarantees have collided with hermetic builds. Untangling that is the next lesson; the gigabytes come after.

## Predict, then verify

Suppose the sqlx problem were fixed and the image built. You delete the `target/` line from `.dockerignore`, then run `docker build` twice with no source edits in between, but with a local `cargo build` before each one. Is the second Docker build fully cached?

Answer: no. Every build now starts by shipping a multi-gigabyte context to the daemon, which is slow before any caching question arises. And because the local `cargo build` rewrote files under `target/`, the content flowing into `COPY . .` changed, so that layer and everything after it, the entire compilation included, run again. Keeping build artifacts out of the context is not tidiness; it is a precondition for the layer caching the small-images lesson relies on.
