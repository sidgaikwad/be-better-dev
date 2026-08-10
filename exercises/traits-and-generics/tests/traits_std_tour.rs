//! Lesson: traits-std-tour
//!
//! Three of the four exercises here are a missing derive, so this file does not
//! compile until they are all present. Read the errors in order; each one names
//! the trait it wants.

use std::collections::HashMap;

use traits_and_generics::*;

#[test]
fn debug_is_derived_and_display_is_decided() {
    let error = SubscribeError::InvalidEmail(String::from("no @ sign"));
    assert_eq!(format!("{error:?}"), "InvalidEmail(\"no @ sign\")", "Debug is a mechanical dump");
    assert_eq!(format!("{error}"), "invalid subscriber email: no @ sign");
    assert_eq!(
        error.to_string(),
        "invalid subscriber email: no @ sign",
        "to_string was never implemented here: std's blanket impl over Display supplies it"
    );

    let error = SubscribeError::SendFailed(String::from("missing API token"));
    assert_eq!(error.to_string(), "failed to send confirmation: missing API token");
}

#[test]
fn default_lets_a_caller_name_only_what_differs() {
    let policy = RetryPolicy { attempts: 3, ..Default::default() };
    assert_eq!(policy.attempts, 3);
    assert_eq!(policy.backoff_ms, 0, "the derive asked u64 for its own default");
    assert!(!policy.jitter, "and bool for its own");
}

#[test]
fn equal_keys_must_hash_equally() {
    let mut delivered: HashMap<SubscriberKey, u32> = HashMap::new();
    delivered.insert(SubscriberKey::new("ada@example.com", 1), 3);

    assert_eq!(
        delivered.get(&SubscriberKey::new("ada@example.com", 1)),
        Some(&3),
        "a separately built but equal key finds the entry, because Eq and Hash agree"
    );
    assert_eq!(
        delivered.get(&SubscriberKey::new("ada@example.com", 2)),
        None,
        "a different list id is a different key"
    );
}

#[test]
fn a_derived_partial_eq_inherits_the_floats_answer() {
    assert_eq!(OpenRate { value: 0.25 }, OpenRate { value: 0.25 });

    let nan = OpenRate { value: f64::NAN };
    assert_ne!(nan, nan, "IEEE 754 says NaN equals nothing, so this value does not equal itself");
    // Which is exactly why adding Eq to that derive list would not compile: Eq
    // is the marker promising the reflexivity the line above just disproved.
}
