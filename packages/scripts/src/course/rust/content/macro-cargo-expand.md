The first lesson in this section placed macro expansion early in the compile pipeline: everything after it, type checking included, sees only expanded code. So when a macro's behavior or error message stops making sense, the move is not to reason harder about what it probably generates. Look at what it generates.

## cargo expand, the x-ray

```bash
cargo install cargo-expand
rustup toolchain install nightly
```

`cargo expand` drives `-Zunpretty=expanded`, a nightly-only pretty-printing mode, so a nightly toolchain must be installed alongside stable. Your project stays on stable; the tool reaches for nightly by itself.

```bash
cargo expand                        # the whole crate
cargo expand routes::subscriptions  # one module, usually what you want
```

Point it at a derive from the newsletter service:

```rust
#[derive(Debug, Clone)]
pub struct ConfirmationLink(pub String);
```

Here is the `Clone` part of the output:

```rust
#[automatically_derived]
impl ::core::clone::Clone for ConfirmationLink {
    #[inline]
    fn clone(&self) -> ConfirmationLink {
        ConfirmationLink(::core::clone::Clone::clone(&self.0))
    }
}
```

Two reading habits transfer to every expansion you will ever open. Paths are fully qualified (`::core::clone::Clone`) so generated code works no matter what the call site imported, the same habit the `context!` macro practiced last lesson. And `#[automatically_derived]` flags the impl to the compiler and its lints as generated rather than handwritten.

## Reading a macro error

Derive serde on a struct with an unserializable field and the diagnostic is a specimen worth dissecting:

```rust
#[derive(serde::Serialize)]
pub struct HealthReport {
    status: String,
    started_at: std::time::Instant,
}
```

```
error[E0277]: the trait bound `Instant: Serialize` is not satisfied
 --> src/routes/health.rs:1:10
  |
1 | #[derive(serde::Serialize)]
  |          ^^^^^^^^^^^^^^^^ the trait `Serialize` is not implemented for `Instant`
  |
  = note: this error originates in the derive macro `serde::Serialize`
```

Read it in three passes. The span points at _your_ code, the derive, because the compiler maps errors in generated code back to the invocation that produced them. The trait bound names the real problem: the generated impl serializes every field, and `Instant` has no serialized form (a monotonic clock reading means nothing on another machine). The note names which macro's output tripped. When those three are not enough, `cargo expand` the module and read the generated code as ordinary Rust; on nightly, `-Z macro-backtrace` traces the expansion itself.

## What expansion costs

Procedural macros bill the build three ways. Cold builds first compile the macro crate and its dependency stack; `syn`, the parsing library nearly all proc macros share, is a famous line item in cold-build time. Then every build runs every expansion. Then the type checker chews the output, and generated code is real code: a derive on a forty-field struct costs what forty fields of handwritten impl would.

`sqlx::query!` adds a fourth: it needs schema truth while compiling, either a live database at `DATABASE_URL` or the offline cache that `cargo sqlx prepare` writes into `.sqlx/`, which is how CI compiles the newsletter service without a Postgres running. When build time matters, `cargo build --timings` renders a timeline of where the minutes went, macro crates included.

None of this bills runtime. There is no interpreter and no reflection in the shipped binary; by the time the program runs, expansion has left nothing behind but ordinary Rust.

## Predict, then verify

Before running `cargo expand` on the `ConfirmationLink` snippet above: how many impl blocks appear in the output, and does the `struct` definition itself look any different?

Answer: two impl blocks, one per derive, `Debug` and `Clone`, each generated independently and marked `#[automatically_derived]`, while the struct is reprinted unchanged. Derives append and never edit, which is why stacking five of them composes without interference, and why adding one can never change your type's fields or layout.
