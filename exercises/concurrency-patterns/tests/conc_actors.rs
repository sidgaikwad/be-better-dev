//! Lesson: conc-actors

use concurrency_patterns::*;
use tokio::sync::mpsc;

#[tokio::test]
async fn a_command_gets_an_answer_back() {
    let (progress, finished) = Progress::spawn();

    progress.record(Outcome { subscriber: 1, delivered: true }).await;
    progress.record(Outcome { subscriber: 2, delivered: false }).await;
    progress.record(Outcome { subscriber: 3, delivered: true }).await;

    assert_eq!(
        progress.stats().await,
        Stats { delivered: 2, failed: 1 },
        "the query queued behind the three records: one inbox, one order, one answer"
    );

    drop(progress);
    assert_eq!(
        finished.await.expect("the actor panicked"),
        Stats { delivered: 2, failed: 1 },
        "the last handle closed the inbox: the actor drained, exited, handed its state back"
    );
}

#[tokio::test]
async fn eight_callers_share_one_actor_and_lose_nothing() {
    let (progress, finished) = Progress::spawn();

    let mut callers = Vec::new();
    for caller in 0..8u32 {
        let progress = progress.clone();
        callers.push(tokio::spawn(async move {
            for i in 0..50 {
                let outcome = Outcome { subscriber: caller * 50 + i, delivered: i % 5 != 0 };
                progress.record(outcome).await;
            }
        }));
    }
    for caller in callers {
        caller.await.expect("a caller panicked");
    }

    drop(progress);
    let stats = finished.await.expect("the actor panicked");

    assert_eq!(
        stats.delivered + stats.failed,
        400,
        "eight callers, fifty records each, every one of them counted exactly once"
    );
    assert_eq!(
        stats.failed,
        80,
        "one task touched the counts, so there is no race to lose an increment to"
    );
}

#[test]
fn the_handle_is_only_a_sender() {
    assert_eq!(
        std::mem::size_of::<Progress>(),
        std::mem::size_of::<mpsc::Sender<u8>>(),
        "a handle is one sender: an Arc<Mutex<Stats>> beside it means the state escaped"
    );
}
