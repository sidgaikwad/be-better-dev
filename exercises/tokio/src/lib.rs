//! tokio.
//!
//! Nine exercises across the section's six lessons. Nothing here is a new
//! idea: it is the executor you built in Async from scratch, industrialized,
//! so every exercise should feel like a name being put to something you
//! already wrote.
//!
//! Run `cargo test -p tokio-exercises` to see what is red, then delete each
//! `todo!()` and make the suite pass. One lesson at a time works too:
//! `cargo test -p tokio-exercises --test tokio_channels`.
//!
//! One test file does not compile as shipped, and that is the point: a value
//! that cannot cross a spawn is a compile error, not a failed assertion.
//! `tests/tokio_spawn_and_tasks.rs` is the one, and the other five run
//! meanwhile. Two more exercises join it the moment you write their bodies:
//! `Metrics::rescale` and `Db::query` both meet the same diagnostic.

use std::collections::HashMap;
use std::future::Future;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use tokio::net::{TcpListener, TcpStream};
use tokio::runtime::Runtime;
use tokio::sync::{mpsc, oneshot};

// ---------------------------------------------------------------------------
// Lesson: tokio-runtime-anatomy
// ---------------------------------------------------------------------------

/// Lesson: tokio-runtime-anatomy
///
/// Build the runtime that `#[tokio::main]` hides: one worker thread per core,
/// and both drivers switched on so timers and sockets work.
///
/// There is no compiler magic to find here. A runtime is a value, built by a
/// builder, from an ordinary synchronous function.
pub fn multi_thread_runtime() -> Runtime {
    todo!("Builder::new_multi_thread, and remember which two drivers enable_all switches on")
}

/// Lesson: tokio-runtime-anatomy
///
/// The other flavor: no worker threads at all, every task running on the
/// thread that called `block_on`. `#[tokio::test]` picks this one by default,
/// which is what keeps tests cheap and deterministic.
pub fn current_thread_runtime() -> Runtime {
    todo!("same builder, the other constructor, and the drivers still have to be on")
}

/// Lesson: tokio-runtime-anatomy
///
/// Drive one future to completion from synchronous code. This is the second
/// half of the `#[tokio::main]` expansion, and the same job as the `block_on`
/// you wrote by hand in Async from scratch.
pub fn run_to_completion<F: Future>(_fut: F) -> F::Output {
    todo!("build a runtime, then hand it the future")
}

// ---------------------------------------------------------------------------
// Lesson: tokio-spawn-and-tasks
// ---------------------------------------------------------------------------

/// Scaffolding, not an exercise: the work one request handler hands off, and
/// the receipt it produces. Panics on id 0, which no subscriber has.
pub fn deliver(id: u64) -> String {
    assert_ne!(id, 0, "id 0 is not a subscriber");
    format!("delivered to subscriber-{id}@example.com")
}

/// Lesson: tokio-spawn-and-tasks
///
/// Give every id its own task, let them all run, then collect the receipts in
/// the order the ids arrived rather than the order the tasks finished.
///
/// Two habits to get right. Spawn every task before awaiting any of them:
/// `spawn` is what turns a future into concurrency, and awaiting inside the
/// spawning loop quietly serializes the whole batch. And a task that panics
/// costs exactly that task, so its slot is `None` while every other id still
/// gets its receipt. That is what a `JoinHandle` answering with a `Result`
/// rather than a plain value is for.
pub async fn deliver_all(_ids: Vec<u64>) -> Vec<Option<String>> {
    todo!("spawn first, collect second; a JoinHandle hands back a Result")
}

/// Lesson: tokio-spawn-and-tasks
///
/// A batch of subscriber ids that several tasks read at once. Cloning a
/// `Batch` shares the ids rather than copying them, and a `Batch` has to be
/// able to sit inside a task across an `.await`.
///
/// As shipped it cannot, so `tests/tokio_spawn_and_tasks.rs` does not compile.
/// The error is the exercise, and it is the one the lesson quotes:
///
/// ```text
/// error: future cannot be sent between threads safely
///    = help: the trait `Send` is not implemented for `Rc<Vec<u64>>`
/// note: future is not `Send` as this value is used across an await
/// ```
///
/// The fix is not to delete the sharing. It is the threads section's fix:
/// pick the shared pointer that is allowed to cross a thread, because a task
/// parked at an await can be stolen and polled next on a different worker.
#[derive(Clone)]
pub struct Batch {
    ids: std::rc::Rc<Vec<u64>>,
}

impl Batch {
    pub fn new(ids: Vec<u64>) -> Self {
        Self { ids: std::rc::Rc::new(ids) }
    }

    /// The sum of every id in the batch.
    pub fn total(&self) -> u64 {
        todo!("read the ids through the shared handle")
    }

    /// How many handles currently point at these ids. Cloning a `Batch` moves
    /// this number; it does not allocate a second vector.
    pub fn handles(&self) -> usize {
        todo!("the shared pointer keeps its own strong count")
    }
}

// ---------------------------------------------------------------------------
// Lesson: tokio-blocking-the-executor
// ---------------------------------------------------------------------------

/// Scaffolding, not an exercise: a password hash, deliberately slow and
/// deliberately synchronous. Its security argument is that every guess costs
/// real CPU, so there is nothing inside it to await and no async version of it
/// can exist.
pub fn hash_password(password: &str, rounds: u32) -> u64 {
    let mut acc: u64 = 0xcbf2_9ce4_8422_2325;
    for round in 0..rounds {
        for byte in password.as_bytes() {
            acc ^= u64::from(*byte);
            acc = acc.wrapping_mul(0x0000_0100_0000_01b3);
        }
        acc = acc.rotate_left(round % 63 + 1);
    }
    acc
}

/// Lesson: tokio-blocking-the-executor
///
/// Run a lump of genuinely blocking work without holding a worker hostage, and
/// hand back whatever it returned.
///
/// The bounds are the ones any thread crossing needs: the closure travels, so
/// it must own what it uses, and its answer travels back. Note that this takes
/// a closure and not a future, because the escape hatch is for code that has
/// no await points to give.
///
/// The `.await` in the body is the whole exercise. Calling `work()` here would
/// compile, produce the right answer, and seize the worker for the duration:
/// the cardinal sin with extra steps.
pub async fn offload<F, T>(_work: F) -> T
where
    F: FnOnce() -> T + Send + 'static,
    T: Send + 'static,
{
    todo!("there is a second pool that exists precisely to be blocked, and it answers with a handle")
}

// ---------------------------------------------------------------------------
// Lesson: tokio-mutex-across-await
// ---------------------------------------------------------------------------

/// Scaffolding, not an exercise: a weight fetched from somewhere slow. It
/// awaits, which is the only property that matters to the exercise below.
pub async fn fetch_factor() -> u64 {
    tokio::task::yield_now().await;
    3
}

/// Lesson: tokio-mutex-across-await
///
/// A request counter shared by every handler task: plain data, one increment
/// per call, no `.await` while locked. This is the lesson's first case, where
/// the ordinary `std::sync::Mutex` is not merely tolerated but preferred, and
/// the field type is already the answer to "which mutex".
#[derive(Clone, Default)]
pub struct Metrics {
    counts: Arc<Mutex<HashMap<String, u64>>>,
}

impl Metrics {
    pub fn new() -> Self {
        Self::default()
    }

    /// Count one request for `path`. Lock, bump, unlock: tens of nanoseconds,
    /// three orders of magnitude under the blocking lesson's budget.
    pub fn record(&self, _path: &str) {
        todo!("lock, bump the entry, and let the guard die before the call returns")
    }

    /// How many requests `path` has seen.
    pub fn count(&self, _path: &str) -> u64 {
        todo!("lock and read; a path nobody has visited has been seen zero times")
    }

    /// Lesson: tokio-mutex-across-await
    ///
    /// Multiply `path`'s count by a factor that has to be fetched, which means
    /// an `.await` sits in the middle of a read and a write.
    ///
    /// This is the lesson's predict-then-verify written out. The test spawns
    /// this future, and `tokio::spawn` demands `Send`, and a
    /// `std::sync::MutexGuard` is deliberately `!Send`. Anything alive across
    /// the await becomes a field of the state machine, so the repair is to
    /// arrange that the guard is not alive there.
    pub async fn rescale(&self, _path: &str) {
        todo!("read what you need, end the guard's scope, then await")
    }
}

/// Scaffolding, not an exercise: the one database connection the whole service
/// shares. `execute` awaits, so whoever holds this connection holds it across
/// an await. No scoping trick avoids that; the IO is the point.
pub struct DbConnection {
    served: usize,
}

impl Default for DbConnection {
    fn default() -> Self {
        Self::new()
    }
}

impl DbConnection {
    pub fn new() -> Self {
        Self { served: 0 }
    }

    /// Stands in for a round trip to the database.
    pub async fn execute(&mut self, query: &str) -> String {
        tokio::task::yield_now().await;
        self.served += 1;
        format!("{query} -> row {}", self.served)
    }

    /// How many queries this connection has answered.
    pub fn served(&self) -> usize {
        self.served
    }
}

/// Lesson: tokio-mutex-across-await
///
/// Shared mutable access to a resource you must keep hold of while doing IO:
/// the narrow case the async mutex exists for.
///
/// As shipped the field names the wrong mutex. Write `query` against it and
/// the compiler answers with the same diagnostic the metrics exercise dodges
/// by scoping, because the test spawns this future. Except here there is
/// nothing to scope: the guard has to live across `execute`'s await, so the
/// mutex has to be the one whose guard is `Send` and whose `lock` parks the
/// task instead of blocking the thread.
///
/// Know what you buy. Every lock and unlock now goes through queueing and
/// waker machinery, and while one task holds the connection through a slow
/// query, every other task queues behind that IO.
#[derive(Clone)]
pub struct Db {
    conn: Arc<Mutex<DbConnection>>,
}

impl Db {
    pub fn new(conn: DbConnection) -> Self {
        Self { conn: Arc::new(Mutex::new(conn)) }
    }

    /// Run one query against the shared connection and return its row.
    pub async fn query(&self, _sql: &str) -> String {
        todo!("take the lock, then hold it across execute's await")
    }

    /// How many queries the shared connection has answered.
    pub async fn served(&self) -> usize {
        todo!("take the lock and ask the connection")
    }
}

// ---------------------------------------------------------------------------
// Lesson: tokio-channels
// ---------------------------------------------------------------------------

/// Lesson: tokio-channels
///
/// Push every value into the channel.
///
/// The channel is bounded, which makes each send a place the producer can be
/// told to wait: when the buffer is full, `send` parks the task until the
/// consumer catches up. That is backpressure, and it is the reason to reach
/// for a bounded channel at all, because the alternative bounds the queue by
/// how much RAM the machine has.
///
/// Take the sender by value and let it die when the values run out. A receiver
/// only ever stops when the last sender is gone.
pub async fn produce(_tx: mpsc::Sender<u64>, _values: Vec<u64>) {
    todo!("await every send, and let the sender drop at the end")
}

/// Lesson: tokio-channels
///
/// Drain the receiver into a vector. Values arrive in the order they were
/// sent, and the loop ends by itself once every sender has been dropped.
pub async fn drain(_rx: mpsc::Receiver<u64>) -> Vec<u64> {
    todo!("recv answers None exactly once, when the last sender is gone")
}

/// Lesson: tokio-channels
///
/// A message with a reply envelope inside it. The `oneshot::Sender` is the
/// caller's private return path: one value, sent once, received once. On its
/// own a oneshot looks pointless; riding inside an mpsc command it is the
/// actor pattern's whole wiring.
pub enum Command {
    Deliver { id: u64, reply: oneshot::Sender<String> },
    Delivered { reply: oneshot::Sender<usize> },
}

/// Lesson: tokio-channels
///
/// The task that owns the resource outright: the "neither mutex" answer from
/// the last lesson, with the delivery count living here and nowhere else.
/// Handle commands until the channel closes, answering each one on the reply
/// channel it arrived with.
///
/// A caller that hung up before its answer arrived is not worth panicking
/// over. A oneshot send fails when the receiving half is gone, and here that
/// failure is ordinary.
pub async fn delivery_worker(_rx: mpsc::Receiver<Command>) {
    todo!("own the count here, and answer every command on the channel it brought")
}

/// Lesson: tokio-channels
///
/// Ask the worker to deliver one id, and wait for your own answer: build the
/// command, keep the receiving half, send, then await.
pub async fn ask_deliver(_tx: &mpsc::Sender<Command>, _id: u64) -> String {
    todo!("the reply channel goes out with the command; its other half stays here")
}

/// Lesson: tokio-channels
///
/// Ask the worker how many deliveries it has made. Same wiring, different
/// answer type, which is what makes the reply envelope worth its weight.
pub async fn ask_delivered(_tx: &mpsc::Sender<Command>) -> usize {
    todo!("same shape as ask_deliver")
}

// ---------------------------------------------------------------------------
// Lesson: tokio-echo-server
// ---------------------------------------------------------------------------

/// Lesson: tokio-echo-server
///
/// Read one chunk from `socket`, giving up if the peer stays quiet for longer
/// than `idle`.
///
/// `timeout` races a future against the clock: the future's output if it
/// finishes first, an `Elapsed` error if the clock wins. On expiry the inner
/// future is dropped, and dropping a future is how async Rust cancels work.
///
/// The echo loop has three ways to end and they collapse into one answer here:
/// `None` for an expired deadline, a peer that closed (a read of zero bytes),
/// or a socket error. `Some(n)` means n bytes actually arrived.
///
/// `read` and `write_all` live on `AsyncReadExt` and `AsyncWriteExt`; you will
/// need to bring those traits into scope.
pub async fn read_chunk(
    _socket: &mut TcpStream,
    _buf: &mut [u8],
    _idle: Duration,
) -> Option<usize> {
    todo!("race the read against the clock, then fold the three endings into None")
}

/// Lesson: tokio-echo-server
///
/// The server, and the map of the whole section. Accept forever, give every
/// connection its own task, echo each chunk straight back, and report the
/// bytes echoed on `stats`.
///
/// Each connection task owns its socket and its buffer outright, which is how
/// `Send + 'static` is satisfied here without a single `Arc`: moves, not
/// sharing. The stats channel is the channels lesson's shape, one task owning
/// the total, and awaiting the send means a lagging stats consumer slows the
/// echoers instead of growing a queue.
///
/// Nothing in this function may block, and nothing in it needs to.
pub async fn serve(_listener: TcpListener, _stats: mpsc::Sender<usize>, _idle: Duration) {
    todo!("accept, spawn one task per connection, echo until read_chunk says stop")
}
