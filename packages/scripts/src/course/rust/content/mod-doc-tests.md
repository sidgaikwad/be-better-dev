Every project has a README example that stopped compiling two refactors ago. Rust's documentation system is built so that cannot happen: examples in doc comments are code, and `cargo test` runs them.

````rust
/// A validated email address for a newsletter subscriber.
///
/// # Examples
///
/// ```
/// use zero2prod::domain::SubscriberEmail;
///
/// let email = SubscriberEmail::parse("ursula@domain.com".to_string()).unwrap();
/// assert_eq!(email.as_ref(), "ursula@domain.com");
/// ```
pub struct SubscriberEmail(String);
````

```bash
$ cargo test
   Doc-tests zero2prod

running 1 test
test src/domain/subscriber_email.rs - domain::SubscriberEmail (line 5) ... ok
```

`///` attaches markdown to the item that follows; `//!` documents the enclosing item, which is how a crate or module gets front-page prose at the top of `lib.rs` or `mod.rs`. `cargo doc --open` renders locally the same site docs.rs builds automatically for every version you ever publish.

## How doc tests keep you honest

rustdoc extracts each fenced block, wraps it in `fn main` if needed, compiles it as its own tiny crate linked against your library, and runs it. Two consequences follow from "its own crate".

First, doc tests see only your public API. An example that calls a `pub(crate)` helper fails with the E0603 from the visibility lesson, so examples cannot quietly depend on internals; they exercise exactly the paths your users will type, re-exports included (facade lesson). Second, doc tests run for library targets only. Code in `src/main.rs` gets none, one more entry on the list of reasons the binary stays thin and the logic lives in `lib.rs` (crates-editions-workspaces).

Inside an example, lines starting with `# ` compile but do not render, which hides setup noise. Intra-doc links like `[SubscriberName]` resolve by path and rustdoc lints when the target disappears. The section conventions used across std and docs.rs: the first line is a single summary sentence (item indexes show only that line), `# Examples` holds runnable usage, `# Errors` says when a `Result` comes back `Err`, `# Panics` states what panics. clippy can require the last two with `missing_errors_doc` and `missing_panics_doc`.

## Semver: the promise around pub

The cargo lesson showed dependency ranges like `validator = "0.14"` and called them a promise. Here is the promise's content. Your API is every `pub` item reachable from the crate root (visibility lesson), and semver classifies changes to it. Breaking, major bump: removing or renaming a `pub` item, changing a signature, making a field private, adding a variant to an enum that downstream code matches exhaustively (the match-exhaustive lesson showed how that breaks). Additive, minor: new `pub` items, new inherent methods. Below 1.0, cargo treats each 0.x minor as its own compatibility range, so 0.3 to 0.4 may break freely.

Tooling carries part of the load. `#[non_exhaustive]` on an enum forces downstream wildcard arms, turning future variants into minor releases. `#[deprecated(note = "use parse instead")]` warns users a release before removal. `cargo-semver-checks` diffs your public API against the previous release in CI and catches accidental breakage.

## One level deeper

The deep point: in Rust the API reference is generated from the same source the compiler checks. Signatures, visibility, re-exported paths, and examples are all verified artifacts; only the prose can lie. Read a crate's docs front page as a design document. If `pub use` has curated a handful of types with compiling examples, the author designed a surface. If the docs mirror a deep internal tree, they published a directory listing.

## Predict, then verify

A doc example on `SubscriberEmail::parse` calls `spawn_delivery_worker`, a `pub(crate)` function, to make the example realistic. What does `cargo test` report?

Answer: a failing doc test with `error[E0603]: function 'spawn_delivery_worker' is private`. The example compiles as an external consumer crate, so crate-private items do not exist for it. Make the example self-contained through public API, or move unavoidable scaffolding onto `# ` lines, which still compile but never render.
