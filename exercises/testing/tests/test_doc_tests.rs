//! Lesson: test-doc-tests
//!
//! This file checks what `slugify` does. The other half of the exercise is not
//! here: it is the doc example you add to the function's own comment in
//! `src/lib.rs`, which `cargo test --doc` compiles and runs against the public
//! API exactly as this file does.

use testing_exercises::*;

#[test]
fn a_title_becomes_a_slug() {
    assert_eq!(slugify("Hello, World!"), "hello-world");
    assert_eq!(slugify("Zero To Production"), "zero-to-production");
}

#[test]
fn a_run_of_separators_collapses_to_one_dash() {
    assert_eq!(
        slugify("  Rust  &  Tests  "),
        "rust-tests",
        "one dash per run of noise, not one per character"
    );
}

#[test]
fn the_edges_are_trimmed() {
    assert_eq!(slugify("!!! Ship it !!!"), "ship-it");
    assert_eq!(slugify("---"), "");
    assert_eq!(slugify(""), "");
}

/// The ASCII-only rule, asserted rather than assumed. A limitation you can
/// state in a doc example is one your users find before they hit it, and the
/// example proving it cannot go stale, because `cargo test` runs it.
#[test]
fn non_ascii_letters_are_treated_as_separators() {
    assert_eq!(slugify("Café Rust"), "caf-rust");
}

/// Doc tests only run for library targets. A project that lives entirely in
/// `main.rs` has documentation nobody executes, which is one more reason the
/// integration lesson's lib/bin split is worth doing on day one.
#[test]
fn a_doc_test_sees_only_the_public_api() {
    // Whatever your example asserts, it has to reach the function this way,
    // through the crate's public path. If that import is awkward to write, the
    // example has found an API problem before any user did.
    let public_path: fn(&str) -> String = testing_exercises::slugify;
    assert_eq!(public_path("Doc Tests"), "doc-tests");
}
