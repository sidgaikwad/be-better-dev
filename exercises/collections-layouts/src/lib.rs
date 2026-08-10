//! Collections and their layouts.
//!
//! Eight exercises across the section's six lessons. Run `cargo test -p
//! collections-layouts` to see what is red, then delete each `todo!()` and make
//! the suite pass.
//!
//! `tests/coll_hashmap_hashing.rs` does not compile until you fix the type it
//! names. That one is deliberate. Every other file still runs meanwhile, so
//! work them with `cargo test --test coll_vec_in_depth` and friends.

use std::collections::{BTreeMap, HashMap};

/// Lesson: coll-vec-in-depth
///
/// One job in the delivery worker's queue. Already written; the exercises below
/// operate on vectors of these.
#[derive(Debug, Clone, PartialEq)]
pub struct PendingEmail {
    pub address: String,
    pub attempts: u32,
}

impl PendingEmail {
    pub fn new(address: &str, attempts: u32) -> Self {
        Self { address: address.to_string(), attempts }
    }
}

/// Lesson: coll-vec-in-depth
///
/// Delete every job that has already been attempted `limit` times or more, and
/// leave the survivors in the order they arrived.
///
/// A loop calling `remove` passes this test too, and is the quadratic trap the
/// lesson describes: one shifted tail per deletion. Write the single pass that
/// loop was trying to be.
///
/// The test also checks capacity afterward, because none of the removal methods
/// hand memory back to the allocator.
pub fn drop_bounced(_queue: &mut Vec<PendingEmail>, _limit: u32) {
    todo!("one left-to-right pass that keeps the jobs you want")
}

/// Lesson: coll-vec-in-depth
///
/// Remove the job at `index` and return it, in constant time.
///
/// Constant time rules out shifting the tail, so something else has to fill the
/// hole and the queue's order changes in one specific way. The test spells out
/// the order it expects: predict it before you run it.
pub fn take_unordered(_queue: &mut Vec<PendingEmail>, _index: usize) -> PendingEmail {
    todo!("fill the hole with one element, not with the whole tail")
}

/// Lesson: coll-string-utf8
///
/// Shorten `subject` so it occupies at most `max_bytes` bytes, and report how
/// many characters survived the cut.
///
/// COMPILE ERROR: the obvious first attempt is not available at all.
///
/// ```text
/// error[E0277]: the type `str` cannot be indexed by `{integer}`
///   = help: the trait `SliceIndex<str>` is not implemented for `{integer}`
/// ```
///
/// Byte-range slicing does exist, and is checked at runtime instead. This is
/// `&"naïve"[..3]`:
///
/// ```text
/// thread 'main' panicked at src/main.rs:3:25:
/// end byte index 3 is not a char boundary; it is inside 'ï' (bytes 2..4 of string)
/// ```
///
/// So `&subject[..max_bytes]` is a panic waiting for its first non-ASCII
/// subscriber. Return a borrowed slice, never an allocation and never a panic,
/// and remember that the two numbers in the return type answer two different
/// questions.
pub fn fit_subject(_subject: &str, _max_bytes: usize) -> (&str, usize) {
    todo!("walk the cut back until it is legal, then count scalars, not bytes")
}

/// Lesson: coll-hashmap-hashing
///
/// The id a campaign's sends are filed under. Make it usable as a map key.
///
/// COMPILE ERROR: `tests/coll_hashmap_hashing.rs` does not build as shipped.
///
/// ```text
/// error[E0599]: the method `insert` exists for struct `HashMap<CampaignId, u32>`,
///               but its trait bounds were not satisfied
///   |
///   | pub struct CampaignId {
///   | --------------------- doesn't satisfy `CampaignId: Eq` or `CampaignId: Hash`
///   |
///   = note: the following trait bounds were not satisfied:
///           `CampaignId: Eq`
///           `CampaignId: Hash`
/// ```
///
/// Step 1 of the lesson's insert hashes the key, and step 3 confirms the slot
/// with `==`. A key that cannot do both has no business in the table. Derives
/// are enough here; the lesson explains why a struct holding an `f64` could not
/// have them.
#[derive(Debug, Clone)]
pub struct CampaignId {
    pub year: u16,
    pub number: u32,
}

/// Lesson: coll-entry-and-keys
///
/// Count how many times each address appears, hashing each address once per
/// event rather than twice.
///
/// `opens` arrives by value because the map is about to own these keys: one
/// owner per value applies inside a collection too. The check-then-insert shape
/// passes this test as well, at the price of a second probe and an `unwrap` the
/// compiler cannot check. Write the shape the lesson names instead.
pub fn count_opens(_opens: Vec<String>) -> HashMap<String, u32> {
    todo!("ask the map for the slot once, occupied or vacant")
}

/// Lesson: coll-choosing-structures
///
/// Return every address from `start` up to but not including `end`, in
/// alphabetical order, without sorting anything.
///
/// The parameter is a `BTreeMap` because the dashboard wants order and paging,
/// and a `HashMap` offers neither: its iteration order is whatever the random
/// seed made it. Collecting every key and filtering also passes this test, and
/// reads the whole map to do it. The structure can find the first key in
/// O(log n) and then walk forward, touching the matches and one key past them.
pub fn page_range(_subs: &BTreeMap<&str, bool>, _start: &str, _end: &str) -> Vec<String> {
    todo!("one seek to the lower bound, then forward while the key is in range")
}

/// Lesson: coll-choosing-structures
///
/// The delivery queue. Jobs join the back, workers take from the front, and a
/// job that just failed jumps to the front so it is retried next.
///
/// A `Vec` gets one end of this wrong: `remove(0)` shifts every waiting job,
/// once per delivery. Give the struct the field the lesson names, add the import
/// it needs, then fill in the bodies. Every operation here should be amortised
/// O(1), and the whole queue should stay in one allocation.
pub struct RetryQueue {
    // TODO: one field. Both ends cheap, one buffer, used circularly.
}

impl RetryQueue {
    pub fn new() -> Self {
        todo!("an empty queue")
    }

    /// Add a job at the back of the queue.
    pub fn submit(&mut self, _address: &str) {
        todo!("joins last, so it is served last")
    }

    /// Put a job at the front, ahead of everyone already waiting.
    pub fn retry_first(&mut self, _address: &str) {
        todo!("the other end of the same structure")
    }

    /// Take the next job to deliver, or None when the queue is empty.
    pub fn next_job(&mut self) -> Option<String> {
        todo!("first in, first out, and nothing shifts")
    }

    pub fn len(&self) -> usize {
        todo!("how many jobs are waiting")
    }
}

/// Lesson: coll-cache-locality
///
/// A rows-by-cols grid of counters, laid out so that a full scan walks memory
/// forward from the first cell to the last.
///
/// `Vec<Vec<i64>>` is the layout this exercise exists to avoid: one heap
/// allocation per row, placed wherever the allocator felt like, so a scan pays
/// a fresh miss per row and no prefetcher can help. Store one buffer and do the
/// index arithmetic yourself.
///
/// `as_row_major` is where the test leans on the layout: a grid built from
/// per-row buffers could not hand back a single slice covering every cell.
pub struct Grid {
    // TODO: the buffer, plus whatever you need to turn (row, col) into an offset.
}

impl Grid {
    /// A new grid with every cell zeroed, in one allocation.
    pub fn new(_rows: usize, _cols: usize) -> Self {
        todo!("rows * cols cells, allocated once")
    }

    pub fn set(&mut self, _row: usize, _col: usize, _value: i64) {
        todo!("compute the offset, then write it")
    }

    pub fn get(&self, _row: usize, _col: usize) -> i64 {
        todo!("the same offset, read back")
    }

    /// One row, as a contiguous slice of the single buffer.
    pub fn row(&self, _row: usize) -> &[i64] {
        todo!("a window into the buffer, not a copy of it")
    }

    /// Every cell, row by row, as one slice.
    pub fn as_row_major(&self) -> &[i64] {
        todo!("the whole buffer, in one piece")
    }

    /// Sum every cell.
    pub fn total(&self) -> i64 {
        todo!("one sequential walk, no indirection per row")
    }
}
