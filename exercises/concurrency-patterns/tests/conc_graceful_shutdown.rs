//! Lesson: conc-graceful-shutdown

use concurrency_patterns::*;
use tokio::sync::{mpsc, oneshot, watch};

fn subscribers(handled: &[Outcome]) -> Vec<u32> {
    handled.iter().map(|outcome| outcome.subscriber).collect()
}

#[tokio::test]
async fn a_worker_nobody_cancels_drains_the_queue() {
    let (jobs, queue) = mpsc::channel(8);
    let (_shutdown, listen) = watch::channel(false);
    for id in 0..5 {
        jobs.send(job(id, true)).await.expect("room for five");
    }
    drop(jobs);

    let handled = worker_until_shutdown(queue, listen).await;

    assert_eq!(
        subscribers(&handled),
        vec![0, 1, 2, 3, 4],
        "a closed and empty queue ends the loop on its own; the signal is for the other case"
    );
}

#[tokio::test]
async fn cancellation_lands_between_jobs_and_never_inside_one() {
    let (jobs, queue) = mpsc::channel(8);
    let (shutdown, listen) = watch::channel(false);
    let (started, has_started) = oneshot::channel();
    let (release, released) = oneshot::channel();

    // The first job reports the instant it starts and then waits to be let go,
    // so the signal fires at a known moment rather than a likely one.
    let gated: Job = Box::pin(async move {
        started.send(()).expect("the test is waiting");
        released.await.expect("the test releases this job");
        Outcome { subscriber: 0, delivered: true }
    });
    jobs.send(gated).await.expect("room");
    for id in 1..4 {
        jobs.send(job(id, true)).await.expect("room");
    }

    let worker = tokio::spawn(worker_until_shutdown(queue, listen));
    has_started.await.expect("the worker picked up the first job");
    shutdown.send(true).expect("the worker is listening");
    release.send(()).expect("the job is waiting");

    let handled = worker.await.expect("the worker panicked");

    assert_eq!(
        subscribers(&handled),
        vec![0],
        "the in-flight job finished; the three still queued were abandoned, by policy"
    );
    assert!(
        jobs.send(job(9, true)).await.is_err(),
        "and they went out with the channel: a queue is process memory, nothing more"
    );
}
