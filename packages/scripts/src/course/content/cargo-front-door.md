You will not spend much quality time with `rustc`. Your interface to building, testing, and running Rust is `cargo`, and a `cargo new` gives you a complete, working project:

```bash
cargo new zero2prod
```

```
zero2prod/
  Cargo.toml
  .gitignore
  .git/
  src/
    main.rs
```

Two things are worth noticing. The project is already a git repository, out of the box. And the whole project definition fits in one small file.

## Cargo.toml is the manifest

```toml
[package]
name = "zero2prod"
version = "0.1.0"
edition = "2021"

[dependencies]
```

The `[package]` table names your _crate_. A crate is Rust's unit of compilation and distribution: a library or a binary. The `[dependencies]` table is where other people's crates enter, fetched from crates.io, the community registry.

Dependencies use semantic versioning ranges. Writing `tokio = "1"` means "any 1.x", and the exact version resolved gets pinned in `Cargo.lock`. The lock file is the reason two machines build identical binaries; commit it for applications.

## The commands you will actually use

```bash
cargo check    # type-check and borrow-check, no machine code produced
cargo build    # compile a debug binary into target/debug/
cargo run      # build if needed, then run it
cargo test     # build and run every test
cargo build --release   # optimised binary into target/release/
```

`cargo check` matters more than it looks. It runs the whole compiler front end, everything that can reject your program, and skips the expensive code generation and linking. While writing code you want the fastest possible "is this still a valid program" answer, and that is `check`, not `build`.

The `target/` directory holds every build artifact and grows without shame. It is disposable and gitignored; deleting it costs you nothing but the next compile.

## Predict, then verify

You add `serde = "1"` to `[dependencies]` and run `cargo build` twice in a row without changing anything. What does the second run do?

Answer: almost nothing. Cargo fingerprints every crate's inputs; an unchanged dependency graph means everything is already fresh, and the second build returns in milliseconds. Incremental, cached compilation is the default, not a feature you enable. This is also your first profiling instinct: when a build is slow, the question is what _changed_, because unchanged code is not recompiled.
