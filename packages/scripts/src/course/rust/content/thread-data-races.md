Armed with `spawn`, the obvious next move is parallelizing the newsletter's delivery counter: four threads, a million sends each, one shared tally. Safe Rust refuses to compile the obvious version of that program. To see what it is protecting you from, here it is with the safety off:

```rust
use std::thread;

static mut DELIVERED: u64 = 0;

fn main() {
    let mut handles = Vec::new();
    for _ in 0..4 {
        handles.push(thread::spawn(|| {
            for _ in 0..1_000_000 {
                unsafe { DELIVERED += 1 }   // data race: never ship this
            }
        }));
    }
    for handle in handles {
        handle.join().unwrap();
    }
    let total = unsafe { DELIVERED };
    println!("{total}");
}
```

Four million increments happen. A typical run prints 1,472,838. The next prints 2,109,516.

## The definition

A data race is three conditions, all required at once:

1. two or more threads access the same memory location,
2. at least one access is a write,
3. nothing synchronizes them: no lock, no atomic, no channel handoff ordering one before the other.

Remove any one condition and there is no data race. A thousand readers of never-written data are fine, which should sound familiar: it is the "any number of readers" half of the aliasing rule from the exclusive references lesson.

## Where the counts went

`DELIVERED += 1` is not one step. It is load, add, store, and two threads can interleave:

```text
thread A               thread B
load DELIVERED -> 41
                       load DELIVERED -> 41
add            -> 42
                       add            -> 42
store 42
                       store 42
```

Two increments ran; the counter moved by one. At full speed on four cores this window is hit constantly, which is why half the updates evaporate.

Reads corrupt too. On a 32-bit machine, storing a `u64` takes two instructions. A reader arriving between them catches half old and half new: increment `0x0000_0000_FFFF_FFFF` and a concurrent reader can observe `0x0000_0001_FFFF_FFFF`, roughly 8.5 billion, a value the counter never held. That is a torn read.

## Why it is undefined behavior, not just a wrong number

The exclusive references lesson showed the payoff of "no aliasing": the compiler may keep values in registers and reorder freely. That license assumes no unsynchronized concurrent access. Facing our loop, the optimizer is entitled to load `DELIVERED` once, add 1,000,000 in a register, and store once, and a "race" between those rewritten threads can produce almost anything: exactly 1,000,000, stale values resurfacing, code after the loop running on impossible state. C and C++ define data races as UB for the same reason; the difference is that they cannot reject the program. ThreadSanitizer can catch races that happen to fire during a test run; no tool can prove their absence.

The production shape of this bug is the worst part: it is probabilistic and load-dependent. It passes CI for months, then corrupts billing metrics at your traffic peak, and the extra logging you add to debug it changes the timing enough to make it vanish.

## Predict, then verify

Two threads share the same `u64`. Both only ever read it. There is no synchronization of any kind. Is this a data race, and is the program correct?

Answer: no race, and correct: condition 2 fails, because no access is a write. Shared immutable data needs no synchronization at all, which is why the next lesson can hand read-only data to a dozen threads for free. Add one unsynchronized writer and every one of those reads becomes a potential stale or torn read. Many readers XOR one writer is not a style preference; it is the shape of shared memory itself, and the next lesson shows how Rust checks it across threads.
