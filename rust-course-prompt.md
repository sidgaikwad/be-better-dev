# Build me a Rust course: from first principles to production

Teach me Rust from the inside out, with the goal of making me genuinely good at reasoning about systems — memory, networks, runtimes, and production infrastructure — with Rust as the vehicle. Not merely able to write Rust that compiles.

## My context

I am a working web developer.

Comfortable with:

- TypeScript/JavaScript, Node and Bun
- React and Next.js
- REST APIs, Postgres, Git
- Docker at a "docker compose up" level

Much less comfortable with:

- systems programming
- reasoning about memory
- operating system internals
- networking below the HTTP layer
- concurrency beyond promises and async/await in JavaScript

Right now, when I read Rust, I can follow the syntax but I cannot reliably answer questions like:

- why does this function need a lifetime annotation
- what does this line actually allocate
- what does `.await` actually do
- why is this wrapped in `Arc<Mutex<T>>`
- why is the borrow checker rejecting something that looks obviously fine

My desired end state is that I can look at a piece of Rust and say:

> "This design is wrong because this guard is held across an await point, which blocks other tasks on this executor thread, and under load that produces X."

rather than only:

> "The compiler is angry and I don't know why."

---

# The mission

Teach me to reason about Rust simultaneously at four levels:

1. **Language** — what the code says: ownership, types, traits, idioms.
2. **Machine** — what actually happens: memory layout, allocations, moves versus copies, what the compiler emits.
3. **System** — what the OS and network do: syscalls, sockets, TLS, processes, containers.
4. **Production** — how real teams ship it: testing, telemetry, deployment, fault tolerance, operations.

Ultimately, I want to be able to pick up any unfamiliar Rust codebase or systems problem and reason my way through it from first principles.

That is more important than finishing any particular list of topics.

---

# What you are building

Two deliverables that develop together:

1. **The course** — a long-form curriculum. Six months or more of daily study. Depth is the point; do not compress it.
2. **The platform** — an interactive web application I use every day to study the course.

Build the platform on **ZeroStarter** (`https://zerostarter.dev`), the free open-source template for building apps: Next.js and shadcn/ui on the frontend, a Hono API running on Bun, a Turborepo monorepo, Postgres with Drizzle, and Better Auth. Use what the template already provides — auth, database, migrations, monorepo structure — instead of re-inventing it.

---

# The platform

The interface should work the way Duolingo works: short daily lessons, visible progress, and mechanics that make me want to come back tomorrow.

Required mechanics:

- **Lessons** — short units of 10–20 minutes: explanation, a prediction prompt, a hands-on exercise, and a retrieval quiz.
- **XP and levels** — earned per lesson, exercise, and review session.
- **Streaks** — a daily study streak with a visible counter and history.
- **Activity heatmap** — a GitHub-contribution-style graph showing which days I showed up and how much I did.
- **Leaderboard** — weekly XP ranking, built so friends can join later.
- **Time tracking** — time spent per lesson, per section, and in total.
- **Badges** — one per completed section. Finishing the entire "Rust with Docker" section earns a Docker × Rust badge. Add milestone badges as well: first deployment, first `unsafe` block audited, 30-day streak, book finished.
- **Progress map** — a skill tree of parts and sections with prerequisites, showing what is unlocked, in progress, and done.
- **Spaced review** — quiz items resurface days and weeks after the lesson. Reviews grant XP so the streak and the memory system reinforce each other.
- **Login history** — which days I logged in and completed at least one lesson.

Content model: course → part → section → unit → lesson → exercise. Store per-user progress, attempts, and review scheduling in Postgres via Drizzle.

Exercises that involve real Rust code live in a companion Cargo workspace repository, one directory per section, each with a test suite that defines "done." Quizzes and prediction prompts are graded in the app. Code exercises are verified by their tests, and the app records completion.

---

# The spine: Zero to Production in Rust

I own _Zero to Production in Rust_ by Luca Palmieri. The PDF is at:

`/Users/mac/Downloads/Zero to Production in Rust.pdf`

Read it. Use it as the backbone of the production track. Its project — an email newsletter API taken from an empty repository to a deployed, fault-tolerant service — becomes the central project of the whole course.

The course must cover the book completely:

1. **Getting Started** — toolchain, rustup, cargo, IDEs, the inner development loop, CI from day one.
2. **Building An Email Newsletter** — requirements, user stories, working in iterations.
3. **Sign Up A New Subscriber** — the anatomy of an actix-web application (`HttpServer`, `App`, `Route`, the tokio runtime), integration testing against a real server, HTML forms and serde, choosing a database crate, sqlx, Postgres, migrations, test isolation.
4. **Telemetry** — unknown unknowns, logging versus tracing, spans, instrumenting futures, `tracing-subscriber`, protecting secrets with `secrecy`, request ids.
5. **Going Live** — writing a Dockerfile for a Rust app, sqlx offline mode, image size and build caching, hierarchical configuration, deploying to a cloud platform.
6. **Reject Invalid Subscribers #1** — type-driven development, ownership meets invariants, panics versus `Result`, the `?` operator, property-based testing, `TryFrom`.
7. **Reject Invalid Subscribers #2** — confirmation emails, writing a REST client with reqwest, HTTP mocking with wiremock, the architecture of a maintainable test suite, zero-downtime deployments, multi-step database migrations, transactions.
8. **Error Handling** — what errors are for, the `Error` trait, layering, `thiserror` versus `anyhow`, who should log.
9. **Naive Newsletter Delivery** — and why it is naive.
10. **Securing Our API** — password storage done right (argon2, salting, PHC format), basic auth, not blocking the async executor, XSS, HMAC-protected messages, what a cookie actually is, cookie security, flash messages, session-based auth with Redis, an admin dashboard, writing actix-web middleware.
11. **Fault-tolerant Workflows** — failure modes, idempotency, concurrent requests, transaction isolation levels, backward and forward recovery, a delivery queue with background workers.

Two additions on top of the book:

- The book was written against the ecosystem of a few years ago. Where crates or idioms have moved on, teach the book's version faithfully, then show the current state and explain what changed and why. Verify against current documentation rather than assuming.
- After the book's build is complete, port the service to axum as a consolidation exercise. Migrating a codebase between frameworks is the fastest way to see which knowledge was about actix-web and which was about Rust.

---

# Do not teach Rust as a syntax tour

This is extremely important.

Teach it as a connected system. For every important concept, walk the chain:

`code I write`
→ `what the compiler does with it`
→ `what exists in memory at runtime`
→ `what the OS does`
→ `what production consequence follows`

For example, I eventually want to deeply understand chains like:

`let s = String::from("hello")`
→ `heap allocation via the global allocator`
→ `malloc`
→ `mmap / brk`
→ `page fault on first write`
→ `drop at end of scope`
→ `free`

and:

`async fn handler()`
→ `compiler-generated state machine`
→ `poll`
→ `Pending, waker registered`
→ `epoll / kqueue readiness`
→ `wake, re-poll, Ready`
→ `response bytes on a socket`

The exact chains must come from real behavior — compiler output, tracing, syscall traces — not from assumptions.

---

# First principles track

I want the course to keep answering "but what is actually happening?" all the way down. Weave these in when they become relevant, not as a wall of theory up front:

- **How a program runs** — executables, linking, loaders, virtual memory, stack frames, what a segfault actually is.
- **How memory allocation works** — stack versus heap, what an allocator does, mmap and brk, jemalloc and mimalloc, fragmentation, why `Vec` growth is amortized, why allocation shows up in profiles.
- **What rustc does** — parsing, HIR, MIR, borrow checking, monomorphization, LLVM, optimization levels, what release mode changes.
- **How the network works** — DNS resolution, TCP handshakes and teardown, TLS handshakes and certificates, HTTP/1.1 versus HTTP/2 versus HTTP/3.
- **How a browser stores cookies** — the `Set-Cookie` header, the cookie jar on disk, `HttpOnly`, `Secure`, `SameSite`, expiry, and how all of it connects to the book's chapter 10 sessions. When we do the login flow, I want to watch the cookie arrive in devtools and find it in the browser's storage.
- **How async I/O works at the OS level** — file descriptors, blocking versus non-blocking sockets, epoll, kqueue, io_uring, readiness versus completion models.
- **What a container is** — namespaces, cgroups, layered filesystems, why a container is not a VM. This comes before the Docker section, so the section explains a mechanism rather than a tool.

---

# Ground the teaching in reality

Do not trust generic knowledge when a primary source can answer the question.

Primary sources, roughly in order of authority:

- the book itself
- _The Rust Programming Language_ and _Rust By Example_
- the standard library documentation and the Rust Reference
- the Rustonomicon for unsafe topics, the Async Book for async topics
- docs.rs for every crate we use: tokio, actix-web, axum, sqlx, reqwest, tracing, and the rest
- the source code of those crates when documentation runs out
- Rust RFCs and release notes when a rule only makes sense with its history
- authoritative OS and networking material when Rust sources alone cannot explain the underlying principle

Maintain the distinction between:

- what the language guarantees
- what a library chose to do
- what the operating system does
- what a particular version happens to do today

Those can disagree, and the disagreement is often where the interesting learning is.

Before writing each ecosystem section, research the current state of that ecosystem properly — which crates are maintained, which are abandoned, what production users actually run. Crate landscapes shift; the course should reflect what is true when it is written, with sources cited.

---

# Use real tools as teaching instruments

The core loop of the course is: **predict → run → compare → explain**.

Before showing me what something does, make me predict it. Then verify with real tools:

- compiler error messages, read closely rather than skimmed
- `cargo expand` — what macros and async fns desugar into
- Godbolt / `cargo asm` — what the optimizer actually emitted
- Miri — undefined behavior detection, and proof of why unsafe rules matter
- clippy — and _why_ each lint exists
- criterion — benchmarks with statistical honesty
- flamegraphs and `perf` / Instruments — where time actually goes
- heaptrack or allocation counters — where allocations actually happen
- `strace` / `dtruss` — which syscalls a server actually makes
- Wireshark or tcpdump — the TCP and TLS handshakes of a real request
- browser devtools — cookies, headers, and caching in the login lessons
- `docker stats`, `kubectl describe` — what the runtime sees in the infrastructure sections

Typical prediction prompts:

> Does this compile? If not, which rule rejects it, and what memory-safety failure would occur if it were allowed?

> How many heap allocations does this function perform? Now check. Why the difference?

> This handler runs argon2 verification directly on the executor thread. What happens to the other requests on that thread? How would you spot it in a flamegraph?

---

# The course map

Organize the course into parts. Every numbered item below is a full **section** — multiple units, each with several lessons — never a single page. Depth requirements are defined in the next heading.

## Part 1 — The language

1. Toolchain and cargo: rustup, editions, crates, workspaces, features, how a build actually works.
2. Ownership and moves — taught with memory diagrams, not analogies alone.
3. Borrowing and lifetimes — what the borrow checker proves, and what it cannot express.
4. Structs, enums, pattern matching, `Option` and `Result`.
5. Traits, generics, monomorphization versus trait objects, static versus dynamic dispatch — and the cost of each.
6. Collections and their memory layouts: `Vec`, `String` and `&str`, `HashMap`, slices.
7. Smart pointers and interior mutability: `Box`, `Rc`, `Arc`, `Cell`, `RefCell`, when each exists and why.
8. Iterators and closures — the zero-cost abstraction claim, tested rather than asserted.
9. Error handling in depth: designing error types, propagation, boundaries.
10. Modules, visibility, and API design: what a good Rust public interface looks like.
11. Testing: unit, integration, doc tests, property-based testing.
12. Macros: declarative and procedural, reading them before writing them.
13. Unsafe Rust and FFI: what `unsafe` actually turns off, undefined behavior, Miri, calling C.

## Part 2 — Concurrency and async

1. Threads, `Send` and `Sync`, atomics, channels, locks — and what data races actually corrupt.
2. Async from scratch: `Future`, `poll`, wakers. Build a minimal executor by hand before ever touching tokio.
3. tokio: runtime anatomy, tasks, work stealing, `spawn_blocking`, the blocking pitfalls.
4. Pinning: why it exists, what problem self-referential state machines create.
5. Streams, `select`, timeouts, cancellation, and cancellation safety.
6. Patterns: worker pools, actors, backpressure, graceful shutdown.

## Part 3 — Zero to production

The book, chapter by chapter, as mapped above — ending with the axum port.

## Part 4 — Rust in the wild

Each of the following is a large, self-contained section with its own badge:

1. **Rust with Docker and containers** — what a container is (namespaces, cgroups, layers), multi-stage builds, static linking with musl, distroless and scratch images, build caching strategies for Rust's compile times, image scanning, docker compose for the full newsletter stack.
2. **Rust with Kubernetes** — pods, deployments, services, ingress from first principles; deploying the newsletter service; liveness and readiness probes wired to real health checks; config and secrets; rolling updates and what zero-downtime actually requires; kube-rs and writing a small controller.
3. **Rust with message queues** — why queues exist; delivery guarantees (at-most-once, at-least-once, exactly-once and why it is a lie); RabbitMQ with lapin: exchanges, queues, acks, prefetch, dead-letter queues; Kafka with rdkafka: partitions, consumer groups, offsets; NATS; Redis Streams; then replace the book's Postgres-backed delivery queue with RabbitMQ and compare the two designs honestly.
4. **Rust with event-driven architecture** — events versus commands, choreography versus orchestration, the outbox pattern, idempotent consumers, webhook signing and verification; then the native Rust stack for the jobs Inngest and Trigger.dev do in TypeScript: apalis for background jobs, scheduled work, and cron; Restate for durable execution with its native Rust SDK — durable steps, automatic retries, sleeps and timers, fan-out, replayable state; Temporal, whose core engine is written in Rust, for contrast on the same ideas at larger scale. Verify the current state of each before writing — this corner of the ecosystem moves fast. The section capstone: extend chapter 11's delivery queue into a small Inngest-style durable workflow engine on Postgres — event triggers, steps with retries, delayed sleeps, and replay after a crash — so the "magic" of these platforms becomes mechanism I have built once myself.
5. **Rust with WebSockets** — the upgrade handshake, frames, ping/pong; tokio-tungstenite and axum's WebSocket support; a live admin dashboard for the newsletter (delivery progress in real time); backpressure and slow consumers; fanning out across instances with Redis pub/sub; reconnection design.
6. **Rust with WebRTC** — why WebRTC is hard: NAT, ICE, STUN, TURN, SDP; the webrtc-rs crate; a data-channel application, then media; where an SFU fits; when to use WebRTC versus WebSockets.
7. **Rust with gRPC** — protobuf, tonic, unary and streaming RPCs, deadlines, load balancing; a gRPC interface between the newsletter API and its delivery worker.
8. **Rust with databases in depth** — how sqlx actually works (compile-time checking, the wire protocol); diesel and sea-orm compared; connection pooling internals; transactions and isolation levels revisited beyond the book; then build a small key-value store with a log-structured design to see the other side of the client/server line.
9. **Rust with AI** — calling LLM APIs from Rust with streaming; building an inference or embedding service; candle and ort for local models; tokenizers; vector search with qdrant (itself written in Rust); an applied project: content-assist and duplicate-detection endpoints for the newsletter.
10. **Rust with WebAssembly** — compilation targets, wasm-bindgen, running Rust in the browser; WASI and running wasm on the server and edge; performance realities versus hype; an applied project: the newsletter's email-template renderer compiled to wasm and previewed in the browser.
11. **Rust with Web3** — how a blockchain actually works at the data-structure level; alloy for reading chain state, calling contracts, and subscribing to events; transaction signing and key handling done carefully; an overview of writing Solana programs in Rust with Anchor; a sober treatment — engineering, not evangelism.
12. **Rust with TypeScript and Node** — this connects to my day job: napi-rs for native Node modules, wasm-pack for the browser, sharing types across the boundary; an applied project: a CPU-heavy task in an existing Node/Bun service rewritten as a Rust native module, benchmarked before and after.
13. **Rust CLI and TUI tools** — clap, ratatui, good CLI ergonomics; build a real tool for the course itself, such as a progress tracker or exercise runner that talks to the platform's API.
14. **Observability in depth** — the tracing ecosystem beyond the book, OpenTelemetry, Prometheus metrics, Grafana dashboards, alerting; instrument the entire newsletter stack and then diagnose a staged incident using only the telemetry.
15. **Performance engineering** — criterion, flamegraphs, allocation profiling, arena allocation, `#[inline]` realities, LTO and codegen units, SIMD basics; profile and optimize the delivery worker with measurements at every step.

If research surfaces other areas worth a section — embedded, game development with bevy, desktop apps with Tauri — add them as optional appendix sections rather than skipping them silently.

---

# Section depth requirements

I am not building a small course. A section titled "Rust with Docker" must not be one page with one example.

Every Part 4 section must contain at least:

- the underlying technology from first principles — what a container, queue, or socket actually _is_, independent of Rust
- the Rust ecosystem for it: the main crates, their maturity, and how to choose
- a hands-on project, preferably extending the newsletter service
- failure modes and production behavior: what breaks, how it looks, how to recover
- how it connects to the rest of the stack
- exercises, a quiz bank feeding the spaced-review system, and a section assessment

That is a floor of four to five substantial units per section; most sections should be larger. When in doubt, go deeper rather than broader.

---

# One coherent project

Use the book's email newsletter service as the single evolving project across the entire course instead of unrelated toy examples.

By the end, the same service has been:

- built endpoint by endpoint through the book
- containerized in the Docker section
- deployed and probed in the Kubernetes section
- re-queued onto RabbitMQ in the queues section
- given a live dashboard in the WebSockets section
- given gRPC internals in the gRPC section
- extended with AI endpoints in the AI section
- partially compiled to wasm in the WebAssembly section
- embedded into a Node script via napi-rs in the interop section
- fully instrumented in the observability section
- profiled and optimized in the performance section

Sections where the newsletter is a poor fit — WebRTC, Web3, CLI — get small dedicated projects, but should reuse the same patterns and note the contrast explicitly.

This should leave me with one connected mental model, and one substantial portfolio project, rather than thirty fragments.

---

# End-to-end journeys

Once I have enough prerequisites, teach through complete journeys that cross every layer:

### Life of an HTTP request

Browser address bar through DNS, TCP, TLS, actix-web's accept loop, my handler, sqlx, the Postgres wire protocol, the response, and back to the browser rendering it.

### Life of a login

Form POST through argon2 verification, session creation, Redis, `Set-Cookie`, the cookie written to the browser's on-disk cookie jar, and the next request arriving authenticated.

### Life of an allocation

`String::from` through the allocator, mmap, page faults, and the corresponding `Drop` and free.

### Life of a future

An `async fn` through the generated state machine, poll, epoll registration, wake, and completion.

### Life of a newsletter issue

POST through the idempotency check, the delivery queue, worker pickup, the email API call, retries, and terminal states.

### Life of a deployment

`cargo build --release` through LLVM, the binary, Docker layers, the registry, the Kubernetes pull, probes passing, and traffic shifting.

### Life of a message

Publish through exchange routing, queue storage, prefetch, consumer ack — and the redelivery path when the consumer dies mid-message.

For each journey I should be able to reconstruct every hop from memory and name the tool that would let me observe it.

---

# Concepts I want to answer confidently

Do not explain these immediately. Use them to calibrate the depth the course must eventually reach:

- What exactly happens, in memory, when a value is moved?
- Why can two `&mut` references never coexist, and what bug does that rule prevent?
- What is a lifetime, mechanically — what does the compiler actually check?
- What does `Box<dyn Trait>` look like in memory versus `impl Trait`?
- Why are `String` and `&str` different types, and what does each cost?
- What do `Send` and `Sync` actually assert, and who checks them?
- What does `.await` compile into?
- Why does holding a `MutexGuard` across an `.await` deadlock or stall an executor?
- What is `Pin` protecting against?
- When does an async runtime actually go to sleep, and what wakes it?
- What does sqlx's compile-time query checking actually do at build time?
- Why is a database connection pool sized, and what happens when it is exhausted?
- What is in a `Set-Cookie` header, where does the browser keep it, and what can JavaScript see?
- Why must password hashing move off the async executor thread?
- What makes an endpoint idempotent, and where can an idempotency key live?
- What does at-least-once delivery force every consumer to guarantee?
- Why are Rust Docker builds slow, and which layers should cache what?
- What does a Kubernetes readiness probe actually gate?
- When is a wasm module faster than JavaScript, and when is it slower?
- What is undefined behavior, concretely, and what may the optimizer do with it?
- When is Rust the wrong choice?

Keep extending this list as the course reveals more.

---

# Train me to investigate, not just remember

I do not want passive documentation disguised as a course.

Make me practice reasoning. Give me exercises like:

> This function returns a reference to a local variable. Before running it: which rule rejects it, what would go wrong at runtime if it were allowed, and where would the dangling pointer point?

> Ten workers consume from one queue with prefetch 50. One crashes after processing 30 messages but acking 10. Exactly which messages are redelivered, and what must the handler guarantee for that to be safe?

> An operator reports the newsletter service is "slow" every day at 09:00. Given the tracing setup from chapter 4, what queries would you run against the telemetry, and what would each hypothesis look like in the data?

Before showing me the answer, require my prediction. Then compare:

**my prediction**
vs
**actual behavior**
vs
**the mechanism that explains the difference**

Every wrong prediction is a lesson working as intended. Feed the misses back into the spaced-review queue.

---

# Train judgment

As my understanding grows, regularly make me evaluate rather than recall:

### Tool choice

Is Rust the right tool here, or is this a job for TypeScript, Go, or Python? Argue both sides with real constraints: team, latency, ecosystem, hiring.

### API design

Should this function take `&str`, `String`, or `impl AsRef<str>`? Return an owned value or a reference? What does each choice cost the caller?

### Cloning

When is `.clone()` correct engineering and when is it a smell? I want calibrated instincts, not clone-phobia.

### Concurrency design

Threads, tasks, channels, or a queue between services? What does each buy and what does each cost?

### Delivery semantics

Which guarantee does this workflow actually need, and what is the cheapest design that provides it?

### Dependency assessment

Given three candidate crates: how do you evaluate maintenance, soundness, unsafe usage, and dependency weight before betting a production service on one?

### Error strategy

Where should errors be handled, where enriched, where logged — and who is each error message for?

---

# Distinguish kinds of difficulty

When something surprises me, do not let me file everything under "Rust is hard." Train me to classify:

- a language guarantee doing its job
- a borrow-checker limitation rather than a rule (fixable with restructuring)
- a library's design decision
- operating system behavior leaking through
- an ecosystem convention with history behind it
- a version-specific behavior
- my own misunderstanding
- genuinely bad API design
- undefined behavior territory

Require evidence — from documentation, source, or a reproducible experiment — before settling on a classification.

---

# Teaching order

Do not dump everything on me at once. Teach according to prerequisites and demonstrated understanding.

My instinct for the overall arc:

1. Toolchain and just enough language to be dangerous
2. Ownership, borrowing, lifetimes — with memory fundamentals woven in
3. Types, traits, collections, error handling
4. Start the book early: chapters 1–3 need only modest language depth, and a real project keeps momentum
5. Threads, then async from scratch, then tokio — arriving just before the book demands them
6. The rest of the book, interleaved with the deeper language topics it motivates (chapter 6 motivates type design, chapter 8 motivates error architecture, chapter 10 motivates cookies, sessions, and hashing)
7. Docker and Kubernetes, once there is something real to deploy
8. Queues and event-driven architecture, building on chapter 11
9. The remaining Part 4 sections in prerequisite order, most of them parallel-friendly
10. Performance and unsafe near the end, when there is real code worth profiling and real judgment to apply

Change this order when the actual dependency structure or my progress suggests something better. The platform's progress map should encode whatever order you settle on.

Pacing assumption: one to two hours a day, six days a week, for six months or more. Short lessons, one meaningful idea each. It is fine — expected — that the course outlasts the initial build; ship the platform with Part 1 complete and keep writing.

---

# Writing style

This matters as much as the content.

- Write like good documentation — the standard library docs and the book itself are the bar. Plain, precise, human.
- No AI-flavored filler. Never "delve", "seamless", "supercharge", "unlock the power of", "master the art of", "in today's fast-paced world", "comprehensive guide". No exclamation points doing enthusiasm's job.
- No over-promising. If a topic is genuinely hard, say so and take more lessons.
- Concrete before abstract: show a real scenario, then name the concept.
- Every code example compiles and runs, with the exact commands to do so.
- Diagrams wherever memory layout, ownership flow, or system topology matters.
- Use real Rust terminology consistently once introduced, and define it precisely the first time.
- Assume I can program. Do not explain what a function or a loop is. Explain patiently the things web developers genuinely lack: memory, OS behavior, networking internals, concurrency semantics.
- Correct my misconceptions directly. Do not confuse "we covered it" with "I understand it" — the review system exists to expose the difference.

---

# Course outcome

The course is not complete when I have seen every topic.

It is successful when I can independently:

1. Read unfamiliar Rust and reconstruct what it does at the language, machine, and system levels.
2. Predict compiler behavior — and, when wrong, locate the exact rule I misunderstood.
3. Explain what any line allocates, copies, moves, or locks.
4. Design a service the way the book does: type-driven, tested, observable, deployable.
5. Trace a request from a browser keystroke to a database row and back, naming every hop.
6. Explain how a cookie, a session, and a password hash cooperate — and where each lives on disk.
7. Choose between threads, tasks, channels, and queues with reasons a colleague would accept.
8. Take a Rust service to production on Docker and Kubernetes and know what every YAML line gates.
9. Integrate Rust into the ecosystems I already work in — TypeScript and Node — and build event-driven, durable-workflow systems natively in Rust with the ergonomics I would expect from Inngest or Trigger.dev.
10. Diagnose a production incident from telemetry, form hypotheses, and test them with the right tool.
11. Evaluate a crate, an architecture, or a blog post's claim with evidence rather than vibes.
12. Look at a working system and articulate precisely _why_ it works.

The capstone: design, build, deploy, and operate one production-grade Rust service end to end — queue-backed, instrumented, containerized — and write up two staged incidents as post-mortems that demonstrate the reasoning this course exists to build.

Begin by reading the book's table of contents and the ZeroStarter documentation, then scaffold the platform, then write Part 1 — starting with the smallest foundational concept that unlocks the rest of the system.
