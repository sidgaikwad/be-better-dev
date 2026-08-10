//! Lesson: stream-timeouts

use std::time::{Duration, Instant};

use streams_cancellation::*;

#[tokio::test]
async fn a_provider_that_answers_in_time_is_accepted() {
    let verdict = send_with_deadline(Duration::from_secs(10), async {
        Ok("provider-message-id-9".to_string())
    })
    .await;

    assert_eq!(verdict, Delivery::Accepted("provider-message-id-9".to_string()));
}

#[tokio::test]
async fn a_slow_but_punctual_provider_is_still_accepted() {
    let verdict = send_with_deadline(Duration::from_secs(10), async {
        tokio::time::sleep(Duration::from_millis(5)).await;
        Ok("provider-message-id-9".to_string())
    })
    .await;

    assert_eq!(verdict, Delivery::Accepted("provider-message-id-9".to_string()));
}

#[tokio::test]
async fn a_rejection_is_not_a_timeout() {
    let verdict = send_with_deadline(Duration::from_secs(10), async {
        Err("550 mailbox unavailable".to_string())
    })
    .await;

    assert_eq!(
        verdict,
        Delivery::Rejected("550 mailbox unavailable".to_string()),
        "the call finished, so the outer layer is Ok; how it went is the inner layer's business"
    );
}

#[tokio::test]
async fn a_hung_provider_costs_the_deadline_and_nothing_more() {
    let started = Instant::now();
    let verdict = send_with_deadline(Duration::from_millis(10), async {
        tokio::time::sleep(Duration::from_secs(60)).await;
        Ok("never sent".to_string())
    })
    .await;

    assert_eq!(verdict, Delivery::TimedOut);
    assert!(
        started.elapsed() < Duration::from_secs(1),
        "the inner future was dropped where it sat, so its remaining fifty-nine seconds never happen to anyone"
    );
}
