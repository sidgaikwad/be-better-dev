//! Lesson: conc-worker-pools

use std::sync::Arc;
use std::time::Duration;

use concurrency_patterns::*;
use tokio::sync::Barrier;
use tokio::time::timeout;

/// Every subscriber the pool reported, in a comparable order. Which worker ran
/// which job is the scheduler's business; that every job ran once is not.
fn subscribers(per_worker: &[Vec<Outcome>]) -> Vec<u32> {
    let mut ids: Vec<u32> = per_worker.iter().flatten().map(|o| o.subscriber).collect();
    ids.sort_unstable();
    ids
}

#[tokio::test]
async fn every_job_runs_exactly_once() {
    let jobs: Vec<Job> = (0..12).map(|id| job(id, true)).collect();

    let per_worker = run_pool(jobs, 4).await;

    assert_eq!(per_worker.len(), 4, "four workers, four reports, whether or not each got work");
    assert_eq!(
        subscribers(&per_worker),
        (0..12).collect::<Vec<u32>>(),
        "one queue, four consumers: every job taken by exactly one of them"
    );
}

#[tokio::test]
async fn every_worker_gets_to_work() {
    // Three jobs that can only finish together. A pool that runs them one at a
    // time never gets a third job to the barrier and stalls, which is the
    // quiet bug in the lesson: right answers, one worker's throughput.
    let gate = Arc::new(Barrier::new(3));
    let jobs: Vec<Job> = (0..3)
        .map(|id| {
            let gate = Arc::clone(&gate);
            Box::pin(async move {
                gate.wait().await;
                Outcome { subscriber: id, delivered: true }
            }) as Job
        })
        .collect();

    let Ok(per_worker) = timeout(Duration::from_secs(2), run_pool(jobs, 3)).await else {
        panic!("three jobs never overlapped: a guard held while a job runs leaves the pool serial");
    };

    assert_eq!(subscribers(&per_worker), vec![0, 1, 2], "and all three finished");
    assert_eq!(
        per_worker.iter().filter(|outcomes| !outcomes.is_empty()).count(),
        3,
        "every worker was inside a job at once, so the lock ended before the work began"
    );
}

#[tokio::test]
async fn a_closed_queue_is_the_whole_shutdown_protocol() {
    let per_worker = run_pool(Vec::new(), 3).await;

    assert_eq!(
        per_worker,
        vec![Vec::new(); 3],
        "no flag and no poison pill: the last Sender dropping is what ends a worker"
    );
}
