//! Lesson: thread-spawn-join

use threads_send_sync::*;

fn batch(addresses: &[&str]) -> Vec<String> {
    addresses.iter().map(|to| to.to_string()).collect()
}

#[test]
fn counts_come_back_in_batch_order() {
    let batches = vec![
        batch(&["ada@example.com", "not-an-address"]),
        batch(&[]),
        batch(&["grace@example.com", "alan@example.com", "kurt"]),
    ];

    assert_eq!(
        valid_per_batch(batches),
        vec![1, 0, 2],
        "the threads finish in any order; joining the handles in turn puts the answers back"
    );
}

#[test]
fn the_answer_does_not_change_from_run_to_run() {
    let make = || (0..12).map(|i| batch(&vec!["ada@example.com"; i])).collect::<Vec<_>>();
    let expected: Vec<usize> = (0..12).collect();

    for _ in 0..5 {
        assert_eq!(
            valid_per_batch(make()),
            expected,
            "twelve threads, one result: scheduling nondeterminism stops at the join"
        );
    }
}

#[test]
fn no_batches_means_no_threads() {
    let empty: Vec<usize> = Vec::new();

    assert_eq!(valid_per_batch(Vec::new()), empty, "nothing to spawn, nothing to join");
}

#[test]
fn every_batch_was_read_by_its_own_thread() {
    // 64 batches is 64 spawns. Each one is a real system call and a stack
    // reservation, which is why the lesson's advice is roughly one thread per
    // core for CPU-bound work rather than one thread per unit of work.
    let batches: Vec<Vec<String>> = (0..64).map(|_| batch(&["ada@example.com", "kurt"])).collect();

    assert_eq!(
        valid_per_batch(batches),
        vec![1; 64],
        "every batch counted, and none of the answers lost on the way back"
    );
}
