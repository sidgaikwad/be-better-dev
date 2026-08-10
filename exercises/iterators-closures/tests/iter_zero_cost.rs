//! Lesson: iter-zero-cost
//!
//! A test can only prove the two spellings agree. That they compile to the same
//! loop is the lesson's claim, and Compiler Explorer at `-C opt-level=3` is
//! where you check it: look for vector instructions, and for calls to
//! `core::panicking::panic_bounds_check` that the iterator version never emits.

use iterators_closures::*;

#[test]
fn both_spellings_agree() {
    let empty: [u64; 0] = [];
    assert_eq!(sum_index(&empty), 0);
    assert_eq!(sum_iter(&empty), 0, "an empty sum is the identity, not a panic");

    let values: Vec<u64> = (1..=1000).collect();
    assert_eq!(sum_index(&values), 500_500);
    assert_eq!(sum_iter(&values), 500_500, "same answer, and after inlining the same loop");
}

#[test]
fn a_sub_slice_sums_too() {
    let values = [10u64, 20, 30, 40];

    assert_eq!(sum_iter(&values[1..3]), 50);
    assert_eq!(
        sum_index(&values[1..3]),
        50,
        "the index loop has to range over this slice's length, not the original's"
    );
}

#[test]
fn a_single_element_is_not_a_special_case() {
    assert_eq!(sum_index(&[7]), 7);
    assert_eq!(sum_iter(&[7]), 7);
}
