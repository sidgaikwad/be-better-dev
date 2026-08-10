The welcome sequence from the first lesson (welcome now, tips in three days, a survey four days later) is miserable to build with the tools so far. As cron plus state columns it becomes a small state machine: `last_step`, `next_run_at`, resumption logic, a bug every time the sequence changes. What you want to write is the obvious function: send, sleep three days, send, sleep four, send. The problem is that no process lives that long, and chapter 11 trained you to assume it dies at the worst possible line.

Durable execution engines let you write the obvious function anyway. Restate is the one with a native Rust SDK.

```rust
use restate_sdk::prelude::*;

#[restate_sdk::service]
trait WelcomeSequence {
    async fn run(email: String) -> Result<(), HandlerError>;
}

struct WelcomeSequenceImpl;

impl WelcomeSequence for WelcomeSequenceImpl {
    async fn run(&self, mut ctx: Context<'_>, email: String) -> Result<(), HandlerError> {
        ctx.run(|| async { send(&email, Template::Welcome).await }).await?;
        ctx.sleep(Duration::from_secs(3 * 86_400)).await?;
        ctx.run(|| async { send(&email, Template::Tips).await }).await?;
        ctx.sleep(Duration::from_secs(4 * 86_400)).await?;
        ctx.run(|| async { send(&email, Template::Survey).await }).await?;
        Ok(())
    }
}
```

## The journal, and replay

Two ideas carry all of it. First, the journal: the handler does not run bare; each `ctx.run` closure's result is recorded by the Restate server as it completes. Second, replay: if the process crashes, or an error fails the attempt, the server re-invokes the handler from the top, and the SDK feeds recorded results back to each completed `ctx.run` without executing its closure. Execution fast-forwards to the first step with no journal entry and resumes for real from there. `ctx.sleep` is not `tokio::time::sleep`: it registers a durable timer in the server and suspends the invocation entirely. A three-day sleep is a timer record, not a parked task, and it survives your service redeploying a dozen times in between. Retries are automatic, with backoff, until success or a deliberately terminal error.

Replay imposes one law: code outside `ctx.run` re-executes on every replay, so it must be deterministic. `Uuid::new_v4()`, `Utc::now()`, a random jitter: route them through `ctx.run` (the SDK also ships deterministic helpers) or your replays diverge from the history they are replaying. And a step itself is at-least-once: crash after the email sends but before the journal ack, and that one step re-runs. Idempotent side effects are still your job; the engine just shrinks the blast radius to a single step.

## Where this sits, and how young it is

Deployment inverts the usual arrow. Your service is an HTTP endpoint (`HttpServer::new(Endpoint::builder().bind(WelcomeSequenceImpl.serve()).build())` listening on 9080), and the Restate server, a single binary itself written in Rust with an embedded RocksDB-backed store, sits in front, owns every invocation and its journal, and drives it to completion; you register the endpoint once with `restate deployments register`. The SDK also offers virtual objects (keyed handlers with durable state, one running invocation per key) and workflows with external signals.

If you know the TypeScript world: this is the niche Inngest and Trigger.dev occupy, with `step.run`, `step.sleep`, and event triggers, and Restate is the closest native equivalent Rust has. Date-stamp the rest: as of 2026 the Rust SDK is official but younger than the TypeScript and Java ones, pre-1.0 and still moving, and adjacent projects (Golem, Obelisk) chase the same durability by compiling Rust to WebAssembly and replaying it deterministically. This paragraph ages fast; check current docs before betting a production system on any of it.

## Predict, then verify

A handler computes `let id = Uuid::new_v4();` at the top, outside any `ctx.run`, then uses `id` inside two journaled steps. The process crashes between the two steps. After replay, what does the second step see?

Answer: a different id than the first step recorded. Replay re-executes plain code, so the uuid is generated fresh; step one returns its recorded result containing the old id, step two runs with the new one, and the run quietly disagrees with itself. The journal protects only what flows through it. Generate the id inside a `ctx.run` and both steps agree on every replay, forever.
