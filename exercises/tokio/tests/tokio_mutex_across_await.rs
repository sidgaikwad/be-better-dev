//! Lesson: tokio-mutex-across-await
//!
//! Two exercises, one per half of the lesson's rule, and the same compiler
//! diagnostic waiting behind both. `Metrics::rescale` keeps the std mutex and
//! scopes the guard so it never reaches the await; `Db::query` has nothing to
//! scope, because the guard must be alive while the connection does IO, so it
//! swaps the mutex instead. Both tests spawn the future, and `tokio::spawn`
//! wants `Send`, so a guard left alive across an await stops being a failed
//! assertion and starts being a compile error.

use tokio_exercises::*;

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn every_increment_lands_exactly_once() {
    let metrics = Metrics::new();

    let mut handles = Vec::new();
    for _ in 0..8 {
        let metrics = metrics.clone();
        handles.push(tokio::spawn(async move {
            for _ in 0..100 {
                metrics.record("/subscriptions");
                // Yielding between increments makes the tasks genuinely
                // interleave. It is safe here precisely because the guard is
                // already gone: `record` returned before this line.
                tokio::task::yield_now().await;
            }
        }));
    }
    for handle in handles {
        handle.await.expect("task panicked");
    }

    assert_eq!(
        metrics.count("/subscriptions"),
        800,
        "eight tasks, a hundred increments each: a mutex is what makes that add up to 800 rather than fewer"
    );
}

#[tokio::test]
async fn a_path_nobody_visited_has_been_seen_zero_times() {
    let metrics = Metrics::new();
    assert_eq!(metrics.count("/nope"), 0);
    metrics.record("/nope");
    assert_eq!(metrics.count("/nope"), 1);
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_scoped_guard_lets_the_future_be_spawned() {
    let metrics = Metrics::new();
    for _ in 0..5 {
        metrics.record("/health");
    }

    let mine = metrics.clone();
    // This spawn is the assertion. It compiles only if no MutexGuard is alive
    // across the await inside `rescale`, because a guard that survives an
    // await is a field of the state machine and `MutexGuard` is not `Send`.
    tokio::spawn(async move { mine.rescale("/health").await }).await.expect("task panicked");

    assert_eq!(metrics.count("/health"), 15, "five requests, scaled by the fetched factor of three");
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn one_connection_serves_every_task_in_turn() {
    let db = Db::new(DbConnection::new());

    let mut handles = Vec::new();
    for n in 0..4 {
        let db = db.clone();
        // Spawning is what forces the choice of mutex: a std::sync guard held
        // across `execute`'s await is `!Send`, and this line would not compile.
        handles.push(tokio::spawn(async move {
            let sql = format!("select {n}");
            db.query(&sql).await
        }));
    }

    let mut rows = Vec::new();
    for handle in handles {
        rows.push(handle.await.expect("task panicked"));
    }

    // Which task reached the lock first is scheduling, not a promise, so
    // assert the set of rows rather than who got which.
    let mut numbers: Vec<String> =
        rows.iter().map(|row| row.split(" -> ").nth(1).expect("row number").to_owned()).collect();
    numbers.sort();
    assert_eq!(
        numbers,
        vec!["row 1", "row 2", "row 3", "row 4"],
        "the mutex serialized four tasks through one connection, and every query got its own row"
    );

    assert_eq!(db.served().await, 4, "four queries reached the connection, no more and no fewer");
}
