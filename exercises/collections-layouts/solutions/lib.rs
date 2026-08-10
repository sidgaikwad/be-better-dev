//! Reference solutions. Read these after you have something passing.
//!
//! Where a solution had a choice to make, the comment says which way it went
//! and why, since that judgment is the part worth copying.

use std::collections::{BTreeMap, HashMap, VecDeque};

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

/// retain is one left-to-right pass: it moves each survivor down into the first
/// free slot and shortens the length once at the end. The loop-calling-remove
/// version shifts the whole tail per deletion, which is the same work squared,
/// and it is easy to write by accident.
pub fn drop_bounced(queue: &mut Vec<PendingEmail>, limit: u32) {
    queue.retain(|job| job.attempts < limit);
}

/// swap_remove is one read and one write: the last element fills the hole, the
/// length drops by one, nothing else moves. Order is the price, and it is worth
/// paying here because the worker takes jobs in batches and nothing downstream
/// reads position. Where order does matter, remove(i) is the honest O(n).
pub fn take_unordered(queue: &mut Vec<PendingEmail>, index: usize) -> PendingEmail {
    queue.swap_remove(index)
}

/// min clamps a budget larger than the text, so the happy path needs no special
/// case. is_char_boundary walks the cut back at most three bytes: continuation
/// bytes all match 10xxxxxx, which is what makes the encoding self-synchronizing
/// and the check a single byte test. Slicing on a boundary cannot panic, so the
/// result is a borrow of the caller's text with no allocation anywhere.
/// `subject.get(..end)` is the other half of the same pair: it returns None
/// instead of panicking, and suits code that wants to report the bad cut rather
/// than repair it.
pub fn fit_subject(subject: &str, max_bytes: usize) -> (&str, usize) {
    let mut end = max_bytes.min(subject.len());
    while !subject.is_char_boundary(end) {
        end -= 1;
    }
    let fitted = &subject[..end];
    (fitted, fitted.chars().count())
}

/// Hash covers step 1 of an insert and Eq covers step 3. Eq rather than plain
/// PartialEq is the promise that a == a always holds, which is exactly what a
/// table needs to find a key again: a struct holding an f64 cannot have it,
/// because NaN != NaN would strand its own entry. Clone and Debug are
/// convenience, not requirements.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct CampaignId {
    pub year: u16,
    pub number: u32,
}

/// entry hashes and probes once, then hands back the slot itself. or_insert
/// fills a vacant slot and returns &mut V either way, so the += lands on the
/// right counter with no second lookup and no unwrap. Taking `opens` by value
/// means each key moves into the map rather than being cloned into it; the
/// caller gave the batch away on the way in.
pub fn count_opens(opens: Vec<String>) -> HashMap<String, u32> {
    let mut counts = HashMap::new();
    for email in opens {
        *counts.entry(email).or_insert(0) += 1;
    }
    counts
}

/// range seeks the lower bound in O(log n) and then walks forward, stopping at
/// the first key past the end: it touches the matches and one more, never the
/// whole map. That is the operation a HashMap cannot fake cheaply, and the
/// reason to accept O(log n) point lookups in exchange.
///
/// The allocation is forced by the return type. Handing back Vec<&str> would
/// borrow the map's keys instead and cost nothing, and is the better signature
/// whenever the caller can hold that borrow; it needs a named lifetime, since
/// elision cannot guess which of three inputs the output comes from.
pub fn page_range(subs: &BTreeMap<&str, bool>, start: &str, end: &str) -> Vec<String> {
    subs.range(start..end).map(|(email, _)| email.to_string()).collect()
}

/// A ring buffer: one contiguous allocation used circularly, with head and tail
/// indices chasing each other around it. Both ends are amortised O(1), which is
/// the whole reason this is not a Vec, where remove(0) would shift every waiting
/// job once per delivery and turn the queue quadratic.
pub struct RetryQueue {
    jobs: VecDeque<String>,
}

impl RetryQueue {
    pub fn new() -> Self {
        Self { jobs: VecDeque::new() }
    }

    pub fn submit(&mut self, address: &str) {
        self.jobs.push_back(address.to_string());
    }

    /// The operation that decides the structure. A Vec can push to the back and
    /// pop from the back cheaply; putting an element at the front is the one
    /// thing it cannot do without moving everything.
    pub fn retry_first(&mut self, address: &str) {
        self.jobs.push_front(address.to_string());
    }

    pub fn next_job(&mut self) -> Option<String> {
        self.jobs.pop_front()
    }

    pub fn len(&self) -> usize {
        self.jobs.len()
    }
}

/// One buffer with the rows laid end to end. The index arithmetic is the price
/// of keeping the whole grid in a single run of memory, and that is what lets a
/// row-order scan take the cache line discount and ride the prefetcher instead
/// of paying a fresh miss at every row boundary.
///
/// Storing cols rather than rows is deliberate: cols is what the offset needs,
/// and rows falls out of cells.len() / cols when anyone asks.
pub struct Grid {
    cells: Vec<i64>,
    cols: usize,
}

impl Grid {
    pub fn new(rows: usize, cols: usize) -> Self {
        Self { cells: vec![0; rows * cols], cols }
    }

    pub fn set(&mut self, row: usize, col: usize, value: i64) {
        let offset = self.offset(row, col);
        self.cells[offset] = value;
    }

    pub fn get(&self, row: usize, col: usize) -> i64 {
        self.cells[self.offset(row, col)]
    }

    pub fn row(&self, row: usize) -> &[i64] {
        let start = row * self.cols;
        &self.cells[start..start + self.cols]
    }

    pub fn as_row_major(&self) -> &[i64] {
        &self.cells
    }

    /// The payoff. Summing the grid is one sequential walk over one allocation,
    /// with no per-row pointer to chase and nothing for the loop to stall on.
    pub fn total(&self) -> i64 {
        self.cells.iter().sum()
    }

    fn offset(&self, row: usize, col: usize) -> usize {
        row * self.cols + col
    }
}
