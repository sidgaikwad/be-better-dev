//! Lesson: borrow-checker-proofs

use borrowing_and_lifetimes::*;

#[test]
fn a_borrow_ends_at_its_last_use() {
    let mut v = vec![10, 20, 30];
    assert_eq!(first_then_clear(&mut v), Some(10));
    assert!(v.is_empty(), "the vector was cleared after the read finished");

    let mut empty: Vec<i32> = Vec::new();
    assert_eq!(first_then_clear(&mut empty), None);
}
