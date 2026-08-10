//! Lesson: lifetimes-in-structs

use borrowing_and_lifetimes::*;

#[test]
fn a_borrowing_struct_walks_without_copying() {
    let text = String::from("one two three");
    let mut parser = Parser::new(&text);

    assert_eq!(parser.remaining(), "one two three");
    assert_eq!(parser.next_word(), Some("one"));
    assert_eq!(parser.next_word(), Some("two"));
    assert_eq!(parser.remaining(), "three");
    assert_eq!(parser.next_word(), Some("three"));
    assert_eq!(parser.next_word(), None);
}
