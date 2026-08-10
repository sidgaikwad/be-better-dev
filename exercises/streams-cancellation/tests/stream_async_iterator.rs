//! Lesson: stream-async-iterator

use tokio_stream::StreamExt;

use streams_cancellation::*;

fn ok(email: &str) -> Result<String, String> {
    Ok(email.to_string())
}

#[tokio::test]
async fn every_row_arrives_in_order() {
    let rows = tokio_stream::iter(vec![ok("ana@example.com"), ok("bo@example.com")]);

    assert_eq!(
        collect_addresses(rows).await,
        Ok(vec!["ana@example.com".to_string(), "bo@example.com".to_string()]),
        "a stream is a sequence, so order is still order"
    );
}

#[tokio::test]
async fn an_empty_result_set_is_not_a_hang() {
    let rows = tokio_stream::iter(Vec::<Result<String, String>>::new());

    assert_eq!(
        collect_addresses(rows).await,
        Ok(Vec::new()),
        "Ready(None) on the first poll: the async end of sequence"
    );
}

#[tokio::test]
async fn the_first_bad_row_ends_the_drain() {
    let rows = tokio_stream::iter(vec![
        ok("ana@example.com"),
        Err("row 2 failed to decode".to_string()),
        ok("cy@example.com"),
        Err("row 4 failed to decode".to_string()),
    ]);

    assert_eq!(
        collect_addresses(rows).await,
        Err("row 2 failed to decode".to_string()),
        "the first error, not the last: the loop stopped there instead of draining past it"
    );
}

#[tokio::test]
async fn the_chain_filters_then_limits() {
    let rows = vec![
        Row { email: "ana@example.com".to_string(), confirmed: true },
        Row { email: "bo@example.com".to_string(), confirmed: false },
        Row { email: "cy@example.com".to_string(), confirmed: true },
        Row { email: "di@example.com".to_string(), confirmed: true },
    ];

    let mut emails = confirmed_emails(rows, 2);
    let mut got = Vec::new();
    while let Some(email) = emails.next().await {
        got.push(email);
    }

    assert_eq!(
        got,
        vec!["ana@example.com".to_string(), "cy@example.com".to_string()],
        "two confirmed addresses, so the limit counts what survived the filter"
    );
}

#[tokio::test]
async fn a_limit_larger_than_the_result_set_is_harmless() {
    let rows = vec![Row { email: "ana@example.com".to_string(), confirmed: true }];

    let got: Vec<String> = confirmed_emails(rows, 100).collect().await;

    assert_eq!(got, vec!["ana@example.com".to_string()], "take stops at the end of the source too");
}

#[tokio::test]
async fn attempts_counts_up_and_then_ends() {
    let mut attempts = Attempts::new(3);
    let mut got = Vec::new();
    while let Some(attempt) = attempts.next().await {
        got.push(attempt);
    }

    assert_eq!(got, vec![1, 2, 3], "poll_next answered Ready(Some(..)) three times, then Ready(None)");
}

#[tokio::test]
async fn a_finished_stream_stays_finished() {
    let mut attempts = Attempts::new(0);

    assert_eq!(attempts.next().await, None, "no attempts left before the first poll");
    assert_eq!(attempts.next().await, None, "the end of a sequence is not a one-time announcement");
}

#[tokio::test]
async fn the_adapters_do_not_care_where_a_stream_came_from() {
    // The same vocabulary, over a stream nobody in tokio-stream has heard of:
    // implementing one trait is the entire price of admission.
    let doubled: Vec<u32> = Attempts::new(4).map(|n| n * 2).filter(|n| n % 4 == 0).collect().await;

    assert_eq!(doubled, vec![4, 8]);
}
