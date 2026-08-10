//! Lesson: traits-bounds-and-where

use traits_and_generics::*;

#[test]
fn one_signature_serves_every_type_that_opted_in() {
    let fake = RecordingClient::new();
    send_confirmation(&fake, "ada@example.com").unwrap();
    assert_eq!(fake.calls(), vec!["ada@example.com"]);

    let postmark = Postmark::new("secret-token");
    send_confirmation(&postmark, "grace@example.com").unwrap();
    assert_eq!(postmark.calls(), vec!["grace@example.com"]);

    // The bound is a contract in both directions: this call is rejected at the
    // call site, not somewhere inside the body, because String never opted in.
    // send_confirmation(&String::from("not a client"), "ada@example.com");
}

#[test]
fn the_bound_a_comparison_needs() {
    assert_eq!(*largest(&[3, 7, 2]), 7);
    assert_eq!(*largest(&[2.5, 0.5]), 2.5, "floats compare, which is why PartialOrd is enough");
    assert_eq!(*largest(&["ada", "grace", "alan"]), "grace", "strings compare lexically");
}

#[test]
fn a_generic_gets_exactly_the_capabilities_it_asked_for() {
    assert_eq!(delivery_label(&42), "42 (42)");
    assert_eq!(
        delivery_label(&String::from("ada")),
        "ada (\"ada\")",
        "Debug quotes a string and Display does not, which is the point of having both"
    );
}
