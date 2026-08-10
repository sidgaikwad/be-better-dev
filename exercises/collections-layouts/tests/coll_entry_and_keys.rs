//! Lesson: coll-entry-and-keys

use std::collections::HashMap;

use collections_layouts::*;

fn opens() -> Vec<String> {
    [
        "zoe@example.com",
        "ada@example.com",
        "zoe@example.com",
        "grace@example.com",
        "ada@example.com",
        "zoe@example.com",
    ]
    .iter()
    .map(|email| email.to_string())
    .collect()
}

#[test]
fn one_probe_per_event() {
    let counts = count_opens(opens());

    assert_eq!(counts.len(), 3, "three distinct addresses in six events");

    // These lookups pass a &str to a map whose keys are String. Borrow bridges
    // the two, so a request handler never allocates a key just to discard it.
    assert_eq!(counts.get("zoe@example.com"), Some(&3));
    assert_eq!(counts.get("ada@example.com"), Some(&2));
    assert_eq!(counts.get("grace@example.com"), Some(&1));
    assert_eq!(counts.get("nobody@example.com"), None, "a vacant slot is None, not zero");
}

#[test]
fn an_empty_batch_produces_an_empty_map() {
    assert!(count_opens(Vec::new()).is_empty(), "no events, no entries, no panic");
}

#[test]
fn a_single_event_starts_the_counter_at_one() {
    let counts = count_opens(vec![String::from("ada@example.com")]);
    assert_eq!(counts.get("ada@example.com"), Some(&1), "the vacant slot got the default, then the increment");
}

#[test]
fn the_map_owns_its_keys() {
    let mut counts: HashMap<String, u32> = HashMap::new();
    counts.insert(String::from("ada@example.com"), 1);

    let replaced = counts.insert(String::from("ada@example.com"), 2);
    assert_eq!(replaced, Some(1), "the old value comes back out");
    assert_eq!(counts.len(), 1, "the map kept the key it already owned and dropped the new one");

    // entry(key) takes the key by value the same way, occupied or vacant, which
    // is why naming that key afterward is a borrow-of-moved-value error.
}
