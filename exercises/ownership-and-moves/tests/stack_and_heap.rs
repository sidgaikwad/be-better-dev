//! Lesson: stack-and-heap

use ownership_and_moves::*;

#[test]
fn a_string_header_is_three_words() {
    assert_eq!(string_stack_size(), 24, "a String header is ptr + len + cap");
}

#[test]
fn a_literal_does_not_reach_the_allocator() {
    assert!(!literal_allocates("hello"), "a literal lives in the binary, not the heap");
}
