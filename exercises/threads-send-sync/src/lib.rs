//! Threads, Send and Sync.
//!
//! Eight exercises across the section's six lessons. Run `cargo test -p
//! threads-send-sync` to see what is red, then delete each `todo!()` and make
//! the suite pass.
//!
//! One of these is type-level: `tests/thread_send_sync.rs` does not compile
//! until `Job` is built from parts that are allowed to cross a thread boundary.
//! That is why the tests are split one file per lesson. A sibling that does not
//! compile never blocks you, so `cargo test --test thread_locks` keeps working
//! while that one is still red.
//!
//! Every test here joins its threads before it asserts, nothing sleeps, and
//! nothing asserts on the order two threads happened to run in. Write your
//! answers the same way: a test that needs a sleep to pass is a test that fails
//! on a loaded machine.

use std::cell::RefCell;
use std::collections::VecDeque;
use std::rc::Rc;
use std::sync::Mutex;

/// Lesson: thread-spawn-join
///
/// Count how many addresses in each batch look deliverable (they contain an
/// `@`), giving every batch its own thread, and return the counts in batch
/// order.
///
/// COMPILE ERROR: a closure that only borrows its batch is rejected before it
/// ever runs, because nothing forces the child thread to finish before this
/// function's frame dies.
///
/// ```text
/// error[E0373]: closure may outlive the current function, but it borrows
///               `batch`, which is owned by the current function
/// note: function requires argument type to outlive `'static`
/// help: to force the closure to take ownership of `batch` (and any other
///       referenced variables), use the `move` keyword
/// ```
///
/// The test asserts the counts line up with the batches one for one, which is
/// an ordering claim the scheduler is not allowed to break. Getting there is
/// about where you join, not where you spawn.
pub fn valid_per_batch(_batches: Vec<Vec<String>>) -> Vec<usize> {
    todo!("spawn every thread first, then collect through the handles")
}

/// Lesson: thread-data-races
///
/// One memory location, described the way the lesson defines a race: how many
/// threads touch it, how many of those write, and whether anything at all
/// orders the accesses (a lock, an atomic, a channel handoff).
pub struct Access {
    pub threads: usize,
    pub writers: usize,
    pub synchronized: bool,
}

/// Lesson: thread-data-races
///
/// Report whether this access pattern is a data race. Three conditions, all
/// required at once. Remove any one of them and the answer is no, which is why
/// a thousand readers of never-written data need no synchronization at all.
pub fn is_data_race(_access: &Access) -> bool {
    todo!("all three hold, or it is not a race")
}

/// Lesson: thread-data-races
///
/// One step of an interleaving. `counter += 1` is not one step: it is a load
/// into a register, an add, and a store back. Each variant names the thread
/// performing it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Step {
    Load(usize),
    Add(usize),
    Store(usize),
}

/// Lesson: thread-data-races
///
/// Replay `steps` against one shared counter that starts at `start`, and return
/// what the counter finally holds. Every thread has its own register, and
/// nothing but the step list decides who goes when.
///
/// This is a model, not a race. It is deterministic on purpose, so that a test
/// can pin down the exact interleaving the real program only hits sometimes,
/// and you can watch an increment evaporate on demand.
pub fn replay(_start: u64, _steps: &[Step]) -> u64 {
    todo!("one shared cell, one private register per thread")
}

/// Lesson: thread-send-sync
///
/// A unit of work for a delivery thread: the batch it should send, and a count
/// of the attempts made so far. The payload sits behind a pointer so that
/// several holders share one copy of the batch, and the counter sits behind an
/// interior-mutability cell so `record_attempt` can work through `&self`, which
/// is the only kind of reference a shared handle ever hands out.
///
/// Both of those parts are built from unsynchronized integers, so this `Job`
/// may not leave the thread that made it, and `tests/thread_send_sync.rs` does
/// not compile as shipped:
///
/// ```text
/// error[E0277]: `Rc<Vec<String>>` cannot be sent between threads safely
///    = help: within `Job`, the trait `Send` is not implemented for `Rc<Vec<String>>`
/// note: required because it appears within the type `Job`
///
/// error[E0277]: `RefCell<u32>` cannot be shared between threads safely
///    = help: within `Job`, the trait `Sync` is not implemented for `RefCell<u32>`
/// ```
///
/// Swap each field for the counterpart that supplies the missing
/// synchronization, and fix the four bodies to match. The public API below does
/// not change, which is the point: the fix is a type substitution, and the
/// compiler found it for you before a single byte was corrupted.
pub struct Job {
    payload: Rc<Vec<String>>,
    attempts: RefCell<u32>,
}

impl Job {
    pub fn new(payload: Vec<String>) -> Self {
        Self { payload: Rc::new(payload), attempts: RefCell::new(0) }
    }

    /// How many addresses this job covers.
    pub fn recipients(&self) -> usize {
        self.payload.len()
    }

    /// Record one delivery attempt.
    pub fn record_attempt(&self) {
        *self.attempts.borrow_mut() += 1;
    }

    /// How many attempts have been recorded.
    pub fn attempts(&self) -> u32 {
        *self.attempts.borrow()
    }
}

/// Lesson: thread-channels
///
/// Give every batch its own worker, have each worker report back through one
/// channel, and return the reports in the order they arrived. A report reads
/// exactly `worker 2: 5 delivered`, numbered by the batch's position.
///
/// Nothing is shared here and no lock appears: the batch moves into its worker,
/// and the report moves through the send, so no two threads ever hold the same
/// value.
///
/// COMPILE ERROR: after a send, the sender's binding is dead. This is the
/// "Passing values into functions" lesson operating across threads.
///
/// ```text
/// error[E0382]: borrow of moved value: `email`
///   |
/// 6 |     tx.send(email).unwrap();
///   |             ----- value moved here
/// 7 |     println!("{email}");
///   |                ^^^^^ value borrowed here after move
/// ```
///
/// One specific mistake in here does not fail the test, it hangs it. The
/// lesson's closing exercise names the line, so answer that before you run
/// anything.
pub fn collect_reports(_batches: Vec<Vec<String>>) -> Vec<String> {
    todo!("a sender per worker; the receiver stops when the last one dies")
}

/// Lesson: thread-locks
///
/// Run `workers` threads, each recording `per_worker` deliveries into one
/// shared tally, and return the total once every worker has finished.
///
/// The `static mut` version of this program printed a different number every
/// run. This one is required to print the same number every run, and the test
/// runs it repeatedly to say so.
pub fn delivered_total(_workers: usize, _per_worker: u64) -> u64 {
    todo!("one allocation all the threads own, one lock around the count")
}

/// Lesson: thread-locks
///
/// Stands in for the SMTP round trip. Here it is instant and pure; in
/// production it is seconds of network. What the exercise is about is where you
/// call it from, which is to say: not while holding the lock.
pub fn deliver(email: &str) -> String {
    format!("250 OK {email}")
}

/// Lesson: thread-locks
///
/// Take the next email off the queue, or return `None` if there is none.
///
/// COMPILE ERROR: the one-liner that keeps the email inside the guard does not
/// compile, and the error is worth meeting on purpose.
///
/// ```text
/// error[E0716]: temporary value dropped while borrowed
///   |
/// 6 |     let next = queue.lock().unwrap().front();
///   |                ^^^^^^^^^^^^^^^^^^^^^        - temporary value is freed at
///   |                |                              the end of this statement
///   |                creates a temporary value which is freed while still in use
/// ```
///
/// Read the return type as the instruction it is: hand back an owned `String`,
/// so the lock is free the moment this call ends and the caller can take as
/// long as it likes over the delivery.
pub fn take_next(_queue: &Mutex<VecDeque<String>>) -> Option<String> {
    todo!("lock, pop, and let the guard die with the call")
}

/// Lesson: thread-locks
///
/// Drain the whole queue across `workers` threads and return one receipt per
/// email, whichever worker sent it. Each worker takes an email, delivers it,
/// and comes back for the next one until the queue is empty.
///
/// Note the parameter: a plain `&Mutex`, not an `Arc<Mutex>`. The test builds
/// its queue as a local variable and lends it out, which plain `spawn` can
/// never allow, because it cannot promise the threads die first. Something in
/// `std::thread` can promise exactly that, and it is the modern answer to
/// "I only wanted to borrow this".
///
/// Call `deliver` outside the lock. The test cannot see that you did, but every
/// other worker can.
pub fn deliver_all(_queue: &Mutex<VecDeque<String>>, _workers: usize) -> Vec<String> {
    todo!("borrowed threads, and a lock held only for the pop")
}

/// Lesson: thread-atomics
///
/// Two independent counters shared by every thread in the process: one tally of
/// deliveries, and one source of subscriber ids that must never hand the same
/// number out twice.
///
/// COMPILE ERROR: the fields as declared cannot be written through `&self`, and
/// `&self` is what a shared handle gives you.
///
/// ```text
/// error[E0594]: cannot assign to `self.delivered`, which is behind a `&` reference
///   |
/// 8 |         self.delivered += 1;
///   |         ^^^^^^^^^^^^^^^^^^^ `self` is a `&` reference, so it cannot be written to
/// ```
///
/// A `Mutex` would fix it and would also be overkill: these are two independent
/// machine words, not a multi-field invariant, and the hardware can add to one
/// indivisibly without any thread ever blocking. Change the field types, keep
/// the methods taking `&self`, and pick the ordering the lesson calls the
/// working dose for counters.
pub struct Metrics {
    delivered: u64,
    next_id: usize,
}

impl Metrics {
    pub fn new() -> Self {
        Self { delivered: 0, next_id: 1 }
    }

    /// Count one delivery.
    pub fn record_delivery(&self) {
        todo!("one indivisible read-modify-write, not load-add-store")
    }

    /// The deliveries counted so far.
    pub fn delivered(&self) -> u64 {
        todo!("read it out")
    }

    /// Hand out the next subscriber id. Ids start at 1 and are never repeated,
    /// however many threads ask at once.
    pub fn fresh_id(&self) -> usize {
        todo!("the same operation, and its return value is already the answer")
    }
}
