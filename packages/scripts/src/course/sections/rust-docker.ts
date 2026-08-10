import type { SectionSeed } from "../types"

export const rustDocker: SectionSeed = {
  slug: "rust-docker",
  title: "Rust with Docker and containers",
  description:
    "Namespaces, cgroups, layers; multi-stage builds, musl static linking, cache-friendly Dockerfiles.",
  badgeIcon: "🐳",
  badgeTitle: "Docker × Rust",
  units: [
    {
      slug: "what-a-container-is",
      title: "What a container is",
      description:
        "A process with a restricted view and a metered budget, running off a stack of tarballs.",
      lessons: [
        {
          slug: "docker-container-is-a-process",
          title: "A container is a process",
          summary:
            "Namespaces shrink the view, cgroups meter the share, and the kernel is the host's.",
          contentFile: "docker-container-is-a-process.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "You run chapter 5's image and then run `ps aux` on the Linux host. What do you see, and what does it tell you?",
              options: [
                "Nothing: the process lives inside a guest kernel the host cannot enumerate",
                "A hypervisor process managing the container's virtual machine",
                "`./zero2prod` with an ordinary host PID: it is a normal process the kernel has given a restricted view and a metered budget",
                "A `runc` supervisor process; the application itself is invisible from outside",
              ],
              answer: 2,
              explanation:
                "There is no guest kernel and no boot: `docker run` is `clone` and `exec` with extra namespace flags, which is why containers start in milliseconds and why one kernel bug is shared by every container on the box.",
            },
            {
              kind: "predict",
              prompt:
                "You run the newsletter with `--cpus=2` on a 64-core host. How many worker threads does tokio's default multi-thread runtime start?",
              options: [
                "64: the runtime reads the host's core count from /proc/cpuinfo",
                "2: since Rust 1.64 `available_parallelism` reads the cgroup CPU quota, and tokio sizes its pool from it",
                "1: any CPU limit forces the current-thread runtime",
                "It is unpredictable; the number is chosen at random per boot",
              ],
              answer: 1,
              explanation:
                "The quota is a cgroup file, `cpu.max`, and the standard library consults it, so the pool matches the budget. Runtimes that only counted host cores are the classic failure here: 64 threads contending over two CPUs' worth of time.",
            },
            {
              kind: "mcq",
              prompt:
                "A process in a container with `--memory=256m` keeps touching new pages past the limit. What does the program observe?",
              options: [
                "Allocation returns an error the program can handle and log",
                "The host starts swapping and every container slows down together",
                "Nothing from userspace: SIGKILL from the OOM killer, exit code 137, `OOMKilled: true` in docker inspect",
                "The kernel silently reuses the container's oldest pages",
              ],
              answer: 2,
              explanation:
                "Linux overcommits, so `mmap` succeeds cheerfully and the bill lands on first write, when the kernel charges the page to the cgroup. There is no graceful failure path to catch: the limit is enforced by killing, not by refusing.",
            },
          ],
        },
        {
          slug: "docker-images-and-layers",
          title: "Images, layers, and copy-on-write",
          summary:
            "Content-addressed tarballs stacked by overlayfs, and why deleting a file never shrinks an image.",
          contentFile: "docker-images-and-layers.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "A Dockerfile has `RUN curl -LO dataset.tar.gz` (300MB) on one line and `RUN rm dataset.tar.gz` on the next. How big is the image?",
              options: [
                "300MB smaller than before: the delete reclaims the space",
                "Still carrying all 300MB: the second layer adds a whiteout marker that hides the file without removing its bytes",
                "The build fails because a later layer cannot reference a file from an earlier one",
                "It depends on the storage driver; overlay2 reclaims it, others do not",
              ],
              answer: 1,
              explanation:
                "Layers are append-only history, not a mutable filesystem, so a delete can only mask what a lower layer supplies. The fixes are a single `RUN` that cleans up before the layer is committed, or a multi-stage build that carries across only the artifact.",
            },
            {
              kind: "predict",
              prompt:
                "Your image ships a 1GB data file. At runtime the container appends one byte to it. What does that cost?",
              options: [
                "One byte written to the writable layer",
                "Nothing measurable: overlayfs writes are made in place in the image layer",
                "A full 1GB copy-up of the file into the writable layer, then the append",
                "The write fails: image layers are read-only",
              ],
              answer: 2,
              explanation:
                "overlay2 is copy-on-write at file granularity, so the first write to any file from a lower layer copies the whole file up. This is the main reason databases get a named volume: a volume sits outside the overlay and skips copy-up entirely.",
            },
            {
              kind: "mcq",
              prompt:
                "You pull `rust:1.85` on a machine that already has a Debian image. Several layers print `Already exists`. Why?",
              options: [
                "Docker compares image tags and skips shared bases by name",
                "The registry deduplicates per repository, so images in the same repo share layers",
                "Layers are content-addressed by the sha256 of their bytes, so identical layers are already present and stored once",
                "The daemon guesses from layer sizes that the content matches",
              ],
              answer: 2,
              explanation:
                "Identity is the digest of the content, which is what makes a registry layer storage with tags on top. The same property is what turns layers into cache entries: identical inputs produce identical digests produce reuse.",
            },
          ],
        },
      ],
    },
    {
      slug: "building-the-image",
      title: "Building the image",
      description:
        "Cache mechanics against Rust compile times, then static linking down to a near-empty base.",
      lessons: [
        {
          slug: "docker-multi-stage-caching",
          title: "Layer caching and the Rust compile problem",
          summary:
            "What the cache keys on, why cargo resists the usual trick, and what cargo-chef actually does.",
          xp: 25,
          contentFile: "docker-multi-stage-caching.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What invalidates a `COPY` layer in BuildKit?",
              options: [
                "Any change to the file modification times of the copied files",
                "A change in the content hash of the copied files, including permissions; timestamps alone do not matter",
                "Only a change to the COPY instruction's text",
                "Any change anywhere in the build context, copied or not",
              ],
              answer: 1,
              explanation:
                "For COPY the instruction text plus a content hash form the key, which is why a stray `target/` directory missing from `.dockerignore` busts the build after every local `cargo` run. And the first miss invalidates everything below it, since each later layer's parent chain has changed.",
            },
            {
              kind: "predict",
              prompt:
                "A Dockerfile fakes a `fn main() {}`, builds to warm dependencies, then copies the real source and builds again. What is the nastiest way this fails?",
              options: [
                "The dummy build fails to compile because the manifest lists no modules",
                "cargo refuses to build twice in the same directory",
                "COPY preserves file metadata, cargo's fingerprints compare mtimes, so the real main.rs can look no newer than the stub and the image ships `fn main() {}`",
                "The second build always recompiles everything, so the trick simply saves nothing",
              ],
              answer: 2,
              explanation:
                "It fails silently by shipping a binary that starts and exits, which is far worse than failing loudly. `cargo chef cook` scrubs the stub's fingerprints for exactly this reason, on top of handling workspaces and feature unification that hand-rolled manifest faking gets wrong.",
            },
            {
              kind: "mcq",
              prompt:
                "Why do BuildKit cache mounts (`RUN --mount=type=cache` over the registry and `target/`) do nothing for a fresh CI runner?",
              options: [
                "Cache mounts are disabled outside interactive builds",
                "The mount lives outside the image layers and cannot be pushed to a registry, so an ephemeral builder starts empty",
                "cargo ignores mounted directories during release builds",
                "They work fine; the runner just needs a larger disk",
              ],
              answer: 1,
              explanation:
                "Mounts give genuinely incremental compiles on a persistent builder and evaporate on a throwaway VM. cargo-chef shapes the expensive work into ordinary layers instead, which is what makes `--cache-to`/`--cache-from type=registry` able to carry it between runs.",
            },
          ],
        },
        {
          slug: "docker-static-musl",
          title: "Static linking with musl",
          summary:
            "glibc versus musl, scratch versus distroless, and the bills you pay for a 20MB image.",
          contentFile: "docker-static-musl.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "You copy a default `x86_64-unknown-linux-gnu` binary into `FROM scratch` and get `exec /zero2prod: no such file or directory`, though the file is clearly there. What is missing?",
              options: [
                "The ENTRYPOINT path is wrong; scratch has no working directory",
                "The dynamic loader named in the ELF header, `/lib64/ld-linux-x86-64.so.2`, which the empty image does not contain",
                "Execute permissions, which COPY strips when the target image has no /etc/passwd",
                "A shell, which scratch lacks, so ENTRYPOINT cannot run",
              ],
              answer: 1,
              explanation:
                "The kernel reports the absent interpreter against your path, which makes the error read like a lie. `ldd` on the binary shows the dependency list; targeting musl removes it, since static linking is that target's default.",
            },
            {
              kind: "predict",
              prompt:
                "Your static musl binary runs on `FROM scratch`. It boots, serves the health check, and then fails the first time it calls Postmark. Why?",
              options: [
                "musl cannot perform TLS handshakes without glibc",
                "scratch has no CA certificate bundle, so certificate verification has nothing to trust",
                "The outbound port is blocked because scratch has no network configuration",
                "rustls requires a shell to load its root store",
              ],
              answer: 1,
              explanation:
                "scratch is genuinely empty: no CA roots, no /etc/passwd, no tzdata, no /tmp. Either COPY the bundle from the builder, or compile roots in with `webpki-roots` and accept that rotating them means a rebuild. Distroless static restores exactly that short list while still shipping no shell and no package manager.",
            },
            {
              kind: "mcq",
              prompt:
                "After switching the newsletter to musl, throughput under load drops noticeably versus the glibc build. What is the usual cause and the usual fix?",
              options: [
                "Static binaries skip CPU feature detection; rebuild with target-cpu=native",
                "musl's syscall wrappers add overhead; there is no fix short of returning to glibc",
                "musl's mallocng optimizes for footprint and hardening rather than multithreaded throughput; set a `#[global_allocator]` such as mimalloc or jemalloc",
                "musl disables tokio's multi-thread runtime, so add worker threads manually",
              ],
              answer: 2,
              explanation:
                "It is an allocator story, and one line of code buys the throughput back while keeping the static binary. The other bills to know about are musl's resolver behavior, which has caused real DNS trouble in clusters, and the loss of every debugging tool from the image.",
            },
          ],
        },
      ],
    },
    {
      slug: "running-the-stack",
      title: "Running the stack",
      description:
        "Four containers wired together, then operating them when there is no shell to log into.",
      lessons: [
        {
          slug: "docker-compose-stack",
          title: "The whole newsletter in one file",
          summary:
            "api, worker, Postgres and Redis in compose; service DNS, healthchecks, and depends_on conditions.",
          contentFile: "docker-compose-stack.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "In the compose file the API's database host is `postgres`, not `localhost`. Why can it not be `localhost`, and what makes `postgres` resolve?",
              options: [
                "localhost is reserved by Docker; compose rewrites service names into /etc/hosts entries at build time",
                "Each container has its own network namespace, so localhost is the API itself; compose runs an embedded DNS server that resolves service names on the project network",
                "localhost works too, but only if the services publish ports to the host",
                "Compose sets a shared network namespace, so either name resolves identically",
              ],
              answer: 1,
              explanation:
                "Service names as hostnames come straight from the namespace model in the first lesson. The mirror-image mistake is binding the server to 127.0.0.1 inside the container, which makes `ports: 8000:8000` publish to a port nothing is listening on; the book's production config sets 0.0.0.0 for that reason.",
            },
            {
              kind: "mcq",
              prompt:
                "Migrations must finish before the API starts, and the migration service exits when it is done. Which `depends_on` condition expresses that?",
              options: [
                "service_started",
                "service_healthy",
                "service_completed_successfully",
                "restart: true",
              ],
              answer: 2,
              explanation:
                "`service_healthy` never becomes true for a job that exits, and `service_started` only means the process exists, which for Postgres is true while initdb is still running. The one-shot condition waits for a zero exit code.",
            },
            {
              kind: "predict",
              prompt:
                "The API is gated on `postgres: condition: service_healthy`. Hours later Postgres is OOM-killed and takes 20 seconds to return. What does compose do to the running API container?",
              options: [
                "Restarts it once Postgres is healthy again",
                "Nothing: depends_on is startup ordering, evaluated once at `up`, not an ongoing supervision relationship",
                "Stops it until the dependency's healthcheck passes",
                "Marks it unhealthy and removes it from the project network",
              ],
              answer: 1,
              explanation:
                "A dependency being healthy at second zero says nothing about second 200, so resilience has to live in the application. `PgPoolOptions::connect_lazy_with` from the book means startup never blocks and connections are re-established on demand, so the outage costs some 500s instead of the process.",
            },
          ],
        },
        {
          slug: "docker-operating-containers",
          title: "Operating a container you cannot log into",
          summary:
            "stdout as the logging contract, PID 1 and signals, namespace-joining debug containers, scanning.",
          contentFile: "docker-operating-containers.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "The delivery worker drains in-flight sends for up to 20 seconds. `docker stop worker` returns after about ten and the last batch is lost. What happened?",
              options: [
                "The exec-form ENTRYPOINT swallowed SIGTERM, so shutdown never began",
                "docker stop's default timeout is 10 seconds, after which SIGKILL, which cannot be caught, cut the drain in half",
                "tokio cancels the drain task when the runtime receives SIGTERM",
                "The container's cgroup was destroyed before the drain could finish",
              ],
              answer: 1,
              explanation:
                "Signals worked; the arithmetic did not. Raise it with `docker stop -t 30` or `stop_grace_period: 30s`, the same calculation as Kubernetes's terminationGracePeriodSeconds. The logs distinguish this from the other ten-second failure: here shutdown starts and is interrupted.",
            },
            {
              kind: "mcq",
              prompt: "Why does a shell-form `ENTRYPOINT ./zero2prod` break graceful shutdown?",
              options: [
                "Shell form runs the binary with a smaller stack, so signal handlers cannot be installed",
                "/bin/sh -c becomes PID 1 and does not forward SIGTERM to its child, so the process never learns it should drain",
                "Shell form disables the exec syscall, so the binary runs as a subshell builtin",
                "It does not; the two forms are equivalent once the image has a shell",
              ],
              answer: 1,
              explanation:
                "docker stop signals PID 1 only. Exec form makes your binary PID 1 so it receives SIGTERM directly. Two related PID 1 facts: the kernel applies no default action for signals to PID 1, so a process with no handler ignores SIGTERM entirely, and PID 1 is responsible for reaping orphans, which is what `docker run --init` provides.",
            },
            {
              kind: "mcq",
              prompt:
                "`trivy image` reports zero vulnerabilities for your distroless Rust image. How much comfort is that worth?",
              options: [
                "Complete comfort: an empty report means no vulnerable code is present",
                "Partly earned and partly blind: scanners read OS package databases, so there really is little OS surface, but none of your crates are visible to them",
                "None: distroless images cannot be scanned at all",
                "It only reflects the base image; the scanner ignores anything added by COPY",
              ],
              answer: 1,
              explanation:
                "There genuinely is no vulnerable curl in the image, and the scanner also cannot see a single dependency from Cargo.lock. Close the gap with `cargo audit` or `cargo deny` in CI, and with `cargo auditable`, which embeds the dependency tree in an ELF section that trivy and syft can read.",
            },
          ],
        },
      ],
    },
  ],
}
