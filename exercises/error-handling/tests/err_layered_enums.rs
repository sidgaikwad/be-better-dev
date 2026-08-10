//! Lesson: err-layered-enums

use error_handling::*;

#[test]
fn the_happy_path_is_flat() {
    let subscriber = subscribe(SubscribeSteps::all_ok()).expect("every step succeeded");
    assert_eq!(subscriber, Subscriber { id: 42, email: "ada@example.com".to_string() });
}

#[test]
fn each_failure_mode_lands_in_its_own_variant() {
    let mut steps = SubscribeSteps::all_ok();
    steps.validate = Err("email is empty".to_string());
    assert!(
        matches!(subscribe(steps), Err(SubscribeError::Validation(m)) if m == "email is empty"),
        "a From impl is what lets a bare `?` do this conversion"
    );

    let mut steps = SubscribeSteps::all_ok();
    steps.store_token = Err(StoreTokenError(DatabaseError::connection_reset()));
    assert!(matches!(subscribe(steps), Err(SubscribeError::StoreToken(_))));

    let mut steps = SubscribeSteps::all_ok();
    steps.send_email = Err(EmailError { status: 502 });
    assert!(matches!(subscribe(steps), Err(SubscribeError::SendEmail(_))));
}

#[test]
fn the_same_type_failing_twice_still_names_the_operation() {
    // Both steps fail as DatabaseError. From dispatches on the type alone and
    // cannot tell them apart, so the call site has to.
    let mut steps = SubscribeSteps::all_ok();
    steps.begin = Err(DatabaseError::connection_reset());
    assert!(matches!(subscribe(steps), Err(SubscribeError::Pool(_))));

    let mut steps = SubscribeSteps::all_ok();
    steps.insert = Err(DatabaseError::connection_reset());
    assert!(matches!(subscribe(steps), Err(SubscribeError::InsertSubscriber(_))));
}

#[test]
fn the_pipeline_stops_at_the_first_failure() {
    let mut steps = SubscribeSteps::all_ok();
    steps.begin = Err(DatabaseError::connection_reset());
    steps.send_email = Err(EmailError { status: 502 });

    assert!(
        matches!(subscribe(steps), Err(SubscribeError::Pool(_))),
        "`?` returns on the first Err, so the later step never ran to fail"
    );
}
