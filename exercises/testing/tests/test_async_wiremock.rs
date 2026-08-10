//! Lesson: test-async-wiremock
//!
//! `wiremock` and `tokio` are not available here, so this is the same idea one
//! layer up: instead of a real HTTP server on a random port impersonating
//! Postmark, an in-process fake implementing the trait that stands between the
//! code and the network.
//!
//! The trade is worth naming. wiremock keeps `reqwest` configuration, URL
//! joining, header encoding, JSON serialization and status parsing in the test,
//! and simulates only the remote party. A trait-level fake bypasses all of
//! that, so a URL-joining bug survives this suite. What carries over unchanged
//! is everything below: scripting a response, recording the calls, and hanging
//! the verdict on `Drop`.

use testing_exercises::*;

fn unconfirmed() -> Subscriber {
    Subscriber {
        name: "Ursula".to_string(),
        email: "ursula@example.com".to_string(),
        confirmed: false,
    }
}

#[test]
fn one_email_goes_to_the_subscriber() {
    let sender = FakeEmailSender::new();

    confirm_subscription(&sender, &unconfirmed()).expect("this fake accepts everything");

    let sent = sender.sent();
    assert_eq!(sent.len(), 1, "exactly one confirmation, not zero and not two");
    assert_eq!(sent[0].to, "ursula@example.com");
    assert_eq!(sent[0].subject, "Please confirm your subscription");
    assert!(
        sent[0].body.contains("Ursula"),
        "the body should address the subscriber, got {:?}",
        sent[0].body
    );
}

/// Asserting on what was *not* sent is half of what a recording fake is for.
/// A test that only checks the return value cannot tell a skipped email from a
/// sent one.
#[test]
fn an_already_confirmed_subscriber_is_left_alone() {
    let sender = FakeEmailSender::new();
    let subscriber = Subscriber { confirmed: true, ..unconfirmed() };

    confirm_subscription(&sender, &subscriber).expect("nothing to do is not a failure");

    assert!(sender.sent().is_empty(), "no second confirmation for a confirmed subscriber");
}

/// The scripted failure, wiremock's `ResponseTemplate::new(500)`. The call is
/// still recorded, because it still happened: "did we even try?" is the first
/// question asked about a delivery that failed.
#[test]
fn the_senders_failure_becomes_the_callers_failure() {
    let sender = FakeEmailSender::failing("postmark returned 500");

    let error = confirm_subscription(&sender, &unconfirmed())
        .expect_err("a failing sender must not be reported as success");

    assert_eq!(error, "postmark returned 500", "propagate it, do not rewrite it");
    assert_eq!(sender.sent().len(), 1, "the request was made; only the response failed");
}

#[test]
fn a_met_expectation_passes_quietly() {
    let sender = FakeEmailSender::new().expect(1);
    confirm_subscription(&sender, &unconfirmed()).unwrap();
    // The check runs when `sender` is dropped, at the end of this function.
}

/// The lesson's "predict, then verify", made executable. Nothing in this test
/// asserts anything, and it still fails: the verdict lands after the last line,
/// when the fake is dropped and finds an expectation nobody met.
///
/// Deterministic destruction is what makes that reliable. Drop runs exactly
/// when the value leaves scope, so the check cannot be forgotten or reordered,
/// and a garbage collected language could not promise the timing.
#[test]
#[should_panic(expected = "expected 1 email(s), the fake received 0")]
fn an_unmet_expectation_fails_the_test_at_drop() {
    let sender = FakeEmailSender::new().expect(1);
    let subscriber = Subscriber { confirmed: true, ..unconfirmed() };

    confirm_subscription(&sender, &subscriber).unwrap();
}

/// An expectation of zero is a real assertion too: prove the code stayed off
/// the network entirely.
#[test]
fn expecting_nothing_is_an_assertion() {
    let sender = FakeEmailSender::new().expect(0);
    let subscriber = Subscriber { confirmed: true, ..unconfirmed() };
    confirm_subscription(&sender, &subscriber).unwrap();
}
