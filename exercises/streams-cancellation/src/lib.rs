//! Streams, select, cancellation.
//!
//! Eight exercises across the section's six lessons. Run
//! `cargo test -p streams-cancellation` to see what is red, then delete each
//! `todo!()` and make the suite pass. One lesson at a time works too:
//! `cargo test -p streams-cancellation --test stream_select`.
//!
//! Every test in here is deterministic and finishes in milliseconds. None of
//! them races two timers, because the answer to that race is not knowable and a
//! test that asserts one is a test that fails on a busy machine. Where a test
//! needs an await that never finishes, it uses a sixty second sleep behind a
//! ten millisecond deadline: the deadline always wins, and the sixty seconds
//! never happen to anyone.

use std::future::Future;
use std::pin::Pin;
use std::sync::{Arc, Mutex};
use std::task::{Context, Poll};
use std::time::Duration;

use futures::stream::BoxStream;
use tokio::sync::{mpsc, oneshot};
use tokio_stream::Stream;

// ---------------------------------------------------------------------------
// Lesson: stream-async-iterator
// ---------------------------------------------------------------------------

/// Lesson: stream-async-iterator
///
/// Drain every row a query is producing, collecting each address, and stop at
/// the first row that failed to decode.
///
/// The signature is the one sqlx's `fetch` hands you: a sequence whose items
/// arrive over time and each of which is a `Result`. There is no `for` loop for
/// this, and no `async for` in the language, so the shape has to come from
/// somewhere else.
pub async fn collect_addresses<S>(_rows: S) -> Result<Vec<String>, String>
where
    S: Stream<Item = Result<String, String>> + Unpin,
{
    todo!("pull one row at a time, and let a bad row end the drain")
}

/// A row the way a database hands one back: the column you asked for, and a
/// flag you still have to filter on yourself.
pub struct Row {
    pub email: String,
    pub confirmed: bool,
}

/// Lesson: stream-async-iterator
///
/// Turn the rows into a stream of the confirmed addresses, at most `limit` of
/// them, without collecting anything into a `Vec` on the way.
///
/// Three of the adapters here have the same names and the same meanings they
/// had on `Iterator`; that is the point of the exercise. The return type is
/// boxed because a chain of adapters has an unspeakable type, and a function
/// that must name it has one honest option.
pub fn confirmed_emails(_rows: Vec<Row>, _limit: usize) -> BoxStream<'static, String> {
    todo!("build the chain, then put it behind the pointer the return type asks for")
}

/// Lesson: stream-async-iterator
///
/// A stream of attempt numbers, `1..=max`, written by hand so the trait stops
/// being magic.
///
/// This source is never waiting on anything, so it never answers `Pending` and
/// never touches the `Context`. A stream backed by a socket is the same shape
/// with one more arm, where the waker in `cx` is what gets it polled again.
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

    /// The signature is given, since the lesson prints it. The body is the
    /// exercise: `Poll<Option<Item>>` has three inhabitants and this stream
    /// uses two of them.
    fn poll_next(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        todo!("which of the three answers means 'here it is', and which means 'that was the last'?")
    }
}

// ---------------------------------------------------------------------------
// Lesson: stream-select
// ---------------------------------------------------------------------------

/// What one pass of the delivery worker's event loop decided.
#[derive(Debug, PartialEq)]
pub enum Pass {
    Delivered(String),
    Shutdown,
    NoMoreJobs,
}

/// Lesson: stream-select
///
/// Wait on both sources at once and report whichever finished first. A closed
/// jobs channel is `NoMoreJobs`, not a hang.
///
/// One more requirement, and it is the interesting one: when a job and the
/// shutdown signal are both ready, shutdown wins. Every time, not half the
/// time. The default polling order will not give you that, and the test runs
/// the case thirty-two times to make sure you did not get lucky.
pub async fn one_pass(
    _jobs: &mut mpsc::Receiver<String>,
    _shutdown: &mut oneshot::Receiver<()>,
) -> Pass {
    todo!("race the two sources, and make the priority between them part of the design")
}

// ---------------------------------------------------------------------------
// Lesson: stream-timeouts
// ---------------------------------------------------------------------------

/// What became of one call to the email provider.
#[derive(Debug, PartialEq)]
pub enum Delivery {
    Accepted(String),
    Rejected(String),
    TimedOut,
}

/// Lesson: stream-timeouts
///
/// Put a deadline on the send and flatten the two questions it answers into one
/// verdict.
///
/// The two layers are asking different things: whether the call finished in
/// time, and how it went. Keep them apart in your head while you match, because
/// an error is information and a timeout is the absence of information.
pub async fn send_with_deadline<F>(_limit: Duration, _send: F) -> Delivery
where
    F: Future<Output = Result<String, String>>,
{
    todo!("wrap the future in a deadline; awaiting the result gives you a Result of a Result")
}

// ---------------------------------------------------------------------------
// Lesson: stream-cancellation
// ---------------------------------------------------------------------------

/// Lesson: stream-cancellation
///
/// A guard that records its own destruction, so a test can watch a cancelled
/// future clean up instead of taking the lesson's word for it.
///
/// Implement `Drop` so that dropping a `Beacon` pushes `"dropped <name>"` onto
/// the shared log. Stand in a lock guard, a database transaction or an open
/// socket for it and every claim the lesson makes is the same claim.
pub struct Beacon {
    pub name: &'static str,
    pub log: Arc<Mutex<Vec<String>>>,
}

// TODO: impl Drop for Beacon

/// Lesson: stream-cancellation
///
/// One batch of work, in three steps: take out a `Beacon` named `"connection"`,
/// wait `hold` for the provider, then push `"committed"` onto the log.
///
/// Write exactly those three steps in that order. No cleanup code, no
/// cancellation check, nothing conditional. The exercise is not the writing, it
/// is predicting which of the three a cancelled future still performs, and then
/// reading the test to find out whether you were right.
pub async fn deliver_batch(_log: Arc<Mutex<Vec<String>>>, _hold: Duration) {
    todo!("a guard is data and lives long enough to be dropped; a line after an await is only code")
}

// ---------------------------------------------------------------------------
// Lesson: stream-cancel-safety
// ---------------------------------------------------------------------------

/// A worker that takes one job off the queue and delivers it.
pub struct Worker {
    /// The worker's end of the job channel. `recv` on it is cancel safe, and
    /// both methods below start there; only one of them stays that way.
    pub jobs: mpsc::Receiver<String>,
    /// Where a job waits while its delivery is in flight. A drop destroys a
    /// future's own state and nothing else, so anything parked out here comes
    /// through a cancellation intact. One of the two methods below uses that.
    pub in_flight: Option<String>,
    pub delivered: Vec<String>,
}

impl Worker {
    pub fn new(jobs: mpsc::Receiver<String>) -> Self {
        Self { jobs, in_flight: None, delivered: Vec::new() }
    }

    /// Lesson: stream-cancel-safety
    ///
    /// The obvious version: receive a job, await the delivery, record it. Write
    /// it exactly that way, with the job held in a local across the second
    /// await.
    ///
    /// `recv` is cancel safe on its own and the delivery is harmless on its
    /// own. This method is neither, and the test prices what a cancellation
    /// mid-delivery costs.
    pub async fn deliver_next(&mut self, _work: Duration) {
        todo!("the straightforward two-await body; the bug is the composition, not either half")
    }

    /// Lesson: stream-cancel-safety
    ///
    /// The same work, made cancel safe without changing what it does when
    /// nothing is cancelled: a call that is dropped mid-delivery must lose
    /// nothing, and the next call must pick up where this one stopped rather
    /// than taking a second job off the queue.
    ///
    /// This is the `Lines::next_line` fix from the lesson. Nothing here is
    /// clever; the whole change is where the job is kept while it waits.
    pub async fn deliver_next_safely(&mut self, _work: Duration) {
        todo!("give the job a home that outlives the future, and resume from it")
    }
}

// ---------------------------------------------------------------------------
// Lesson: stream-joinset
// ---------------------------------------------------------------------------

/// Lesson: stream-joinset
///
/// Fan the batches out over the runtime, one task each, and collect what comes
/// back as it lands. A batch of zero subscribers is a bug upstream and its task
/// panics: report that one as `None` and keep draining, because one bad batch
/// must not cost you the campaign.
///
/// Results arrive in completion order, which is the runtime's business and not
/// yours. The test sorts before it asserts, and it would be a lie if it did
/// not.
pub async fn deliver_all(_batches: Vec<u64>) -> Vec<Option<u64>> {
    todo!("an owned group of tasks, drained with the streams lesson's while let")
}

/// Lesson: stream-joinset
///
/// Spawn `count` tasks that would each take a minute, cancel the lot, and count
/// how many come back marked cancelled.
///
/// Aborted tasks do not vanish quietly, which is why the drain after the abort
/// is not optional: each one surfaces exactly once, and the outer layer of the
/// result says which kind of ending it was.
pub async fn cancel_and_reap(_count: usize) -> usize {
    todo!("cancel every task, then keep draining until the set is empty")
}
