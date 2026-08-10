//! Reference solutions. Read these after you have something passing.
//!
//! Where a solution had a choice to make, the comment says which way it went
//! and why, since that judgment is the part worth copying.

use std::collections::HashMap;
use std::future::Future;
use std::io;
use std::pin::Pin;
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::task::{Context, Poll, Wake, Waker};
use std::thread::{self, Thread};

/// Scaffolding, not an exercise: poll a future exactly once with a waker that
/// does nothing, and report what it answered.
pub fn poll_once<F: Future + Unpin>(fut: &mut F) -> Poll<F::Output> {
    let mut cx = Context::from_waker(Waker::noop());
    Pin::new(fut).poll(&mut cx)
}

// ---------------------------------------------------------------------------
// Lesson: future-why-async
// ---------------------------------------------------------------------------

pub const THREAD_STACK_RESERVATION: usize = 2 * 1024 * 1024;

pub struct PendingSend {
    pub subscriber_id: u64,
    pub attempt: u8,
}

/// The stack is reserved when the thread is spawned, whether or not the thread
/// ever touches it. Most of those pages stay virtual, but the reservation is
/// what puts a ceiling on how many in-flight sends one process can represent.
pub fn thread_per_send_bytes(sends: usize) -> usize {
    sends * THREAD_STACK_RESERVATION
}

/// `size_of` rather than 8 + 1: the u8 sits in a struct aligned to its widest
/// field, so a `PendingSend` is 16 bytes, not 9. Either way the comparison in
/// the test holds by five orders of magnitude.
pub fn paused_value_bytes(sends: usize) -> usize {
    sends * std::mem::size_of::<PendingSend>()
}

// ---------------------------------------------------------------------------
// Lesson: future-trait
// ---------------------------------------------------------------------------

pub struct Ready<T>(Option<T>);

pub fn ready<T>(value: T) -> Ready<T> {
    Ready(Some(value))
}

impl<T: Unpin> Future for Ready<T> {
    type Output = T;

    /// `take` moves the value out and leaves `None` behind, which costs nothing
    /// and doubles as the spent-future check. Cloning instead would demand
    /// `T: Clone` from every caller and would quietly permit a second poll,
    /// hiding a bug the contract wants surfaced.
    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<T> {
        let value =
            self.get_mut().0.take().expect("a future must not be polled after it returned Ready");
        Poll::Ready(value)
    }
}

pub struct SendConfirmation {
    email: String,
    log: Arc<std::sync::Mutex<Vec<String>>>,
}

impl SendConfirmation {
    /// Allocating the String here is fine: it is moving an argument in, not
    /// running the body. The line the test watches for is the one in `poll`.
    pub fn new(email: &str, log: Arc<std::sync::Mutex<Vec<String>>>) -> Self {
        Self { email: email.to_string(), log }
    }
}

impl Future for SendConfirmation {
    type Output = usize;

    /// The body, all of it, running on the first poll and never before. There
    /// is no await inside, so this future is `Ready` immediately and needs no
    /// waker.
    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<usize> {
        let this = self.get_mut();
        this.log.lock().unwrap().push(format!("sending to {}", this.email));
        Poll::Ready(this.email.len())
    }
}

// ---------------------------------------------------------------------------
// Lesson: future-state-machine
// ---------------------------------------------------------------------------

pub fn fetch_email(id: u64) -> String {
    format!("subscriber-{id}@example.com")
}

pub fn send_receipt(email: &str) -> String {
    format!("queued {email}")
}

/// One variant per await point, plus a start and a done. `receipt` is absent on
/// purpose: it is born after the last await and dead before poll returns, so it
/// stays an ordinary local and costs the future nothing.
pub enum DeliverFuture {
    Start { id: u64 },
    AwaitingFetch { id: u64 },
    AwaitingSend { email: String },
    Done,
}

impl DeliverFuture {
    pub fn new(id: u64) -> Self {
        DeliverFuture::Start { id }
    }

    pub fn state_name(&self) -> &'static str {
        match self {
            DeliverFuture::Start { .. } => "start",
            DeliverFuture::AwaitingFetch { .. } => "awaiting-fetch",
            DeliverFuture::AwaitingSend { .. } => "awaiting-send",
            DeliverFuture::Done => "done",
        }
    }
}

impl Future for DeliverFuture {
    type Output = String;

    /// `mem::replace` rather than `match self`: `AwaitingSend` owns its String,
    /// and the next state has to own it too, so the old state must be moved out
    /// rather than borrowed. Leaving `Done` behind is what makes that legal, and
    /// it is also what a real generated machine does at every transition.
    ///
    /// Each `Pending` wakes first. Progress here is possible immediately, so
    /// this machine is its own wake source; a real one would have handed the
    /// waker to the child future it is waiting on.
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<String> {
        let this = self.get_mut();
        match std::mem::replace(this, DeliverFuture::Done) {
            DeliverFuture::Start { id } => {
                *this = DeliverFuture::AwaitingFetch { id };
                cx.waker().wake_by_ref();
                Poll::Pending
            }
            DeliverFuture::AwaitingFetch { id } => {
                *this = DeliverFuture::AwaitingSend { email: fetch_email(id) };
                cx.waker().wake_by_ref();
                Poll::Pending
            }
            DeliverFuture::AwaitingSend { email } => {
                // `receipt` never becomes a field: it lives and dies inside this
                // one call, after the last await point.
                let receipt = send_receipt(&email);
                Poll::Ready(receipt)
            }
            DeliverFuture::Done => panic!("a future must not be polled after it returned Ready"),
        }
    }
}

// ---------------------------------------------------------------------------
// Lesson: future-waker
// ---------------------------------------------------------------------------

#[derive(Default)]
pub struct WakeCounter {
    wakes: AtomicUsize,
}

impl WakeCounter {
    pub fn new() -> Arc<Self> {
        Arc::new(Self::default())
    }

    pub fn count(&self) -> usize {
        self.wakes.load(Ordering::SeqCst)
    }

    /// Cloning the Arc is the point: the handle and the counter share one
    /// allocation, so a waker that outlives the poll it was cloned in still has
    /// something to report to.
    pub fn waker(self: &Arc<Self>) -> Waker {
        Waker::from(Arc::clone(self))
    }
}

impl Wake for WakeCounter {
    /// An atomic, not a Cell, because `Wake` requires `Send + Sync`: wakers are
    /// cloned and shipped across threads, and a timer thread or a reactor is
    /// exactly what usually rings this.
    fn wake(self: Arc<Self>) {
        self.wakes.fetch_add(1, Ordering::SeqCst);
    }
}

pub struct CountdownFuture {
    remaining: u32,
    polls: u32,
}

impl CountdownFuture {
    pub fn new(remaining: u32) -> Self {
        Self { remaining, polls: 0 }
    }

    pub fn polls(&self) -> u32 {
        self.polls
    }
}

impl Future for CountdownFuture {
    type Output = u32;

    /// The wake goes before the `Pending`, not after some later event, because
    /// this future's condition is already satisfiable: it just wants another
    /// turn. Real futures hand the clone to whatever will learn about progress
    /// first, a timer or the reactor, and the shape is identical.
    ///
    /// The `Ready` path deliberately does not wake. Nobody needs to be told to
    /// poll a future that is finished.
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<u32> {
        let this = self.get_mut();
        this.polls += 1;
        if this.remaining == 0 {
            return Poll::Ready(this.polls);
        }
        this.remaining -= 1;
        cx.waker().wake_by_ref();
        Poll::Pending
    }
}

// ---------------------------------------------------------------------------
// Lesson: future-block-on
// ---------------------------------------------------------------------------

pub struct ThreadWaker(pub Thread);

impl Wake for ThreadWaker {
    fn wake(self: Arc<Self>) {
        self.0.unpark();
    }
}

/// `Box::pin` gives the future a stable heap address, which is what makes
/// resuming a self-referential state machine safe. `std::pin::pin!` would do
/// the same on the stack with no allocation; either satisfies poll's receiver.
///
/// `park` is the whole craft. A parked thread costs nothing per tick, and the
/// unpark token means a wake that lands between the `Pending` and the `park`
/// is not lost: that park returns immediately and the loop polls again.
pub fn block_on<F: Future>(fut: F) -> F::Output {
    let mut fut = Box::pin(fut);
    let waker = Waker::from(Arc::new(ThreadWaker(thread::current())));
    let mut cx = Context::from_waker(&waker);
    loop {
        match fut.as_mut().poll(&mut cx) {
            Poll::Ready(value) => return value,
            Poll::Pending => thread::park(),
        }
    }
}

pub struct Join<A: Future, B: Future> {
    a: Option<A>,
    b: Option<B>,
    a_out: Option<A::Output>,
    b_out: Option<B::Output>,
}

pub fn join<A: Future, B: Future>(a: A, b: B) -> Join<A, B> {
    Join { a: Some(a), b: Some(b), a_out: None, b_out: None }
}

impl<A, B> Future for Join<A, B>
where
    A: Future + Unpin,
    B: Future + Unpin,
    A::Output: Unpin,
    B::Output: Unpin,
{
    type Output = (A::Output, B::Output);

    /// Taking the child out of its `Option` on `Ready` is what stops the next
    /// poll from touching a spent future. It also drops the child there and
    /// then, releasing whatever it held while the other half runs on.
    ///
    /// The `Pending` path lodges no waker of its own, and does not need to:
    /// each child that is still running was handed this task's waker and has
    /// already lodged it wherever its own progress will come from.
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let this = self.get_mut();

        if let Some(a) = this.a.as_mut()
            && let Poll::Ready(out) = Pin::new(a).poll(cx)
        {
            this.a_out = Some(out);
            this.a = None;
        }

        if let Some(b) = this.b.as_mut()
            && let Poll::Ready(out) = Pin::new(b).poll(cx)
        {
            this.b_out = Some(out);
            this.b = None;
        }

        if this.a_out.is_some() && this.b_out.is_some() {
            let a = this.a_out.take().expect("checked just above");
            let b = this.b_out.take().expect("checked just above");
            return Poll::Ready((a, b));
        }
        Poll::Pending
    }
}

// ---------------------------------------------------------------------------
// Lesson: future-epoll
// ---------------------------------------------------------------------------

/// The match arms are the whole translation. `WouldBlock` is the kernel saying
/// nothing is buffered yet, which is a readiness fact, not a failure; anything
/// else is a real error and belongs in the output where the caller can see it.
pub fn readiness(result: io::Result<usize>) -> Poll<io::Result<usize>> {
    match result {
        Err(e) if e.kind() == io::ErrorKind::WouldBlock => Poll::Pending,
        other => Poll::Ready(other),
    }
}

pub struct Reactor {
    registrations: HashMap<u32, Waker>,
}

impl Reactor {
    pub fn new() -> Self {
        Self { registrations: HashMap::new() }
    }

    pub fn registered(&self) -> usize {
        self.registrations.len()
    }

    /// `insert` replaces, which is the behaviour the contract wants: a task
    /// that was re-polled may carry a fresh waker, and the stale one must not
    /// be the handle that gets rung.
    pub fn register(&mut self, fd: u32, waker: Waker) {
        self.registrations.insert(fd, waker);
    }

    /// `remove` rather than `get`: a wake is one-shot. The task will re-poll,
    /// and if it is still not ready it will register again, which is exactly
    /// what a future does on `WouldBlock`.
    pub fn notify_ready(&mut self, fd: u32) -> bool {
        match self.registrations.remove(&fd) {
            Some(waker) => {
                waker.wake();
                true
            }
            None => false,
        }
    }
}
