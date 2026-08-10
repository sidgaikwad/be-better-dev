//! Lesson: err-web-boundary

use error_handling::*;

#[test]
fn the_status_decision_lives_in_one_match() {
    assert_eq!(
        SubscriptionError::Validation("email is empty".to_string()).status(),
        400,
        "the user caused it and the user can fix it"
    );
    assert_eq!(
        SubscriptionError::Unexpected(Box::new(EmailError { status: 502 })).status(),
        500,
        "nothing the user can do about the email provider being down"
    );
}

#[test]
fn a_request_that_worked_reports_nothing() {
    let response = handle_subscribe(SubscribeSteps::all_ok());

    assert_eq!(response.status, 200);
    assert!(response.body.is_empty());
    assert!(response.log.is_none(), "no failure, no error record");
}

#[test]
fn bad_input_tells_the_user_how_to_fix_it() {
    let mut steps = SubscribeSteps::all_ok();
    steps.validate = Err("email is empty".to_string());
    let response = handle_subscribe(steps);

    assert_eq!(response.status, 400, "not a 500: the default would have been the bug");
    assert_eq!(response.body, "email is empty", "this user is the one person who can act on it");
    assert_eq!(
        response.log.as_deref(),
        Some("email is empty"),
        "one record, and a validation failure has no cause underneath it"
    );
}

#[test]
fn an_internal_failure_tells_the_user_nothing_and_the_operator_everything() {
    let mut steps = SubscribeSteps::all_ok();
    steps.store_token = Err(StoreTokenError(DatabaseError::connection_reset()));
    let response = handle_subscribe(steps);

    assert_eq!(response.status, 500);
    assert!(response.body.is_empty(), "internals in a response body are a gift to an attacker");

    let log = response.log.as_deref().expect("the boundary handles the failure, so it logs it");
    assert_eq!(
        log.lines().count(),
        4,
        "one record carrying every layer: subscription, storage, database, io"
    );
    assert!(log.ends_with("connection reset by peer"), "root cause last");
    assert!(
        !response.body.contains("connection reset"),
        "the same detail that belongs in the log is the detail the body must never carry"
    );
}
