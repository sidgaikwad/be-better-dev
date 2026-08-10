//! Lesson: structs-and-impl
//!
//! This file does not compile until `Subscriber` carries the right derives.
//! That is half the exercise: the error names the trait the call site needs.
//! The other lessons still run, so work them with
//! `cargo test --test option_basics` and friends while this one is red.

use structs_enums_matching::*;

#[test]
fn the_three_receivers_do_three_different_things_to_the_caller() {
    let mut sub = Subscriber::new("ada@example.com", "Ada");

    // &self reads. Everything the caller had, it still has.
    assert_eq!(sub.domain(), Some("example.com"));
    assert!(!sub.confirmed);
    assert_eq!(sub.name, "Ada");

    // &mut self mutates in place. The binding is the same value, changed.
    sub.confirm();
    assert!(sub.confirmed, "confirm writes through the exclusive borrow");
    assert_eq!(sub.domain(), Some("example.com"), "and the subscriber survives it");

    // self consumes. This is the last use of `sub`.
    let (email, name) = sub.into_parts();
    assert_eq!(email, "ada@example.com");
    assert_eq!(name, "Ada");

    // COMPILE ERROR: error[E0382]: borrow of moved value: `sub`
    // `into_parts` took the whole struct, exactly like any by-value parameter.
    // assert_eq!(sub.name, "Ada");
}

#[test]
fn an_address_with_no_at_sign_has_no_domain() {
    let sub = Subscriber::new("grace", "Grace");
    assert_eq!(sub.domain(), None, "absence is an answer, not an empty string");
}

#[test]
fn the_derives_are_what_the_call_sites_ask_for() {
    let sub = Subscriber::new("ada@example.com", "Ada");

    // Clone: an explicit duplicate, because a String owner can never be Copy.
    let mut copy = sub.clone();
    // PartialEq for ==, Debug so a failure prints the two values.
    assert_eq!(copy, sub);

    copy.confirm();
    assert_ne!(copy, sub, "confirmed is a field, so field-by-field == notices it");
    assert!(!sub.confirmed, "the clone is a separate value; changing it changed nothing here");

    assert!(format!("{sub:?}").contains("ada@example.com"), "Debug prints the fields");
}
