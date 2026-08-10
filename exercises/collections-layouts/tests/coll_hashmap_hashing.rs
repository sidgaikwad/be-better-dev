//! Lesson: coll-hashmap-hashing
//!
//! This file does not compile until `CampaignId` can be a key. That is the
//! exercise: the error is the lesson. Every other file still runs, so work them
//! with `cargo test --test coll_entry_and_keys` and friends meanwhile.

use std::collections::HashMap;

use collections_layouts::*;

#[test]
fn a_key_has_to_hash_and_compare() {
    let mut sends: HashMap<CampaignId, u32> = HashMap::new();
    sends.insert(CampaignId { year: 2026, number: 7 }, 1200);
    sends.insert(CampaignId { year: 2026, number: 8 }, 900);

    // Insert hashed the key to pick a slot and confirmed the match with ==. An
    // equal key built somewhere else therefore finds the same entry.
    assert_eq!(sends.get(&CampaignId { year: 2026, number: 7 }), Some(&1200));
    assert_eq!(sends.get(&CampaignId { year: 2025, number: 7 }), None, "a different year is a different key");
    assert_eq!(sends.len(), 2);

    let replaced = sends.insert(CampaignId { year: 2026, number: 7 }, 1300);
    assert_eq!(replaced, Some(1200), "insert hands back the value that was there");
    assert_eq!(sends.len(), 2, "an equal key found the existing slot rather than taking a new one");
}

#[test]
fn iteration_order_is_not_a_contract() {
    let mut events = HashMap::new();
    for name in ["ack", "bounce", "click", "drop", "expire"] {
        events.insert(name, 0u32);
    }

    let mut names: Vec<&str> = events.keys().copied().collect();
    // Asserting on events.keys() as it comes out is the test that passes today
    // and fails after the next run seeds SipHash with fresh randomness. Sorting
    // first is the fix, and a BTreeMap is the other one.
    names.sort_unstable();
    assert_eq!(names, ["ack", "bounce", "click", "drop", "expire"]);
}
