Three words carry most of Rust's project structure: crate, edition, workspace.

## Crates

A crate is the unit of compilation: the compiler takes one crate at a time and produces one artifact, either a library or a binary. A package (what `Cargo.toml` describes) can contain at most one library crate and any number of binary crates. `src/lib.rs` is the library root, `src/main.rs` the default binary root.

This split becomes load-bearing in chapter 3 of the book: integration tests and the binary both link against the _library_, so almost all application code lives in `lib.rs` and `main.rs` shrinks to a thin entry point calling into it. Structure your project for testability from day one, and the compiler's crate model is what makes that possible.

## Editions

An edition (`2015`, `2018`, `2021`, `2024`) is Rust's mechanism for making breaking syntax changes without breaking anyone. Each crate declares its edition in `Cargo.toml`, the compiler honours it per crate, and crates on different editions link together freely. New keywords like `async` could become keywords in edition 2018 because edition 2015 crates keep compiling with the old rules, forever.

Editions change surface syntax and defaults, never the runtime or the standard library's behavior. Upgrading is mechanical: `cargo fix --edition` rewrites what needs rewriting.

## Features

A dependency can expose optional functionality behind _feature flags_:

```toml
[dependencies]
sqlx = { version = "0.8", features = ["postgres", "macros", "migrate"] }
```

Features are additive switches that compile extra code into the dependency. The book leans on this heavily: `sqlx` alone needs half a dozen features chosen deliberately. When a crate's documentation mentions functionality you cannot find, the first suspect is a feature you have not enabled.

## Workspaces

A workspace is several packages sharing one `Cargo.lock` and one `target/` directory:

```toml
[workspace]
members = ["api", "worker", "shared"]
```

One lock file means every member agrees on dependency versions. One shared `target/` means a dependency compiled for the API is already compiled for the worker. Large Rust projects are almost always workspaces of many small crates, partly for organisation and partly because the crate is the unit of incremental compilation: smaller crates, shorter rebuilds.

## Predict, then verify

Two workspace members both depend on `serde`, one asking for `1.0.190` and one for `1.0.200`. How many copies of `serde` get compiled?

Answer: one. Both requirements are semver-compatible ranges, so the resolver unifies them to a single version satisfying both (the newer one). Two _incompatible_ majors (`0.11` and `0.12`) would genuinely compile twice, and both would exist in the binary as separate types. That is why a "why do I have two versions of X" investigation starts with `cargo tree -d`, which lists exactly these duplicates.
