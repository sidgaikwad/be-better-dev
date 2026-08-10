//! Lesson: stream-select
//!
//! Every case here is decided before the race starts: one branch is ready and
//! the other cannot be, or both are ready and the tie-break is the exercise.
//! None of them asks which of two timers fires first, because that question has
//! no right answer and a test that asserts one is a test that fails on a busy
//! machine.

use tokio::sync::{mpsc, oneshot};

use streams_cancellation::*;

#[tokio::test]
async fn a_waiting_job_is_delivered() {
    let (jobs_tx, mut jobs) = mpsc::channel(4);
    // Held for the whole test: a dropped sender resolves the receiver, which
    // would fire shutdown by accident.
    let (_shutdown_tx, mut shutdown) = oneshot::channel();
    jobs_tx.send("issue-87".to_string()).await.unwrap();

    assert_eq!(
        one_pass(&mut jobs, &mut shutdown).await,
        Pass::Delivered("issue-87".to_string()),
        "only one branch can complete, so only one branch can win"
    );
}

#[tokio::test]
async fn a_closed_channel_ends_the_loop_instead_of_hanging() {
    let (jobs_tx, mut jobs) = mpsc::channel::<String>(4);
    let (_shutdown_tx, mut shutdown) = oneshot::channel();
    drop(jobs_tx);

    assert_eq!(
        one_pass(&mut jobs, &mut shutdown).await,
        Pass::NoMoreJobs,
        "recv answers None once the last sender is gone; that is a completion, not a stall"
    );
}

#[tokio::test]
async fn shutdown_wins_every_time_both_are_ready() {
    for round in 0..32 {
        let (jobs_tx, mut jobs) = mpsc::channel(4);
        let (shutdown_tx, mut shutdown) = oneshot::channel();
        jobs_tx.send("issue-87".to_string()).await.unwrap();
        shutdown_tx.send(()).unwrap();

        assert_eq!(
            one_pass(&mut jobs, &mut shutdown).await,
            Pass::Shutdown,
            "round {round}: random polling order would lose this coin flip about half the time"
        );
    }
}

#[tokio::test]
async fn the_losing_branch_takes_nothing_with_it() {
    let (jobs_tx, mut jobs) = mpsc::channel(4);
    let (shutdown_tx, mut first_shutdown) = oneshot::channel();
    jobs_tx.send("issue-87".to_string()).await.unwrap();
    shutdown_tx.send(()).unwrap();

    assert_eq!(one_pass(&mut jobs, &mut first_shutdown).await, Pass::Shutdown);

    // The job's recv future was dropped where it stood. A fresh pass, with a
    // shutdown that never fires, finds the job exactly where it was.
    let (_shutdown_tx, mut second_shutdown) = oneshot::channel();
    assert_eq!(
        one_pass(&mut jobs, &mut second_shutdown).await,
        Pass::Delivered("issue-87".to_string()),
        "a cancelled recv removes nothing from the queue: that property is called cancel safety"
    );
}
