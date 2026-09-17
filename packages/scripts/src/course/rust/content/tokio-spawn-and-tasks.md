In Threads, Send and Sync, concurrency cost you `std::thread::spawn`: a system call, kernel bookkeeping, and a default reservation of 8 MiB of virtual memory for the new thread's stack. Here is the tokio equivalent:

```rust
let handle = tokio::spawn(async move {
    fetch_confirmed_subscribers().await
});
// ...other work runs here, concurrently...
let subscribers = handle.await.expect("task panicked")?;
```

`tokio::spawn` hands the future to the scheduler and returns immediately. Two things about that line are easy to miss.

First, the task starts without being awaited. A bare future is inert; Async from scratch made you prove it: nothing runs until something polls. `spawn` is what turns a future into concurrency: the scheduler begins polling right away, interleaved with everything else. Awaiting the `JoinHandle` is only how you collect the result.

Second, dropping the handle does not cancel the task; it detaches it, and the task runs to completion unobserved. Cancelling is explicit: `handle.abort()`.

The handle awaits to `Result<T, JoinError>`, not `T`. A panic inside a task is caught at the task boundary and handed back as a `JoinError` (`is_panic()` tells you which kind); the runtime and every other task carry on. This is why one crashing request handler costs one request, not the whole server.

## What a task costs

A spawned task is one heap allocation: the future's state machine plus a small header, an overhead the tokio tutorial puts at 64 bytes. The state machine itself is the sum of the locals alive across its await points, typically a few hundred bytes, and the allocation costs nanoseconds (the cost of allocation lesson priced it). Set that against a thread: megabytes of stack address space, a kernel object, and a trip through the kernel scheduler on every switch. Switching tasks is returning `Poll::Pending` from one function call and making another. A hundred thousand tasks is a normal afternoon; a hundred thousand threads is an incident.

## The bounds are the lesson

```rust
pub fn spawn<F>(future: F) -> JoinHandle<F::Output>
where
    F: Future + Send + 'static,
    F::Output: Send + 'static,
```

`Send` is work stealing's bill arriving. The runtime anatomy lesson established that a task parked at an `.await` can be stolen and polled next on a different worker thread. Everything alive across that await is a field of the state machine, so all of it may cross threads, so all of it must be `Send`: the exact rule from Threads, Send and Sync. Break it:

```rust
tokio::spawn(async {
    let rc = std::rc::Rc::new(vec![1, 2, 3]);
    let sum: i32 = rc.iter().sum();
    tokio::task::yield_now().await;
    println!("{sum}");
});
```

```text
error: future cannot be sent between threads safely
   = help: the trait `Send` is not implemented for `Rc<Vec<i32>>`
note: future is not `Send` as this value is used across an await
   |         tokio::task::yield_now().await;
   |                                  ^^^^^ await occurs here, with `rc` maybe used later
```

The note is precise: used across an await. `rc` would be dropped at the end of the block, after the await, so it is alive through the suspension. End its scope before the await and the same logic compiles:

```rust
tokio::spawn(async {
    let sum: i32 = {
        let rc = std::rc::Rc::new(vec![1, 2, 3]);
        rc.iter().sum()
    };
    tokio::task::yield_now().await;
    println!("{sum}");
});
```

When a value truly is needed on both sides of an await, the fix is the threads section's fix: `Arc`.

`'static` is the other half: the spawning function may return, and its stack frame die, while the task lives on, so the future cannot borrow from that frame. Try it and rustc answers with `error[E0373]: async block may outlive the current function, but it borrows...` and suggests the repair: `move` ownership in, cloning whatever the caller still needs.

## Predict, then verify

`let f = send_confirmation_email(id);` and then, later in the function, `tokio::spawn(f);`, with the returned handle thrown away. Does the email get sent?

Answer: yes. Between construction and spawn the future did nothing, futures are lazy as ever, but spawn transfers it to the scheduler, which polls it to completion whether or not anyone is watching. What discarding the handle loses is observation: the result, and any panic, vanish silently. If the outcome matters, keep the handle and await it somewhere; detached tasks are for work that is genuinely fire-and-forget.
