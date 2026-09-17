"What an allocation costs" ended with a promise: profilers can count your allocations precisely. Time to collect, because the allocations that hurt are the ones you did not know you wrote:

```rust
let recipients = subscribers
    .iter()
    .map(|s| s.email.to_string())   // one heap allocation per subscriber
    .collect::<Vec<_>>()            // plus the Vec's doubling growth
    .join(", ");                    // plus one more for the result
```

Fifty thousand subscribers, fifty thousand and change allocations, when borrowing `&str` and a single `join` needed a handful. Nothing in the syntax warns you. Counting requires a tool.

## Counting with dhat

The `dhat` crate replaces the global allocator with one that records every allocation and the stack that made it:

```rust
#[global_allocator]
static ALLOC: dhat::Alloc = dhat::Alloc;

fn main() {
    let _profiler = dhat::Profiler::new_heap();
    run_worker();
}
```

On exit it writes `dhat-heap.json`, which the DHAT viewer renders as a tree: total blocks, total bytes, peak heap, sorted by the stacks responsible. Runs are slower under dhat; the counts, not the times, are the data. The numbers are exact, unlike a sampling profiler's estimates, and the surprises are reliable: a `format!` in a log line, a `clone` inside `Iterator::map`, an error path building `String`s on the happy path's dime.

dhat also has a testing mode, which turns a finding into a regression guard:

```rust
#[test]
fn render_allocation_budget() {
    let _profiler = dhat::Profiler::builder().testing().build();
    render_email(&sample_issue(), &sample_subscriber());
    let stats = dhat::HeapStats::get();
    dhat::assert!(stats.total_blocks <= 4);
}
```

CI now fails if rendering quietly picks up allocations. On Linux, `heaptrack ./target/release/worker` gives the no-recompile version: it interposes on malloc, records every call with its stack, and its GUI draws allocation flamegraphs and flags short-lived "temporary" allocations, the kind a hot loop churns through.

## Shrinking the count

The fixes form a ladder; climb only as far as measurements push you.

Do not allocate: borrow instead of `to_string`, reuse one buffer with `buf.clear()` and `write!` instead of fresh `format!` calls. Allocate once: `Vec::with_capacity` and `String::with_capacity`, which you already understand from the doubling dance in "What an allocation costs".

Then arenas. `bumpalo` allocates by bumping a pointer through a big chunk:

```rust
use bumpalo::Bump;

let arena = Bump::new();
for batch in batches {
    let scratch = arena.alloc_str(&batch.render());
    send(scratch);
    arena.reset();   // frees everything at once, keeps the memory
}
```

Each allocation is a few instructions, no free-list search, and freeing is one pointer reset for the whole batch. Two sharp edges: `Drop` does not run for arena contents (use `bumpalo::boxed::Box` when it must), and everything borrowed from the arena carries its lifetime, so the borrow checker enforces the arena discipline for you.

Last rung: swap the global allocator entirely.

```rust
#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;
```

This changes step 2 of the allocation chain, the allocator's own bookkeeping. It is a real win in specific shapes: many threads allocating concurrently, where glibc malloc contends on shared state, and static musl binaries, common for tiny Docker images from the going-live section, whose bundled allocator degrades badly under threaded load. On a compute-bound or low-allocation program it does approximately nothing. It is one line, so the temptation is to cargo-cult it; the honest move is one criterion run before and after.

Why care about the count at all? Back to the first principles lesson: each allocation is nanoseconds usually, a syscall and page fault occasionally. Cutting the count cuts the number of chances for the slow case, which is exactly the tail-latency variance argument, now with a tool that gives you the number.

## Predict, then verify

```rust
let mut out = String::new();
for s in &subs {                       // 3 subscribers
    out.push_str(&format!("{}\n", s.email));
}
```

How many allocations, and what does `write!(out, "{}\n", s.email)` change?

Answer: about five or six: three `format!` temporaries, plus `out` growing by doubling once or twice. `write!` through `std::fmt::Write` formats directly into `out`, deleting all three temporaries; pre-size with `with_capacity` and the loop allocates zero times after setup. dhat will show exactly this before and after.
