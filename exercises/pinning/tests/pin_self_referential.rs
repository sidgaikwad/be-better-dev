//! Lesson: pin-self-referential
//!
//! The abstract danger, made concrete. Every assertion here compares addresses
//! as integers; nothing follows the stale pointer, because following it is the
//! undefined behaviour the rest of the section exists to prevent.

use pinning::*;

#[test]
fn linking_points_a_field_at_the_field_beside_it() {
    let mut issue = SelfRef::new("issue 6");
    assert!(!issue.is_intact(), "nothing has been recorded yet, so there is nothing to be wrong");

    issue.link();

    assert_eq!(
        issue.recorded_address(),
        issue.value_address(),
        "the struct now holds the address of its own field: no lifetime could name this, \
         which is why the field has to be a raw pointer"
    );
    assert!(issue.is_intact());
    assert_eq!(issue.value(), "issue 6");
}

#[test]
fn a_move_copies_the_pointer_verbatim_and_leaves_it_behind() {
    let mut issue = SelfRef::new("issue 7");
    issue.link();
    let recorded_before = issue.recorded_address();

    // One move onto the heap: a memcpy of the bytes, and nothing else. There is
    // no hook, no move constructor, no pass over the copied bytes.
    let moved = Box::new(issue);

    assert_eq!(
        moved.recorded_address(),
        recorded_before,
        "the pointer arrived at the new address unchanged, because a Rust move rewrites nothing"
    );
    assert_ne!(
        moved.value_address(),
        moved.recorded_address(),
        "the value it names is somewhere else now: this is the dangling pointer, observed \
         without being followed"
    );
    assert!(
        !moved.is_intact(),
        "reading through that pointer would be a use-after-free, which is the bug class \
         Rust exists to rule out and the reason the language answers with a compile error"
    );
}

#[test]
fn nothing_is_broken_before_the_self_reference_exists() {
    let fresh = SelfRef::new("issue 8");

    // The same move as above, and this time it is completely safe: the value is
    // in its start state, exactly like a future that has never been polled.
    let mut settled = Box::new(fresh);
    settled.link();

    assert!(
        settled.is_intact(),
        "the danger window opens when the self-reference is created, not before, which is \
         why you can return futures from functions and hand them to a runtime"
    );
}

#[test]
fn moving_the_handle_is_not_moving_the_value() {
    let mut boxed = Box::new(SelfRef::new("issue 9"));
    boxed.link();
    let lives_at = boxed.value_address();

    let travelled = boxed; // the handle moves; the allocation does not

    assert_eq!(travelled.value_address(), lives_at, "three words moved, the value stayed put");
    assert!(
        travelled.is_intact(),
        "one owner per value again: giving a self-referential value a heap home makes its \
         address survive every later move of the handle, which is the whole idea behind Box::pin"
    );
}
