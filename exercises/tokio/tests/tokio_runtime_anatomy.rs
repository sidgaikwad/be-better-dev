//! Lesson: tokio-runtime-anatomy
//!
//! These are plain `#[test]` functions on purpose. The lesson's claim is that
//! `main` stays an ordinary synchronous function and the runtime is a value it
//! builds, so the tests have to start from synchronous code to test it. It is
//! also the only safe place to drop a runtime: doing that inside an async
//! context panics.

use std::time::Duration;

use tokio_exercises::*;

#[test]
fn a_runtime_is_a_value_built_from_synchronous_code() {
    let answer = run_to_completion(async {
        // The sleep is here to check `enable_all`: without the time driver
        // this line panics with "there is no reactor running".
        tokio::time::sleep(Duration::from_millis(1)).await;
        40 + 2
    });
    assert_eq!(answer, 42, "block_on drives one future to completion and hands back its output");
}

#[test]
fn one_runtime_can_be_reused_for_many_block_ons() {
    let rt = multi_thread_runtime();
    assert_eq!(rt.block_on(async { 1 }), 1);
    assert_eq!(rt.block_on(async { 2 }), 2, "building a runtime is the expensive part, not using it");
}

#[test]
fn a_current_thread_runtime_has_no_worker_threads() {
    let rt = current_thread_runtime();
    let caller = std::thread::current().id();

    let ran_on = rt.block_on(async {
        tokio::time::sleep(Duration::from_millis(1)).await;
        tokio::spawn(async { std::thread::current().id() }).await.expect("task panicked")
    });

    assert_eq!(
        ran_on, caller,
        "current_thread spawns nothing: every task runs on the thread that called block_on"
    );
}

#[test]
fn a_multi_thread_runtime_polls_tasks_on_its_workers() {
    let rt = multi_thread_runtime();
    let caller = std::thread::current().id();

    let ran_on = rt.block_on(async {
        tokio::spawn(async { std::thread::current().id() }).await.expect("task panicked")
    });

    assert_ne!(
        ran_on, caller,
        "block_on's caller is not a worker: spawned tasks land on the pool, which is why a task has no home thread"
    );
}
