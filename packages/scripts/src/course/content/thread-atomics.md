The Mutex counter is correct, and mildly absurd: an Arc, a lock, and a guard object per increment of one integer. The hardware can do an uninterruptible add in a single instruction. Atomics expose it:

```rust
use std::sync::atomic::{AtomicU64, Ordering};
use std::thread;

static DELIVERED: AtomicU64 = AtomicU64::new(0);

fn main() {
    let mut handles = Vec::new();
    for _ in 0..4 {
        handles.push(thread::spawn(|| {
            for _ in 0..1_000_000 {
                DELIVERED.fetch_add(1, Ordering::Relaxed);
            }
        }));
    }
    for handle in handles {
        handle.join().unwrap();
    }
    println!("{}", DELIVERED.load(Ordering::Relaxed));   // 4000000, every run
}
```

Put this beside the data race lesson's `static mut` program: the same shape, but no `unsafe`, no lock, and the count is exact. A plain `static` works because `AtomicU64` is `Sync`: every method takes `&self`, and the synchronization happens in silicon.

## Why fetch_add cannot lose an update

`+= 1` was load, add, store, with a window where another thread's work vanishes. `fetch_add` compiles to one indivisible read-modify-write: `lock xadd` on x86, and on ARM a load-exclusive/store-exclusive pair that retries if another core intervened. No window, no lost update. Atomic reads and writes are also always whole, so a torn read is impossible by construction.

The family is deliberately small: `AtomicBool`, `AtomicUsize`, `AtomicU64`, `AtomicPtr`, and siblings. Machine-word shapes only, because that is what hardware can operate on indivisibly. There is no `AtomicString`, and no way to update two atomics as one transaction; multi-field invariants still want a `Mutex`. Atomics shine for independent scalars:

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

static NEXT_ID: AtomicUsize = AtomicUsize::new(1);

fn fresh_subscriber_id() -> usize {
    NEXT_ID.fetch_add(1, Ordering::Relaxed)
}
```

Callable from any thread, never a duplicate, no lock.

## Ordering, the working dose

Every atomic method takes an `Ordering`: what this operation promises about other memory around it.

`Relaxed` promises only that this one operation is atomic. For counters and id generators, where the atomic variable is the whole story, that is exactly enough. Our final `load` is also safe for a second reason worth knowing: `join` guarantees everything a thread did happens-before the join returns, so the reader cannot see a partial world.

`SeqCst` (sequentially consistent) is the strongest: all `SeqCst` operations, across all threads and variables, form one global order that every thread agrees on. The honest beginner rule: when the atomic stands for something beyond itself and you are unsure, use `SeqCst` first and relax later, with understanding. (`Acquire` and `Release`, the publish/subscribe pair between the extremes, are what seasoned code mostly uses; the full memory model is deliberately out of scope here.)

Here is `Relaxed` failing, in a program that compiles:

```rust
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::thread;

static DATA: AtomicU64 = AtomicU64::new(0);
static READY: AtomicBool = AtomicBool::new(false);

fn main() {
    let writer = thread::spawn(|| {
        DATA.store(42, Ordering::Relaxed);
        READY.store(true, Ordering::Relaxed);
    });
    while !READY.load(Ordering::Relaxed) {}
    println!("{}", DATA.load(Ordering::Relaxed));
    writer.join().unwrap();
}
```

The intent is that the flag publishes the data. But `Relaxed` orders nothing between variables: the compiler or the CPU may reorder the two stores, so the reader is allowed to print 0. On x86 you will likely never observe it, because the hardware orders stores strongly; then it surfaces on an ARM server, a portability heisenbug. `Release` on the flag store plus `Acquire` on the flag load, or `SeqCst` on both, makes 42 guaranteed.

## One level deeper: atomics are not free

Four cores hammering `fetch_add` on one variable fight over the cache line that holds it, and the line ping-pongs between cores. An uncontended atomic add costs a few nanoseconds; heavily contended, an order of magnitude more, even though no thread ever blocks. When a hot counter matters, production systems shard it per thread and sum on read. Atomics remove locking; contention they merely relocate.

## Predict, then verify

While the four workers run, a monitor thread prints `DELIVERED.load(Ordering::Relaxed)` once per second. Can it print a torn or impossible value? Can it print a number larger than the increments performed so far?

Answer: no and no. An atomic load returns a value the variable actually held, drawn from that variable's own modification history: possibly a little stale, never invented, never torn. A progress meter over `Relaxed` is therefore fully sound. Compare the `static mut` version, where the same mid-run read is itself a data race and thus UB: the distance between "slightly stale" and "meaningless" is the atomic type.
