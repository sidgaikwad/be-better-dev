The delivery worker consumes jobs from an mpsc channel. It also has to notice shutdown. Sequential awaits cannot do both:

```rust
let job = jobs.recv().await;   // waits here, deaf to everything else
// ...only now could the code look at a shutdown flag
```

If jobs stop arriving at 2 a.m., the worker sits inside `recv` indefinitely and your deploy hangs behind it. The missing ability is waiting on several futures at once and acting on whichever finishes first. That is `tokio::select!`.

## Racing futures

```rust
loop {
    tokio::select! {
        maybe_job = jobs.recv() => match maybe_job {
            Some(job) => deliver(job).await,
            None => break,             // channel closed: all senders gone
        },
        _ = &mut shutdown => break,    // a oneshot fired from main
    }
}
```

Each branch is `binding = future => handler`. The macro polls all the branch futures; the first to complete wins, its output is bound, its handler runs, and the `select!` expression is over. (Selecting on `&mut shutdown` instead of `shutdown` keeps ownership in the loop, so the next iteration can race it again.)

This loop is the shape of most real tokio services: an event loop over a handful of sources: a work channel, a shutdown signal, an `interval.tick()` for periodic flushing, sometimes a socket. axum's graceful shutdown and tokio's tutorial chat server are this loop with different branches, and so is our worker.

Two mechanical details. Every pass through the loop evaluates the branch expressions again, constructing fresh futures (`jobs.recv()` is a new call each iteration). And by default the branches are polled in random order each time, so an always-ready branch cannot systematically starve the others.

## The losers are cancelled

When one branch completes, the other futures are dropped on the spot, at whatever await they had reached. `select!` does not park the losers to resume later; it destroys them, and the next iteration builds new ones that start from zero.

For `jobs.recv()` this is harmless: a cancelled `recv` removes nothing from the channel, so no job is lost. That property has a name, cancellation safety, it is not universal, and it gets its own lesson shortly. For now, hold the fact: a select loop cancels futures constantly, by design, on the happy path.

## biased, when order should be law

Random polling is fairness insurance. Sometimes priority is the design:

```rust
tokio::select! {
    biased;
    _ = &mut shutdown => break,
    maybe_job = jobs.recv() => { /* ... */ }
}
```

With `biased;` as the first token, branches are polled strictly top to bottom. When shutdown and a job are both ready, shutdown wins every time instead of half the coin flips. Use it when ordering is part of correctness: shutdown before new work, control channel before data channel. The cost is that fairness is now your job: an always-ready first branch starves everything below it.

## Deeper: the race covers only the awaiting

`select!` expands to one future whose poll method polls each branch in turn: the Async from scratch section's executor idea, shrunk to fit inside a single task. Which exposes an important boundary: once a branch wins, the race is over. The handler is ordinary sequential code, and while `deliver(job).await` runs, nothing else in the loop is polled; a shutdown signal arriving mid-delivery is noticed on the next pass, not now. A select loop is concurrent between its sources, never with itself. Long handler work belongs in a spawned task (the tokio section) or a JoinSet (this section's last lesson), keeping each pass short.

## Predict, then verify

```rust
let mut ticks = tokio::time::interval(Duration::from_millis(100));
loop {
    tokio::select! {
        _ = ticks.tick() => print!("t"),
        _ = refresh_dns_cache() => print!("d"),   // needs about 1 second
    }
}
```

What does this print over time?

Answer: a steady run of `t`, and never a single `d`. Each iteration constructs a fresh `refresh_dns_cache()` future, and about a tenth of the way in, the next tick wins the race and drops it; the following pass starts the refresh over from zero. The compiler has no opinion; the program is just wrong. The fixes: spawn the refresh as its own task so it is not in the race, or create the future once outside the loop, pin it with `tokio::pin!` (the Pinning section, applied), and select on `&mut fut` so progress accumulates across passes.
