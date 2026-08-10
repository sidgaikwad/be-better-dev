//! Reference solutions. Read these after you have something passing.
//!
//! The comments are about the judgment calls: which primitive, where the guard
//! ends, what closes each channel. The code itself is short on purpose, since
//! that is the section's claim: every limit in the system is one line you
//! chose, not one a resource chose for you at 2 a.m.

use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};

use tokio::sync::{Semaphore, mpsc, oneshot, watch};
use tokio::task::JoinHandle;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Outcome {
    pub subscriber: u32,
    pub delivered: bool,
}

pub type Job = Pin<Box<dyn Future<Output = Outcome> + Send>>;

pub fn job(subscriber: u32, delivered: bool) -> Job {
    Box::pin(async move { Outcome { subscriber, delivered } })
}

/// The pool is three moving parts: one queue, one lock around its receiving
/// end, and N tasks that take turns waiting on it.
pub async fn run_pool(jobs: Vec<Job>, workers: usize) -> Vec<Vec<Outcome>> {
    // Unbounded is honest here: every job already exists in the caller's Vec,
    // so there is no producer to pace and a bound would only add a wait that
    // buys nothing. The capstone, whose producer reads rows lazily, bounds it.
    let (tx, rx) = mpsc::unbounded_channel();
    for job in jobs {
        tx.send(job).expect("the receiver outlives this loop");
    }
    // Shutdown falls out of ownership. With the last sender gone, recv returns
    // None as soon as the queue empties, and every worker loop ends by itself:
    // no stop flag, no poison-pill job.
    drop(tx);

    // Receiver has one owner and does not clone, so the lock turns "one
    // consumer" into "one consumer at a time".
    let rx = Arc::new(tokio::sync::Mutex::new(rx));

    let handles: Vec<JoinHandle<Vec<Outcome>>> = (0..workers)
        .map(|_| {
            let rx = Arc::clone(&rx);
            tokio::spawn(async move {
                let mut mine = Vec::new();
                loop {
                    // The guard is a temporary of this statement, so it is
                    // released before the job below runs: a worker holds the
                    // lock while waiting for work, never while doing it.
                    // Spelled `while let Some(job) = rx.lock().await.recv().await`
                    // the same calls compile and the guard survives the body,
                    // which leaves the pool correct, complete, and serial.
                    let next = rx.lock().await.recv().await;
                    match next {
                        Some(job) => mine.push(job.await),
                        None => break,
                    }
                }
                mine
            })
        })
        .collect();

    let mut per_worker = Vec::with_capacity(workers);
    for handle in handles {
        per_worker.push(handle.await.expect("a worker panicked"));
    }
    per_worker
}

/// The bound is the whole exercise: `channel(capacity)` and an awaited send.
pub fn start_producer(
    capacity: usize,
    total: u32,
    sent: Arc<AtomicUsize>,
) -> (mpsc::Receiver<u32>, JoinHandle<()>) {
    let (tx, rx) = mpsc::channel(capacity);
    let producer = tokio::spawn(async move {
        for item in 0..total {
            // Returns immediately while there is room and parks when there is
            // not. Parked costs a stored waker and a few hundred bytes, which
            // is why bounded is the sensible default rather than a knob to
            // reach for after an incident.
            if tx.send(item).await.is_err() {
                break; // consumer gone: there is nobody left to pace for
            }
            sent.fetch_add(1, Ordering::SeqCst);
        }
    });
    (rx, producer)
}

/// A channel bounds what is queued; a semaphore bounds what is running.
pub async fn bounded_fan_out(jobs: Vec<Job>, limit: usize) -> Vec<Outcome> {
    let permits = Arc::new(Semaphore::new(limit));
    let mut handles = Vec::with_capacity(jobs.len());
    for job in jobs {
        // Acquired before the spawn, so this loop itself parks once every
        // permit is out. Acquiring inside the task instead would spawn all of
        // them immediately and hold the same ceiling on running work, at the
        // price of keeping every pending future alive to wait for its turn.
        let permit =
            Arc::clone(&permits).acquire_owned().await.expect("the semaphore is never closed");
        handles.push(tokio::spawn(async move {
            let _permit = permit; // held for exactly the job's lifetime
            job.await
        }));
    }

    let mut outcomes = Vec::with_capacity(handles.len());
    for handle in handles {
        outcomes.push(handle.await.expect("a job panicked"));
    }
    outcomes
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct Stats {
    pub delivered: usize,
    pub failed: usize,
}

/// One variant per message. `Stats` carries the channel to answer on, which is
/// the only difference between a message and a request.
enum Command {
    Record(Outcome),
    Stats(oneshot::Sender<Stats>),
}

#[derive(Clone)]
pub struct Progress {
    tx: mpsc::Sender<Command>,
}

impl Progress {
    pub fn spawn() -> (Self, JoinHandle<Stats>) {
        // Bounded, so a caller that outruns the actor waits its turn: the
        // backpressure lesson composing in for free.
        let (tx, mut inbox) = mpsc::channel(32);
        let task = tokio::spawn(async move {
            // Plain state with zero synchronization, because only this task can
            // reach it. Part 1's one-owner rule promoted to an architecture.
            let mut stats = Stats::default();
            while let Some(command) = inbox.recv().await {
                match command {
                    Command::Record(outcome) if outcome.delivered => stats.delivered += 1,
                    Command::Record(_) => stats.failed += 1,
                    // A caller that gave up leaves a dead reply channel behind.
                    // That is the caller's business, not a reason to stop.
                    Command::Stats(reply) => {
                        let _ = reply.send(stats);
                    }
                }
            }
            // The inbox closed, which means the last handle is gone and no
            // further command can arrive. Handing the state back is the whole
            // shutdown protocol.
            stats
        });
        (Self { tx }, task)
    }

    pub async fn record(&self, outcome: Outcome) {
        // Nothing to wait for beyond a slot in the inbox, so no oneshot and no
        // round trip. A dead actor is not worth panicking over on a metric.
        let _ = self.tx.send(Command::Record(outcome)).await;
    }

    pub async fn stats(&self) -> Stats {
        let (reply, answer) = oneshot::channel();
        self.tx.send(Command::Stats(reply)).await.expect("the progress actor is gone");
        answer.await.expect("the progress actor dropped the reply")
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Config {
    pub retries: u32,
    pub batch: usize,
}

#[derive(Clone)]
pub struct ConfigHandle {
    // watch::Sender is single-producer and not Clone, so the outer Arc is what
    // makes the handle shareable. The inner Arc is the point of the design:
    // readers take the pointer, never a copy of the config.
    swap: Arc<watch::Sender<Arc<Config>>>,
}

impl ConfigHandle {
    pub fn new(initial: Config) -> Self {
        // The receiver is dropped on the spot. Readers here poll for a
        // snapshot rather than subscribing to changes, and watch keeps
        // serving the current value with no subscribers at all.
        let (swap, _) = watch::channel(Arc::new(initial));
        Self { swap: Arc::new(swap) }
    }

    pub fn snapshot(&self) -> Arc<Config> {
        // One atomic increment, no copy of the config, and the borrow of the
        // watch cell ends with this statement.
        Arc::clone(&self.swap.borrow())
    }

    pub fn reload(&self, next: Config) {
        // send_replace rather than send: this has to publish even when nobody
        // is subscribed, which is the normal case when readers only snapshot.
        // A reader mid-job keeps the Arc it already took.
        self.swap.send_replace(Arc::new(next));
    }
}

/// The fix is the block, not a different mutex.
pub fn spawn_bump(
    counter: Arc<std::sync::Mutex<usize>>,
    tx: mpsc::Sender<usize>,
) -> JoinHandle<()> {
    tokio::spawn(async move {
        // The guard lives and dies inside these braces, so the future holds
        // nothing across the await below and is Send again. What is left is a
        // critical section of two instructions, which is what a mutex is good
        // at: lock, touch memory, unlock.
        let mine = {
            let mut count = counter.lock().expect("the counter is never poisoned");
            *count += 1;
            *count
        };
        let _ = tx.send(mine).await;
    })
}

/// Stop taking new work, finish what is in flight, exit.
pub async fn worker_until_shutdown(
    mut jobs: mpsc::Receiver<Job>,
    mut shutdown: watch::Receiver<bool>,
) -> Vec<Outcome> {
    let mut handled = Vec::new();
    loop {
        let job = tokio::select! {
            // Without this, a run where both branches are ready hands the
            // decision to a coin flip, and "shutdown, probably" is not a
            // policy anyone can test or reason about.
            biased;
            _ = shutdown.changed() => break,
            next = jobs.recv() => match next {
                Some(job) => job,
                None => break,
            },
        };
        // Outside the select, so cancellation cannot land in the middle of it.
        // Queued jobs are abandoned; that is a policy, and it is only safe
        // because a delivery job is replayable.
        handled.push(job.await);
    }
    handled
}

pub async fn deliver_issue(
    jobs: Vec<Job>,
    queue: usize,
    workers: usize,
    shutdown: watch::Receiver<bool>,
) -> Stats {
    let (tx, rx) = mpsc::channel::<Job>(queue); // backpressure
    let rx = Arc::new(tokio::sync::Mutex::new(rx)); // shared receiver
    let (progress, counts) = Progress::spawn(); // the actor owning the counts

    let pool: Vec<_> = (0..workers)
        .map(|_| {
            let rx = Arc::clone(&rx);
            let progress = progress.clone();
            let mut shutdown = shutdown.clone();
            tokio::spawn(async move {
                loop {
                    let job = tokio::select! {
                        biased;
                        _ = shutdown.changed() => break,
                        // Both lock and recv are cancel-safe, so losing this
                        // branch cannot strand a job outside the channel.
                        next = async { rx.lock().await.recv().await } => match next {
                            Some(job) => job,
                            None => break, // queue closed and empty
                        },
                    };
                    progress.record(job.await).await;
                }
            })
        })
        .collect();
    // The workers hold the only clones now. Keeping this one alive would leave
    // the receiver alive after they exit, and a producer parked on a full queue
    // would then wait forever for room that is never coming.
    drop(rx);

    let producer = tokio::spawn(async move {
        for job in jobs {
            // Waits while the queue is full, and fails once the workers have
            // dropped the receiver, which is how a cancelled run releases its
            // producer instead of hanging on it.
            if tx.send(job).await.is_err() {
                break;
            }
        }
        // tx falls out of scope on either path, closing the queue so workers
        // that are still running drain it and stop.
    });

    for worker in pool {
        worker.await.expect("a worker panicked");
    }
    producer.await.expect("the producer panicked");

    // Every worker's clone went with it; this is the last handle, so the inbox
    // closes and the actor hands back the totals it owned all along.
    drop(progress);
    counts.await.expect("the progress actor panicked")
}

/// Queued, in flight, and the one the parked producer is still holding inside
/// `send().await`. Everything else is a row nobody has read yet.
pub fn peak_jobs_in_memory(queue: usize, workers: usize) -> usize {
    queue + workers + 1
}
