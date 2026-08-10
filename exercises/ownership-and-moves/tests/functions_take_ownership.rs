//! Lesson: functions-take-ownership

use ownership_and_moves::*;

#[test]
fn receivers_are_an_ownership_contract() {
    let sub = Subscriber::new("ada@example.com", "Ada");

    // &self borrows: the subscriber is still usable afterward.
    assert_eq!(sub.domain(), "example.com");
    assert_eq!(sub.name, "Ada");

    // self consumes: this is the last use of `sub`.
    assert_eq!(sub.into_email(), "ada@example.com");
}
