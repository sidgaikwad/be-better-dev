//! Lesson: thread-atomics

use std::collections::HashSet;
use std::sync::Arc;
use std::thread;

use threads_send_sync::*;

#[test]
fn every_delivery_is_counted() {
    let metrics = Arc::new(Metrics::new());
    assert_eq!(metrics.delivered(), 0, "nothing counted yet");

    let mut handles = Vec::new();
    for _ in 0..4 {
        let metrics = Arc::clone(&metrics);
        handles.push(thread::spawn(move || {
            for _ in 0..5_000 {
                metrics.record_delivery();
            }
        }));
    }

    // Read the counter while the workers are still running. This is the
    // lesson's monitor thread: an atomic load is stale at worst, never torn,
    // and never a value the counter did not hold.
    let mid_run = metrics.delivered();
    assert!(mid_run <= 20_000, "a load draws from the variable's own history, not thin air");

    for handle in handles {
        handle.join().unwrap();
    }
    assert_eq!(
        metrics.delivered(),
        20_000,
        "one indivisible read-modify-write per delivery, so no update is lost"
    );
}

#[test]
fn the_count_is_the_same_every_run() {
    for _ in 0..5 {
        let metrics = Arc::new(Metrics::new());
        let mut handles = Vec::new();
        for _ in 0..4 {
            let metrics = Arc::clone(&metrics);
            handles.push(thread::spawn(move || {
                for _ in 0..1_000 {
                    metrics.record_delivery();
                }
            }));
        }
        for handle in handles {
            handle.join().unwrap();
        }

        assert_eq!(metrics.delivered(), 4_000, "no lock, no unsafe, and still exact");
    }
}

#[test]
fn fresh_id_never_repeats() {
    let metrics = Arc::new(Metrics::new());

    let mut handles = Vec::new();
    for _ in 0..4 {
        let metrics = Arc::clone(&metrics);
        handles.push(thread::spawn(move || {
            (0..250).map(|_| metrics.fresh_id()).collect::<Vec<usize>>()
        }));
    }
    let ids: Vec<usize> =
        handles.into_iter().flat_map(|handle| handle.join().unwrap()).collect();
    let distinct: HashSet<usize> = ids.iter().copied().collect();

    assert_eq!(ids.len(), 1_000, "a thousand ids were asked for");
    assert_eq!(distinct.len(), 1_000, "and a thousand different ids came back, from four threads");
    assert_eq!(
        distinct.iter().copied().min(),
        Some(1),
        "ids start at 1: fetch_add returns the value from before the add"
    );
    assert_eq!(
        distinct.iter().copied().max(),
        Some(1_000),
        "and the run has no gaps, so nothing was skipped either"
    );
}

#[test]
fn the_two_counters_are_independent() {
    let metrics = Metrics::new();

    assert_eq!(metrics.fresh_id(), 1);
    metrics.record_delivery();
    assert_eq!(metrics.fresh_id(), 2, "handing out an id does not count as a delivery");
    assert_eq!(metrics.delivered(), 1, "and counting a delivery does not consume an id");
}
