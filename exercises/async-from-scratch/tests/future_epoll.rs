//! Lesson: future-epoll
//!
//! The reactor tests use `WakeCounter` from the waker lesson, so finish that one
//! first.

use std::io::{self, ErrorKind};
use std::task::Poll;

use async_from_scratch::*;

#[test]
fn would_block_is_pending_not_an_error() {
    assert!(
        matches!(readiness(Ok(7)), Poll::Ready(Ok(7))),
        "bytes were already in the kernel's buffer, so the read never slept"
    );
    assert!(
        matches!(readiness(Err(io::Error::from(ErrorKind::WouldBlock))), Poll::Pending),
        "nothing buffered yet is a readiness fact, not a failure"
    );

    match readiness(Err(io::Error::from(ErrorKind::ConnectionReset))) {
        Poll::Ready(Err(e)) => assert_eq!(e.kind(), ErrorKind::ConnectionReset),
        _ => panic!("a real error must reach the caller, not be swallowed as Pending"),
    }
}

#[test]
fn readiness_of_zero_bytes_is_still_ready() {
    // Zero bytes from a readable socket means the peer closed it. That is an
    // answer, and a future that treated it as Pending would wait forever.
    assert!(matches!(readiness(Ok(0)), Poll::Ready(Ok(0))));
}

#[test]
fn the_reactor_wakes_exactly_the_fd_that_became_ready() {
    let alice = WakeCounter::new();
    let bob = WakeCounter::new();

    let mut reactor = Reactor::new();
    reactor.register(3, alice.waker());
    reactor.register(4, bob.waker());
    assert_eq!(reactor.registered(), 2);

    assert!(reactor.notify_ready(3), "fd 3 had a waker filed under it");
    assert_eq!(alice.count(), 1, "one packet, one wake, one task re-polled");
    assert_eq!(bob.count(), 0, "the connections that stayed idle cost nothing on this path");
}

#[test]
fn a_wake_spends_the_registration() {
    let counter = WakeCounter::new();
    let mut reactor = Reactor::new();
    reactor.register(9, counter.waker());

    assert!(reactor.notify_ready(9));
    assert_eq!(reactor.registered(), 0, "the reactor handed the waker over, it did not keep it");
    assert!(!reactor.notify_ready(9), "nothing is filed under fd 9 any more");
    assert_eq!(
        counter.count(),
        1,
        "the task re-registers on its next poll, if it is still not ready"
    );
}

#[test]
fn registering_again_replaces_the_stale_waker() {
    let first = WakeCounter::new();
    let second = WakeCounter::new();

    let mut reactor = Reactor::new();
    reactor.register(5, first.waker());
    reactor.register(5, second.waker());

    assert_eq!(reactor.registered(), 1, "one fd, one entry, however many times it was polled");
    assert!(reactor.notify_ready(5));
    assert_eq!(second.count(), 1, "the waker from the newest poll is the live one");
    assert_eq!(first.count(), 0);
}

#[test]
fn an_unregistered_fd_wakes_nobody() {
    let mut reactor = Reactor::new();
    assert!(!reactor.notify_ready(11), "readiness for an fd nobody is waiting on is a no-op");
    assert_eq!(reactor.registered(), 0);
}

#[test]
fn ten_thousand_idle_registrations_are_a_table_and_nothing_more() {
    let counters: Vec<_> = (0..10_000).map(|_| WakeCounter::new()).collect();
    let mut reactor = Reactor::new();
    for (fd, counter) in counters.iter().enumerate() {
        reactor.register(fd as u32, counter.waker());
    }
    assert_eq!(reactor.registered(), 10_000, "no thread apiece, just an entry apiece");

    assert!(reactor.notify_ready(7_777));
    assert_eq!(counters[7_777].count(), 1);
    assert_eq!(
        counters.iter().map(|c| c.count()).sum::<usize>(),
        1,
        "one packet arrived, so exactly one task was woken"
    );
}
