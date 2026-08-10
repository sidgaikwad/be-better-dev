//! Lesson: mod-signatures
//!
//! This file does not compile until both signatures widen. Every assertion is a
//! different argument shape, and the claim under test is that one signature
//! takes them all without a single clone at the call site.

use modules_api_design::*;

#[test]
fn one_bound_takes_every_string_shape() {
    let owned = String::from("  Ada Lovelace  ");

    assert_eq!(normalize_name("  Ada  "), "Ada"); // &str
    assert_eq!(normalize_name(owned.clone()), "Ada Lovelace"); // String, handed over
    assert_eq!(normalize_name(&owned), "Ada Lovelace"); // &String, still the caller's

    // The last call read the value and left it here. Under the original
    // `name: String` signature this line would not compile, and the usual fix
    // is a clone that only exists to satisfy a parameter type.
    assert_eq!(owned, "  Ada Lovelace  ");
}

#[test]
fn a_slice_is_the_front_door_for_contiguous_data() {
    let owned: Vec<String> = vec!["ada".into(), "grace".into(), "ursula".into()];
    let fixed = ["ada".to_string(), "grace".to_string()];

    assert_eq!(total_len(&owned), 14); // &Vec<String>, deref-coerced on the way in
    assert_eq!(total_len(&fixed), 8); // an array, which is not a Vec at all
    assert_eq!(total_len(&owned[1..]), 11); // a sub-slice, which owns nothing

    // Narrowing the parameter widened the API. `&Vec<String>` would have taken
    // the first of these three and rejected the other two, for no gain: the
    // function never needed the vector's capacity or its ability to grow.
}

// #[must_use] is a lint, not a test failure, so nothing here can assert it.
// Check it by hand instead. Add this line to a test above:
//
//     normalize_name("  Ada  ");
//
// With the attribute on the function, `cargo test` prints
//
//     warning: unused return value of `modules_api_design::normalize_name`
//     that must be used
//
// and without it, silence. That warning is the whole reason to add the
// attribute to a pure transform: the return value is the only thing the call
// produces, so discarding it is always a bug.
