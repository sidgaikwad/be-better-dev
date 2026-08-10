//! Lesson: conc-delivery-capstone

use std::sync::{Arc, Mutex};
use std::time::Duration;

use concurrency_patterns::*;
use tokio::sync::{oneshot, watch};
use tokio::time::timeout;

#[tokio::test]
async fn one_issue_goes_out_exactly_once() {
    let sent = Arc::new(Mutex::new(Vec::new()));
    let jobs: Vec<Job> = (0..20u32)
        .map(|id| {
            let sent = Arc::clone(&sent);
            Box::pin(async move {
                sent.lock().expect("never poisoned").push(id);
                Outcome { subscriber: id, delivered: id % 4 != 0 }
            }) as Job
        })
        .collect();
    let (_shutdown, listen) = watch::channel(false);

    let stats = deliver_issue(jobs, 4, 3, listen).await;

    assert_eq!(
        stats,
        Stats { delivered: 15, failed: 5 },
        "every outcome reached the actor, counted once, refusals included"
    );

    let mut sent = sent.lock().expect("never poisoned").clone();
    sent.sort_unstable();
    assert_eq!(
        sent,
        (0..20).collect::<Vec<u32>>(),
        "twenty subscribers, twenty sends: one queue, three workers, nothing doubled"
    );
}

#[tokio::test]
async fn a_signal_mid_issue_finishes_what_is_in_flight() {
    let (shutdown, listen) = watch::channel(false);
    let (started, has_started) = oneshot::channel();
    let (release, released) = oneshot::channel();

    let gated: Job = Box::pin(async move {
        started.send(()).expect("the test is waiting");
        released.await.expect("the test releases this job");
        Outcome { subscriber: 0, delivered: true }
    });
    let mut jobs: Vec<Job> = vec![gated];
    jobs.extend((1..10u32).map(|id| job(id, true)));

    // One worker and room for one waiting job, so the producer is parked
    // inside send() when the signal arrives: the awkward moment, on purpose.
    let issue = tokio::spawn(deliver_issue(jobs, 1, 1, listen));
    has_started.await.expect("the worker picked up the first job");
    shutdown.send(true).expect("the pool is listening");
    release.send(()).expect("the job is waiting");

    let Ok(finished) = timeout(Duration::from_secs(2), issue).await else {
        panic!("shutdown hung: only the receiver going away releases a producer on a full queue");
    };

    assert_eq!(
        finished.expect("the delivery task panicked"),
        Stats { delivered: 1, failed: 0 },
        "the send in flight finished and was recorded; the nine queued behind it were not"
    );
}

#[test]
fn the_memory_bound_is_the_one_you_wrote_down() {
    assert_eq!(
        peak_jobs_in_memory(64, 8),
        73,
        "sixty-four queued, eight in flight, one held by the producer parked in send()"
    );
    assert_eq!(
        peak_jobs_in_memory(1, 1),
        3,
        "the shape does not change when the numbers do; the bound is readable off the source"
    );
}
