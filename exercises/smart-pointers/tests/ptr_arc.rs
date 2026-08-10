//! Lesson: ptr-arc

use std::collections::HashSet;
use std::sync::Arc;
use std::thread;

use smart_pointers::*;

#[test]
fn one_allocation_read_by_every_worker() {
    let shared = Arc::new((1..=100).collect::<Vec<u64>>());
    assert_eq!(Arc::strong_count(&shared), 1);

    let report = parallel_sum(&shared, 4);

    assert_eq!(report.total, 5050, "every element counted exactly once");

    let distinct: HashSet<_> = report.threads.iter().collect();
    assert_eq!(distinct.len(), 4, "one thread per worker, the boundary Rc is not allowed to cross");
    assert!(
        !report.threads.contains(&thread::current().id()),
        "the chunks were summed off the calling thread"
    );

    assert_eq!(
        Arc::strong_count(&shared),
        1,
        "the count peaked at 5 and settled back: join means every handle has already dropped"
    );
    assert_eq!(shared.len(), 100, "the workers read the vector; nobody consumed it");
}

#[test]
fn the_split_covers_every_element_however_it_falls() {
    let shared = Arc::new((1..=7).collect::<Vec<u64>>());

    let report = parallel_sum(&shared, 3);

    assert_eq!(report.total, 28, "7 elements over 3 workers: none skipped, none counted twice");
    assert_eq!(report.threads.len(), 3, "one report entry per worker, even for a short tail");
    assert_eq!(Arc::strong_count(&shared), 1);
}
