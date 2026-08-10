//! Lesson: traits-capability-contracts
//!
//! This file does not compile until `Postcard` has an `impl EmailClient` block.
//! That is one of the exercises: the error is the lesson. Work the others with
//! `cargo test --test traits_bounds_and_where` and friends while this one is
//! red.

use traits_and_generics::*;

fn recipients() -> Vec<String> {
    vec![
        String::from("ada@example.com"),
        String::from("grace@example.com"),
        String::from("alan@example.com"),
    ]
}

#[test]
fn one_required_method_buys_the_whole_surface() {
    let client = RecordingClient::new();
    client.send("ada@example.com", "Welcome", "You are in").unwrap();
    assert_eq!(client.calls(), vec!["ada@example.com"]);

    // `send_to_all` was never written for RecordingClient. It arrived with the
    // impl block, already expressed in terms of `send`.
    let client = RecordingClient::new();
    client.send_to_all(&recipients(), "Welcome", "You are in").unwrap();
    assert_eq!(
        client.calls(),
        vec!["ada@example.com", "grace@example.com", "alan@example.com"],
        "the default method loops, so each recipient is its own call"
    );
}

#[test]
fn the_default_method_stops_at_the_first_failure() {
    let client = RecordingClient::new();
    let list = vec![
        String::from("ada@example.com"),
        String::from("not-an-address"),
        String::from("grace@example.com"),
    ];

    let error = client.send_to_all(&list, "Welcome", "You are in").unwrap_err();
    assert!(error.reason.contains("not-an-address"), "the error names what the provider refused");
    assert_eq!(
        client.calls(),
        vec!["ada@example.com"],
        "`?` returned at the first Err, so the third recipient was never attempted"
    );
}

#[test]
fn an_override_is_invisible_to_callers() {
    let client = Postmark::new("secret-token");
    client.send_to_all(&recipients(), "Welcome", "You are in").unwrap();
    assert_eq!(
        client.calls(),
        vec!["ada@example.com,grace@example.com,alan@example.com"],
        "Postmark overrode send_to_all with one batch call, and the signature never changed"
    );
}

#[test]
fn a_failed_send_reports_rather_than_records() {
    let client = Postmark::new("");
    let error = client.send("ada@example.com", "Welcome", "You are in").unwrap_err();
    assert_eq!(error, SendError::new("missing API token"));
    assert!(client.calls().is_empty(), "nothing was delivered, so nothing was recorded");
}

#[test]
fn opting_in_is_the_only_door() {
    // Postcard already had a `send` with the trait's exact signature, and it
    // counted for nothing. Rust traits are nominal: this line compiles because
    // an impl block exists, and for no other reason.
    assert!(Postcard.send_to_all(&recipients(), "Welcome", "You are in").is_ok());
}
