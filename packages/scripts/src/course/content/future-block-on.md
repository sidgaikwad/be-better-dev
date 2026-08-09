This section keeps asserting that async needs no built-in runtime, that a future is a plain value any loop can drive. Assertions like that should be paid in code. Here is a complete executor, std only, that runs any future to completion, including the `Delay` timer from the waker lesson.

## What an executor owes

Read the contract from the executor's side: poll the future once; on `Ready(value)`, hand the value back; on `Pending`, sleep cheaply until a wake arrives, then poll again. The whole craft is in "sleep cheaply", and std has the exact tool: `thread::park()` blocks the calling thread, and `Thread::unpark()` releases it. A parked thread costs nothing per tick, just like the blocked thread from the why-async lesson; the difference is that we park one executor thread standing in for every pending wait, not one thread per wait. One more property matters: if `unpark` arrives before `park`, it leaves a token and the next `park` returns immediately. Hold that thought; it closes a race below.

## The code

```rust
use std::future::Future;
use std::sync::Arc;
use std::task::{Context, Poll, Wake, Waker};
use std::thread::{self, Thread};

struct ThreadWaker(Thread);

impl Wake for ThreadWaker {
    fn wake(self: Arc<Self>) {
        self.0.unpark();
    }
}

fn block_on<F: Future>(fut: F) -> F::Output {
    let mut fut = Box::pin(fut);
    let waker = Waker::from(Arc::new(ThreadWaker(thread::current())));
    let mut cx = Context::from_waker(&waker);
    loop {
        match fut.as_mut().poll(&mut cx) {
            Poll::Ready(value) => return value,
            Poll::Pending => thread::park(),
        }
    }
}
```

Piece by piece:

- `ThreadWaker` wraps the executor thread's own handle, captured with `thread::current()`. std's `Wake` trait turns any `Arc<impl Wake>` into a real `Waker` via `Waker::from`, assembling the vtable from the waker lesson for us. The `Arc` receiver (shared ownership, from Smart pointers and interior mutability) is the right shape because wakers get cloned and shipped across threads freely. Our wake is one line: unpark the executor.
- `Box::pin` satisfies poll's `Pin<&mut Self>` requirement from the state machine lesson by giving the future a stable heap address, making its self-references safe to resume. (`std::pin::pin!` does the same on the stack with no allocation; the pinning section covers why both work.)
- The loop is the executor. All of it.

## Run it

With `Delay` from the waker lesson pasted alongside:

```rust
use std::time::{Duration, Instant};

fn main() {
    let msg = block_on(async {
        println!("delivery worker: waiting out the provider's rate limit");
        Delay { deadline: Instant::now() + Duration::from_millis(300) }.await;
        "window open, resuming sends"
    });
    println!("{msg}");
}
```

Trace it with everything the section has built. The async block compiles to a state machine, constructed inert. The first poll prints, reaches the `.await`, and polls `Delay`, which lodges the waker with a sleeper thread and answers `Pending`; the machine stores its state and `Pending` unwinds out to `block_on`, which parks at zero CPU. After 300 ms the sleeper calls `wake()`, wake unparks, the loop polls again, `Delay` reads `Ready`, and the machine runs to completion; `block_on` returns the message.

The race that is not there: if the sleeper fires in the gap after poll returns `Pending` but before the executor reaches `park()`, the token from `unpark` makes that park return instantly. No lost wakeup, no deadlock. This is precisely why park/unpark fits the waker contract.

This executor is real. The pollster crate, which some GUI and GPU projects use as their entire runtime, is essentially this file; `futures::executor::block_on` is the same idea. What it deliberately lacks: it drives exactly one task (no spawn, no run queue), and its only wake source is a thread per timer, the why-async lesson's problem sneaking back in through a side door. Sharing one wait across ten thousand I/O sources is the operating system's job, next lesson; multi-task executors with work stealing are tokio's, next section.

## Predict, then verify

How many polls and how many parks does `block_on(async { 21 * 2 })` perform?

Answer: one poll, zero parks. A body with no `.await` compiles to a machine that runs from start to done in its first poll and answers `Ready(42)`; the match returns before `park` is ever reached. An executor adds cost only where there is genuine waiting: for a ready future it is one function call. The abstractions-compile-away theme from the niche optimization in Enums: one of several shapes, again, now at the scale of a runtime.
