//! Lesson: test-suite-architecture
//!
//! Test code is still code. The two things this file exercises are the two
//! things that keep a suite from decaying: shared construction of test data,
//! and a shared assertion whose failure message you can diagnose from.
//!
//! The lesson's other half is layout, one binary under `tests/api/` with
//! `mod helpers;`, which a single-file crate cannot demonstrate. The local
//! helper below is that idea in miniature: setup named once, called from
//! several tests.

use testing_exercises::*;

/// The shared fixture. In the book this is `spawn_app`, and the rule is the
/// same: everything the tests agree on lives here, and each test states only
/// what makes it different.
fn confirmed_subscriber() -> Subscriber {
    SubscriberBuilder::new().confirmed(true).build()
}

#[test]
fn the_builder_supplies_defaults() {
    let subscriber = SubscriberBuilder::new().build();
    assert_eq!(subscriber.name, "Ursula Le Guin");
    assert_eq!(subscriber.email, "ursula@example.com");
    assert!(!subscriber.confirmed, "a fresh subscriber has not confirmed yet");
}

/// A test overrides the one field it is about. Read this line and you know
/// exactly what the test depends on, which is impossible when every test spells
/// out all three fields.
#[test]
fn a_test_overrides_only_what_it_cares_about() {
    let subscriber = SubscriberBuilder::new().email("le-guin@example.com").build();
    assert_eq!(subscriber.email, "le-guin@example.com");
    assert_eq!(subscriber.name, "Ursula Le Guin", "the untouched default stands");
}

#[test]
fn the_setters_chain() {
    let subscriber = SubscriberBuilder::new()
        .name("Theodora")
        .email("theo@example.com")
        .confirmed(true)
        .build();
    assert_eq!(
        subscriber,
        Subscriber {
            name: "Theodora".to_string(),
            email: "theo@example.com".to_string(),
            confirmed: true,
        }
    );
}

#[test]
fn the_fixture_is_reusable() {
    assert!(confirmed_subscriber().confirmed);
    assert_eq!(confirmed_subscriber().name, "Ursula Le Guin");
}

#[test]
fn close_enough_is_not_a_failure() {
    assert_eq!(check_close(1.0, 1.0, 0.0), Ok(()));
    assert_eq!(check_close(1.04, 1.0, 0.05), Ok(()));
    assert_eq!(check_close(0.96, 1.0, 0.05), Ok(()), "the comparison is on the absolute difference");
    assert_eq!(
        check_close(1.5, 1.0, 0.5),
        Ok(()),
        "a difference exactly at the tolerance is within it: the comparison is <=, not <"
    );
}

/// The message is the exercise. A custom assertion earns its place by saying
/// more than `assert!(difference < tolerance)` can, and the only way to hold it
/// to that is to assert on the text.
#[test]
fn the_failure_message_carries_the_whole_diagnosis() {
    assert_eq!(
        check_close(1.2, 1.0, 0.05).unwrap_err(),
        "expected 1.000 +/- 0.050, got 1.200 (off by 0.200)",
        "every one of the four numbers could be the surprise, so name all four"
    );
}

/// Fixed precision is not decoration. The raw difference here is
/// 0.19999999999999996, and a message full of float noise is one people stop
/// reading.
#[test]
fn the_numbers_are_formatted_not_dumped() {
    let message = check_close(1.2, 1.0, 0.05).unwrap_err();
    assert!(
        !message.contains("0.19999999999999996"),
        "format the difference rather than printing it raw: {message}"
    );
}

/// `assert_close` is the same check, delivered by a panic. That is all an
/// assertion is in Rust: a test fails by panicking, so any function that
/// panics is an assertion.
#[test]
#[should_panic(expected = "off by 0.200")]
fn the_assertion_panics_with_that_message() {
    assert_close(1.2, 1.0, 0.05);
}

#[test]
fn the_assertion_is_silent_when_it_holds() {
    assert_close(1.0, 1.0, 0.001);
}
