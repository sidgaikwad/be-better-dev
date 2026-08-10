//! Lesson: mod-doc-tests
//!
//! The example in `preview`'s doc comment is a test. `cargo test` extracts it,
//! compiles it as its own crate against this library, and runs it, which is why
//! a Rust README example cannot rot the way every other one does.
//!
//! These assertions repeat the same claims here, plus the two the example does
//! not show. A doc test is written to be read, so it stays short and states the
//! common case; the exhaustive cases belong in `tests/`, where nobody is reading
//! them for documentation.

use modules_api_design::*;

#[test]
fn a_body_that_fits_comes_back_unchanged() {
    assert_eq!(preview("hi", 7), "hi");
    assert_eq!(preview("welcome", 7), "welcome", "exactly at the limit still fits");
}

#[test]
fn a_longer_body_is_cut_and_marked() {
    assert_eq!(preview("welcome aboard", 7), "welcome...");
}

#[test]
fn previews_count_characters_not_bytes() {
    // Eleven characters, thirteen bytes. `&body[..5]` would answer "héll"
    // here, and on a different input it would panic on a char boundary.
    assert_eq!(preview("héllo wörld", 5), "héllo...");
}

#[test]
#[should_panic(expected = "max_chars must be greater than zero")]
fn a_zero_width_preview_is_a_caller_bug() {
    // The `# Panics` section is part of the contract, so the suite asserts it
    // like any other claim. clippy's missing_panics_doc lint exists to make
    // sure the section is there in the first place.
    let _ = preview("anything", 0);
}
