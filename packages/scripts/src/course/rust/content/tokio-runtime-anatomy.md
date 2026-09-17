In Async from scratch you finished with a working executor: a loop that polls futures, parks in `epoll_wait` when nothing is ready, and requeues tasks when their wakers fire. tokio is that same program with years of production hardening. Nothing in this section is a new idea; it is your executor, industrialized.

Start by removing the sugar. This:

```rust
#[tokio::main]
async fn main() {
    serve().await;
}
```

expands to almost exactly this:

```rust
fn main() {
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .expect("failed to build runtime")
        .block_on(async { serve().await })
}
```

`main` is still an ordinary synchronous function. It builds a `Runtime` value, then drives one future to completion with `block_on`, the same job as the `block_on` you wrote by hand. `enable_all` switches on the two drivers: IO and time. There is no compiler magic to find; the day you need a custom runtime, you write this expansion yourself.

## The moving parts

**Worker threads.** `new_multi_thread` spawns one worker thread per CPU core (override with `.worker_threads(n)`). Each worker runs the loop you already know: pop a task, poll it, repeat. A poll is a plain function call on the worker's own stack, no syscall, no context switch, which is why switching between tasks costs nanoseconds where switching threads costs microseconds.

**Run queues.** Each worker owns a local queue with a fixed capacity of 256 tasks. One shared injection queue backs them all: spawns arriving from outside the runtime land there, and a local queue that fills up spills into it.

**The IO driver.** This is the readiness loop from Async from scratch, wrapped by the `mio` crate: epoll on Linux, kqueue on macOS, an equivalent on Windows. Sockets register once; when every worker runs dry, one of them takes the driver and blocks in `epoll_wait`, and the rest park. Readiness events fire wakers, wakers push tasks onto queues, workers wake. The timer rides along: the next sleep deadline becomes the timeout argument to `epoll_wait`, so one sleeping thread services both IO and the clock.

## Work stealing

The distinctive scheduling decision is what a worker does when its local queue runs empty. It does not park straight away: it picks another worker at random and steals half of that worker's local queue.

This matters because load is lumpy. One accept loop runs on one worker, so a burst of new connections lands as a pile of tasks in a single local queue. Stealing half of it spreads the pile across cores in microseconds, with no central dispatcher and no single queue that every worker fights over. A one-shared-queue design serializes all scheduling through one lock; per-worker queues plus stealing keeps the common path (push and pop on your own queue) uncontended, and pays for balancing only when imbalance exists.

The consequence to hold onto: a task has no home thread. It can be polled on worker 3, return `Pending`, and be polled next on worker 7. That is exactly why `tokio::spawn` will demand `Send`, which the next lesson makes concrete.

One more flavor exists: `#[tokio::main(flavor = "current_thread")]` builds a runtime with no worker threads at all; every task runs on the thread that called `block_on`. `#[tokio::test]` uses it by default, which keeps tests cheap and deterministic.

## Predict, then verify

An 8-core machine, default runtime. One task, in a tight loop with no awaits, spawns 500 already-ready tasks. Where do they go, and what do the other seven workers do?

Answer: each spawn pushes onto the spawning worker's local queue; when that hits its 256-task capacity, the overflow spills into the shared injection queue. The other workers were parked, in or around the driver; the first spawns notify them, and each wakes and steals half a queue. Within microseconds the 500 tasks are spread across all eight cores. The one thing that cannot move is the spawning task itself: it is mid-poll, and a poll runs to completion on its thread, one reason a long spawn loop with no `.await` in it is already bad manners, a theme the blocking lesson returns to.
