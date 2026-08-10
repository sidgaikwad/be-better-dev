//! Lesson: stream-cancellation

use std::sync::{Arc, Mutex};
use std::time::Duration;

use tokio::time::timeout;

use streams_cancellation::*;

fn new_log() -> Arc<Mutex<Vec<String>>> {
    Arc::new(Mutex::new(Vec::new()))
}

fn entries(log: &Arc<Mutex<Vec<String>>>) -> Vec<String> {
    log.lock().unwrap().clone()
}

#[test]
fn a_beacon_records_its_own_destruction() {
    // No runtime and no future in sight. Cancellation borrows this mechanism
    // rather than adding one, which is why it needs no signal parameter.
    let log = new_log();
    {
        let _guard = Beacon { name: "connection", log: Arc::clone(&log) };
        assert!(entries(&log).is_empty(), "nothing has been dropped yet");
    }

    assert_eq!(entries(&log), vec!["dropped connection".to_string()]);
}

#[tokio::test]
async fn finishing_runs_the_body_and_then_the_destructor() {
    let log = new_log();

    deliver_batch(Arc::clone(&log), Duration::from_millis(1)).await;

    assert_eq!(
        entries(&log),
        vec!["committed".to_string(), "dropped connection".to_string()],
        "the commit is a line in the body, the release is the guard leaving scope after it"
    );
}

#[tokio::test]
async fn cancelling_runs_the_destructor_and_skips_the_rest() {
    let log = new_log();

    let outcome =
        timeout(Duration::from_millis(10), deliver_batch(Arc::clone(&log), Duration::from_secs(60)))
            .await;

    assert!(outcome.is_err(), "the deadline won, which means the batch future was dropped mid-await");
    assert_eq!(
        entries(&log),
        vec!["dropped connection".to_string()],
        "values are cleaned up and code is skipped: there is no finally to put the commit in"
    );
}

#[tokio::test]
async fn a_cancelled_task_cleans_up_too() {
    let log = new_log();
    let handle = tokio::spawn(deliver_batch(Arc::clone(&log), Duration::from_secs(60)));

    // Let the task reach its await, then cancel it from the outside. abort is
    // the same drop, delivered at the task's next yield point.
    tokio::time::sleep(Duration::from_millis(10)).await;
    handle.abort();
    let joined = handle.await;

    assert!(joined.is_err_and(|err| err.is_cancelled()), "the task ended by cancellation, not by returning");
    assert_eq!(
        entries(&log),
        vec!["dropped connection".to_string()],
        "abort drops the task's future, and dropping a future runs the destructors it was holding"
    );
}
