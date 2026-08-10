//! Lesson: unsafe-raw-pointers

use unsafe_and_ffi::*;

#[test]
fn making_a_pointer_is_safe_and_following_one_is_not() {
    let v = vec![10i32, 20, 30];
    let (start, end) = bounds(&v);

    // Creating, comparing and printing addresses took no keyword anywhere in
    // this test. A wrong address in a variable harms nothing.
    assert!(!start.is_null());
    assert_ne!(start, end);
    assert_ne!(format!("{start:?}"), String::new());

    // SAFETY: start points at v[0], which is live, initialized and aligned for
    // the whole test, and nothing writes to v while this read happens.
    assert_eq!(unsafe { *start }, 10, "only the dereference needed the block");
}

#[test]
fn arithmetic_counts_elements_not_bytes() {
    let v = vec![10i32, 20, 30];
    let (start, end) = bounds(&v);
    assert_eq!(
        end.addr() - start.addr(),
        3 * std::mem::size_of::<i32>(),
        "add(3) moved three elements, which is twelve bytes for i32"
    );
}

#[test]
fn one_past_the_end_is_a_finish_line_not_an_element() {
    let v: Vec<i32> = Vec::new();
    let (start, end) = bounds(&v);
    assert_eq!(start, end, "an empty slice ends where it starts, so a walk reads nothing");

    // `end` for the non-empty case is a perfectly legal pointer to hold and
    // compare. It is the address a slice iterator stops at, and reading it
    // would be out of bounds of the allocation: undefined behavior, with no
    // symptom at all on most runs.
    let v = vec![1i32, 2];
    let (start, end) = bounds(&v);
    assert!(end > start);
}
