Issue 87 of the newsletter goes to forty thousand confirmed subscribers. The streams lesson's `while let` loop sends one email at a time, politely and far too slowly; the tokio section's answer is to spawn tasks. The reflex is a Vec of handles:

```rust
let mut handles = Vec::new();
for chunk in batches {
    handles.push(tokio::spawn(deliver_batch(chunk)));
}
for handle in handles {
    handle.await??;
}
```

Three problems hide here. Results are observed in spawn order, so one slow early batch hides the news from every finished one behind it. There is no way to say "at most sixteen in flight". Worst: if this function is itself cancelled (last lesson: a shutdown timeout drops it), the Vec of handles drops, and dropping `JoinHandle`s detaches the tasks: forty thousand sends continue with no owner and no off switch.

## JoinSet: tasks with an owner

```rust
use tokio::task::JoinSet;

let mut set = JoinSet::new();
for chunk in batches {
    set.spawn(deliver_batch(chunk));
}
while let Some(res) = set.join_next().await {
    match res {
        Ok(Ok(report)) => tally(report),       // finished, succeeded
        Ok(Err(e)) => record_failure(e),       // finished, returned Err
        Err(join_err) => log_crash(join_err),  // panicked, or was aborted
    }
}
```

`join_next` resolves with the next task to finish, regardless of spawn order, and `None` once the set is empty, so the group drains with the streams lesson's `while let` shape. The nested `Result` is the timeout lesson's pattern again: the outer layer is the runtime's verdict (a `JoinError` distinguishes `is_panic` from `is_cancelled`), the inner is your function's own.

The structural rule is the point: when a `JoinSet` is dropped, every task still in it is aborted. Tasks cannot outlive the set, the set is a local variable, and so Part 1's ownership discipline now governs concurrency: one owner, teardown at scope exit, nothing leaked. If shutdown cancels the worker mid-campaign, the campaign's tasks are cancelled with it, transitively. Bounding fan-out is two lines in the spawn loop:

```rust
if set.len() >= 16 {
    let res = set.join_next().await;   // wait for a slot; handle res as above
}
```

That is a worker pool in miniature; the Concurrency patterns section grows it into the real thing, with backpressure.

## Abort handles

`set.spawn` returns an `AbortHandle` for cancelling that one task remotely (`JoinHandle::abort` is the same power for plain spawns), and `set.abort_all()` cancels the lot. Abort is the previous lesson's drop, delivered at each task's next await point. Aborted tasks do not vanish silently: each still surfaces once through `join_next` as an `Err` whose `is_cancelled()` is true, so after `abort_all` you keep draining to reap them.

## Draining on shutdown

The worker's full event loop, and this whole section in one screenful:

```rust
loop {
    tokio::select! {
        biased;
        _ = &mut shutdown => break,
        Some(job) = jobs.recv() => { set.spawn(deliver_batch(job)); }
        Some(res) = set.join_next() => tally_result(res),
    }
}
// Intake has stopped. Give in-flight work a deadline:
let drain = async { while set.join_next().await.is_some() {} };
if timeout(Duration::from_secs(30), drain).await.is_err() {
    set.abort_all();
    while set.join_next().await.is_some() {}   // reap the aborted
}
```

One new `select!` detail: `Some(res) = set.join_next()` is a refutable pattern. When the set is empty, `join_next` yields `None`, the pattern misses, and that branch is disabled for the rest of the pass; the loop waits on the others instead of spinning (the same disabling covers a closed jobs channel). And `join_next` may sit in this race at all because its docs mark it cancel-safe: losing never discards a finished task's result. The cancellation safety lesson's checklist, applied.

Read the shutdown as a recipe: stop intake, drain under a deadline, abort the stragglers, reap what the abort produced. Select, timeout, cancellation, cancel safety, and an owned task group, all load-bearing in a dozen lines. The Concurrency patterns section builds worker pools, actors, and graceful shutdown as first-class shapes from exactly these parts.

## Predict, then verify

```rust
let mut set = JoinSet::new();
for i in 0..3 {
    set.spawn(async move {
        tokio::time::sleep(Duration::from_secs(60)).await;
        println!("batch {i} done");
    });
}
drop(set);
tokio::time::sleep(Duration::from_secs(2)).await;
println!("main done");
```

What prints, and roughly when?

Answer: only `main done`, after about two seconds. Dropping the set aborts all three tasks; each is parked at its sleep, an await point, so the abort lands at once and the `println!` after it is skipped code, per the cancellation lesson. Had this been a `Vec<JoinHandle>` dropped in its place, the tasks would instead detach and keep sleeping, invisible. The difference between those two drops, shrug versus ownership, is what the word structured in structured concurrency means.
