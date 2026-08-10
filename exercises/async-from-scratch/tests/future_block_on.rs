//! Lesson: future-block-on
//!
//! These tests drive `CountdownFuture` from the waker lesson, so finish that one
//! first. If a test here hangs instead of failing, the countdown returned
//! `Pending` without waking: that is the lost wakeup, and a correct executor
//! sleeps through it forever at zero CPU, exactly as the lesson warns.

use std::sync::Arc;
use std::task::Waker;
use std::thread;
use std::time::{Duration, Instant};

use async_from_scratch::*;

#[test]
fn waking_the_executor_releases_its_park() {
    let waker = Waker::from(Arc::new(ThreadWaker(thread::current())));

    // The wake lands before the park, which is the race the lesson calls out.
    // unpark leaves a token, so the park below has to return at once.
    waker.wake();
    let start = Instant::now();
    thread::park_timeout(Duration::from_secs(2));

    assert!(
        start.elapsed() < Duration::from_secs(1),
        "an unpark that arrives early leaves a token, so no wake is ever lost"
    );
}

#[test]
fn a_ready_future_costs_one_poll_and_zero_parks() {
    assert_eq!(block_on(ready(42)), 42);
    assert_eq!(
        block_on(CountdownFuture::new(0)),
        1,
        "no waiting means one poll: an executor charges only where there is a real wait"
    );
}

#[test]
fn the_executor_parks_until_a_wake_arrives() {
    assert_eq!(
        block_on(CountdownFuture::new(3)),
        4,
        "three park-and-wake rounds, then the poll that answers Ready"
    );
}

#[test]
fn block_on_returns_what_the_future_produced() {
    let value = block_on(ready(String::from("window open, resuming sends")));
    assert_eq!(value, "window open, resuming sends");
}

#[test]
fn join_runs_two_futures_on_one_thread() {
    let (fast, slow) = block_on(join(CountdownFuture::new(2), CountdownFuture::new(5)));

    assert_eq!(fast, 3, "two Pendings and the poll that answered, and not one poll more");
    assert_eq!(slow, 6, "the longer wait finished on its own schedule, on the same thread");
}

#[test]
fn join_never_polls_a_finished_child_again() {
    // The left future finishes on its third poll while the right needs nine.
    // If join kept polling the left one, its count would come back inflated,
    // and a real future would panic instead of answering twice.
    let (left, right) = block_on(join(CountdownFuture::new(2), CountdownFuture::new(8)));
    assert_eq!(left, 3, "join must drop a child the moment it answers Ready");
    assert_eq!(right, 9);
}

#[test]
fn join_finishes_immediately_when_both_children_are_ready() {
    let (a, b) = block_on(join(ready(1), ready(2)));
    assert_eq!((a, b), (1, 2), "one poll each, and the pair comes back from the first round");
}
