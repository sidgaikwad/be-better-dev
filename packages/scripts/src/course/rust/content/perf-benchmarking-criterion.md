Here is a benchmark that proves an optimization made your code infinitely fast:

```rust
use std::time::Instant;

fn main() {
    let xs: Vec<u64> = (0..1_000_000).collect();
    let start = Instant::now();
    let _ = xs.iter().sum::<u64>();
    println!("{:?}", start.elapsed());
}
```

In a debug build this prints about 4 ms. Build with `--release` and it prints a few nanoseconds. Not because summing got faster: the result is never used, so the optimizer deleted the sum entirely. You timed nothing. These are the two classic measurement lies, and they point in opposite directions: debug builds make everything look slow (opt-level 0, debug assertions, overflow checks; 10x to 100x on iterator-heavy code), and dead-code elimination makes deleted work look free.

## criterion

`criterion` is the standard benchmark harness, and it addresses both lies plus a third: pretending one number is the truth.

```toml
[dev-dependencies]
criterion = "0.6"

[[bench]]
name = "render"
harness = false
```

```rust
// benches/render.rs
use criterion::{criterion_group, criterion_main, Criterion};
use std::hint::black_box;

fn bench_render(c: &mut Criterion) {
    let issue = sample_issue();
    c.bench_function("render_issue", |b| {
        b.iter(|| render_issue(black_box(&issue)))
    });
}

criterion_group!(benches, bench_render);
criterion_main!(benches);
```

`cargo bench` compiles with the bench profile, which inherits release, so lie number one is handled by the tooling. Lie number two is handled by `std::hint::black_box`: an identity function the optimizer must treat as opaque. Wrapping the input stops the compiler from constant-folding a call it can see through; returning a value from the closure routes the output through `black_box` too, so the work cannot be declared unused. The docs call it best-effort rather than a guarantee, which is one more reason to sanity-check surprising numbers.

The output takes statistics seriously:

```text
render_issue            time:   [478.32 µs 481.09 µs 484.11 µs]
                        change: [-4.81% -2.10% +0.92%] (p = 0.19 > 0.05)
                        No change in performance detected.
```

That is a confidence interval, not a stopwatch reading, and the `change` line compares against the previous saved run with a significance test. Read it the way criterion wrote it: a 2% improvement with p = 0.19 is not a small win, it is no evidence of a win. Keep it, and next week's "regression" will be the same noise pointing the other way.

## Where the noise comes from

One level down, variance is physical. CPU frequency scales with temperature, caches and branch predictors start cold, the first write to freshly allocated memory takes a page fault (step 4 from "What an allocation costs"), and the OS interrupts you at will. Criterion's warm-up phase, large sample counts, and outlier classification exist because of these, not as decoration. You still owe it a quiet machine: a thermally throttling laptop can manufacture a 15% "regression" out of nothing.

Two traps remain that no harness can catch. Measuring the wrong thing: if setup runs inside `iter`, you are benchmarking your setup; `iter_batched` exists to keep clone-and-prepare out of the timed region, and a 100-element input that fits in L1 cache says little about the 50,000-subscriber run. And optimizing what you never proved was slow: a benchmark tells you how fast a function is, never whether that function matters. That question belongs to a profiler, which is the next lesson.

## Predict, then verify

You benchmark `fibonacci(20)` two ways: `b.iter(|| fibonacci(20))` and `b.iter(|| fibonacci(black_box(20)))`. Both return the value. Will the times differ?

Answer: very likely, and the first one is the lie. With a literal `20` the compiler can evaluate the recursive call at compile time and the benchmark measures loading a constant. `black_box(20)` makes the argument unknowable, forcing the real computation to run at runtime. The returned value protects the output from elimination; only an opaque input protects the computation from being done early.
