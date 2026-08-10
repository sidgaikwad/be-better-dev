//! Lesson: coll-choosing-structures

use std::collections::BTreeMap;

use collections_layouts::*;

fn subscribers() -> BTreeMap<&'static str, bool> {
    // Inserted in no particular order, on purpose.
    [
        ("maria@example.com", true),
        ("alice@example.com", false),
        ("nina@example.com", true),
        ("mo@example.com", false),
        ("zoe@example.com", true),
    ]
    .into_iter()
    .collect()
}

#[test]
fn a_btree_map_is_sorted_by_construction() {
    let subs = subscribers();
    let all: Vec<&str> = subs.keys().copied().collect();
    assert_eq!(
        all,
        [
            "alice@example.com",
            "maria@example.com",
            "mo@example.com",
            "nina@example.com",
            "zoe@example.com",
        ],
        "insertion order is gone and sorted order is the invariant, which is what makes this safe to snapshot"
    );
}

#[test]
fn range_pages_without_sorting_anything() {
    let subs = subscribers();

    assert_eq!(
        page_range(&subs, "m", "n"),
        ["maria@example.com", "mo@example.com"],
        "everyone from m up to n, already in order"
    );
    assert_eq!(page_range(&subs, "n", "z"), ["nina@example.com"], "the end bound is exclusive, so zoe is the next page");
    assert!(page_range(&subs, "b", "c").is_empty(), "a range that matches nothing is empty, not an error");
    assert_eq!(page_range(&subs, "a", "zz").len(), 5, "a range wide enough covers the whole map");
}

#[test]
fn the_queue_moves_at_both_ends() {
    let mut queue = RetryQueue::new();
    queue.submit("ada@example.com");
    queue.submit("grace@example.com");
    queue.submit("zoe@example.com");
    assert_eq!(queue.len(), 3);

    assert_eq!(queue.next_job().as_deref(), Some("ada@example.com"), "first in, first out");
    assert_eq!(queue.len(), 2, "the head index moved; nothing shifted");

    // That send failed, so it goes back to the front, ahead of everyone waiting.
    queue.retry_first("ada@example.com");
    assert_eq!(queue.next_job().as_deref(), Some("ada@example.com"), "the retry jumped the queue");
    assert_eq!(queue.next_job().as_deref(), Some("grace@example.com"));
    assert_eq!(queue.next_job().as_deref(), Some("zoe@example.com"));

    assert_eq!(queue.next_job(), None, "an empty queue answers None rather than panicking");
    assert_eq!(queue.len(), 0);
}
