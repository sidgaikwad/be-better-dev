Every deploy kills your process. Kubernetes sends SIGTERM, waits thirty seconds by default, then sends SIGKILL; Ctrl-C in a terminal is SIGINT; your platform's rolling restart is one of the two. The delivery worker will be 3,000 emails into an issue when it happens. What the process does next should be a design, not an accident.

The design is three steps, in order: stop taking new work, finish what is in flight before a deadline, exit. Everything below is plumbing for those three sentences.

## Hearing the signal

```rust
use tokio::signal::unix::{signal, SignalKind};

let mut sigterm = signal(SignalKind::terminate())?;
tokio::select! {
    _ = tokio::signal::ctrl_c() => {}
    _ = sigterm.recv() => {}
}
```

## Fanning it out

One signal, many tasks. `tokio_util::sync::CancellationToken` is built for this: clone it into every worker, call `.cancel()` once, and every clone's `.cancelled()` future completes. (A `tokio::sync::watch` channel does the same job with slightly more wiring.) The worker loop is the select lesson applied:

```rust
loop {
    tokio::select! {
        _ = token.cancelled() => break,
        job = jobs.recv() => match job {
            Some(job) => handle(job).await,
            None => break,
        },
    }
}
```

Both branches are cancel-safe, in the precise sense the cancellation-safety lesson gave the term: when `cancelled()` wins, no job has been half-removed from the channel and dropped on the floor. Notice what the loop chooses, though. Cancellation is only checked between jobs, so an in-flight `handle` always runs to completion, and queued jobs are abandoned. That is a policy. If your policy is "drain the queue too", encode it: on cancellation, stop the producer, then keep receiving until `None` instead of breaking.

## Draining with a deadline

Track what is in flight and wait for it, but not forever:

```rust
let tracker = tokio_util::task::TaskTracker::new();
// spawn each worker with tracker.spawn(...), then tracker.close()

token.cancel();
drop(jobs_tx); // no new work
if tokio::time::timeout(Duration::from_secs(25), tracker.wait()).await.is_err() {
    eprintln!("drain deadline exceeded; exiting with work in flight");
}
```

The deadline must be shorter than the platform's grace period. If your drain takes 40 seconds under a 30-second grace, the platform finishes the job for you, and its tool is SIGKILL at a moment you did not choose.

## kill -9 is the audit

SIGKILL cannot be caught, blocked, or handled. The kernel stops scheduling the process and reclaims its memory; none of the code above runs, no destructor, no handler. OOM kills, power loss, and aborts behave the same way. Graceful shutdown is therefore an optimization: it saves in-flight work, keeps latencies clean, and makes deploys cheap. It is not a correctness mechanism, because the one death you cannot drain on is the one you will eventually get.

Correctness lives elsewhere: work that must survive a crash has to be recorded durably before you claim it, and retried idempotently after a restart. That is exactly what Part 3's chapter 11 section, Fault-tolerant workflows, builds for this same delivery worker. The honest test of that story is `kill -9` mid-delivery followed by a restart: if subscribers get duplicates or silence, graceful shutdown was concealing a durability bug, not fixing one.

## Predict, then verify

The worker loop above is running with 200 jobs queued when `token.cancel()` fires. How many of the 200 get handled?

Answer: zero, in the common case. Each worker's next trip through `select!` sees `cancelled()` complete and breaks; a worker mid-`handle` finishes that one job first, but nobody returns to `recv`. The 200 are dropped with the channel. Whether that is acceptable depends on what a job is: abandoning replayable, idempotent work is fine, and chapter 11 makes delivery jobs exactly that. If it is not acceptable, choose the drain-the-queue policy above, or shrink the queue with the backpressure lesson's bounds so there is less to lose. Either way, choose.
