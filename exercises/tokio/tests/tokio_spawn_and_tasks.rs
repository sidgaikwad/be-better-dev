//! Lesson: tokio-spawn-and-tasks
//!
//! This file does not compile until `Batch` shares its ids through a pointer
//! that is allowed to cross a thread. That is the exercise: the error is the
//! lesson, and it is the one the lesson quotes verbatim. The other lessons
//! still run meanwhile: `cargo test --test tokio_channels` and friends.
//!
//! One test below deliberately panics inside a task, so a panic message and a
//! note about a task's backtrace appear on stderr while the suite is green.
//! That is the runtime reporting a caught panic, not a failure.

use tokio_exercises::*;

#[tokio::test]
async fn receipts_come_back_in_the_order_the_ids_arrived() {
    let out = deliver_all(vec![3, 1, 2]).await;
    assert_eq!(
        out,
        vec![Some(deliver(3)), Some(deliver(1)), Some(deliver(2))],
        "awaiting the handles in order restores the caller's order, whatever order the tasks finished in"
    );
}

#[tokio::test]
async fn a_panicking_task_costs_exactly_one_task() {
    let out = deliver_all(vec![1, 0, 2]).await;

    assert_eq!(out.len(), 3);
    assert_eq!(out[0], Some(deliver(1)));
    assert_eq!(out[1], None, "the panic was caught at the task boundary and came back as a JoinError");
    assert_eq!(
        out[2],
        Some(deliver(2)),
        "one crashing handler costs one request; the runtime and every other task carried on"
    );
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_batch_of_tasks_is_a_normal_afternoon() {
    let ids: Vec<u64> = (1..=256).collect();
    let out = deliver_all(ids.clone()).await;

    assert_eq!(out.len(), 256, "a task is one heap allocation, so 256 of them is nothing");
    for (slot, id) in out.iter().zip(&ids) {
        assert_eq!(slot.as_deref(), Some(deliver(*id).as_str()));
    }
}

#[tokio::test]
async fn a_shared_batch_can_cross_a_spawn() {
    let batch = Batch::new(vec![1, 2, 3, 4]);
    let mine = batch.clone();
    assert_eq!(batch.handles(), 2, "cloning shares the ids; it does not copy them");

    let handle = tokio::spawn(async move {
        // `batch` is alive across this await, so it becomes a field of the
        // task's state machine, so it has to be Send. That is the whole
        // reason this file does or does not compile.
        tokio::task::yield_now().await;
        batch.total()
    });

    assert_eq!(handle.await.expect("task panicked"), 10);
    assert_eq!(mine.total(), 10, "the other handle still sees the same ids");
}

#[tokio::test]
async fn a_task_owns_what_it_uses() {
    let batch = Batch::new(vec![10, 20]);

    // COMPILE ERROR: the async block borrows a local whose frame may die
    // before the task is polled.
    //
    //   error[E0373]: async block may outlive the current function, but it
    //   borrows `batch`, which is owned by the current function
    //   help: to force the async block to take ownership of `batch` (and any
    //   other referenced variables), use the `move` keyword
    //
    // let handle = tokio::spawn(async { batch.total() });

    let handle = tokio::spawn({
        let batch = batch.clone();
        async move { batch.total() }
    });

    assert_eq!(handle.await.expect("task panicked"), 30);
    assert_eq!(batch.total(), 30, "cloning the handle is what 'static costs here, and it is cheap");
}
