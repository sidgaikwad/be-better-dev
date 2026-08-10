//! Lesson: future-waker

use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

use async_from_scratch::*;

#[test]
fn a_waker_is_a_doorbell_with_no_payload() {
    let counter = WakeCounter::new();
    let waker = counter.waker();
    assert_eq!(counter.count(), 0, "building a waker rings nothing");

    waker.wake_by_ref();
    waker.wake_by_ref();
    assert_eq!(counter.count(), 2, "wake_by_ref goes through wake, so both rings land");

    // Wakers are cloned and handed around freely. Every clone reports to the
    // same counter, which is what makes the Arc the right shape.
    let clone = waker.clone();
    clone.wake();
    assert_eq!(counter.count(), 3);
}

#[test]
fn a_future_advances_only_when_polled() {
    let counter = WakeCounter::new();
    let waker = counter.waker();
    let mut cx = Context::from_waker(&waker);

    let mut fut = CountdownFuture::new(3);
    assert_eq!(fut.polls(), 0, "constructing a future polls it zero times: it is only data");

    for expected in 1..=3 {
        assert_eq!(Pin::new(&mut fut).poll(&mut cx), Poll::Pending);
        assert_eq!(fut.polls(), expected, "one poll in, one step of progress out, no more");
        assert_eq!(
            counter.count(),
            expected as usize,
            "every Pending must lodge a wake, or the executor sleeps forever"
        );
    }

    assert_eq!(
        Pin::new(&mut fut).poll(&mut cx),
        Poll::Ready(4),
        "three Pendings, then the fourth poll is the one that answers"
    );
    assert_eq!(
        counter.count(),
        3,
        "no wake on the way out: nobody needs telling to re-poll a finished future"
    );
}

#[test]
fn a_countdown_of_zero_is_ready_at_once() {
    let counter = WakeCounter::new();
    let waker = counter.waker();
    let mut cx = Context::from_waker(&waker);

    let mut fut = CountdownFuture::new(0);
    assert_eq!(Pin::new(&mut fut).poll(&mut cx), Poll::Ready(1), "one poll, and it was enough");
    assert_eq!(counter.count(), 0, "a future that never waited never needed a waker");
}

#[test]
fn nothing_happens_between_polls() {
    let counter = WakeCounter::new();
    let waker = counter.waker();
    let mut cx = Context::from_waker(&waker);

    let mut fut = CountdownFuture::new(2);
    assert_eq!(Pin::new(&mut fut).poll(&mut cx), Poll::Pending);

    // A thread would have kept running here. A future is inert between polls:
    // no timer, no queue, no slice of CPU. The count is the proof.
    for _ in 0..1_000_000 {
        std::hint::black_box(0u8);
    }
    assert_eq!(fut.polls(), 1, "a million iterations later, the future has not moved");
}
