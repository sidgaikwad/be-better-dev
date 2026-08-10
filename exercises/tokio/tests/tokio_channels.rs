//! Lesson: tokio-channels

use std::time::Duration;

use tokio::sync::mpsc;
use tokio::time::timeout;

use tokio_exercises::*;

#[tokio::test]
async fn values_arrive_once_each_and_in_order() {
    let (tx, rx) = mpsc::channel(4);
    let producer = tokio::spawn(produce(tx, (0..10).collect()));

    assert_eq!(
        drain(rx).await,
        (0..10).collect::<Vec<u64>>(),
        "mpsc is a queue: many senders, one receiver, every value exactly once and in send order"
    );
    producer.await.expect("producer panicked");
}

#[tokio::test]
async fn a_full_channel_parks_the_producer() {
    let (tx, rx) = mpsc::channel::<u64>(2);
    let mut producer = tokio::spawn(produce(tx, (0..5).collect()));

    // Nobody is receiving, so the two buffer slots fill and the third send
    // parks. Waiting on the producer has to time out rather than finish.
    let stalled = timeout(Duration::from_millis(30), &mut producer).await;
    assert!(
        stalled.is_err(),
        "a bounded send must await: a producer that never waits is an unbounded queue with extra steps, and its buffer is your RAM"
    );

    // Start draining and the producer finishes. Backpressure slowed it down;
    // it did not drop anything.
    assert_eq!(drain(rx).await, vec![0, 1, 2, 3, 4], "a slow consumer costs latency, not messages");
    producer.await.expect("producer panicked");
}

#[tokio::test]
async fn the_receiver_stops_when_the_last_sender_is_gone() {
    let (tx, rx) = mpsc::channel::<u64>(8);
    let second = tx.clone();

    let first_producer = tokio::spawn(produce(tx, vec![1, 2]));
    let second_producer = tokio::spawn(produce(second, vec![3, 4]));

    // `drain` returns at all only because both senders were dropped. Order
    // between the two producers is scheduling, so assert on the multiset.
    let mut values = drain(rx).await;
    values.sort();
    assert_eq!(values, vec![1, 2, 3, 4]);

    first_producer.await.expect("producer panicked");
    second_producer.await.expect("producer panicked");
}

#[tokio::test]
async fn one_task_owns_the_resource_and_answers_by_message() {
    let (tx, rx) = mpsc::channel(8);
    let worker = tokio::spawn(delivery_worker(rx));

    assert_eq!(ask_deliver(&tx, 7).await, deliver(7), "the oneshot carried this caller's own answer back");
    assert_eq!(ask_deliver(&tx, 8).await, deliver(8));
    assert_eq!(
        ask_delivered(&tx).await,
        2,
        "the count lives inside the worker: no Arc, no mutex, one owner reached only by message"
    );

    drop(tx);
    worker.await.expect("worker panicked");
}

#[tokio::test]
async fn many_callers_can_be_waiting_on_their_own_answers() {
    let (tx, rx) = mpsc::channel(8);
    let worker = tokio::spawn(delivery_worker(rx));

    let mut handles = Vec::new();
    for id in 1..=4u64 {
        let tx = tx.clone();
        handles.push(tokio::spawn(async move { (id, ask_deliver(&tx, id).await) }));
    }
    for handle in handles {
        let (id, receipt) = handle.await.expect("task panicked");
        assert_eq!(receipt, deliver(id), "no answer went to the wrong caller");
    }

    assert_eq!(ask_delivered(&tx).await, 4);
    drop(tx);
    worker.await.expect("worker panicked");
}
