Two lines that look interchangeable and are not:

```rust
tokio::time::sleep(Duration::from_secs(1)).await; // parks the task
std::thread::sleep(Duration::from_secs(1));       // seizes the worker
```

The first registers a deadline with the timer, returns `Pending`, and frees the worker to run other tasks: the executor mechanics from Async from scratch. The second never returns `Pending` because it does not return at all until the second is up. The worker thread, one of only eight on an 8-core box, spends that second doing nothing, and every task queued behind it waits.

The scheduler is cooperative. A worker runs exactly one poll at a time, and nothing can preempt it; tasks hand control back by returning. That is what makes task switches cost nanoseconds, and it produces the contract this lesson is about, the tokio maintainers' rule of thumb: code between two `.await` points should run for no more than 10 to 100 microseconds. A synchronous sleep misses the budget by four orders of magnitude. So does a blocking `std::fs` read on a cold disk, a `reqwest::blocking` call, or `std::sync::mpsc::recv()` from the threads section.

Miss it everywhere at once and the failure is total: eight workers, eight blocking calls, and the runtime is wedged. No accepts, no timers, nothing. The partial version is nastier because it hides: p99 latency spikes while CPU sits near idle. Requests are not slow because work is slow; they are finished-and-ready in queues nobody is polling. Work stealing does not rescue you either: peers can steal a stalled worker's queued tasks, but never the poll in flight, and under load every worker eventually swallows one of the poisoned tasks. This is the mystery latency of async services, and no log line confesses to it.

For sleeps and IO the fix is substitution: `tokio::time::sleep`, `tokio::net`, `tokio::fs`. The interesting case is work that is honestly CPU.

## The argon2 case

Chapter 10 of Zero to Production adds login to the newsletter service. Passwords are verified with argon2, which is slow on purpose: its security argument is that every guess must cost real memory and CPU time, and the server pays the same price as the attacker, tens to hundreds of milliseconds of pure computation per login. No async version of that can exist. The CPU is genuinely busy; there is nothing to await.

Section 10.2.4 reaches for the escape hatch:

```rust
let outcome = tokio::task::spawn_blocking(move || {
    verify_password_hash(expected_hash, password_candidate)
})
.await
.expect("blocking task panicked")?;
```

`spawn_blocking` takes a closure, not a future, and runs it on a second thread pool that exists precisely to be blocked: threads are spawned on demand up to 512 by default and retired after about ten seconds idle. The async task awaits the returned `JoinHandle` and yields its worker in the meantime, so a login costs the runtime one parked task instead of one hostage worker. The `move` is Part 1 doing its job: the closure crosses to another thread, so it must own what it uses. (The book actually wraps this in a `spawn_blocking_with_tracing` helper so the request's tracing span follows the work onto the new thread; Part 3 explains why that is worth a helper.)

Two calibration points so the hatch is not overused. Blocking is measured in time, not in API names: a `std::sync::Mutex` held for eighty nanoseconds is technically blocking and entirely fine, which is the next lesson. And `spawn_blocking` is for lumps of blocking work, not a compute scheduler: 512 threads oversubscribing eight cores is no way to run sustained number crunching, which belongs on a fixed-size pool such as rayon, answering back over a channel. Concurrency patterns builds that.

## Predict, then verify

Four workers. You spawn four tasks that each call a legacy blocking database driver taking 30 seconds, plus a fifth task that prints a heartbeat every second. What does the output do?

Answer: a few beats, then silence for roughly 30 seconds, then the missed beats arrive in a burst. Once four polls block, all four workers are hostages. The heartbeat's deadline passes, but firing a timer takes a worker turning the driver, and running the task takes a free worker; there are neither. When the driver calls finally return, the backlog drains at once. Burst-then-silence heartbeats, latency without errors, load without CPU: learn the signature, because in production this bug never announces itself.
