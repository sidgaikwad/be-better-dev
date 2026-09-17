A modern x86 core can add eight 32-bit integers in one instruction, using 256-bit vector registers. The interesting news for you: this loop probably already does.

```rust
pub fn sum(xs: &[i32]) -> i32 {
    xs.iter().sum()
}
```

At `opt-level=3`, LLVM auto-vectorizes simple loops, and the zero-cost iterators lesson showed that iterator chains compile to exactly such loops. So the first SIMD skill is not writing SIMD, it is verifying what the compiler already did.

## Reading the evidence

Open Compiler Explorer at godbolt.org, pick rustc, add `-C opt-level=3`, and paste the function. In the output, scalar code adds through registers like `eax` one element at a time; vectorized code uses packed instructions on vector registers: `paddd xmm0, ...` (four i32 lanes at baseline SSE2). Add `-C target-cpu=x86-64-v3` from the build-knobs lesson and it widens to `vpaddd ymm0, ...`, eight lanes. Locally, `cargo install cargo-show-asm` and `cargo asm your_crate::sum` gives the same view without a browser. Wider registers in the listing is the claim; the speedup is still measured with criterion, because a loop limited by memory bandwidth gains little from wider arithmetic, the cache-locality lesson's point wearing a new hat.

Now the surprise:

```rust
pub fn sum(xs: &[f32]) -> f32 {
    xs.iter().sum()
}
```

This stays scalar: one `addss` per element. Floating-point addition is not associative (`(a + b) + c` can differ from `a + (b + c)` in the last bits), vectorizing a reduction means reordering the additions, and rustc refuses to change your program's answer for speed. Integer arithmetic wraps associatively, so integers vectorize and floats do not. If you accept the reordering, say so in code: split into `chunks_exact(8)`, keep eight accumulators, combine at the end. You performed the reassociation, the compiler vectorizes what remains, and the semantics change is visible in the diff.

## When to go explicit

`std::simd` (portable SIMD: `Simd<f32, 8>`, lane-wise ops that compile to whatever the target offers) remains nightly-only as of early 2026, years into development; watch it, do not build your product on it. On stable you have `core::arch` intrinsics per platform, guarded by runtime detection:

```rust
if is_x86_feature_detected!("avx2") {
    unsafe { sum_avx2(xs) }    // #[target_feature(enable = "avx2")]
} else {
    sum_scalar(xs)
}
```

This is the memchr pattern: ship baseline binaries, detect features once at startup, dispatch to the widest kernel the CPU supports. Since Rust 1.86, `#[target_feature]` functions can be safe to call from contexts where the feature is statically enabled, which trims the unsafe surface. And most of the time the right amount of hand-written SIMD is none: `memchr` for byte searches, `simd-json` for parsing, your regex and hash crates already carry tuned kernels written by people with instruction tables open.

Explicit SIMD pays in hot, proven kernels with parallel data shape: scanning bytes, checksums, image and audio math, the newsletter service's best candidate being something like scrubbing 50,000 email bodies for a token. It does not pay when the profiler never flagged the loop, when the compiler already vectorized it (check the asm), or when the loop is memory-bound (check by measuring). The order is fixed: flamegraph says the loop matters, Godbolt says the compiler missed it, layout says lanes are reachable, then intrinsics.

## Predict, then verify

Will `xs.iter().map(|x| x * 3).sum::<i32>()` auto-vectorize at `opt-level=3`? Will the f32 version?

Answer: the i32 version, yes: multiply by a constant and an integer add reduction vectorize cleanly, and on Godbolt you will find packed multiplies and adds, unrolled a few times. The f32 version keeps the multiplies but cannot vectorize the sum without reordering your additions, so it stays a scalar chain. Same shape, different algebra, and now you know to check rather than assume either way.
