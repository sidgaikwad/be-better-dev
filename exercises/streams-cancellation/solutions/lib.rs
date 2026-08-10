//! Reference solutions. Read these after you have something passing.
//!
//! Where a solution had a choice to make, the comment says which way it went
//! and why, since that judgment is the part worth copying.

use std::future::Future;
use std::pin::Pin;
use std::sync::{Arc, Mutex};
use std::task::{Context, Poll};
use std::time::Duration;

use futures::stream::BoxStream;
use tokio::sync::{mpsc, oneshot};
use tokio::task::JoinSet;
use tokio::time::{sleep, timeout};
use tokio_stream::{Stream, StreamExt};

// ---------------------------------------------------------------------------
// Lesson: stream-async-iterator
// ---------------------------------------------------------------------------

/// `while let Some(x) = s.next().await` is the idiom because the language has
/// no async `for`. Three moves in one line: build the next-item future, await
/// it, match the option. The `?` on each item is the second half of the sqlx
/// loop, and it is what makes the first bad row the last row read.
pub async fn collect_addresses<S>(mut rows: S) -> Result<Vec<String>, String>
where
    S: Stream<Item = Result<String, String>> + Unpin,
{
    let mut addresses = Vec::new();
    while let Some(row) = rows.next().await {
        addresses.push(row?);
    }
    Ok(addresses)
}

pub struct Row {
    pub email: String,
    pub confirmed: bool,
}

/// The adapters are the iterator ones, unchanged in name and meaning, and just
/// as lazy: this function allocates one box and reads no rows. `take` is last
/// so the limit counts confirmed addresses rather than rows examined, which is
/// the same ordering care a synchronous chain needs.
///
/// `Box::pin` rather than `futures::StreamExt::boxed` on purpose: pulling in
/// the second `StreamExt` would make every adapter call above ambiguous, for a
/// method that is one constructor spelled differently.
pub fn confirmed_emails(rows: Vec<Row>, limit: usize) -> BoxStream<'static, String> {
    Box::pin(
        tokio_stream::iter(rows)
            .filter(|row| row.confirmed)
            .map(|row| row.email)
            .take(limit),
    )
}

pub struct Attempts {
    pub next: u32,
    pub max: u32,
}

impl Attempts {
    pub fn new(max: u32) -> Self {
        Self { next: 1, max }
    }
}

impl Stream for Attempts {
    type Item = u32;

    /// Two of the three answers, because this source is never waiting: an item
    /// is either sitting right here or the sequence is over. `Pending` is what
    /// the third arm would be, and returning it without arranging for the waker
    /// in `cx` to fire is how a stream hangs forever.
    ///
    /// `mut self: Pin<&mut Self>` gives field access through `DerefMut`, which
    /// is available because `Attempts` is `Unpin`: two integers, nothing
    /// pointing at itself.
    fn poll_next(mut self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        if self.next > self.max {
            return Poll::Ready(None);
        }
        let attempt = self.next;
        self.next += 1;
        Poll::Ready(Some(attempt))
    }
}

// ---------------------------------------------------------------------------
// Lesson: stream-select
// ---------------------------------------------------------------------------

#[derive(Debug, PartialEq)]
pub enum Pass {
    Delivered(String),
    Shutdown,
    NoMoreJobs,
}

/// `biased;` is the whole exercise. Without it the branches are polled in a
/// random order each pass, which is the right default for fairness and the
/// wrong one here: when a job and a shutdown are both ready, draining one more
/// job before stopping is not a coin flip anyone wants to lose. Order is part
/// of correctness, so it gets written down.
///
/// `&mut *shutdown` reborrows rather than moving, so the caller keeps the
/// receiver and can race it again next pass. `jobs.recv()` is a fresh future
/// every pass, which costs nothing because a cancelled `recv` consumed nothing.
pub async fn one_pass(
    jobs: &mut mpsc::Receiver<String>,
    shutdown: &mut oneshot::Receiver<()>,
) -> Pass {
    tokio::select! {
        biased;
        _ = &mut *shutdown => Pass::Shutdown,
        maybe_job = jobs.recv() => match maybe_job {
            Some(job) => Pass::Delivered(job),
            None => Pass::NoMoreJobs,
        },
    }
}

// ---------------------------------------------------------------------------
// Lesson: stream-timeouts
// ---------------------------------------------------------------------------

#[derive(Debug, PartialEq)]
pub enum Delivery {
    Accepted(String),
    Rejected(String),
    TimedOut,
}

/// The nesting is not noise, it is two different questions arriving in one
/// value: the outer layer is the deadline's verdict, the inner one the
/// provider's. Flattening them into three arms is the only place in the program
/// that has to know both, which is why the enum exists.
///
/// Nothing here restricts the pattern to HTTP: `send` is any future at all, so
/// wrapping a whole async block puts one deadline on connect, query and render
/// together.
pub async fn send_with_deadline<F>(limit: Duration, send: F) -> Delivery
where
    F: Future<Output = Result<String, String>>,
{
    match timeout(limit, send).await {
        Ok(Ok(id)) => Delivery::Accepted(id),
        Ok(Err(rejection)) => Delivery::Rejected(rejection),
        Err(_elapsed) => Delivery::TimedOut,
    }
}

// ---------------------------------------------------------------------------
// Lesson: stream-cancellation
// ---------------------------------------------------------------------------

pub struct Beacon {
    pub name: &'static str,
    pub log: Arc<Mutex<Vec<String>>>,
}

/// The only cleanup mechanism cancellation has. It runs on every path out of
/// the future, including the path where the future is dropped mid-await, which
/// is what makes drop-based cancellation safe for memory without any
/// cooperation from the code being cancelled.
impl Drop for Beacon {
    fn drop(&mut self) {
        self.log.lock().unwrap().push(format!("dropped {}", self.name));
    }
}

/// Three lines, and the cancellation behaviour is entirely decided by which of
/// them is data and which is code. The guard is a live local when the deadline
/// lands, so its destructor runs. The push after the await is code, and code
/// after a cancellation point is code that never happens: there is no `finally`
/// to move it into.
///
/// The fix, when a commit really must not be skipped, is not to write cleanup
/// after the await. It is to make the abandoned attempt harmless, the way an
/// uncommitted transaction rolls itself back.
pub async fn deliver_batch(log: Arc<Mutex<Vec<String>>>, hold: Duration) {
    let _connection = Beacon { name: "connection", log: Arc::clone(&log) };
    sleep(hold).await;
    log.lock().unwrap().push("committed".to_string());
}

// ---------------------------------------------------------------------------
// Lesson: stream-cancel-safety
// ---------------------------------------------------------------------------

pub struct Worker {
    pub jobs: mpsc::Receiver<String>,
    pub in_flight: Option<String>,
    pub delivered: Vec<String>,
}

impl Worker {
    pub fn new(jobs: mpsc::Receiver<String>) -> Self {
        Self { jobs, in_flight: None, delivered: Vec::new() }
    }

    /// Cancel unsafe, and no line of it is wrong on its own. `recv` hands the
    /// job over at the instant it completes, so after that first await the
    /// queue no longer has it and `job` is the only copy in the world. `job`
    /// lives in this future's state, so a drop during the delivery takes it
    /// along. The unit of cancellation is the future, not the await.
    pub async fn deliver_next(&mut self, work: Duration) {
        if let Some(job) = self.jobs.recv().await {
            sleep(work).await;
            self.delivered.push(job);
        }
    }

    /// Cancel safe, and identical in behaviour when nothing is cancelled. The
    /// job is parked in `self` before the slow await, and `self` is the
    /// caller's, not the future's, so a drop cannot reach it. Re-issuing the
    /// call finds the job already in hand and does not take a second one.
    ///
    /// This is the shape of every fix in the lesson: move the progress
    /// somewhere that outlives the race. `Lines::next_line` buffers the partial
    /// line in the `Lines` value for exactly this reason.
    pub async fn deliver_next_safely(&mut self, work: Duration) {
        if self.in_flight.is_none() {
            // Cancel safe on its own: dropped before it completes, it has
            // consumed nothing from the queue.
            self.in_flight = self.jobs.recv().await;
        }
        if self.in_flight.is_some() {
            sleep(work).await;
            if let Some(job) = self.in_flight.take() {
                self.delivered.push(job);
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Lesson: stream-joinset
// ---------------------------------------------------------------------------

/// A `JoinSet` rather than a `Vec<JoinHandle>` for two reasons the test can see
/// and one it cannot. `join_next` yields whoever finished first, so a slow early
/// batch hides nothing behind it. A panicking task becomes an `Err` from the
/// set instead of unwinding the caller, so one bad batch costs one result. And
/// the invisible one: if this whole function is cancelled, the set drops and
/// takes every spawned task with it, where a vector of handles would detach
/// them to run on unowned.
pub async fn deliver_all(batches: Vec<u64>) -> Vec<Option<u64>> {
    let mut set = JoinSet::new();
    for batch in batches {
        set.spawn(async move {
            assert!(batch > 0, "a batch with no subscribers should never have been queued");
            // A real batch is IO all the way down; this stands in for the
            // suspension point that lets the tasks interleave.
            tokio::task::yield_now().await;
            batch * 10
        });
    }

    let mut results = Vec::new();
    while let Some(joined) = set.join_next().await {
        // The outer layer is the runtime's verdict, the inner one the task's.
        // `ok()` collapses "panicked or aborted" into the None this caller
        // wants; a worker that had to tell those apart would match on the
        // JoinError and ask `is_panic`.
        results.push(joined.ok());
    }
    results
}

/// `abort_all` cancels, it does not erase. Each task still comes back through
/// `join_next` once, as an `Err` whose `is_cancelled` is true, so the drain
/// after the abort is how the set empties. Skipping it is the bug the lesson's
/// shutdown recipe ends by warning about.
///
/// The tasks here are aborted before they are ever polled, and still report
/// back: cancellation is delivered to the task, not negotiated with it.
pub async fn cancel_and_reap(count: usize) -> usize {
    let mut set = JoinSet::new();
    for _ in 0..count {
        set.spawn(async { sleep(Duration::from_secs(60)).await });
    }
    set.abort_all();

    let mut cancelled = 0;
    while let Some(joined) = set.join_next().await {
        if joined.is_err_and(|err| err.is_cancelled()) {
            cancelled += 1;
        }
    }
    cancelled
}
