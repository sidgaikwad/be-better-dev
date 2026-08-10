//! Lesson: pin-in-the-wild
//!
//! Hand-polling a future is the one place an application developer meets a
//! `Pin` receiver head on, and this file is that place three times over: a
//! `Future` impl, a driver that has to pin before it can poll, and a struct
//! that stores a future on the heap.

use std::task::Poll;

use pinning::*;

#[test]
fn a_future_advances_only_when_something_polls_it() {
    let mut countdown = Countdown::new(2);
    assert_eq!(countdown.polls(), 0, "constructing a future runs none of it");

    assert_eq!(poll_borrowed(&mut countdown), Poll::Pending);
    assert_eq!(poll_borrowed(&mut countdown), Poll::Pending);
    assert_eq!(
        poll_borrowed(&mut countdown),
        Poll::Ready(3),
        "two Pendings and the poll that finished it"
    );
    assert_eq!(countdown.polls(), 3);
}

#[test]
fn an_unpin_future_can_be_pinned_for_free() {
    // Countdown holds two u32 fields, so it is Unpin, so Pin::new inside
    // poll_borrowed is safe with no allocation and no unsafe. This is the case
    // the async-from-scratch section could take for granted.
    let mut countdown = Countdown::new(0);
    assert_eq!(poll_borrowed(&mut countdown), Poll::Ready(1), "ready on the very first ask");
}

#[test]
fn driving_a_future_that_is_not_unpin() {
    // COMPILE ERROR: an async block is the one !Unpin type a working developer
    // actually meets, so lending it by reference is rejected.
    //
    // error[E0277]: `{async block@tests/pin_in_the_wild.rs:NN:NN}` cannot be unpinned
    //    |
    //    |     poll_borrowed(&mut block);
    //    |     ------------- ^^^^^^^^^^ the trait `Unpin` is not implemented
    //    |                              for `{async block}`
    //    |
    //    = note: consider using the `pin!` macro
    //            consider using `Box::pin` if you need to access the pinned
    //            value outside of the current scope
    //
    // let mut block = async { 2 + 2 };
    // poll_borrowed(&mut block);

    // `drive` takes the future by value and pins it before the first poll,
    // which is the whole reason its bound is `F: Future` and not `F: Future + Unpin`.
    assert_eq!(drive(async { 2 + 2 }), 4, "pinned first, then polled at that address");
}

#[test]
fn a_machine_holding_a_local_across_an_await_drives_the_same_way() {
    // This block keeps `doubled` alive across the second await, which is what
    // turns the generated machine into a struct with fields. Nothing in the
    // test can see that, and nothing has to: the pin is what makes it sound.
    let total = drive(async {
        let first = Countdown::new(3).await;
        let doubled = first * 2;
        Countdown::new(1).await + doubled
    });

    assert_eq!(total, 10, "four polls to finish the first child, two to finish the second");
}

#[test]
fn a_struct_stores_a_future_by_pinning_it_to_the_heap() {
    let mut worker = Worker::new();
    assert!(worker.is_idle());

    worker.accept(async {
        let first = Countdown::new(1).await;
        first + Countdown::new(0).await
    });
    assert!(!worker.is_idle(), "the machine is parked on the heap, waiting for a poll");

    assert_eq!(worker.poll_job(), Poll::Pending);
    assert_eq!(worker.poll_job(), Poll::Ready(3));
    assert!(worker.is_idle(), "a future that has answered Ready is spent, so the slot is cleared");
}

#[test]
fn the_stored_future_is_polled_at_one_address_every_time() {
    let mut worker = Worker::new();
    worker.accept(Countdown::new(4));

    // Five polls of the same machine, each one resuming where the last left
    // off. That only works because every poll found it where the previous poll
    // left it, which is the invariant the whole async runtime stands on.
    for _ in 0..4 {
        assert_eq!(worker.poll_job(), Poll::Pending);
    }
    assert_eq!(worker.poll_job(), Poll::Ready(5));
}
