//! Lesson: future-trait

use std::sync::{Arc, Mutex};
use std::task::Poll;

use async_from_scratch::*;

#[test]
fn a_ready_future_answers_on_the_first_poll() {
    let mut fut = ready(41);
    assert_eq!(poll_once(&mut fut), Poll::Ready(41), "nothing to wait for, so nothing is Pending");
}

#[test]
fn the_output_is_moved_out_not_copied() {
    // A String is not Copy, so this only compiles and runs if poll takes the
    // value out of the future rather than duplicating it.
    let mut fut = ready(String::from("window open"));
    assert_eq!(poll_once(&mut fut), Poll::Ready(String::from("window open")));
}

#[test]
fn constructing_a_future_runs_none_of_its_body() {
    let log = Arc::new(Mutex::new(Vec::new()));
    let fut = SendConfirmation::new("ada@example.com", Arc::clone(&log));
    assert!(
        log.lock().unwrap().is_empty(),
        "calling the constructor is not calling the body: futures are inert"
    );

    drop(fut);
    assert!(
        log.lock().unwrap().is_empty(),
        "dropping an unpolled future runs nothing, which is why cancellation is just drop"
    );
}

#[test]
fn polling_is_what_makes_the_body_run() {
    let log = Arc::new(Mutex::new(Vec::new()));
    let mut fut = SendConfirmation::new("ada@example.com", Arc::clone(&log));

    assert_eq!(poll_once(&mut fut), Poll::Ready(15), "the address is fifteen bytes long");
    assert_eq!(
        *log.lock().unwrap(),
        vec![String::from("sending to ada@example.com")],
        "every bit of forward motion came from outside, from the poll"
    );
}

#[test]
fn ten_thousand_constructions_contact_nobody() {
    let log = Arc::new(Mutex::new(Vec::new()));
    let pending: Vec<SendConfirmation> = (0..10_000)
        .map(|i| SendConfirmation::new(&format!("s{i}@example.com"), Arc::clone(&log)))
        .collect();

    assert_eq!(pending.len(), 10_000);
    assert!(log.lock().unwrap().is_empty(), "cheap setup: work starts when an executor does");
}
