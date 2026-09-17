Every Rust performance thread eventually posts this:

```toml
[profile.release]
lto = "fat"
codegen-units = 1
panic = "abort"
```

and calls it free speed. None of it is free. Each line trades something: compile time, portability, or a language feature. This lesson is the price list, so each knob can be an experiment with a criterion number attached instead of a ritual.

## The one non-negotiable

`cargo build --release` versus a debug build is worth 10x to 100x and is not optional. Debug builds use opt-level 0, keep debug assertions and integer overflow checks, and inline nothing, so the iterator chains that "Zero-cost: tested, not asserted" showed compiling down to tight loops instead stay as dozens of real function calls. Every knob below adjusts single-digit percentages on top of this one order-of-magnitude decision.

## Codegen units and LTO

Release builds split each crate into 16 codegen units so LLVM can optimize them in parallel. The seams cost inlining opportunities. `codegen-units = 1` removes the seams within a crate: typically 0% to 5% faster, noticeably slower to compile.

LTO widens the same idea across crates. The default (`lto = false`) already runs thin LTO across the units of each single crate. `lto = "thin"` extends it across your whole dependency graph at modest link-time cost; `lto = "fat"` merges everything into one unit for maximum inlining and can multiply link time by several fold for, frequently, another fraction of a percent. Note what the monomorphization lesson implies here: generic calls are already specialized into your crate, so LTO mostly earns its keep on non-generic boundaries like calls into pre-compiled dependency code. Whether your program has hot paths shaped like that is not knowable from a forum post. Measure thin, measure fat, keep what pays.

## target-cpu, and where the binary will run

By default rustc targets baseline x86-64: SSE2, no AVX, so the binary runs on any 64-bit x86 made this millennium. `-C target-cpu=native` compiles for the exact CPU doing the compiling, unlocking AVX2, FMA, and friends. The catch is in the name: run that binary on an older machine and it dies with SIGILL, an illegal-instruction crash, the moment it hits an instruction the CPU lacks. Build on a new CI runner, deploy to an older fleet node, and you have shipped a crash. For fleets you control, the named microarchitecture levels (`-C target-cpu=x86-64-v3`, roughly 2013+ CPUs with AVX2) state the requirement explicitly instead of inheriting whatever CI hardware you bought.

Profile-guided optimization goes one step further: compile an instrumented binary, run it under representative load, recompile using the recorded branch and call frequencies. `cargo-pgo` automates the dance. Gains of 5% to 15% on large branchy programs are typical, rustc itself ships PGO-built, and the cost is a doubled build pipeline plus a "representative workload" you must now maintain. Know it exists; reach for it after the cheaper knobs are exhausted.

## The other direction: size

`opt-level = "z"`, `lto = true`, `codegen-units = 1`, `strip = true`, and `panic = "abort"` can shrink a binary severalfold, which matters for containers, embedded, and wasm. But `panic = "abort"` changes semantics, not just size: no unwinding means `catch_unwind` cannot catch, and a tokio task that panics no longer becomes a `JoinError` for its supervisor. The fault-tolerance section's worker survived a poison job by isolating the panic to one task; with `panic = "abort"` that same job kills the entire worker process. A build flag reached into your failure model. That is the recurring lesson of this whole family of knobs: nothing here is free, everything here is measurable, so measure.

## Predict, then verify

You build the worker with `-C target-cpu=native` on your 2024 laptop with AVX-512, containerize it, and deploy to an aging Xeon node without AVX-512. What happens?

Answer: it crashes with SIGILL, possibly at startup, possibly minutes later when the first AVX-512 codepath executes, which is the crueler version. Nothing in `docker run` checks CPU features; the instruction simply faults. Fleet builds pin an explicit level like `x86-64-v3` chosen from the oldest CPU you must support.
