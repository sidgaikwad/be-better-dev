While working you go through the same steps over and over: make a change, compile, run tests, run the app. The total time of that loop puts a ceiling on how fast you can iterate, so the book spends its first chapter tuning it before writing any application code. That ordering is a lesson in itself.

## Where the time goes

A Rust compile has two expensive phases: code generation (LLVM turning intermediate representation into machine code) and _linking_ (stitching every compiled object into one binary). For an incremental change in a big project, linking is often the dominant cost, because it happens at the end of every build even when only one small crate changed.

Two well-known responses:

- **Use a faster linker.** `lld` (LLVM's linker) or `mold` on Linux link several times faster than the system default. This is a build configuration change, not a code change; your program behaves identically.
- **Don't produce a binary at all.** `cargo check` skips codegen and linking entirely. Most iterations only need to know whether the program still compiles.

## Recompile on save

The book recommends `cargo-watch` to drive the loop automatically:

```bash
cargo watch -x check -x test -x run
```

This chains commands: on every file change, check first, then run tests, then start the application, stopping at the first failure. The tool has since been retired by its maintainer, and the community moved to `bacon`, which serves the same purpose with a nicer terminal interface:

```bash
bacon        # watches, runs check by default
bacon test   # watches, runs tests
```

The exact tool matters less than the shape of the loop: **save, and let the terminal tell you the state of the program without being asked.**

## A note on debug vs release

The default `cargo build` produces a _debug_ build: fast to compile, slow to run, full of debug assertions. `--release` flips the trade: slow to compile, fast to run. Benchmarks on debug builds are meaningless, routinely 10-50x slower than release. If a Rust program ever seems inexplicably slow, the first question is always: was this a debug binary?

## Predict, then verify

Your project compiles clean. You change one character inside a comment in `main.rs` and run `cargo check`. Does the compiler do real work?

Answer: yes, some. The file's fingerprint changed, so its crate is re-checked; comments are stripped early but the crate cannot know that without parsing it again. What does _not_ happen is any work on the dependency graph: every upstream crate is untouched and stays cached. The unit of recompilation is the crate, which is one reason large Rust projects split into many small ones.
