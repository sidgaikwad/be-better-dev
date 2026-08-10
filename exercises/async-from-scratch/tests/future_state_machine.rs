//! Lesson: future-state-machine
//!
//! Nothing here names a variant of `DeliverFuture`, on purpose: which states
//! the machine needs is the exercise, and these tests only watch it move
//! through them.

use std::task::Poll;

use async_from_scratch::*;

#[test]
fn the_machine_advances_one_state_per_poll() {
    let mut fut = DeliverFuture::new(7);
    assert_eq!(fut.state_name(), "start", "constructing the machine runs none of it");

    assert_eq!(poll_once(&mut fut), Poll::Pending);
    assert_eq!(fut.state_name(), "awaiting-fetch", "poll ran to the first await point and stopped");

    assert_eq!(poll_once(&mut fut), Poll::Pending);
    assert_eq!(fut.state_name(), "awaiting-send", "the fetch resolved, so the machine moved on");

    assert_eq!(
        poll_once(&mut fut),
        Poll::Ready(String::from("queued subscriber-7@example.com")),
        "past the last await point, the body runs to its end inside one poll"
    );
    assert_eq!(fut.state_name(), "done");
}

#[test]
fn progress_lives_in_the_value_not_in_a_stack_frame() {
    let mut first = DeliverFuture::new(1);
    let mut second = DeliverFuture::new(2);

    assert_eq!(poll_once(&mut first), Poll::Pending);
    assert_eq!(poll_once(&mut first), Poll::Pending);
    assert_eq!(poll_once(&mut second), Poll::Pending);

    assert_eq!(first.state_name(), "awaiting-send");
    assert_eq!(second.state_name(), "awaiting-fetch", "each future carries its own progress");
}

#[test]
fn a_state_that_outlives_an_await_carries_its_locals() {
    let mut fut = DeliverFuture::new(42);
    // Two polls parks the machine at await point 2, where the send is pending.
    assert_eq!(poll_once(&mut fut), Poll::Pending);
    assert_eq!(poll_once(&mut fut), Poll::Pending);

    // Moving the future between polls is fine, and the email it fetched has to
    // come along: it is a field now, not a local in a frame that already popped.
    let mut moved = fut;
    assert_eq!(
        poll_once(&mut moved),
        Poll::Ready(String::from("queued subscriber-42@example.com")),
        "the address fetched two polls ago survived, because the state owns it"
    );
}

#[test]
fn polling_after_ready_is_a_contract_violation() {
    let mut fut = DeliverFuture::new(7);
    assert_eq!(poll_once(&mut fut), Poll::Pending);
    assert_eq!(poll_once(&mut fut), Poll::Pending);
    assert!(poll_once(&mut fut).is_ready());

    // The future is spent. Asking again is the caller's bug, and a hand-written
    // machine has no state left to answer from, so it says so.
    let again = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| poll_once(&mut fut)));
    assert!(again.is_err(), "a spent future must not quietly answer a second time");
}
