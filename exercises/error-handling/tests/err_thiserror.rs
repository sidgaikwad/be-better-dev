//! Lesson: err-thiserror
//!
//! Red until `SubscribeError` has the two impls the derive would have written
//! for it. Every assertion here is one the generated code would satisfy.

use std::error::Error;

use error_handling::*;

#[test]
fn a_validation_message_displays_as_itself() {
    let e = SubscribeError::Validation("email is empty".to_string());

    assert_eq!(e.to_string(), "email is empty", "this is all `#[error(\"{{0}}\")]` means");
    assert!(
        e.source().is_none(),
        "String does not implement Error, so the message is its own root cause. \
         That absence is what leaving `#[source]` off a field encodes"
    );
}

#[test]
fn two_operations_that_fail_alike_still_read_differently() {
    let pool = SubscribeError::Pool(DatabaseError::connection_reset());
    let insert = SubscribeError::InsertSubscriber(DatabaseError::connection_reset());

    assert_ne!(
        pool.to_string(),
        insert.to_string(),
        "the operator has to be able to tell which step died, which is the whole \
         reason these are two variants and not one"
    );
    assert!(pool.source().is_some(), "the wrapped DatabaseError is the cause of both");
    assert!(insert.source().is_some());
}

#[test]
fn wrapping_a_layer_carries_its_whole_chain_up() {
    let e = SubscribeError::StoreToken(StoreTokenError(DatabaseError::connection_reset()));
    let chain = error_chain(&e);

    assert_eq!(chain.len(), 4, "subscription, storage, database, io: one line per layer");
    assert_eq!(chain[0], e.to_string(), "this layer's own sentence comes first");
    assert_eq!(chain[3], "connection reset by peer", "root cause last");
}

#[test]
fn a_variant_over_a_root_cause_adds_exactly_one_link() {
    let e = SubscribeError::SendEmail(EmailError { status: 502 });
    let chain = error_chain(&e);

    assert_eq!(chain.len(), 2);
    assert_eq!(chain[1], "the email API responded with 502");
}
