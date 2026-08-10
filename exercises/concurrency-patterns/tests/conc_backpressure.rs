//! Lesson: conc-backpressure

use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Duration;

use concurrency_patterns::*;
use tokio::sync::Barrier;
use tokio::time::timeout;

#[tokio::test]
async fn a_full_queue_stops_the_producer() {
    let sent = Arc::new(AtomicUsize::new(0));
    let (mut queue, producer) = start_producer(1, 500, Arc::clone(&sent));

    let mut received: Vec<u32> = Vec::new();
    for _ in 0..5 {
        received.push(queue.recv().await.expect("the producer is still going"));
    }

    // Whatever the producer has sent and the consumer has not taken is sitting
    // in the channel, so a capacity of one is a hard ceiling on how far ahead
    // the producer can get. No timing, no sleeping, no guessing.
    let ahead = sent.load(Ordering::SeqCst);
    assert!(
        ahead <= received.len() + 1,
        "consumer took {}, producer sent {ahead}: room for one is a ceiling on running ahead",
        received.len()
    );

    while let Some(item) = queue.recv().await {
        received.push(item);
    }
    producer.await.expect("the producer panicked");

    assert_eq!(
        received,
        (0..500).collect::<Vec<u32>>(),
        "backpressure delays a producer, in order; it never drops what it was holding"
    );
    assert_eq!(
        sent.load(Ordering::SeqCst),
        500,
        "and the producer did finish, at the consumer's speed rather than its own"
    );
}

/// The high-water mark of jobs running at once, kept by the jobs themselves so
/// the assertion below is about the code under test and not about the runtime.
#[derive(Default)]
struct InFlight {
    now: AtomicUsize,
    peak: AtomicUsize,
}

impl InFlight {
    fn enter(&self) {
        let now = self.now.fetch_add(1, Ordering::SeqCst) + 1;
        self.peak.fetch_max(now, Ordering::SeqCst);
    }

    fn leave(&self) {
        self.now.fetch_sub(1, Ordering::SeqCst);
    }
}

#[tokio::test]
async fn nothing_ever_runs_above_the_limit() {
    let in_flight = Arc::new(InFlight::default());
    // Nine jobs that can only finish three at a time. The barrier is what
    // turns "they probably overlapped" into a fact the test can assert.
    let gate = Arc::new(Barrier::new(3));
    let jobs: Vec<Job> = (0..9)
        .map(|id| {
            let in_flight = Arc::clone(&in_flight);
            let gate = Arc::clone(&gate);
            Box::pin(async move {
                in_flight.enter();
                gate.wait().await;
                in_flight.leave();
                Outcome { subscriber: id, delivered: id % 3 != 0 }
            }) as Job
        })
        .collect();

    let Ok(mut outcomes) = timeout(Duration::from_secs(2), bounded_fan_out(jobs, 3)).await else {
        panic!("no three jobs overlapped: a limit is a ceiling, not a schedule of one at a time");
    };

    outcomes.sort_by_key(|outcome| outcome.subscriber);
    assert_eq!(
        outcomes.iter().map(|o| o.subscriber).collect::<Vec<u32>>(),
        (0..9).collect::<Vec<u32>>(),
        "every job ran and every outcome came back"
    );
    assert_eq!(
        in_flight.peak.load(Ordering::SeqCst),
        3,
        "peak concurrency is exactly the limit: never above it, never short of it"
    );
    assert_eq!(
        in_flight.now.load(Ordering::SeqCst),
        0,
        "and each permit went back when its job finished, not at the end of the batch"
    );
}
