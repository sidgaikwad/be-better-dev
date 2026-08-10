//! Lesson: iter-closures-capture

use iterators_closures::*;

#[test]
fn a_move_closure_outlives_what_it_captured() {
    let greet = {
        let name = String::from("Ada");
        // `name` dies at the end of this block, and the closure walks out of it
        // alive. Whatever the closure holds cannot be a borrow of `name`.
        make_greeter(name)
    };

    assert_eq!(greet(), "hello, Ada");
    // Fn, not FnOnce: calling it did not consume it.
    assert_eq!(greet(), "hello, Ada");
}

#[test]
fn two_greeters_do_not_share_state() {
    let ada = make_greeter(String::from("Ada"));
    let grace = make_greeter(String::from("Grace"));
    assert_eq!(ada(), "hello, Ada");
    assert_eq!(grace(), "hello, Grace");
}

#[test]
fn a_closure_is_a_struct_with_one_field_per_capture() {
    let (by_ref, by_val) = capture_sizes();

    assert_eq!(by_ref, 16, "two references: one to the u64, one to the String");
    assert_eq!(
        by_val, 32,
        "the u64 itself beside the String's three-word header, and the heap text stays where it is"
    );
}
