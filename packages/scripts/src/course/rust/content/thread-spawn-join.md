Every program in this course so far has run on a single OS thread, while the machine underneath offered eight or more cores. `thread::spawn` is how you accept the offer.

## spawn, join, and who outlives whom

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        println!("hello from the new thread");
    });
    println!("hello from main");
    handle.join().unwrap();
}
```

`spawn` asks the OS for a new thread and returns immediately with a `JoinHandle`. From that point two threads run concurrently, and the two lines can print in either order; rerun it and the order may flip. Scheduling nondeterminism is the medium you now work in.

`join` blocks until the thread finishes. It returns a `Result`: `Ok` carries the closure's return value, `Err` means the thread panicked, and the panic arrives here as a value instead of crashing your thread. Drop the handle without joining and the thread is detached: it keeps running, but when `main` returns the process exits and takes every thread with it, finished or not.

## Why the compiler demands move

Hand the thread some data and the borrow checker objects:

```rust
let subscribers = vec![String::from("ada@example.com")];
let handle = thread::spawn(|| {
    println!("{} to notify", subscribers.len());   // rejected
});
```

```text
error[E0373]: closure may outlive the current function, but it borrows
              `subscribers`, which is owned by the current function
note: function requires argument type to outlive `'static`
help: to force the closure to take ownership, use the `move` keyword
```

The closure only reads `subscribers`, so it captures `&subscribers`. But `spawn` requires the closure to be `'static`: it may not borrow anything from the spawning function's stack, because nothing forces the child thread to finish before the parent's frame dies. If `main` returned first, the child would read a dead frame: the dangling reference from the "No dangling" lesson, with a scheduler deciding whether it fires tonight or next month.

`move` transfers ownership into the closure. No new rules appear: one owner per value, and the owner now lives on another thread. When borrowing is genuinely what you want, `thread::scope` (Rust 1.63) gives you threads guaranteed to finish before the borrow ends; plain `spawn` can promise no such thing.

## What a thread costs

`spawn` is a real system call (`clone` on Linux). The kernel allocates scheduling bookkeeping, and the new thread reserves 2 MiB of stack by default (`thread::Builder::stack_size` adjusts it; the reservation is address space, and physical pages arrive only as the stack actually grows). The recurring cost is the context switch: parking one thread and resuming another takes on the order of a microsecond, and the incoming thread finds the CPU caches full of the outgoing thread's data.

So: ten threads are nothing. Ten thousand are 20 GiB of reserved address space and a scheduler doing real work deciding who runs next. CPU-bound work wants roughly one thread per core. A server holding 100,000 idle connections wants something far cheaper than a thread apiece, which is why the async sections exist later in this part.

## Predict, then verify

```rust
use std::thread;

fn main() {
    for i in 0..3 {
        thread::spawn(move || println!("worker {i}"));
    }
}
```

No joins. What does this print?

Answer: anything from nothing to all three lines, in any order. `main` reaches its end immediately, the process exits, and unfinished threads are killed mid-flight; run it repeatedly and you will see zero, one, two, or three lines, varying run to run. Collect the handles and join them all to guarantee full output. Note that each closure gets its own copy of `i`: `i32` is `Copy`, so `move` copies it, exactly as the "Copy or move" lesson promised.
