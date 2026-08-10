//! Reference solutions. Read these after you have something passing.
//!
//! Where a solution had a choice to make, the comment says which way it went
//! and why, since that judgment is the part worth copying.

use std::collections::{HashMap, VecDeque};
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex, mpsc};
use std::thread;

/// Two loops, not one. Spawning inside the first and joining inside the second
/// is what makes this concurrent: join in the spawn loop and each thread is
/// waited out before the next one starts, which is the sequential program with
/// a thread's overhead added.
///
/// Collecting in handle order is what buys the deterministic result. The
/// threads finish in whatever order the scheduler picks; the vector does not
/// care, because a handle is joined where it sits.
pub fn valid_per_batch(batches: Vec<Vec<String>>) -> Vec<usize> {
    let mut handles = Vec::with_capacity(batches.len());
    for batch in batches {
        // `move` transfers the batch into the closure. Nothing is shared, so
        // there is nothing here to synchronize.
        handles.push(thread::spawn(move || batch.iter().filter(|to| to.contains('@')).count()));
    }
    handles.into_iter().map(|handle| handle.join().unwrap()).collect()
}

pub struct Access {
    pub threads: usize,
    pub writers: usize,
    pub synchronized: bool,
}

/// The definition, transcribed. Writing it as one `&&` chain is the honest
/// shape: three conditions, all required at once, and no fourth clause hiding
/// anywhere. A single thread cannot race with itself, a location nobody writes
/// is safe for any number of readers, and synchronization of any kind removes
/// the third condition.
pub fn is_data_race(access: &Access) -> bool {
    access.threads >= 2 && access.writers >= 1 && !access.synchronized
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Step {
    Load(usize),
    Add(usize),
    Store(usize),
}

/// A map rather than a vector for the registers, so the thread numbers can be
/// anything the caller likes. A store from a thread that never loaded writes
/// its zeroed register, which is exactly the garbage a real uninitialized
/// register would hand over.
///
/// The whole exercise is in `Store`: it writes back a value read at `Load`
/// time, and any work another thread did in between is simply overwritten.
/// That is a lost update, and no amount of care inside one thread prevents it.
pub fn replay(start: u64, steps: &[Step]) -> u64 {
    let mut counter = start;
    let mut registers: HashMap<usize, u64> = HashMap::new();
    for step in steps {
        match *step {
            Step::Load(thread) => {
                registers.insert(thread, counter);
            }
            Step::Add(thread) => {
                *registers.entry(thread).or_insert(0) += 1;
            }
            Step::Store(thread) => {
                counter = registers.get(&thread).copied().unwrap_or(0);
            }
        }
    }
    counter
}

/// `Arc` is `Rc` with an atomic count, and `Mutex` is `RefCell` with blocking
/// instead of a panic. Both are the same idea paid for in synchronization, and
/// swapping them in is the entire fix: no field was added, no method signature
/// moved, and `record_attempt` still takes `&self`.
pub struct Job {
    payload: Arc<Vec<String>>,
    attempts: Mutex<u32>,
}

impl Job {
    pub fn new(payload: Vec<String>) -> Self {
        Self { payload: Arc::new(payload), attempts: Mutex::new(0) }
    }

    pub fn recipients(&self) -> usize {
        self.payload.len()
    }

    /// `.unwrap()` on the lock is the usual policy: if a thread panicked
    /// mid-update the count is not to be trusted, so fail here too.
    pub fn record_attempt(&self) {
        *self.attempts.lock().unwrap() += 1;
    }

    pub fn attempts(&self) -> u32 {
        *self.attempts.lock().unwrap()
    }
}

/// `drop(tx)` is the load-bearing line. The four clones die with their worker
/// threads, but the original stays alive in this frame, and the receiver keeps
/// waiting for it forever while this frame sits inside the loop that is waiting
/// for the receiver. Dropping it first is one fix; handing the last worker the
/// original instead of a clone is the other.
///
/// The reports arrive in whatever order the workers finish, which is why the
/// test sorts before it compares. Claiming an order here would be a test that
/// passes on a quiet laptop and fails under load.
pub fn collect_reports(batches: Vec<Vec<String>>) -> Vec<String> {
    let (tx, rx) = mpsc::channel();
    for (worker, batch) in batches.into_iter().enumerate() {
        let tx = tx.clone();
        thread::spawn(move || {
            let report = format!("worker {worker}: {} delivered", batch.len());
            // The report moves into the channel. There is no second copy of it
            // anywhere, so there is nothing to guard.
            tx.send(report).unwrap();
        });
    }
    drop(tx);
    rx.into_iter().collect()
}

/// `Arc` gives every thread ownership of one allocation; `Mutex` makes the
/// writes legal. Neither alone is enough, which is why the pair travels
/// together so often that it reads as a single idiom.
///
/// The guard is a temporary inside the loop body, so it is released at the end
/// of each statement rather than held for the whole loop. Hoisting the lock out
/// of the loop would be faster here and wrong in general: it is the shape that
/// starves every other worker once the body does anything slow.
pub fn delivered_total(workers: usize, per_worker: u64) -> u64 {
    let delivered = Arc::new(Mutex::new(0u64));
    let mut handles = Vec::with_capacity(workers);
    for _ in 0..workers {
        let delivered = Arc::clone(&delivered);
        handles.push(thread::spawn(move || {
            for _ in 0..per_worker {
                *delivered.lock().unwrap() += 1;
            }
        }));
    }
    for handle in handles {
        handle.join().unwrap();
    }
    *delivered.lock().unwrap()
}

pub fn deliver(email: &str) -> String {
    format!("250 OK {email}")
}

/// `pop_front` returns an owned `String`, so the guard has nothing left to lend
/// and dies at the end of the function. Returning `Option<&String>` instead
/// would not compile, and the reason is the same one that makes this correct:
/// the reference would outlive the guard that made it legal.
pub fn take_next(queue: &Mutex<VecDeque<String>>) -> Option<String> {
    let mut guard = queue.lock().unwrap();
    guard.pop_front()
}

/// `thread::scope` is what lets the parameter be a plain `&Mutex`. The scope
/// does not return until every thread inside it has been joined, so the borrow
/// provably ends after the threads do, and no `Arc` is needed to prove it.
///
/// The lock covers the `pop_front` and nothing else. `deliver` stands in for an
/// SMTP round trip, and running it inside the guard would serialize every
/// worker behind the slowest network call in the queue.
pub fn deliver_all(queue: &Mutex<VecDeque<String>>, workers: usize) -> Vec<String> {
    thread::scope(|scope| {
        let mut handles = Vec::with_capacity(workers);
        for _ in 0..workers {
            handles.push(scope.spawn(|| {
                let mut receipts = Vec::new();
                while let Some(email) = take_next(queue) {
                    receipts.push(deliver(&email));
                }
                receipts
            }));
        }
        handles.into_iter().flat_map(|handle| handle.join().unwrap()).collect()
    })
}

/// Two independent scalars, so two atomics and no lock. A `Mutex<(u64, usize)>`
/// would also be correct and would tie the two counters together for no reason:
/// a thread asking for an id would wait behind a thread counting a delivery.
pub struct Metrics {
    delivered: AtomicU64,
    next_id: AtomicUsize,
}

impl Metrics {
    pub fn new() -> Self {
        Self { delivered: AtomicU64::new(0), next_id: AtomicUsize::new(1) }
    }

    /// `Relaxed` is the right dose here. The counter stands for nothing but
    /// itself: no other memory is being published through it, so there is
    /// nothing for a stronger ordering to order.
    pub fn record_delivery(&self) {
        self.delivered.fetch_add(1, Ordering::Relaxed);
    }

    /// A load can be stale, never torn and never invented, which is what makes
    /// a progress meter over `Relaxed` sound. The test reads this while the
    /// workers are still running for exactly that reason.
    pub fn delivered(&self) -> u64 {
        self.delivered.load(Ordering::Relaxed)
    }

    /// `fetch_add` returns the value from before the add, so the id is the
    /// return value and no separate read is needed. A load followed by a store
    /// would reintroduce the window the atomic exists to close.
    pub fn fresh_id(&self) -> usize {
        self.next_id.fetch_add(1, Ordering::Relaxed)
    }
}
