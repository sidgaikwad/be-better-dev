//! Lesson: coll-vec-in-depth

use collections_layouts::*;

fn queue() -> Vec<PendingEmail> {
    vec![
        PendingEmail::new("ada@example.com", 0),
        PendingEmail::new("bounce@example.com", 3),
        PendingEmail::new("grace@example.com", 1),
        PendingEmail::new("dead@example.com", 5),
        PendingEmail::new("zoe@example.com", 0),
    ]
}

fn addresses(queue: &[PendingEmail]) -> Vec<&str> {
    queue.iter().map(|job| job.address.as_str()).collect()
}

#[test]
fn retaining_keeps_arrival_order() {
    let mut queue = queue();
    let before = queue.capacity();

    drop_bounced(&mut queue, 3);

    assert_eq!(
        addresses(&queue),
        ["ada@example.com", "grace@example.com", "zoe@example.com"],
        "survivors keep the order they arrived in"
    );
    assert_eq!(
        queue.capacity(),
        before,
        "removing elements drops them and keeps the buffer; only the Vec's own drop frees it"
    );
}

#[test]
fn swap_remove_trades_order_for_constant_time() {
    let mut queue = queue();

    let taken = take_unordered(&mut queue, 1);

    assert_eq!(taken.address, "bounce@example.com", "the evicted job comes back out");
    assert_eq!(
        addresses(&queue),
        ["ada@example.com", "zoe@example.com", "grace@example.com", "dead@example.com"],
        "the last job moved into the hole and the tail never shifted"
    );
}

#[test]
fn a_full_prune_leaves_an_empty_queue() {
    let mut queue = queue();
    drop_bounced(&mut queue, 0);
    assert!(queue.is_empty(), "a limit of zero bounces everyone");
    assert!(queue.capacity() >= 5, "still holding the buffer, ready for the next batch");
}
