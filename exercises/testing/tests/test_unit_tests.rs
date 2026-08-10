//! Lesson: test-unit-tests
//!
//! The unit tests you write live in `src/lib.rs`, inside `#[cfg(test)] mod
//! tests`. This file checks the same function from outside, so the exercise
//! stays honest: your module cannot pass by asserting nothing.

use testing_exercises::*;

#[test]
fn a_name_is_trimmed_not_rejected() {
    assert_eq!(
        parse_subscriber_name("  Ursula  ").unwrap(),
        "Ursula",
        "surrounding whitespace is a formatting accident, not a bad name"
    );
}

#[test]
fn each_rule_reports_itself() {
    assert_eq!(
        parse_subscriber_name("   ").unwrap_err(),
        "subscriber name cannot be empty",
        "whitespace-only is empty once trimmed, and should say so"
    );
    assert_eq!(
        parse_subscriber_name(&"a".repeat(257)).unwrap_err(),
        "subscriber name is longer than 256 characters"
    );
    assert_eq!(
        parse_subscriber_name("Ursula</b>").unwrap_err(),
        "subscriber name contains the forbidden character '<'",
        "the message names the character, so the caller can fix its input"
    );
}

#[test]
fn the_length_rule_is_inclusive() {
    let name = "a".repeat(256);
    assert!(
        parse_subscriber_name(&name).is_ok(),
        "256 characters is the limit, not the first value past it"
    );
}

/// A `#[test]` function may return `Result`, which is what makes `?` usable
/// inside one. An `Err` return fails the test just as a panic does.
#[test]
fn a_test_may_return_result() -> Result<(), String> {
    let name = parse_subscriber_name("  Ursula  ")?;
    assert_eq!(name, "Ursula");
    Ok(())
}

#[test]
fn a_percentage_is_a_percentage() {
    assert_eq!(percentage_of(3, 4), 75.0);
    assert_eq!(percentage_of(0, 7), 0.0);
}

/// `expected` is a substring match against the panic message. Without it, any
/// panic at all satisfies `#[should_panic]`, including an unrelated bug that
/// fired earlier for the wrong reason.
#[test]
#[should_panic(expected = "whole must not be zero")]
fn dividing_by_zero_panics_with_a_message_that_says_why() {
    percentage_of(1, 0);
}

/// The same panic, caught by hand. This is what `#[should_panic]` does for you,
/// and seeing the payload makes clear what `expected` is matching against: the
/// message the panic carried, not the name of the function that raised it.
#[test]
fn the_panic_payload_carries_the_message() {
    let result = std::panic::catch_unwind(|| percentage_of(1, 0));
    let payload = result.expect_err("percentage_of(1, 0) is supposed to panic");
    let message = payload
        .downcast_ref::<String>()
        .map(String::as_str)
        .or_else(|| payload.downcast_ref::<&str>().copied())
        .unwrap_or("<not a string payload>");
    assert!(
        message.contains("whole must not be zero"),
        "a should_panic(expected = ...) test matches on this string, and got {message:?}"
    );
}
