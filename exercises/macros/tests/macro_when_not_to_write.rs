//! Lesson: macro-when-not-to-write
//!
//! Two exercises, one on each side of the line. `largest` is the case where a
//! generic already does the job. `impl_wire_tag!` is the legitimate residue: a
//! per-type constant that no generic can express.

use macros_exercises::*;

#[test]
fn a_generic_covers_every_ordered_type() {
    assert_eq!(largest(&[3, 9, 2]), Some(&9));
    assert_eq!(largest(&["ada", "grace", "alan"]), Some(&"grace"));
    assert_eq!(largest::<i32>(&[]), None, "an empty slice has no largest item");

    // One definition served both element types, and it did so with a signature
    // the compiler checked once, at the definition, rather than once per call.
}

#[test]
fn one_definition_generates_an_impl_per_type() {
    assert_eq!(<u8 as WireTag>::TAG, "u8");
    assert_eq!(<bool as WireTag>::TAG, "bool");
    assert_eq!(<String as WireTag>::TAG, "string");

    // The default method on the trait reads the constant, so this only works if
    // the generated impl really is an impl and not something adjacent to one.
    assert_eq!(7u8.tag(), "u8");
    assert_eq!(true.tag(), "bool");
}

/// A downstream crate implementing the trait for a type of its own, from a
/// module that has imported nothing. This is what `#[macro_export]` plus
/// `$crate::` buys, and it is the reason the standard library can implement
/// traits for tuples with an internal macro without leaking anything.
mod downstream {
    pub struct Digest;

    macros_exercises::impl_wire_tag! {
        Digest => "digest",
    }
}

#[test]
fn the_macro_travels_to_the_crates_that_call_it() {
    assert_eq!(
        downstream::Digest.tag(),
        "digest",
        "the expansion landed in another module and still found its own trait"
    );
}
