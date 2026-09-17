Rust inherits C++'s zero-overhead principle, in Stroustrup's formulation: you do not pay for what you do not use, and what you do use, you could not reasonably hand-code better. For this section it means the subscriber pipeline from the adapters lesson should compile to the same machine code as the index loop you would have written instead. Coming from JavaScript, where every `filter` and `map` allocates an array, skepticism is earned. Keep it. The claim is checkable, so check it.

## The experiment

```rust
pub fn sum_index(v: &[u64]) -> u64 {
    let mut total = 0;
    for i in 0..v.len() {
        total += v[i];
    }
    total
}

pub fn sum_iter(v: &[u64]) -> u64 {
    v.iter().sum()
}
```

Paste both into Compiler Explorer (godbolt.org) with the flag `-C opt-level=3`. On current stable they compile to essentially the same assembly: one vectorized loop using SIMD registers to add several `u64`s per instruction, plus a small scalar tail.

Why this works: nothing in a chain survives to runtime. Adapters are ordinary structs holding a source iterator and a closure ("Adapters are lazy, consumers do the work"), `next` is a small inlinable method, and monomorphization hands LLVM every layer's body in one piece. Inlining flattens the tower of structs into a plain loop, and then the regular loop optimizer, the same one C++ relies on, takes over. Zero-cost does not mean the abstraction is cheap; it means the abstraction is gone before the optimizer starts on the loop.

## Bounds checks, and who elides them

Before optimization the two functions differ. `v[i]` compiles to a check: if `i >= v.len()`, panic. In `sum_index` the optimizer proves the index in bounds (`i` ranges over `0..v.len()` of the same slice) and deletes the check. Weaken the proof, indexing as `v[i + offset]` or with indices from another array, and checks survive: a compare-and-branch per element that frequently also blocks vectorization.

`sum_iter` has nothing to delete. The slice iterator from "The Iterator trait: next() is the engine" walks a pointer toward an end pointer; going out of bounds is structurally impossible, so no check is ever emitted. This is the practical reason idiomatic Rust leans on iterators: they do not beg the optimizer to remove safety checks, they never generate them.

## Where the folklore breaks

The honest caveats:

- Debug builds. At `opt-level=0` nothing inlines, so every element pays real method calls through every adapter layer. Iterator-heavy code can run ten times slower than the hand loop in debug mode; test suites and game loops feel this.
- `chain`. Its `next` must branch on every call: front iterator or back? In hot loops, two separate loops often beat one chained one.
- Heavily nested `zip`s can defeat auto-vectorization where a manual index loop over length-checked slices vectorizes fine.
- Laziness is free; materializing is not. `collect` allocates ("What an allocation costs"), and that dwarfs adapter overhead when it happens inside a loop.

The claim is "no overhead versus hand-written code, in optimized builds", not "free everywhere always".

## How to verify, instead of believing

Two tools settle arguments. Compiler Explorer for the code: compare your chain against the loop at `-C opt-level=3`, looking for vector instructions (`vpaddq` and friends) and for calls to `core::panicking::panic_bounds_check`. You do not need to read assembly fluently to count branches in a ten-line loop. criterion for the time: add it as a dev-dependency, write a benchmark, run `cargo bench`; it does warmup, statistics, and outlier detection, and `std::hint::black_box` keeps the optimizer from deleting the very work being measured. Blog posts about iterator speed age badly, because rustc and LLVM keep improving. Your loop, your data, this week's compiler: measure that.

## Predict, then verify

You benchmark `sum_index` against `sum_iter` on ten million elements with `cargo run`, a debug build, and the iterator version loses by 8x. What will `cargo run --release` show?

Answer: near-identical times, with both far faster than either debug number. Debug builds skip the inlining that dissolves adapter structs, so the debug benchmark measured the abstraction itself; release inlines, flattens, and vectorizes both functions into the same loop, measuring the program. Benchmarking debug builds is the most common way people "disprove" zero-cost, and it is why `cargo bench` always compiles with optimizations on.
