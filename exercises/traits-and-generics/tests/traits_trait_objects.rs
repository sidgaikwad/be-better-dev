//! Lesson: traits-trait-objects

use std::cell::RefCell;
use std::rc::Rc;

use traits_and_generics::*;

fn recipients() -> Vec<String> {
    vec![
        String::from("ada@example.com"),
        String::from("grace@example.com"),
        String::from("alan@example.com"),
    ]
}

#[test]
fn a_trait_object_defers_the_choice_to_runtime() {
    let log: CallLog = Rc::new(RefCell::new(Vec::new()));
    make_client(true, Rc::clone(&log)).send_to_all(&recipients(), "Welcome", "You are in").unwrap();
    assert_eq!(
        log.borrow().len(),
        3,
        "the fake inherited the trait's loop, so three recipients meant three calls"
    );

    let log: CallLog = Rc::new(RefCell::new(Vec::new()));
    make_client(false, Rc::clone(&log)).send_to_all(&recipients(), "Welcome", "You are in").unwrap();
    assert_eq!(
        log.borrow().len(),
        1,
        "dispatch went through the vtable and found Postmark's override, one batch call"
    );
}

#[test]
fn one_collection_holds_several_concrete_types() {
    let log: CallLog = Rc::new(RefCell::new(Vec::new()));
    // A Vec<C> with a generic C could hold only one of these two. Erasing the
    // type behind dyn is what lets them share a collection.
    let clients: Vec<Box<dyn EmailClient>> = vec![
        Box::new(RecordingClient::with_log(Rc::clone(&log))),
        Box::new(Postmark::with_log("secret-token", Rc::clone(&log))),
    ];

    broadcast(&clients, "ada@example.com", "Welcome", "You are in").unwrap();
    assert_eq!(*log.borrow(), vec!["ada@example.com", "ada@example.com"], "both clients ran");
}

#[test]
fn broadcast_stops_at_the_first_failure() {
    let log: CallLog = Rc::new(RefCell::new(Vec::new()));
    let clients: Vec<Box<dyn EmailClient>> = vec![
        Box::new(RecordingClient::with_log(Rc::clone(&log))),
        Box::new(Postmark::with_log("", Rc::clone(&log))),
        Box::new(RecordingClient::with_log(Rc::clone(&log))),
    ];

    let error = broadcast(&clients, "ada@example.com", "Welcome", "You are in").unwrap_err();
    assert_eq!(error, SendError::new("missing API token"));
    assert_eq!(log.borrow().len(), 1, "the third client was never reached");
}

#[test]
fn erasing_the_type_widens_the_pointer() {
    assert_eq!(
        pointer_widths(),
        (8, 16),
        "a thin pointer is one word; a trait object pointer carries the vtable in a second"
    );
}
