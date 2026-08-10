//! Lesson: thread-channels
//!
//! If a test in here never finishes, it is not slow: it is the deadlock from
//! the lesson's closing exercise. The receiver's loop ends when the last sender
//! is dropped, and `collect_reports` is holding one of them.

use threads_send_sync::*;

fn batch(size: usize) -> Vec<String> {
    (0..size).map(|i| format!("subscriber{i}@example.com")).collect()
}

#[test]
fn every_worker_reports_exactly_once() {
    let mut reports = collect_reports(vec![batch(3), batch(0), batch(2)]);

    assert_eq!(
        reports.len(),
        3,
        "three reports arrived and then the loop ended, so every sender was gone"
    );

    // The arrival order belongs to the scheduler, so the test sorts before it
    // compares. Asserting an order here would be asserting on a coin flip.
    reports.sort();
    assert_eq!(reports, vec![
        "worker 0: 3 delivered".to_string(),
        "worker 1: 0 delivered".to_string(),
        "worker 2: 2 delivered".to_string(),
    ]);
}

#[test]
fn each_worker_is_numbered_by_its_batch() {
    let mut reports = collect_reports((0..8).map(batch).collect());
    reports.sort();

    let expected: Vec<String> = (0..8).map(|i| format!("worker {i}: {i} delivered")).collect();
    assert_eq!(reports, expected, "the batch a worker owns is the one it reports on");
}

#[test]
fn no_workers_closes_the_channel_immediately() {
    let silence: Vec<String> = Vec::new();

    assert_eq!(
        collect_reports(Vec::new()),
        silence,
        "no sender was cloned, so the only one to drop is the one you already have"
    );
}

#[test]
fn a_large_batch_costs_nothing_extra_to_move() {
    // The batch moves into the worker and the report moves through the send.
    // Both are header copies: the heap buffers never move, however long the
    // batch is.
    let reports = collect_reports(vec![batch(50_000)]);

    assert_eq!(reports, vec!["worker 0: 50000 delivered".to_string()]);
}
