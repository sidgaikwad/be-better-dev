//! Reference solutions. Read these after you have something passing.
//!
//! Where a solution had a choice to make, the comment says which way it went
//! and why, since that judgment is the part worth copying.

use std::collections::HashMap;
use std::future::Future;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::runtime::{Builder, Runtime};
use tokio::sync::{mpsc, oneshot};

/// The expansion of `#[tokio::main]`, written out. `enable_all` is what
/// switches on the IO and time drivers; leave it off and the first
/// `tokio::time::sleep` panics with "there is no reactor running".
pub fn multi_thread_runtime() -> Runtime {
    Builder::new_multi_thread().enable_all().build().expect("failed to build runtime")
}

/// No worker threads at all. `block_on`'s caller runs every task itself, which
/// is why a current-thread runtime is the cheap, predictable choice for tests
/// and the default for `#[tokio::test]`.
pub fn current_thread_runtime() -> Runtime {
    Builder::new_current_thread().enable_all().build().expect("failed to build runtime")
}

/// A runtime is an ordinary value and `block_on` is an ordinary method call.
/// The runtime is dropped as this function returns, which shuts its workers
/// down; that is also why this must never be called from inside an async
/// context, where dropping a runtime panics.
pub fn run_to_completion<F: Future>(fut: F) -> F::Output {
    multi_thread_runtime().block_on(fut)
}

pub fn deliver(id: u64) -> String {
    assert_ne!(id, 0, "id 0 is not a subscriber");
    format!("delivered to subscriber-{id}@example.com")
}

/// Two loops, not one. The first hands every future to the scheduler, which
/// starts polling immediately; the second only collects. Fusing them into
/// `for id in ids { out.push(tokio::spawn(...).await) }` would still compile
/// and still be correct, and would run the batch strictly one at a time.
///
/// `handle.await.ok()` is the panic policy in three characters: a panic is
/// caught at the task boundary and arrives as `Err(JoinError)`, so it costs
/// one slot. `JoinError::is_panic` is how you tell a panic from an abort when
/// that distinction matters.
pub async fn deliver_all(ids: Vec<u64>) -> Vec<Option<String>> {
    let handles: Vec<_> =
        ids.into_iter().map(|id| tokio::spawn(async move { deliver(id) })).collect();

    let mut out = Vec::with_capacity(handles.len());
    for handle in handles {
        out.push(handle.await.ok());
    }
    out
}

/// `Arc` rather than `Rc`, for the reason the runtime anatomy lesson gave: a
/// task has no home thread, so anything alive across an await may be polled
/// next on a different worker. `Rc`'s non-atomic count cannot survive that,
/// which is exactly what `!Send` encodes.
///
/// Nothing else about the type changed. The sharing was never the problem.
#[derive(Clone)]
pub struct Batch {
    ids: Arc<Vec<u64>>,
}

impl Batch {
    pub fn new(ids: Vec<u64>) -> Self {
        Self { ids: Arc::new(ids) }
    }

    pub fn total(&self) -> u64 {
        self.ids.iter().sum()
    }

    pub fn handles(&self) -> usize {
        Arc::strong_count(&self.ids)
    }
}

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

/// `spawn_blocking` moves the closure to a pool that exists to be blocked:
/// threads spawned on demand up to 512 by default, retired after about ten
/// seconds idle. Awaiting the handle is the half that matters to the runtime,
/// because that is where this task returns `Pending` and gives its worker
/// back. One parked task instead of one hostage thread.
///
/// The `expect` matches the book's habit: a panic inside the blocking closure
/// is a bug, not a condition, and swallowing it here would hide it.
pub async fn offload<F, T>(work: F) -> T
where
    F: FnOnce() -> T + Send + 'static,
    T: Send + 'static,
{
    tokio::task::spawn_blocking(work).await.expect("blocking task panicked")
}

pub async fn fetch_factor() -> u64 {
    tokio::task::yield_now().await;
    3
}

#[derive(Clone, Default)]
pub struct Metrics {
    counts: Arc<Mutex<HashMap<String, u64>>>,
}

impl Metrics {
    pub fn new() -> Self {
        Self::default()
    }

    /// The guard dies at the end of the statement, so the critical section is
    /// one hash lookup and one add. `to_owned` only pays when the path is new,
    /// which is the reason for `entry` over `insert`.
    pub fn record(&self, path: &str) {
        let mut counts = self.counts.lock().expect("metrics mutex poisoned");
        *counts.entry(path.to_owned()).or_default() += 1;
    }

    pub fn count(&self, path: &str) -> u64 {
        let counts = self.counts.lock().expect("metrics mutex poisoned");
        counts.get(path).copied().unwrap_or(0)
    }

    /// The braces are load-bearing twice over. They keep the guard out of the
    /// state machine, so this future is `Send` and can be spawned; and they
    /// mean nobody sleeps holding the lock, which is what would otherwise
    /// deadlock a single-threaded runtime. An explicit `drop(guard)` reads the
    /// same to the compiler; a scope is harder to delete by accident.
    pub async fn rescale(&self, path: &str) {
        let current = {
            let counts = self.counts.lock().expect("metrics mutex poisoned");
            counts.get(path).copied().unwrap_or(0)
        };

        let factor = fetch_factor().await;

        let mut counts = self.counts.lock().expect("metrics mutex poisoned");
        counts.insert(path.to_owned(), current * factor);
    }
}

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

    pub async fn execute(&mut self, query: &str) -> String {
        tokio::task::yield_now().await;
        self.served += 1;
        format!("{query} -> row {}", self.served)
    }

    pub fn served(&self) -> usize {
        self.served
    }
}

/// The one case the async mutex is for. `execute` awaits while the connection
/// is held, so the guard is alive across an await no matter how the code is
/// arranged, and `std::sync::MutexGuard` is `!Send` on purpose. Swapping the
/// mutex is the entire fix.
#[derive(Clone)]
pub struct Db {
    conn: Arc<tokio::sync::Mutex<DbConnection>>,
}

impl Db {
    pub fn new(conn: DbConnection) -> Self {
        Self { conn: Arc::new(tokio::sync::Mutex::new(conn)) }
    }

    /// `lock().await` parks the waiting task and frees its worker, where the
    /// std mutex would have blocked the thread. The queueing that buys costs
    /// more per lock than the std mutex does, which is why the metrics table
    /// above stayed on the cheap one.
    pub async fn query(&self, sql: &str) -> String {
        let mut conn = self.conn.lock().await;
        conn.execute(sql).await
    }

    pub async fn served(&self) -> usize {
        self.conn.lock().await.served()
    }
}

/// Awaiting each send is what makes the channel's bound mean anything. The
/// error case is the consumer having gone away, which is a real condition
/// rather than a bug: there is nobody left to produce for, so stop.
pub async fn produce(tx: mpsc::Sender<u64>, values: Vec<u64>) {
    for value in values {
        if tx.send(value).await.is_err() {
            return;
        }
    }
    // `tx` drops here. Nothing else can close the receiver's loop.
}

/// `recv` answers `None` once, when the last sender is gone. That is the whole
/// termination condition: no sentinel value, no separate shutdown flag.
pub async fn drain(mut rx: mpsc::Receiver<u64>) -> Vec<u64> {
    let mut out = Vec::new();
    while let Some(value) = rx.recv().await {
        out.push(value);
    }
    out
}

pub enum Command {
    Deliver { id: u64, reply: oneshot::Sender<String> },
    Delivered { reply: oneshot::Sender<usize> },
}

/// The count is a plain local. One task owns it, everyone else asks by
/// message, and there is no mutex to hold too long or forget to release: the
/// one-owner rule from Part 1 wearing concurrency clothes.
///
/// `let _ =` on the replies is deliberate. A caller that dropped its receiver
/// stopped caring about the answer, which is not this worker's problem.
pub async fn delivery_worker(mut rx: mpsc::Receiver<Command>) {
    let mut delivered = 0usize;
    while let Some(command) = rx.recv().await {
        match command {
            Command::Deliver { id, reply } => {
                delivered += 1;
                let _ = reply.send(deliver(id));
            }
            Command::Delivered { reply } => {
                let _ = reply.send(delivered);
            }
        }
    }
}

/// Build the envelope, send the command down the shared queue, then await a
/// channel only this call site holds. Many callers can be in flight at once
/// and no answer can go to the wrong one.
pub async fn ask_deliver(tx: &mpsc::Sender<Command>, id: u64) -> String {
    let (reply, answer) = oneshot::channel();
    tx.send(Command::Deliver { id, reply }).await.expect("delivery worker gone");
    answer.await.expect("delivery worker dropped the reply channel")
}

pub async fn ask_delivered(tx: &mpsc::Sender<Command>) -> usize {
    let (reply, answer) = oneshot::channel();
    tx.send(Command::Delivered { reply }).await.expect("delivery worker gone");
    answer.await.expect("delivery worker dropped the reply channel")
}

/// The match arms are the three endings, in the order they are easy to
/// confuse: the clock winning, the socket erroring, and the peer closing.
/// A read of zero bytes is end of stream, not an empty chunk, and reading it
/// as "nothing arrived yet" is how echo loops turn into spin loops.
pub async fn read_chunk(socket: &mut TcpStream, buf: &mut [u8], idle: Duration) -> Option<usize> {
    match tokio::time::timeout(idle, socket.read(buf)).await {
        Err(_) => None,        // idle too long: the deadline dropped the read
        Ok(Err(_)) => None,    // socket error
        Ok(Ok(0)) => None,     // peer closed
        Ok(Ok(n)) => Some(n),
    }
}

/// Read this as the section's map. The accept awaits readiness from the IO
/// driver; each connection is a `tokio::spawn` whose task owns `socket` and
/// `buf` by moving them in; the stats channel is one task owning the total.
///
/// The loop is written with an explicit `match` rather than `while let` so the
/// borrows of `socket` and `buf` end at the semicolon. A `while let` holds its
/// scrutinee's temporaries for the whole body, which would keep both borrowed
/// while the echo tries to write.
pub async fn serve(listener: TcpListener, stats: mpsc::Sender<usize>, idle: Duration) {
    loop {
        let Ok((mut socket, _peer)) = listener.accept().await else {
            return;
        };
        let stats = stats.clone();
        tokio::spawn(async move {
            let mut buf = vec![0u8; 4096];
            loop {
                let n = match read_chunk(&mut socket, &mut buf, idle).await {
                    Some(n) => n,
                    None => break,
                };
                if socket.write_all(&buf[..n]).await.is_err() {
                    break;
                }
                if stats.send(n).await.is_err() {
                    break;
                }
            }
            // `socket` drops here, and that drop is the hang-up the peer sees.
        });
    }
}
