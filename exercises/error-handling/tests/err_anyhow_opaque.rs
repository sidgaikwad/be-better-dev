//! Lesson: err-anyhow-opaque
//!
//! Red until `Context`, `ContextError`, and the collapse into
//! `SubscriptionError` exist.

use std::error::Error;

use error_handling::*;

#[test]
fn context_adds_a_layer_without_cutting_the_chain() {
    let stored: Result<(), StoreTokenError> =
        Err(StoreTokenError(DatabaseError::connection_reset()));

    let e = stored
        .context("Failed to store the confirmation token for a new subscriber.")
        .unwrap_err();

    assert_eq!(
        e.to_string(),
        "Failed to store the confirmation token for a new subscriber.",
        "the context message is what this layer says for itself"
    );

    let chain = error_chain(&*e);
    assert_eq!(chain.len(), 4, "context, storage, database, io");
    assert_eq!(chain[3], "connection reset by peer", "opaque is not the same as lossy");
}

#[test]
fn context_works_on_anything_that_can_be_boxed() {
    let sent: Result<(), EmailError> = Err(EmailError { status: 502 });
    let e = sent.context("Failed to send a confirmation email.").unwrap_err();

    assert_eq!(error_chain(&*e).len(), 2, "one blanket impl, every error type in the crate");
}

#[test]
fn the_failure_mode_a_caller_reacts_to_keeps_its_name() {
    let e = SubscriptionError::from(SubscribeError::Validation("email is empty".to_string()));

    assert!(
        matches!(&e, SubscriptionError::Validation(m) if m == "email is empty"),
        "the one mode somebody behaves differently for is the one worth enumerating"
    );
    assert!(e.source().is_none());
}

#[test]
fn everything_nobody_can_act_on_collapses_into_one_variant() {
    let internal = [
        SubscribeError::Pool(DatabaseError::connection_reset()),
        SubscribeError::InsertSubscriber(DatabaseError::connection_reset()),
        SubscribeError::StoreToken(StoreTokenError(DatabaseError::connection_reset())),
        SubscribeError::SendEmail(EmailError { status: 502 }),
    ];

    for error in internal {
        assert!(
            matches!(SubscriptionError::from(error), SubscriptionError::Unexpected(_)),
            "which internal step died is a tour of the implementation, not a contract"
        );
    }
}

#[test]
fn boxing_is_not_discarding() {
    let inner = SubscribeError::StoreToken(StoreTokenError(DatabaseError::connection_reset()));
    let before = error_chain(&inner);
    let collapsed = SubscriptionError::from(inner);

    assert_eq!(
        error_chain(&collapsed),
        before,
        "Unexpected has no vocabulary of its own, so it must not add a line either: \
         Display and source both forward, which is what transparent means"
    );
}
