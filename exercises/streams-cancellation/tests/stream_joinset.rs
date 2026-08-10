//! Lesson: stream-joinset

use streams_cancellation::*;

#[tokio::test]
async fn every_batch_reports_back() {
    let mut results = deliver_all(vec![3, 1, 4, 1, 5]).await;
    results.sort_unstable();

    assert_eq!(
        results,
        vec![Some(10), Some(10), Some(30), Some(40), Some(50)],
        "five batches out, five results in, sorted because completion order is the runtime's to choose"
    );
}

#[tokio::test]
async fn one_panicking_batch_costs_one_result() {
    // The task's panic message on stderr is part of the expected output here.
    // The point is what does not happen: the panic stays inside its task and
    // arrives as a value, so the campaign finishes.
    let mut results = deliver_all(vec![3, 0, 5]).await;
    results.sort_unstable();

    assert_eq!(
        results,
        vec![None, Some(30), Some(50)],
        "the outer layer of a join result is the runtime's verdict on the task, not the task's on its work"
    );
}

#[tokio::test]
async fn an_empty_campaign_finishes_immediately() {
    assert!(
        deliver_all(Vec::new()).await.is_empty(),
        "join_next answers None on an empty set, which is what ends the drain"
    );
}

#[tokio::test]
async fn aborting_still_reports_every_task() {
    assert_eq!(
        cancel_and_reap(4).await,
        4,
        "abort_all cancels, it does not erase: each task surfaces once more on the way out"
    );
}

#[tokio::test]
async fn reaping_an_empty_set_is_not_a_hang() {
    assert_eq!(cancel_and_reap(0).await, 0);
}
