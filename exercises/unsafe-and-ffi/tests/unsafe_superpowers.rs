//! Lesson: unsafe-superpowers

use unsafe_and_ffi::*;

#[test]
fn an_unsafe_fn_hands_the_obligation_to_its_caller() {
    let v = vec![10, 20, 30];
    // SAFETY: 0, 1 and 2 are all less than v.len(), which is nth's whole
    // contract. Note that the proof lives at the call site now: that is what
    // marking a function `unsafe` moves.
    unsafe {
        assert_eq!(nth(&v, 0), 10);
        assert_eq!(nth(&v, 1), 20);
        assert_eq!(nth(&v, 2), 30, "the last element is in bounds; the next index is not");
    }
}

#[test]
fn the_borrow_checker_still_runs_inside_the_block() {
    let mut v = vec![1];
    assert_eq!(append_two(&mut v, 2, 3), 3);
    assert_eq!(v, vec![1, 2, 3], "sequencing the borrows is the only version that compiles");
}

#[test]
#[should_panic(expected = "index out of bounds")]
#[allow(unused_unsafe, clippy::useless_vec)]
fn a_bounds_check_inside_the_block_still_fires() {
    // A Vec rather than an array on purpose: on a fixed-size array the compiler
    // rejects `v[10]` outright, and the claim under test is about the check
    // that survives all the way to run time.
    let v = vec![10, 20, 30];
    // Nothing about this block is needed, and that is the claim being tested:
    // indexing is a safe API with a runtime check, and wrapping a safe API in
    // `unsafe` changes nothing about it. Skipping the check takes a different
    // function, `get_unchecked`, which is marked unsafe for exactly that reason.
    unsafe {
        let _ = v[10];
    }
}
