//! Lesson: stream-cancel-safety
//!
//! Both methods do the same work and differ only in where the job sits while
//! the delivery is in flight. Cancel safety is that difference and nothing
//! else, which is why no compiler pass can see it.

use std::time::Duration;

use futures::future::FutureExt;
use tokio::sync::mpsc;
use tokio::time::timeout;

use streams_cancellation::*;

/// A cancellation that lands mid-delivery, every time: the send is already
/// queued so the receive completes on the first poll, and the sixty second
/// delivery cannot beat a ten millisecond deadline.
const MID_DELIVERY: Duration = Duration::from_secs(60);
const DEADLINE: Duration = Duration::from_millis(10);

#[tokio::test]
async fn cancelling_the_obvious_version_loses_the_job() {
    let (jobs_tx, jobs) = mpsc::channel(4);
    jobs_tx.send("issue-87".to_string()).await.unwrap();
    let mut worker = Worker::new(jobs);

    let outcome = timeout(DEADLINE, worker.deliver_next(MID_DELIVERY)).await;
    assert!(outcome.is_err(), "the deadline won while the delivery was in flight");
    assert!(worker.delivered.is_empty(), "the delivery never finished, which is expected");

    // The queue is the only other place the job could be, and a fresh call
    // finds nothing there: a future's own state is not a place data survives.
    let retry = worker.deliver_next(Duration::ZERO);
    assert!(
        retry.now_or_never().is_none(),
        "still waiting on an empty queue: the job was dequeued, then died with the dropped future"
    );
}

#[tokio::test]
async fn the_safe_version_parks_the_job_out_of_the_futures_reach() {
    let (jobs_tx, jobs) = mpsc::channel(4);
    jobs_tx.send("issue-87".to_string()).await.unwrap();
    let mut worker = Worker::new(jobs);

    let outcome = timeout(DEADLINE, worker.deliver_next_safely(MID_DELIVERY)).await;
    assert!(outcome.is_err(), "the same cancellation, at the same point");
    assert!(worker.delivered.is_empty(), "the delivery still never finished");
    assert_eq!(
        worker.in_flight.as_deref(),
        Some("issue-87"),
        "the job outlived the drop because it was never the future's to lose"
    );

    // Re-issuing resumes rather than starting over, so nothing is lost and
    // nothing is taken twice.
    timeout(Duration::from_secs(5), worker.deliver_next_safely(Duration::ZERO))
        .await
        .expect("the second attempt has a job in hand and finishes at once");

    assert_eq!(worker.delivered, vec!["issue-87".to_string()]);
    assert_eq!(worker.in_flight, None, "delivered, so no longer in flight");
}

#[tokio::test]
async fn the_safe_version_does_not_take_a_second_job_while_one_is_in_hand() {
    let (jobs_tx, jobs) = mpsc::channel(4);
    jobs_tx.send("issue-87".to_string()).await.unwrap();
    jobs_tx.send("issue-88".to_string()).await.unwrap();
    let mut worker = Worker::new(jobs);

    assert!(timeout(DEADLINE, worker.deliver_next_safely(MID_DELIVERY)).await.is_err());
    assert!(timeout(DEADLINE, worker.deliver_next_safely(MID_DELIVERY)).await.is_err());

    assert_eq!(
        worker.in_flight.as_deref(),
        Some("issue-87"),
        "the second attempt resumed the first job instead of dequeuing another one"
    );
}

#[tokio::test]
async fn the_two_versions_agree_when_nothing_is_cancelled() {
    let (jobs_tx, jobs) = mpsc::channel(4);
    jobs_tx.send("issue-87".to_string()).await.unwrap();
    jobs_tx.send("issue-88".to_string()).await.unwrap();
    let mut plain = Worker::new(jobs);
    plain.deliver_next(Duration::ZERO).await;
    plain.deliver_next(Duration::ZERO).await;

    let (safe_tx, safe_jobs) = mpsc::channel(4);
    safe_tx.send("issue-87".to_string()).await.unwrap();
    safe_tx.send("issue-88".to_string()).await.unwrap();
    let mut safe = Worker::new(safe_jobs);
    safe.deliver_next_safely(Duration::ZERO).await;
    safe.deliver_next_safely(Duration::ZERO).await;

    assert_eq!(plain.delivered, vec!["issue-87".to_string(), "issue-88".to_string()]);
    assert_eq!(
        safe.delivered, plain.delivered,
        "cancel safety is not different behaviour, it is the same behaviour surviving a drop"
    );
}
