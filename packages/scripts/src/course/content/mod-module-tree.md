In TypeScript the file system is the module system: drop `analytics.ts` into `src/` and every other file can import it. Rust cuts that link. Put this in the newsletter project:

```rust
// src/analytics.rs
fn track() { this is not even close to Rust }
```

```bash
$ cargo check
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.08s
```

Clean build. The compiler never opened the file. A file under `src/` is inert until a module declares it; rust-analyzer grays such files out with a "file not included in module tree" hint.

## The tree is declared

Every crate has a module tree, and it starts at the crate root: `src/main.rs` for a binary, `src/lib.rs` for a library (the crates lesson explained why the newsletter has both). Everything else joins through `mod`:

```rust
// src/lib.rs
pub mod configuration;
pub mod routes;
pub mod startup;
```

`mod` has two forms. Inline, the body sits in braces, which you have already met as `#[cfg(test)] mod tests { ... }`. As a declaration, `mod routes;` says "this module's body lives in a file", and the compiler accepts exactly two locations: `src/routes.rs`, or `src/routes/mod.rs`. Zero to Production uses the `mod.rs` style when chapter 3 splits the route handlers:

```rust
// src/routes/mod.rs
mod health_check;
mod subscriptions;

pub use health_check::*;
pub use subscriptions::*;
```

with the handlers in `src/routes/health_check.rs` and `src/routes/subscriptions.rs`. The directory mirrors the tree because the declarations say so, not the other way around.

## Paths name items; use renames them

Every item has one canonical path from the root, like `crate::routes::subscriptions::subscribe`. Relative paths exist too: `self::` for the current module and `super::` for the parent, which is how `mod tests` reaches the code it tests with `use super::*;`.

`use` does exactly one thing: it binds a shorter name in the current scope.

```rust
use crate::routes::subscriptions::subscribe;
```

Nothing is loaded, fetched, or executed. The item was already compiled into the crate; `use` is a rename. You could delete every `use` in the project, rewrite the code with full paths, and get an identical binary.

Two TypeScript differences worth internalizing:

- An `import` resolves a file and runs its top-level statements the first time it is reached, so module initialization order is real behavior. Rust modules contain only items (`fn`, `struct`, `impl`, `mod`, ...), never statements. There is nothing to run and no init order to reason about.
- Circular imports in TypeScript hand you a partially initialized module at runtime. Inside one crate, `crate::a` and `crate::b` may call into each other freely: the crate compiles as a single unit, so in-crate cycles are a non-event. The cycle ban you met earlier applies between crates, where cargo enforces it.

## One level deeper

The crate, not the file, is the unit of compilation, which the inner-dev-loop lesson already used: touch one file and the whole crate re-checks. Module boundaries are a compile-time structure for naming and, next lesson, visibility; they cost nothing at runtime, and the optimizer inlines across them freely. Splitting an 800-line `domain.rs` into four files changes nothing about the generated code. File layout in Rust is an editing convenience; the API is shaped elsewhere.

## Predict, then verify

`src/routes/mod.rs` contains `mod subscriptions;`. Which file locations will the compiler accept for the module body, and does moving that declaration into `src/lib.rs` change them?

Answer: declared from `src/routes/mod.rs`, the body must be `src/routes/subscriptions.rs` or `src/routes/subscriptions/mod.rs`; candidates are relative to the declaring module's directory. Declared from the crate root instead, the compiler looks for `src/subscriptions.rs` or `src/subscriptions/mod.rs`. Same keyword, different position in the tree, different files, which is why "where is this module mounted" is the first question to ask when a path like `crate::routes::subscriptions` fails to resolve.
