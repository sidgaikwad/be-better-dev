//! Lesson: mod-newtypes

use modules_api_design::*;

#[test]
fn parse_is_the_only_door_and_it_can_say_no() {
    let email = SubscriberEmail::parse("ursula@domain.com".to_string())
        .expect("a well formed address parses");
    assert_eq!(email.as_str(), "ursula@domain.com");

    let err = SubscriberEmail::parse("ursula.domain.com".to_string())
        .expect_err("no @, so there is nothing to parse");
    assert!(err.contains("ursula.domain.com"), "the error should name what it rejected: {err}");

    for bad in ["", "@domain.com", "ursula@", "ur sula@domain.com", "a@b@c.com"] {
        assert!(
            SubscriberEmail::parse(bad.to_string()).is_err(),
            "{bad:?} should not be able to become a SubscriberEmail"
        );
    }
}

#[test]
fn the_inner_value_comes_back_out_through_the_api_or_not_at_all() {
    let email = SubscriberEmail::parse("ursula@domain.com".to_string()).unwrap();

    assert_eq!(email.as_str(), "ursula@domain.com"); // a view: borrows self
    assert_eq!(email.into_inner(), "ursula@domain.com"); // a handover: consumes self
}

#[test]
fn a_name_is_trimmed_once_at_the_boundary() {
    let name = SubscriberName::parse("  Ada Lovelace  ".to_string())
        .expect("surrounding whitespace is normalized, not rejected");
    assert_eq!(name.as_str(), "Ada Lovelace", "the type holds the cleaned value, not a note that it was checked");

    assert!(SubscriberName::parse("a".repeat(256)).is_ok(), "256 characters is the limit, not past it");
    for bad in ["".to_string(), "   ".to_string(), "a".repeat(257), "Ada</script>".to_string()] {
        assert!(
            SubscriberName::parse(bad.clone()).is_err(),
            "{bad:?} should not be able to become a SubscriberName"
        );
    }
}

#[test]
fn two_newtypes_cannot_be_swapped() {
    let email = SubscriberEmail::parse("ursula@domain.com".to_string()).unwrap();
    let name = SubscriberName::parse("Ursula".to_string()).unwrap();

    assert_eq!(
        welcome_line(&email, &name),
        "Welcome, Ursula. Confirmations go to ursula@domain.com."
    );

    // COMPILE ERROR: error[E0308]: arguments to this function are incorrect
    //
    // Two String parameters would have accepted this happily and mailed the
    // wrong field. The types refuse it before the program runs, which is the
    // bug the lesson opens with.
    //
    // let _ = welcome_line(&name, &email);
}

// COMPILE ERROR: error[E0423]: cannot initialize a tuple struct which contains
// private fields
//
// The struct is pub and the field is not, so out here there is no way to build
// one except `parse`. Possession is proof: if a SubscriberEmail exists, the
// validation ran, and no downstream function has to check again.
//
// let forged = SubscriberEmail("whatever".to_string());

// COMPILE ERROR: error[E0616]: field `0` of struct
// `modules_api_design::SubscriberEmail` is private
//
// And no way back in through the side door either. The accessor is the only
// route, which is what keeps the invariant true for the value's whole life.
//
// let raw = SubscriberEmail::parse("ursula@domain.com".to_string()).unwrap().0;
