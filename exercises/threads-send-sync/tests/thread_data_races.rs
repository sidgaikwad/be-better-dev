//! Lesson: thread-data-races

use threads_send_sync::Step::*;
use threads_send_sync::*;

#[test]
fn a_thousand_readers_are_not_a_race() {
    let readers = Access { threads: 1000, writers: 0, synchronized: false };

    assert!(
        !is_data_race(&readers),
        "condition 2 fails: shared immutable data needs no synchronization at all"
    );
}

#[test]
fn four_unsynchronized_writers_are() {
    let counter = Access { threads: 4, writers: 4, synchronized: false };

    assert!(is_data_race(&counter), "the static mut tally, and the reason it needed unsafe");
}

#[test]
fn one_writer_among_readers_is_enough() {
    let cache = Access { threads: 8, writers: 1, synchronized: false };

    assert!(
        is_data_race(&cache),
        "seven safe readers and one writer is not seven eighths safe: every read is now suspect"
    );
}

#[test]
fn synchronization_removes_the_third_condition() {
    let guarded = Access { threads: 4, writers: 4, synchronized: true };

    assert!(
        !is_data_race(&guarded),
        "same threads, same writes, ordered: that is the whole of what a lock sells"
    );
}

#[test]
fn one_thread_cannot_race_with_itself() {
    let single = Access { threads: 1, writers: 1, synchronized: false };

    assert!(!is_data_race(&single), "condition 1 needs two threads, whatever the one does");
}

#[test]
fn two_interleaved_increments_move_the_counter_by_one() {
    // The lesson's table, step for step: both threads load 41 before either
    // stores.
    let racy = [Load(0), Load(1), Add(0), Add(1), Store(0), Store(1)];

    assert_eq!(replay(41, &racy), 42, "two increments ran, and one evaporated at the store");
}

#[test]
fn the_same_steps_without_overlap_lose_nothing() {
    let serial = [Load(0), Add(0), Store(0), Load(1), Add(1), Store(1)];

    assert_eq!(
        replay(41, &serial),
        43,
        "a lock does not change the arithmetic, only whether the three steps can be split"
    );
}

#[test]
fn the_window_widens_with_the_number_of_threads() {
    let racy = [Load(0), Load(1), Load(2), Add(0), Add(1), Add(2), Store(0), Store(1), Store(2)];

    assert_eq!(replay(0, &racy), 1, "three increments, one survivor: the last store wins outright");
}

#[test]
fn a_late_store_can_undo_finished_work() {
    // Thread 0 loads, sits through five complete increments by thread 1, then
    // stores the value it read at the start.
    let mut steps = vec![Load(0)];
    for _ in 0..5 {
        steps.extend([Load(1), Add(1), Store(1)]);
    }
    steps.extend([Add(0), Store(0)]);

    assert_eq!(
        replay(100, &steps),
        101,
        "six increments, and the counter ends one above where it started"
    );
}
