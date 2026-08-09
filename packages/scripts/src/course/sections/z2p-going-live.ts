import type { SectionSeed } from "../types"

export const z2pGoingLive: SectionSeed = {
  slug: "z2p-going-live",
  title: "Going live (ch. 5)",
  description: "Dockerfile, sqlx offline mode, hierarchical configuration, deploys.",
  badgeIcon: "🛰️",
  badgeTitle: "Going live",
  units: [
    {
      slug: "build-the-image",
      title: "Build the image",
      description:
        "From a naive 2.31GB Dockerfile to a small, cache-friendly build with no database in sight.",
      lessons: [
        {
          slug: "live-first-dockerfile",
          title: "A first Dockerfile",
          summary:
            "Package the newsletter as an image and learn what the build can and cannot see.",
          contentFile: "live-first-dockerfile.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "In `docker build --tag zero2prod --file Dockerfile .`, what does the final `.` specify?",
              options: [
                "Where the finished image is written",
                "The build context: the set of files `COPY` is allowed to see",
                "The working directory inside the container",
                "The path to the Dockerfile",
              ],
              answer: 1,
              explanation:
                "The build runs in isolation; Docker ships the context directory to it, and `COPY` can only reach files inside that set. The image goes to the local image store, and `--file` already named the Dockerfile.",
            },
            {
              kind: "predict",
              prompt:
                "Your Dockerfile contains `COPY ../shared-lib /lib` and the build context is `.`. What happens?",
              options: [
                "The build fails: paths outside the build context do not exist as far as `COPY` is concerned",
                "Docker resolves the path relative to your shell and copies it",
                "It works as long as the directory exists on your machine",
                "The instruction is silently skipped",
              ],
              answer: 0,
              explanation:
                "Only the files shipped as the build context are visible to the build; parent directories are not part of it. To include them you would have to widen the context, for example by building from the parent directory.",
            },
            {
              kind: "mcq",
              prompt:
                "During `docker build`, `cargo build --release` errors out inside `sqlx::query!`. Why?",
              options: [
                "The macro validates queries against a live database at compile time, and none is reachable from the build",
                "Docker blocks all network access, so cargo cannot download crates",
                "`--release` disables database drivers",
                "Postgres client libraries are missing from the base image",
              ],
              answer: 0,
              explanation:
                "`sqlx::query!` connects out at compile time to check SQL and types, and the hermetic build has no database to offer it. Crate downloads worked fine, which is how the build got as far as the macro.",
            },
          ],
        },
        {
          slug: "live-sqlx-offline",
          title: "sqlx offline mode",
          summary:
            "Compile-time query checking without a database, via metadata checked into the repo.",
          contentFile: "live-sqlx-offline.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "`DATABASE_URL` points at a live, reachable database and `SQLX_OFFLINE=true` is also set. What does `sqlx::query!` check against?",
              options: [
                "The live database: a real server always wins",
                "The committed metadata in `.sqlx/`: the variable forces offline mode",
                "Both, failing the build if they disagree",
                "Neither: the macros are disabled entirely",
              ],
              answer: 1,
              explanation:
                "`SQLX_OFFLINE=true` pins the macros to the saved snapshot so builds behave the same whether or not a database is reachable. Disagreement with the live schema only surfaces when the metadata is regenerated, or at runtime.",
            },
            {
              kind: "mcq",
              prompt: "What does `cargo sqlx prepare` actually save?",
              options: [
                "A dump of your development database's rows",
                "Per-query records of the SQL plus inferred input and output types, keyed by a hash of the SQL",
                "The compiled queries as native code",
                "The list of migrations already applied",
              ],
              answer: 1,
              explanation:
                "It runs the same describe step the macros would run and stores the answers, so compilation can typecheck without a server. No table data is involved, only shapes.",
            },
            {
              kind: "mcq",
              prompt:
                "After the image finally built, the first `docker run` panicked immediately. Why?",
              options: [
                "`PgPool::connect` awaits a database connection at startup, and no Postgres is reachable from the container",
                "The binary was compiled for the wrong CPU architecture",
                "`SQLX_OFFLINE=true` disables database access at runtime",
                "The health check endpoint returned a 500",
              ],
              answer: 0,
              explanation:
                "Startup eagerly connected; `connect_lazy` defers the connection to first use so the server can boot and answer its health check. `SQLX_OFFLINE` affects compilation only, never runtime behavior.",
            },
          ],
        },
        {
          slug: "live-small-images",
          title: "Small images, fast builds",
          summary: "Multi-stage builds, layer caching, cargo-chef, and how 2.31GB becomes 88MB.",
          xp: 25,
          contentFile: "live-small-images.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why can the runtime stage start `FROM debian:bookworm-slim` when the builder needed the full Rust toolchain?",
              options: [
                "The binary is self-contained apart from libc and a few system libraries; the toolchain is only needed to produce it",
                "Debian slim includes a minimal Rust interpreter",
                "The builder stage stays attached to the final image and provides the toolchain on demand",
                "cargo reinstalls itself on the first container start",
              ],
              answer: 0,
              explanation:
                "Rust compiles ahead of time to native code, so nothing interprets it later. The builder stage is discarded; only what `COPY --from=builder` explicitly carries over reaches the final image.",
            },
            {
              kind: "predict",
              prompt:
                "Team A edits only `src/routes/subscriptions.rs`; team B bumps tokio's version in `Cargo.toml`. Both rebuild the cargo-chef Dockerfile with a warm cache. Whose `cargo chef cook` layer reruns?",
              options: ["Both teams'", "Only team A's", "Only team B's", "Neither team's"],
              answer: 2,
              explanation:
                "cook's effective cache key is the recipe: a source edit leaves `recipe.json` byte-identical, while a dependency bump changes it. That asymmetry is the entire point of the planner stage.",
            },
            {
              kind: "mcq",
              prompt:
                "What is the main cost of moving the runtime base from Debian slim to a distroless image?",
              options: [
                "Dynamic linking stops working entirely",
                "No shell or package manager in the container, so live debugging gets harder",
                "TLS breaks because certificates cannot be present",
                "The image gets larger but starts faster",
              ],
              answer: 1,
              explanation:
                "Distroless deliberately drops the userland: a smaller attack surface, but no `docker exec bash` when things go wrong. The `cc` variant keeps glibc and even ships a CA store, so linking and TLS verification still work.",
            },
          ],
        },
      ],
    },
    {
      slug: "configure-and-deploy",
      title: "Configure and deploy",
      description:
        "Layered configuration, then a managed platform: secrets, TLS, and continuous deployment.",
      lessons: [
        {
          slug: "live-hierarchical-config",
          title: "Hierarchical configuration",
          summary:
            "Base plus environment layers and APP__ overrides: one binary, every environment.",
          contentFile: "live-hierarchical-config.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "With `-p 8000:8000` in place, why did the health check still get connection refused?",
              options: [
                "The app bound 127.0.0.1, the container's own loopback, so nothing listened where published traffic arrived",
                "Docker only maps ports for TCP when a firewall rule allows it",
                "The health check route requires a database connection",
                "Port 8000 was already taken on the host",
              ],
              answer: 0,
              explanation:
                "Published traffic arrives on the container's external interface, and a loopback-bound listener never sees it. Binding 0.0.0.0 inside the container fixes it, while local development keeps the narrower 127.0.0.1.",
            },
            {
              kind: "predict",
              prompt:
                "Which field does the environment variable `APP_DATABASE__DATABASE_NAME=newsletter` set?",
              options: [
                "`settings.database.database_name`",
                "`settings.database.database.name`",
                "`settings.database_name`",
                "None: double underscores are invalid in variable names",
              ],
              answer: 0,
              explanation:
                "The `APP` prefix is stripped, the double underscore splits nesting levels, and single underscores stay inside a field name. That ambiguity is exactly why the separator is doubled.",
            },
            {
              kind: "mcq",
              prompt: "Why do the port fields need `serde-aux`'s `deserialize_number_from_string`?",
              options: [
                'Environment variables arrive as strings, and the standard derive will not turn "5001" into a `u16`',
                "YAML cannot represent numbers",
                "The config crate lowercases every value it reads",
                "Ports are secrets and need special handling",
              ],
              answer: 0,
              explanation:
                "File sources hand the deserializer real numbers, but the environment source hands it strings. The helper accepts both, so one `Settings` struct serves every layer.",
            },
          ],
        },
        {
          slug: "live-managed-deploy",
          title: "Deploying to a managed platform",
          summary:
            "A declarative spec, injected secrets, TLS to Postgres, and health-gated rollouts.",
          contentFile: "live-managed-deploy.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why are the database credential variables marked `scope: RUN_TIME` in the spec?",
              options: [
                "They are needed when the container runs, not during the image build, where sqlx's offline mode means no database is touched",
                "RUN_TIME encrypts the values at rest",
                "Build-time variables would be visible in the git repository",
                "It restricts the variables to `docker build` only",
              ],
              answer: 0,
              explanation:
                "The build compiles against `.sqlx/` metadata and needs no credentials; the running app is what dials Postgres. Keeping secrets out of build scope also keeps them out of image layers.",
            },
            {
              kind: "predict",
              prompt:
                "You move the database password out of the spec's `envs` and into the Dockerfile as `ENV APP_DATABASE__PASSWORD=...`. The app still works. What did it cost?",
              options: [
                "Nothing: ENV and platform-injected variables are equivalent",
                "The secret is baked into the image: anyone who can pull it can read it, and rotating it means a rebuild",
                "The variable no longer reaches the config crate",
                "The container starts measurably slower",
              ],
              answer: 1,
              explanation:
                "`ENV` values live in image metadata, visible to `docker history` and every registry consumer, and changing one means rebuilding and redeploying. Runtime injection keeps secrets out of the artifact and makes rotation a restart.",
            },
            {
              kind: "mcq",
              prompt:
                "The app and managed database both deploy successfully, but `POST /subscriptions` returns 500. What is the most likely missing step?",
              options: [
                "Migrations were never run against the managed database, so the subscriptions table does not exist",
                "The health check path is misconfigured",
                "The sqlx offline metadata is stale",
                "TLS must be disabled for writes",
              ],
              answer: 0,
              explanation:
                "The platform runs your container, not your migrations; `sqlx migrate run` against the managed instance is a deliberate, separate step. Offline metadata affects compilation, and the app compiled and deployed fine.",
            },
          ],
        },
      ],
    },
  ],
}
