//! Lesson: traits-from-into-newtypes

use traits_and_generics::*;

#[test]
fn a_newtype_is_the_only_door_and_costs_nothing() {
    let email = SubscriberEmail::try_from(String::from("ada@example.com")).unwrap();
    assert_eq!(email.as_str(), "ada@example.com");

    // try_into arrived free from std's blanket TryInto impl. Only TryFrom was
    // written.
    let email: SubscriberEmail = String::from("grace@example.com").try_into().unwrap();
    assert_eq!(email.into_inner(), "grace@example.com");

    assert_eq!(
        std::mem::size_of::<SubscriberEmail>(),
        std::mem::size_of::<String>(),
        "a struct's memory is just its fields, so the proof the wrapper carries is free"
    );
}

#[test]
fn a_conversion_that_can_refuse() {
    let error = SubscriberEmail::try_from(String::from("not-an-address")).unwrap_err();
    assert_eq!(error, "`not-an-address` is not a valid subscriber email");
    assert!(SubscriberEmail::try_from(String::from("@example.com")).is_err(), "no local part");
    assert!(SubscriberEmail::try_from(String::from("ada@example.com")).is_ok());
}

#[test]
fn implementing_from_hands_you_into() {
    let converted: SubscribeError = SendError::new("missing API token").into();
    assert_eq!(
        converted,
        SubscribeError::SendFailed(String::from("missing API token")),
        "Into was never implemented here; the blanket impl over From supplies it"
    );
}

#[test]
fn the_question_mark_converts_through_that_same_from() {
    let client = Postmark::new("");
    let error = confirm_subscriber(&client, String::from("ada@example.com")).unwrap_err();
    assert_eq!(
        error,
        SubscribeError::SendFailed(String::from("missing API token")),
        "`?` called From::from on the SendError on its way out"
    );
}

#[test]
fn validation_happens_before_any_delivery() {
    let client = RecordingClient::new();
    let confirmed = confirm_subscriber(&client, String::from("ada@example.com")).unwrap();
    assert_eq!(confirmed, "ada@example.com");
    assert_eq!(client.calls(), vec!["ada@example.com"]);

    let client = RecordingClient::new();
    let error = confirm_subscriber(&client, String::from("not-an-address")).unwrap_err();
    assert!(matches!(error, SubscribeError::InvalidEmail(_)));
    assert!(client.calls().is_empty(), "parsing refused to build the value, so nothing was sent");
}

#[test]
fn a_newtype_gets_around_the_orphan_rule() {
    let recipients = Recipients(vec![
        SubscriberEmail::try_from(String::from("ada@example.com")).unwrap(),
        SubscriberEmail::try_from(String::from("grace@example.com")).unwrap(),
    ]);
    assert_eq!(recipients.to_string(), "2 confirmed recipients");
    assert_eq!(Recipients(Vec::new()).to_string(), "0 confirmed recipients");
}
