//! Lesson: conc-shared-state

use std::sync::{Arc, Mutex};

use concurrency_patterns::*;
use tokio::sync::{mpsc, oneshot};

#[tokio::test]
async fn eight_tasks_bump_one_counter_and_publish_what_they_wrote() {
    let counter = Arc::new(Mutex::new(0usize));
    let (tx, mut published) = mpsc::channel(16);

    let mut tasks = Vec::new();
    for _ in 0..8 {
        tasks.push(spawn_bump(Arc::clone(&counter), tx.clone()));
    }
    drop(tx);
    for task in tasks {
        task.await.expect("the task has to be spawnable, so its future has to be Send");
    }

    let mut values = Vec::new();
    while let Some(value) = published.recv().await {
        values.push(value);
    }
    values.sort_unstable();

    assert_eq!(
        values,
        (1..=8).collect::<Vec<usize>>(),
        "eight tasks, eight distinct values: read and write happened in one critical section"
    );
    assert_eq!(*counter.lock().unwrap(), 8, "and the counter agrees that nothing was lost");
}

#[test]
fn a_snapshot_is_a_pointer_not_a_copy() {
    let config = ConfigHandle::new(Config { retries: 3, batch: 100 });

    let first = config.snapshot();
    let second = config.snapshot();
    assert!(
        Arc::ptr_eq(&first, &second),
        "two reads of an unchanged config are one allocation: a snapshot copies nothing"
    );

    config.reload(Config { retries: 5, batch: 250 });

    assert_eq!(
        *first,
        Config { retries: 3, batch: 100 },
        "a reader that snapshotted before the swap keeps it, however long it holds on"
    );
    assert_eq!(
        config.snapshot().retries,
        5,
        "and the next reader gets the new pointer without queueing behind anyone"
    );
}

#[tokio::test]
async fn a_snapshot_survives_an_await() {
    let config = ConfigHandle::new(Config { retries: 3, batch: 100 });
    let (took_it, taken) = oneshot::channel();

    let reader = {
        let config = config.clone();
        tokio::spawn(async move {
            let mine = config.snapshot();
            took_it.send(()).expect("the test is waiting");
            tokio::task::yield_now().await;
            mine
        })
    };

    taken.await.expect("the reader took its snapshot");
    config.reload(Config { retries: 9, batch: 1 });

    assert_eq!(
        *reader.await.expect("the reader panicked"),
        Config { retries: 3, batch: 100 },
        "the snapshot crossed an await point, which a lock guard could not have done"
    );
    assert_eq!(config.snapshot().batch, 1, "meanwhile the reload landed for everyone after it");
}

#[test]
fn the_handle_is_shareable() {
    fn shareable<T: Clone + Send + Sync + 'static>() {}

    // Every worker holds one of these, so this is not a formality: whatever
    // field you chose has to survive being cloned into eight tasks.
    shareable::<ConfigHandle>();
}
