//! Lesson: err-two-audiences

use error_handling::*;

#[test]
fn the_user_gets_a_status_and_that_part_was_never_broken() {
    let ok = store_token_outcome(Ok(()));
    assert_eq!(ok.status, 200);
    assert!(ok.error.is_none(), "nothing failed, so there is nothing to report");

    let failed = store_token_outcome(Err(StoreTokenError(DatabaseError::connection_reset())));
    assert_eq!(failed.status, 500, "a storage failure is nothing the user can act on");
}

#[test]
fn the_operator_gets_the_value_is_err_would_have_thrown_away() {
    let failed = store_token_outcome(Err(StoreTokenError(DatabaseError::connection_reset())));
    let error = failed.error.expect("the error value has to survive the handler");

    // Debug is the programmer-facing rendering of that same value, and the root
    // cause is still nested inside it. `is_err()` would have reduced all of
    // this to the word `true`.
    let debug = format!("{error:?}");
    assert!(
        debug.contains("connection reset by peer"),
        "the root cause must still be reachable from what the handler kept: {debug}"
    );
}
