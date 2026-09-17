Restate, Inngest, Trigger.dev, and Temporal all sell the same three-part trick: record facts transactionally, claim work from a queue, journal step results and replay. You built the first two in chapter 11 and the outbox lesson. Build the third and the magic evaporates. The goal: event-triggered workflows with named steps, recorded results, durable sleeps, and crash replay, on the Postgres you already run.

Two tables extend chapter 11's queue:

```sql
CREATE TABLE workflow_runs (
    run_id       uuid PRIMARY KEY,
    workflow     text NOT NULL,
    input        jsonb NOT NULL,
    wake_at      timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);

CREATE TABLE workflow_steps (
    run_id uuid NOT NULL REFERENCES workflow_runs (run_id),
    step   text NOT NULL,
    result jsonb NOT NULL,
    PRIMARY KEY (run_id, step)
);
```

A workflow is a plain async function over a context:

```rust
async fn welcome_flow(ctx: &StepContext, input: WelcomeInput) -> Result<(), StepError> {
    ctx.step("send-welcome", async || send_email(&input.email, Template::Welcome).await)
        .await?;
    ctx.sleep_until(input.confirmed_at + Duration::days(3)).await?;
    ctx.step("send-tips", async || send_email(&input.email, Template::Tips).await)
        .await?;
    Ok(())
}
```

## The journal is a primary key

`step` checks for a recording; a hit skips the closure entirely:

```rust
pub async fn step<T, F>(&self, name: &str, f: F) -> Result<T, StepError>
where
    T: Serialize + DeserializeOwned,
    F: AsyncFnOnce() -> Result<T, StepError>,
{
    let recorded: Option<serde_json::Value> =
        sqlx::query_scalar("SELECT result FROM workflow_steps WHERE run_id = $1 AND step = $2")
            .bind(self.run_id).bind(name)
            .fetch_optional(&self.pool).await?;
    if let Some(value) = recorded {
        return Ok(serde_json::from_value(value)?); // replay: skip the work
    }
    let value = f().await?;
    sqlx::query("INSERT INTO workflow_steps (run_id, step, result) VALUES ($1, $2, $3)")
        .bind(self.run_id).bind(name).bind(serde_json::to_value(&value)?)
        .execute(&self.pool).await?;
    Ok(value)
}
```

(`AsyncFnOnce` and the `async ||` closures are stable current Rust, the async siblings of Part 1's `Fn` traits.) Sleep parks the run, not a task:

```rust
pub async fn sleep_until(&self, at: DateTime<Utc>) -> Result<(), StepError> {
    if Utc::now() >= at {
        return Ok(()); // replaying past a finished sleep
    }
    sqlx::query("UPDATE workflow_runs SET wake_at = $1 WHERE run_id = $2")
        .bind(at).bind(self.run_id)
        .execute(&self.pool).await?;
    Err(StepError::Suspended) // park the run; the worker treats this as success
}
```

`Suspended` unwinds out of the workflow through `?`. The runner is chapter 11's claim loop verbatim: `WHERE completed_at IS NULL AND wake_at <= now() FOR UPDATE SKIP LOCKED`, dispatch on the `workflow` column, call the function from the top. That re-call is the replay: `send-welcome` hits the steps table and returns instantly, `sleep_until` sees its deadline passed, and execution arrives at `send-tips` as if the process had lived the whole three days. Event triggers close the loop: an outbox-relay consumer maps `subscriber_confirmed` to an insert into `workflow_runs`, with the inbox dedup from the outbox lesson so a redelivered event cannot spawn a second run.

## What the toy lacks, and what Temporal adds

Take honest inventory, because each gap is a real engine's feature list. A crash between a step's side effect and its insert re-runs the step: at-least-once per step, which the real engines share, which is why all of them preach idempotency. Deploying new workflow code under in-flight runs is unversioned: rename or reorder steps and replay quietly diverges. No signals from outside, no step timeouts or heartbeats, no UI showing stuck runs.

Temporal is these ideas at industrial scale: event-sourced histories instead of a step table, workers that replay code against history with strict nondeterminism detection, plus versioning, signals, queries, and clustered multi-region deployments. Its core, `sdk-core`, is written in Rust and powers the TypeScript, Python, and .NET SDKs, but as of 2026 there is no stable official Rust authoring SDK, only experiments; verify before depending on one. The Rust menu today: Restate natively, Temporal from a neighboring language, apalis when jobs are enough, or this hundred-line engine when you need exactly what it does.

## Predict, then verify

While a run sleeps between `send-welcome` and `send-tips`, you deploy a version of `welcome_flow` that adds `ctx.step("record-analytics", ...)` between them. The run wakes. Walk the replay.

Answer: the function runs from the top; `send-welcome` hits its recording and skips; `record-analytics` misses, so it executes now, days after the run began, then records; `send-tips` proceeds. Name-keyed journals absorb inserted steps but re-execute renamed ones and scramble on reorders; Temporal's position-keyed histories refuse to guess and raise a nondeterminism error instead. Both are policies for the same fact: code changes while history stands still. Recognizing that fact everywhere, from Postmark retries to Temporal clusters, is what this section was for.
