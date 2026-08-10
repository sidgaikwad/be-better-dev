//! Lesson: thread-locks

use std::collections::VecDeque;
use std::sync::Mutex;

use threads_send_sync::*;

fn queue_of(size: usize) -> Mutex<VecDeque<String>> {
    Mutex::new((0..size).map(|i| format!("subscriber{i}@example.com")).collect())
}

#[test]
fn the_total_is_exact() {
    assert_eq!(
        delivered_total(4, 10_000),
        40_000,
        "the shape of the static mut program, and this one cannot lose an update"
    );
}

#[test]
fn it_lands_on_the_same_number_every_run() {
    let runs: Vec<u64> = (0..8).map(|_| delivered_total(4, 1_000)).collect();

    assert_eq!(
        runs,
        vec![4_000; 8],
        "the unsynchronized version printed a different number every time"
    );
}

#[test]
fn the_edges_are_not_special() {
    assert_eq!(delivered_total(1, 5), 5, "one worker is still a lock, just an uncontended one");
    assert_eq!(delivered_total(0, 1_000), 0, "no workers, nothing delivered");
    assert_eq!(delivered_total(3, 0), 0, "three workers spawn, find nothing to do, and are joined");
}

#[test]
fn take_next_hands_back_an_owned_email() {
    let queue = queue_of(2);

    let first = take_next(&queue);

    assert_eq!(first.as_deref(), Some("subscriber0@example.com"), "front of the queue, off it");
    assert!(
        queue.try_lock().is_ok(),
        "the guard died with the call, so the caller's SMTP round trip blocks nobody"
    );
    assert_eq!(queue.lock().unwrap().len(), 1, "one taken, one left");
}

#[test]
fn an_empty_queue_is_not_an_error() {
    let queue = queue_of(0);

    assert_eq!(take_next(&queue), None, "nothing to do is how a worker knows to stop");
}

#[test]
fn every_email_is_delivered_exactly_once() {
    // A local variable, lent to the workers. No Arc anywhere: the scope is the
    // proof that the threads are gone before this frame is.
    let queue = queue_of(7);

    let mut receipts = deliver_all(&queue, 3);

    let mut expected: Vec<String> =
        (0..7).map(|i| deliver(&format!("subscriber{i}@example.com"))).collect();
    receipts.sort();
    expected.sort();
    assert_eq!(receipts, expected, "seven emails over three workers: none skipped, none twice");
    assert!(
        queue.lock().unwrap().is_empty(),
        "the workers stopped because the queue was empty, not because they gave up"
    );
}

#[test]
fn more_workers_than_emails_is_fine() {
    let queue = queue_of(2);

    let receipts = deliver_all(&queue, 8);

    assert_eq!(receipts.len(), 2, "six workers found an empty queue on their first look");
}

#[test]
fn one_worker_drains_the_whole_queue() {
    let queue = queue_of(5);

    let receipts = deliver_all(&queue, 1);

    assert_eq!(receipts.len(), 5, "take the lock, release it, deliver, and come back for more");
    assert_eq!(
        receipts[0],
        deliver("subscriber0@example.com"),
        "with one worker the queue order survives all the way to the receipts"
    );
}
