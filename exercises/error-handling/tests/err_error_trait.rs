//! Lesson: err-error-trait
//!
//! This file does not compile until `StoreTokenError` implements
//! `std::error::Error`. That is the exercise: the missing impl is the lesson.
//! Other lessons still run, so work them with
//! `cargo test --test err_two_audiences` while this one is red.

use error_handling::*;

#[test]
fn display_says_what_the_operation_meant() {
    let e = StoreTokenError(DatabaseError::connection_reset());
    let message = e.to_string();

    assert!(!message.is_empty(), "Display is the operator's one-line summary of this layer");
    assert_ne!(
        message,
        DatabaseError::connection_reset().to_string(),
        "a wrapper that only repeats its cause has added nothing to the report"
    );
}

#[test]
fn wrapping_preserves_the_chain() {
    let e = StoreTokenError(DatabaseError::connection_reset());
    let chain = error_chain(&e);

    assert_eq!(
        chain.len(),
        3,
        "three levels: this error, the database error, the io error under it. \
         Leaving the default `source` in place would leave only one"
    );
    assert_eq!(chain[0], e.to_string(), "the chain starts at the error you were handed");
    assert_eq!(chain[1], "error returned from database: connection closed mid-query");
    assert_eq!(chain[2], "connection reset by peer", "root cause last");
}

#[test]
fn a_root_cause_ends_the_walk() {
    let e = EmailError { status: 502 };
    assert_eq!(
        error_chain(&e).len(),
        1,
        "nothing underneath it, so `source` returns None and the while let never runs"
    );
}
