The Future trait lesson left a debt unpaid. `poll` answered `Pending`; the caller must poll again later. When, exactly? Polling in a tight loop reinvents busy-waiting: a core pinned at 100%, asking are-we-there-yet forever, which is worse than the blocked thread it replaced (that thread at least slept). Never polling again hangs the program. The answer rides in poll's other parameter, `cx: &mut Context<'_>`, whose one job today is handing out `cx.waker()`.

## The contract

A `Waker` is a small, cloneable, thread-safe handle. Calling `wake()` on it states one fact: polling this future again is now worth it. The contract has a side for each party:

- The future, before returning `Pending`, must clone the waker and lodge it with something that will learn when progress is possible: a timer thread, the OS readiness machinery (two lessons ahead), the sending half of a channel.
- The executor, having received `Pending`, must not poll again until some waker fires, and must poll again when one does.

Note what a wake does not carry: the value. A JS callback receives the result; `wake()` has no payload at all. It is a doorbell, not a delivery. The executor re-polls, and the future re-checks its own condition and produces `Ready(value)` itself. This is called the readiness model, and one of its consequences is load-bearing: spurious wakes are harmless. An extra wake, or a paranoid executor polling early, just runs the state machine's match again, finds the child still pending, and returns `Pending` after re-lodging the waker. Correctness never depends on wakes being precise, only on at least one arriving after progress becomes possible.

## A complete future, by hand

The first Future in this course written rather than compiled: a timer.

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::thread;
use std::time::Instant;

struct Delay {
    deadline: Instant,
}

impl Future for Delay {
    type Output = ();

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {
        if Instant::now() >= self.deadline {
            return Poll::Ready(());
        }
        let waker = cx.waker().clone();
        let deadline = self.deadline;
        thread::spawn(move || {
            thread::sleep(deadline.saturating_duration_since(Instant::now()));
            waker.wake();
        });
        Poll::Pending
    }
}
```

Past the deadline: `Ready`. Otherwise: clone the waker, hand it to a sleeper thread, answer `Pending`. The clone crosses a thread boundary, which compiles because `Waker` is `Send` and `Sync`: the bounds from Threads, Send and Sync doing quiet work. Spawning a thread per pending poll is a teaching shortcut and honestly wasteful; a real runtime keeps one timer structure holding every deadline sorted (tokio's timer, next section). But the contract is fully honored, and this future runs unmodified on any executor, including the one we build next lesson.

## What a Waker is made of

Physically, a `Waker` is two words: a data pointer plus a pointer to a vtable of function pointers (clone, wake, drop). That is the same fat-pointer shape as a `dyn Trait` object from the traits and generics section, hand-assembled (`RawWaker`) so it can exist without any allocation, even in embedded no_std code. Executors supply the behavior: next lesson's vtable unparks a thread; tokio's pushes the task onto a run queue. The future neither knows nor cares which.

And the bug to respect: return `Pending` without lodging the waker anywhere, and nothing will ever wake the task. No panic, no error, no log line: a silent, permanent sleep. Lost wakeups are the signature bug of hand-written futures.

## Predict, then verify

Delete the `thread::spawn` block from Delay's poll, keeping the rest, and run it under a correct executor, one that only re-polls after a wake. What happens, and what does CPU usage show?

Answer: the program hangs at roughly 0% CPU. The first poll returns `Pending` and the executor sleeps, waiting for a wake that no one will ever send. Nothing crashes and nothing errors; the process just waits forever. Under a sloppier executor that re-polls on a timer anyway, the same broken future would eventually complete. That is what makes this bug family nasty: it hides under one runtime and hangs under another. Program to the contract, not to your executor's forgiveness.
