Part 3 follows the book into the newsletter service, and its chapter 9 section ships delivery in the most naive form possible: a request handler that loops over every confirmed subscriber and sends emails one at a time, inline, holding the HTTP request open. Chapter 11 later rebuilds it as a fault-tolerant background workflow. This capstone is the bridge between them: the concurrent worker you can now design with this section's four patterns, plus an honest account of the gap only chapter 11 can close.

Requirements: at most 8 sends in flight (the provider's connection cap), flat memory however long the subscriber list grows, progress you can query, a clean SIGTERM.

## The wiring

```rust
let (jobs_tx, jobs_rx) = mpsc::channel::<DeliveryJob>(64);   // backpressure
let jobs_rx = Arc::new(tokio::sync::Mutex::new(jobs_rx));    // shared receiver
let progress = Progress::spawn();                            // actor owning the counts
let token = CancellationToken::new();
let tracker = TaskTracker::new();

for _ in 0..8 {                                              // the pool
    let (jobs, progress, token) = (jobs_rx.clone(), progress.clone(), token.clone());
    tracker.spawn(async move {
        loop {
            let job = tokio::select! {
                _ = token.cancelled() => break,
                next = async { jobs.lock().await.recv().await } => match next {
                    Some(job) => job,
                    None => break,                           // queue closed and empty
                },
            };
            let outcome = send_email(&job.subscriber, &job.issue).await;
            progress.record(&job, outcome).await;
        }
    });
}
tracker.close();
```

The producer streams rows in, parking whenever the workers fall behind:

```rust
for subscriber in fetch_confirmed_subscribers(&pool).await? {
    jobs_tx.send(DeliveryJob::new(subscriber, &issue)).await?; // waits when full
}
drop(jobs_tx); // done: workers drain the queue and exit
```

And main waits for natural completion or a signal, whichever comes first:

```rust
tokio::select! {
    _ = tracker.wait() => {}
    _ = shutdown_signal() => {
        token.cancel();
        let _ = tokio::time::timeout(Duration::from_secs(25), tracker.wait()).await;
    }
}
```

## Where each lesson lives

- Worker pool: eight tasks share one receiver behind a `tokio::sync::Mutex`, taking turns waiting and working in parallel. Eight is not a guess; it is the provider's cap, stated once.
- Backpressure: capacity 64 means memory holds at most 64 queued jobs plus 8 in flight, whether the issue goes to 500 subscribers or 500,000. The database cursor holds the rest, not the heap.
- Actor: `Progress` owns its counters with no lock, records every outcome, and can answer a stats query over oneshot, ready to back a delivery-status endpoint.
- Graceful shutdown: the worker `select!` is legitimate because `lock` and `recv` are cancel-safe (the cancellation-safety lesson). On cancel, in-flight sends finish, queued jobs are abandoned, and the drain deadline stays under the platform's grace period.

## The gap, named

The queue is process memory. `kill -9` this worker mid-issue and the queued and in-flight jobs evaporate: some subscribers have the issue, the rest do not, and no record says which. Rerunning the issue would double-send to the first group. The shutdown lesson showed why no amount of signal handling fixes this. Chapter 11's fix keeps every pattern on this page and changes one material: the channel becomes a Postgres table, each delivery is recorded idempotently, and a restarted worker resumes where the dead one stopped. The concurrency design survives; only the queue's substrate changes.

## Predict, then verify

An issue goes to 50,000 subscribers. At the busiest instant, roughly how many `DeliveryJob` values exist in memory?

Answer: about 73: up to 64 in the channel, 8 held by workers mid-send, and the one the parked producer is holding in `send().await`. The other 49,900-odd are rows the producer has not read yet. That bound was fixed the moment `channel(64)` and the pool size were written down, which is this section's whole point: every limit in the system is one you chose, visible in the source, instead of one a resource chose for you at 2 a.m.
