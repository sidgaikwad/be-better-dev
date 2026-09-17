You have 40,000 thumbnails to generate. From the threads section you know what `thread::spawn` costs: a syscall, kernel bookkeeping, a stack reservation measured in megabytes. One thread per job means the machine spends its budget on context switches instead of work, and may refuse outright somewhere past a few thousand spawns. The old, boring answer is a worker pool: start N workers once, feed them one queue.

## The shape

```rust
use std::sync::{mpsc, Arc, Mutex};
use std::thread;

type Job = Box<dyn FnOnce() + Send + 'static>;

let (tx, rx) = mpsc::channel::<Job>();
let rx = Arc::new(Mutex::new(rx));

let workers: Vec<_> = (0..4)
    .map(|_| {
        let rx = Arc::clone(&rx);
        thread::spawn(move || loop {
            let job = rx.lock().unwrap().recv();
            match job {
                Ok(job) => job(),
                Err(_) => break,
            }
        })
    })
    .collect();
```

Two details carry the whole design.

**Why the Mutex.** std's channel is multi-producer, single-consumer: `Receiver` is not `Clone` and has one owner. `Arc<Mutex<Receiver>>` turns "one consumer" into "one consumer at a time", which is all a pool needs. The crossbeam-channel crate skips the ceremony: its receivers are multi-consumer and clone freely, so each worker owns its own handle to the same queue. Same shape, one less lock.

**Where the lock ends.** The temporary guard created by `rx.lock().unwrap()` is dropped at the end of that `let` statement. A worker therefore holds the lock only while waiting for a job, never while running one. Workers take jobs one at a time; they execute them in parallel.

Shutdown falls out of ownership, the same rule as the one-owner lesson: drop the last `Sender` and the channel closes. Workers drain whatever is still queued, `recv` begins returning `Err`, the loops break, and `join` on the handles completes. No stop flag, no poison-pill job.

## When a pool beats spawning per job

On threads: almost always, for the cost reasons above. On tokio the numbers move: the tokio section showed that a task costs hundreds of bytes, not megabytes, and spawning is well under a microsecond, so task-per-job is often fine. A pool still wins when:

- each worker owns an expensive resource reused across jobs: one database connection, one SMTP session, one large scratch buffer
- N is a hard cap with outside meaning, like a provider that allows 8 concurrent connections
- jobs are CPU-bound, where running more of them than you have cores adds scheduler churn and nothing else

The async pool is the same picture with `tokio::sync::mpsc` and a `tokio::sync::Mutex` around the receiver; the capstone lesson builds it.

## One level deeper

Per-job overhead here is one lock handoff plus one channel receive: tens of nanoseconds uncontended. Any job doing real work, a file read, a network call, an image resize, dwarfs that by three or four orders of magnitude. The pool's real price is a design constraint: jobs cross into other threads, so `Job` must be `Send + 'static`, which is the Send and Sync lesson showing up in a type alias instead of an error message.

## Predict, then verify

A cleanup commit rewrites the worker loop:

```rust
while let Ok(job) = rx.lock().unwrap().recv() {
    job();
}
```

Same calls, fewer lines, and it compiles. Is the pool still parallel?

Answer: no. Temporaries in a `while let` condition live until the end of the loop body, so the mutex guard is now held while `job()` runs. One worker executes at a time; the other three sit blocked on the lock. Everything still completes, which is what makes the bug quiet: results are correct, throughput is one worker, and no test that checks outputs will notice. Lock scope is set by where the guard drops, and `while let` drops it later than it reads.
