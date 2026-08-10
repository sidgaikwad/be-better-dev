//! Concurrency patterns.
//!
//! Eight exercises and one prediction, across the section's six lessons. Run
//! `cargo test -p concurrency-patterns` to see what is red, then delete each
//! `todo!()` until the suite passes.
//!
//! The tests assert invariants and never timing: every job ran exactly once,
//! nothing was ever above the limit, nothing was lost. Where a test has to
//! observe two tasks running at the same instant it makes them meet at a
//! `Barrier` rather than hoping the scheduler cooperates, so a red result is
//! always a fact about your code and never about the machine's mood.

use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::sync::atomic::AtomicUsize;

use tokio::sync::{mpsc, watch};
use tokio::task::JoinHandle;

/// What one delivery attempt produced: which subscriber it was for, and
/// whether the provider took it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Outcome {
    pub subscriber: u32,
    pub delivered: bool,
}

/// A unit of work.
///
/// Work arrives as a future rather than as data so the tests can decide what
/// "doing the job" means: report the instant it starts, park until the rest of
/// the pool catches up, count itself while it is in flight. Jobs cross into
/// other tasks, which is why the alias says `Send` and why it is `'static`,
/// the Send and Sync lesson showing up in a type alias instead of an error.
pub type Job = Pin<Box<dyn Future<Output = Outcome> + Send>>;

/// Build a job that finishes immediately. Scaffolding for the tests, not an
/// exercise: it is already written.
pub fn job(subscriber: u32, delivered: bool) -> Job {
    Box::pin(async move { Outcome { subscriber, delivered } })
}

/// Lesson: conc-worker-pools
///
/// Start `workers` tasks that all drain one queue, run every job they take,
/// and stop when the queue is closed and empty. Return, in worker order, the
/// outcomes each worker produced.
///
/// A `tokio::sync::mpsc::Receiver` has one owner and does not clone, so the
/// pool wraps it in `Arc<tokio::sync::Mutex<_>>`: "one consumer" becomes "one
/// consumer at a time", which is all a pool needs. Nothing else here needs a
/// lock.
///
/// Two details decide whether this is a pool or a queue with extra steps.
/// Where the guard drops is the first, and `every_worker_gets_to_work` is the
/// test that notices; a worker should hold the lock while waiting for a job
/// and never while running one. Shutdown is the second: there is no stop flag
/// in this design, only the last `Sender` going out of scope.
pub async fn run_pool(_jobs: Vec<Job>, _workers: usize) -> Vec<Vec<Outcome>> {
    todo!("one receiver, N workers, and a guard that is gone before the job runs")
}

/// Lesson: conc-backpressure
///
/// Start a producer task that sends `0..total` into a queue with room for
/// `capacity` waiting items, bumping `sent` after each item it hands over.
/// Return the receiving end for the caller to drain, plus the producer's
/// handle.
///
/// `sent` is how the test watches the producer's speed, so the queue has to be
/// able to say no. An unbounded queue would let the counter reach `total`
/// before the consumer read anything: the producer would measure itself as
/// healthy while the heap absorbed the overload, which is the failure the
/// lesson prices in memory, latency, and 3 a.m. diagnosis.
pub fn start_producer(
    _capacity: usize,
    _total: u32,
    _sent: Arc<AtomicUsize>,
) -> (mpsc::Receiver<u32>, JoinHandle<()>) {
    todo!("bounded, and awaited: a full queue is information for the producer")
}

/// Lesson: conc-backpressure
///
/// Run every job with at most `limit` of them in flight at any instant, and
/// return their outcomes. Order is not part of the contract; the tests sort
/// before they compare.
///
/// A channel bounds the jobs that are waiting. This bounds the jobs that are
/// running, which is a different question and a different tool. Note that the
/// limit is a ceiling and not a schedule: with a limit of 3 and nine jobs,
/// three of them have to be running together, not one after another.
pub async fn bounded_fan_out(_jobs: Vec<Job>, _limit: usize) -> Vec<Outcome> {
    todo!("hand out permits, and let each job hold its own until it finishes")
}

/// Lesson: conc-actors
///
/// The counts the delivery worker keeps while an issue goes out.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct Stats {
    pub delivered: usize,
    pub failed: usize,
}

// TODO: a private `Command` enum, one variant per message the actor accepts.
// The variant that expects an answer carries the `oneshot::Sender` to answer
// on, which is what makes a request out of a message.

/// Lesson: conc-actors
///
/// A handle to the task that owns the counts.
///
/// The state lives in one task, so nothing synchronizes it: exclusive access
/// enforced by ownership instead of by a lock. Cloning this handle must hand
/// out another way to reach the same task, not another copy of the state, and
/// `the_handle_is_only_a_sender` fails if the struct is carrying anything
/// besides its channel.
#[derive(Clone)]
pub struct Progress {
    // TODO: one field, and it is not a lock.
}

impl Progress {
    /// Spawn the actor. The returned handle is what callers use; the
    /// `JoinHandle` completes with the final counts.
    ///
    /// That completion is the worker pool's shutdown again. An inbox whose
    /// last sender is gone returns `None`, the loop ends, and the state the
    /// task owned comes back as its return value.
    pub fn spawn() -> (Self, JoinHandle<Stats>) {
        todo!("spawn a task that owns Stats and reads commands until the inbox closes")
    }

    /// Record one outcome. There is nothing to wait for, so nothing comes
    /// back.
    pub async fn record(&self, _outcome: Outcome) {
        todo!("post a command; do not wait for an answer that does not exist")
    }

    /// Ask the actor for the counts so far.
    pub async fn stats(&self) -> Stats {
        todo!("send a command carrying somewhere to reply, then await the reply")
    }
}

/// Lesson: conc-shared-state
///
/// Settings the delivery worker reads on every job and reloads once a day.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Config {
    pub retries: u32,
    pub batch: usize,
}

/// Lesson: conc-shared-state
///
/// A config that readers snapshot without queueing on a lock, and that a
/// reloader replaces wholesale.
///
/// This is the lesson's closing exercise: the profiler shows workers waiting
/// on `Arc<Mutex<Config>>`, and the fix is not a faster lock. Readers do not
/// need a lock, they need a stable snapshot, so hold an immutable
/// `Arc<Config>` behind a swap point (`tokio::sync::watch` is one, the
/// arc-swap crate is another) and replace the pointer on reload.
#[derive(Clone)]
pub struct ConfigHandle {
    // TODO: one field. It has to be shareable, which the derive above already
    // demands of whatever you put here.
}

impl ConfigHandle {
    pub fn new(_initial: Config) -> Self {
        todo!("park the first config behind the swap point")
    }

    /// Return the config as it stands now.
    ///
    /// The return type is doing the teaching. A guard would borrow from
    /// `self` and could not be held across an `.await`; an `Arc` is a value
    /// the caller keeps, at the price of one atomic increment and no copy of
    /// the config at all.
    pub fn snapshot(&self) -> Arc<Config> {
        todo!("clone the pointer, not the config")
    }

    /// Publish a new config. Readers already holding a snapshot keep it.
    pub fn reload(&self, _next: Config) {
        todo!("swap the pointer; there is no field to mutate in place")
    }
}

/// Lesson: conc-shared-state
///
/// Spawn a task that increments `counter` and then sends the value it wrote on
/// `tx`.
///
/// The obvious body does not compile:
///
/// ```text
/// error: future cannot be sent between threads safely
///   |
///   | /     tokio::spawn(async move {
///   | |         let mut n = counter.lock().unwrap();
///   | |         *n += 1;
///   | |         tx.send(*n).await.unwrap();
///   | |     })
///   | |______^ future created by async block is not `Send`
///   |
///   = help: the trait `Send` is not implemented for `std::sync::MutexGuard<'_, usize>`
/// note: future is not `Send` as this value is used across an await
///   |         let mut n = counter.lock().unwrap();
///   |             ----- has type `std::sync::MutexGuard<'_, usize>` which is not `Send`
///   |         tx.send(*n).await.unwrap();
///   |                     ^^^^^ await occurs here, with `mut n` maybe used later
/// note: required by a bound in `tokio::spawn`
///   |         F: Future + Send + 'static,
///   |                     ^^^^ required by this bound in `spawn`
/// ```
///
/// ```ignore
/// pub fn spawn_bump(counter: Arc<Mutex<usize>>, tx: mpsc::Sender<usize>) -> JoinHandle<()> {
///     tokio::spawn(async move {
///         let mut n = counter.lock().unwrap();
///         *n += 1;
///         tx.send(*n).await.unwrap();
///     })
/// }
/// ```
///
/// Write the version that compiles. Do not reach for `tokio::sync::Mutex`:
/// that brand of lock would make this build and then serialize every task on
/// whatever is awaited inside the critical section. The fix is where the guard
/// ends, and the test proves the counter still lost nothing.
pub fn spawn_bump(
    _counter: Arc<std::sync::Mutex<usize>>,
    _tx: mpsc::Sender<usize>,
) -> JoinHandle<()> {
    todo!("end the critical section before the await begins")
}

/// Lesson: conc-graceful-shutdown
///
/// Run one worker: take jobs from `jobs`, run each to completion, and return
/// the outcomes. Stop when the queue is closed and empty, or when `shutdown`
/// carries a new value, whichever happens first. The caller keeps the
/// shutdown sender alive for as long as the worker runs.
///
/// The policy this encodes is the lesson's: cancellation is checked between
/// jobs, so a job that has started always finishes and queued jobs are
/// abandoned. Both branches of the wait are cancel-safe, which is what makes
/// the shape legitimate: when cancellation wins, no job has been half-removed
/// from the channel and dropped on the floor.
///
/// One detail the lesson leaves implicit: when both branches are ready,
/// `tokio::select!` picks one at random. A shutdown policy decided by a coin
/// flip is not a policy, so ask for `biased;` and put the cancellation branch
/// first.
pub async fn worker_until_shutdown(
    _jobs: mpsc::Receiver<Job>,
    _shutdown: watch::Receiver<bool>,
) -> Vec<Outcome> {
    todo!("select over cancellation and the queue, biased toward stopping")
}

/// Lesson: conc-delivery-capstone
///
/// The whole delivery worker: a producer feeding a queue that holds at most
/// `queue` waiting jobs, `workers` workers sharing one receiver, a `Progress`
/// actor recording every outcome, and `shutdown` stopping the pool between
/// jobs. Return the actor's final counts.
///
/// Every pattern in the section has a job here, and none of them is new. What
/// is new is making them fit: the producer parks on a full queue, so it has to
/// be able to finish once the workers are gone. Ask what `send().await`
/// returns when the last receiver has been dropped, and make sure the answer
/// is handled rather than unwrapped.
///
/// Getting the final `Stats` back is the other assembly detail. The actor
/// exits when its last handle drops, so every worker's clone has to be gone
/// before you await it.
pub async fn deliver_issue(
    _jobs: Vec<Job>,
    _queue: usize,
    _workers: usize,
    _shutdown: watch::Receiver<bool>,
) -> Stats {
    todo!("producer, pool, actor, cancellation; then drop the handles and collect")
}

/// Lesson: conc-delivery-capstone
///
/// How many `Job` values exist in memory at the busiest instant of an issue,
/// for a queue of `queue` and a pool of `workers`, however many subscribers
/// the issue goes to.
///
/// Answer it by counting the places a job can be, not by running anything. The
/// point of the number is that it was fixed the moment the channel capacity
/// and the pool size were written down.
pub fn peak_jobs_in_memory(_queue: usize, _workers: usize) -> usize {
    todo!("queued, in flight, and one more place you may have forgotten")
}
