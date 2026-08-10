//! Lesson: tokio-blocking-the-executor
//!
//! The last test deliberately panics inside the blocking pool, so panic
//! messages appear on stderr while the suite is green. That is the runtime
//! reporting a caught panic, not a failure.

use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use tokio_exercises::*;

#[tokio::test]
async fn the_closure_runs_off_the_runtime_s_own_threads() {
    let awaiting_on = std::thread::current().id();

    let (hash, ran_on) =
        offload(|| (hash_password("correct horse", 200), std::thread::current().id())).await;

    assert_eq!(
        hash,
        hash_password("correct horse", 200),
        "same input, same answer: the only thing that changed is where it was computed"
    );
    assert_ne!(
        ran_on, awaiting_on,
        "spawn_blocking moves the closure onto the pool that is allowed to block, never onto the worker that awaited it"
    );
}

#[tokio::test]
async fn the_runtime_keeps_running_while_the_closure_blocks() {
    // A single-threaded runtime, so there is exactly one worker to lose.
    let (release, wait) = std::sync::mpsc::channel::<()>();

    let job = tokio::spawn(offload(move || {
        // Genuinely blocking, in the way the lesson means: this thread is
        // gone until the message arrives or the deadline passes. The bound
        // is here so a wrong answer fails the test instead of hanging it.
        wait.recv_timeout(Duration::from_secs(1)).is_ok()
    }));

    // Reaching the next two lines at all is the assertion. The runtime is
    // still polling tasks while that closure sits in a blocking recv.
    tokio::task::yield_now().await;
    release.send(()).expect("the blocking closure hung up early");

    assert!(
        job.await.expect("task panicked"),
        "the async side never got a turn, so the closure must have run inline and seized the only worker"
    );
}

#[tokio::test]
async fn several_lumps_can_be_in_flight_and_still_answer_in_order() {
    let handles: Vec<_> = (1u32..=4)
        .map(|n| tokio::spawn(offload(move || hash_password("pepper", n * 10))))
        .collect();

    let mut hashes = Vec::new();
    for handle in handles {
        hashes.push(handle.await.expect("task panicked"));
    }

    let expected: Vec<u64> = (1u32..=4).map(|n| hash_password("pepper", n * 10)).collect();
    assert_eq!(hashes, expected, "awaiting the handles in order collects the answers in order");
}

#[tokio::test]
async fn a_panic_inside_the_blocking_pool_is_still_a_panic() {
    // The escape hatch does not change the failure mode: a closure that panics
    // comes back as a JoinError, which `offload` turns into a panic on the
    // awaiting task. Catching that at the outer task boundary keeps the suite
    // green while proving the panic was not swallowed.
    let ran = Arc::new(AtomicBool::new(false));
    let flag = Arc::clone(&ran);

    let outcome = tokio::spawn(offload(move || -> u64 {
        flag.store(true, Ordering::SeqCst);
        panic!("argon2 exploded")
    }))
    .await;

    assert!(ran.load(Ordering::SeqCst), "the closure never ran at all");
    assert!(outcome.is_err(), "the panic reached the awaiting task rather than vanishing");
    assert!(outcome.unwrap_err().is_panic(), "a panicking task is a panic, not an abort");
}
