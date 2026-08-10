//! Lesson: mod-module-tree
//!
//! This file does not compile until `src/lib.rs` mounts the `issues` module and
//! re-exports its items at the crate root. That is the exercise: the missing
//! name is the lesson. Every other lesson still runs meanwhile, so work them
//! with `cargo test --test mod_visibility` and friends.

use modules_api_design::*;

#[test]
fn a_facade_publishes_the_item_not_the_tree() {
    // `slugify` is written in src/issues/slug.rs: a private module, inside a
    // private module, inside the crate. This test can still name it, because
    // `pub use` at the crate root decoupled the public path from the internal
    // one. That is the whole facade pattern: grow whatever depth you need
    // inside, publish a flat namespace outside.
    assert_eq!(slugify("Issue #1: Ship It"), "issue-1-ship-it");
    assert_eq!(slugify("  Trailing  "), "trailing");
}

#[test]
fn where_a_module_is_mounted_decides_its_path() {
    // src/issues/slug.rs has not changed and cannot: it just reports
    // module_path!(). This string is decided entirely by the `mod` declaration
    // you wrote and where you wrote it. The directory mirrors the tree because
    // the declaration says so, not the other way around.
    assert_eq!(
        slug_module_path(),
        "modules_api_design::issues::slug",
        "mounted anywhere else, the same file would answer differently"
    );
}

// COMPILE ERROR: error[E0603]: module `issues` is private
//
// The canonical path exists, and no outside crate can walk it. That refusal is
// the feature: nothing beyond src/lib.rs depends on the file layout, so the
// tree below is free to change. Uncomment to hear the compiler say it.
//
// #[test]
// fn the_tree_is_walkable_from_outside() {
//     assert_eq!(modules_api_design::issues::slugify("Ship It"), "ship-it");
// }
