//! Lesson: unsafe-miri
//!
//! Green here proves less than it looks. Once it passes, run the file under the
//! interpreter that checks the rules rather than the symptoms:
//!
//! ```bash
//! rustup +nightly component add miri
//! cargo +nightly miri test --test unsafe_miri
//! ```

use unsafe_and_ffi::*;

#[test]
fn the_walk_agrees_with_the_safe_iterator() {
    let v = vec![1, 2, 3, 4, 5];
    assert_eq!(sum_via_raw(&v), v.iter().sum::<i32>());
    assert_eq!(v.len(), 5, "the walk borrowed the slice, it did not consume it");
}

#[test]
fn miri_only_ever_sees_the_paths_a_test_runs() {
    // These are the inputs worth writing down, because a branch no test
    // executes is a branch Miri never interprets and says nothing about. The
    // empty case is the one that matters: its start pointer is aligned and
    // non-null and points at no element, so any read at all is out of bounds.
    assert_eq!(sum_via_raw(&[]), 0, "an empty slice must not dereference its start pointer");
    assert_eq!(sum_via_raw(&[7]), 7, "one element means exactly one read");
    assert_eq!(sum_via_raw(&[-3, 3]), 0);
    assert_eq!(sum_via_raw(&[i32::MIN, i32::MAX, 1]), 0);
}

#[test]
fn the_walk_reads_a_slice_it_does_not_own() {
    // A sub-slice hands the walk a start pointer that is not the allocation's
    // start and an end that is not the allocation's end. Both are inside it,
    // which is all the dereference contract asks for.
    let v = [10, 20, 30, 40];
    assert_eq!(sum_via_raw(&v[1..3]), 50);
    assert_eq!(sum_via_raw(&v[4..]), 0, "an empty tail slice still ends where it begins");
}
