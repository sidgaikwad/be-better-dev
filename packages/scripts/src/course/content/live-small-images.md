The image builds and runs. `docker images zero2prod` prints the bill: 2.31GB in the book's measurement, against 1.29GB for the `rust` base image alone. Production machines will `docker pull` this on every deploy and every scale-up. And from the inner-dev-loop lesson you know the other cost: with one layer doing all the compilation, every one-line change recompiles every dependency, tokio and actix-web included, which for a `--release` build on a mid-sized project can mean 15 minutes. Two problems, size and time, with two Docker features between them and one cargo-shaped hole.

## Multi-stage builds

Nothing in the 2.31GB is needed to run the binary. Rust compiles to a mostly self-contained executable: it links libc dynamically, and some dependencies want OpenSSL, but rustc, cargo, and the source tree are build-time baggage. Multi-stage builds split the recipe:

```dockerfile
FROM rust:1.85 AS builder
WORKDIR /app
RUN apt update && apt install lld clang -y
COPY . .
ENV SQLX_OFFLINE=true
RUN cargo build --release

FROM debian:bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/zero2prod zero2prod
COPY configuration configuration
ENV APP_ENVIRONMENT=production
ENTRYPOINT ["./zero2prod"]
```

Only the last stage becomes the image; the builder is scaffolding, discarded except for what `COPY --from=builder` carries across. The book's measurements walk the sizes down: 1.3GB with the full `rust` image as runtime base, 681MB with `rust:slim`, 88MB on Debian slim; current image generations land close by. `ca-certificates` earns its place: without a CA store the binary cannot verify anyone's TLS certificate, which will matter the moment we dial a managed Postgres. (With a rustls-only dependency tree, the `openssl` install is often unnecessary; the CA store never is.)

Below Debian slim sit the sparser bases. Google's distroless `cc` image is roughly 25MB and ships glibc and a CA store but no shell and no package manager: a smaller attack surface, and no `docker exec bash` when production misbehaves. A static musl build can run on `scratch` at just-the-binary size, traded against cross-compilation setup. Debian slim is the boring default; the deeper trade-offs live in the Part 4 container internals section.

## Caching the expensive layer

Docker caches each layer and reuses it when its inputs are byte-identical, so things that change often belong late in the Dockerfile. Most ecosystems exploit this by copying only the lockfile, installing dependencies into one big cached layer, then copying source. Cargo has no first-class way to do that: nothing like `cargo build --only-deps` exists, and with `COPY . .` before the build, any source edit invalidates the compile layer.

cargo-chef, written by this book's author, fakes it:

```dockerfile
FROM lukemathwalker/cargo-chef:latest-rust-1.85 AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
ENV SQLX_OFFLINE=true
RUN cargo build --release --bin zero2prod

FROM debian:bookworm-slim AS runtime
# ...unchanged from the previous Dockerfile
```

`prepare` boils the project down to a recipe: the dependency skeleton, no application source. `cook` builds only the dependencies it lists. The planner's `COPY . .` reruns on every change, but stages cache independently, and the builder sees only `recipe.json`: identical dependencies produce a byte-identical recipe, so the `cook` layer stays cached and a code-only change recompiles just your crate. Since the book, BuildKit cache mounts (`RUN --mount=type=cache` on the cargo registry and `target/`) have become the common alternative where runners persist a cache; cargo-chef remains the portable answer when the layer cache is all you have.

## Predict, then verify

With the cargo-chef build warm in cache, you add one new dependency to `Cargo.toml` and rebuild. Which layers rerun?

Answer: nearly all the meaningful ones. The planner reruns and emits a different `recipe.json`, so the builder's `COPY` of it invalidates, `cook` rebuilds the dependency set, and your crate compiles after it. Compare a source-only edit: the planner still reruns, but its recipe comes out byte-identical, so `cook` stays cached. The cache key is the dependency skeleton, not timestamps or file names, which is exactly why the trick is safe.
