//! Lesson: shared-references

use borrowing_and_lifetimes::*;

#[test]
fn shared_borrows_accept_every_caller() {
    let owned = String::from("ferris");
    // One signature, three shapes of argument. That is what &str buys.
    assert_eq!(text_len(&owned), 6);
    assert_eq!(text_len("literal"), 7);
    assert_eq!(text_len(&owned[0..3]), 3);
    // Nothing moved: the caller still owns its String.
    assert_eq!(owned, "ferris");
}
