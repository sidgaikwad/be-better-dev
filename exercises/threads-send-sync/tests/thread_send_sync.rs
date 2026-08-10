//! Lesson: thread-send-sync
//!
//! This file does not compile until `Job` is made of parts that can cross a
//! thread boundary. That is the exercise: the error is the lesson, and it
//! arrives before the program can corrupt anything. The other lessons still
//! run, so work them with `cargo test --test thread_locks` and friends while
//! this one is red.

use std::sync::Arc;
use std::thread;

use threads_send_sync::*;

/// The two markers, asked for directly. Neither has a method to call, so a
/// bound is the only way to make the compiler say whether a type has them.
fn requires_send<T: Send>() {}
fn requires_sync<T: Sync>() {}

#[test]
fn a_job_can_move_to_a_worker_thread() {
    requires_send::<Job>();

    let job = Job::new(vec!["ada@example.com".to_string(), "grace@example.com".to_string()]);
    let handle = thread::spawn(move || {
        job.record_attempt();
        (job.recipients(), job.attempts())
    });

    assert_eq!(
        handle.join().unwrap(),
        (2, 1),
        "ownership moved to the worker, and the work came back at the join"
    );
}

#[test]
fn one_job_can_be_shared_by_many_workers() {
    // Arc<T> is Send only when T is Send *and* Sync, because every clone of the
    // handle can hand out a &T on a different thread. Asking for Sync directly
    // is the same question, one step earlier.
    requires_sync::<Job>();

    let job = Arc::new(Job::new(vec!["ada@example.com".to_string()]));
    let mut handles = Vec::new();
    for _ in 0..8 {
        let job = Arc::clone(&job);
        handles.push(thread::spawn(move || job.record_attempt()));
    }
    for handle in handles {
        handle.join().unwrap();
    }

    assert_eq!(job.attempts(), 8, "eight attempts, eight recorded: exact, not approximate");
    assert_eq!(Arc::strong_count(&job), 1, "every worker's handle died at its join");
}

#[test]
fn the_payload_is_shared_rather_than_copied() {
    let batch = (0..1000).map(|i| format!("subscriber{i}@example.com")).collect();
    let job = Arc::new(Job::new(batch));
    let worker = Arc::clone(&job);

    let counted = thread::spawn(move || worker.recipients()).join().unwrap();

    assert_eq!(counted, 1000, "the worker read the batch main built, not a copy of it");
    assert_eq!(job.attempts(), 0, "reading is not an attempt");
}
