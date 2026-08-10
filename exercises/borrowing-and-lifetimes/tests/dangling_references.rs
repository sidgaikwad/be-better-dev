//! Lesson: dangling-references

use borrowing_and_lifetimes::*;

#[test]
fn returning_owned_data_escapes_the_dangling_problem() {
    let greeting = build_greeting();
    assert_eq!(greeting, "hello");
    // It is owned, so it outlives the function that built it without any
    // lifetime annotation being involved.
    drop(greeting);
}
