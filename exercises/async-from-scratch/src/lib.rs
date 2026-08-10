//! Async from scratch.
//!
//! One or two exercises per lesson, six lessons in all. Nothing here depends on
//! a runtime: `std::future::Future`, `std::task`, `std::pin::Pin` and
//! `std::sync::Arc` are the whole toolkit, and tokio is deliberately absent.
//! You write the future, the state machine an `async fn` compiles to, the
//! waker, the executor that drives them, and the table a reactor keeps.
//!
//! Run `cargo test -p async-from-scratch` to see what is red, then delete each
//! `todo!()` and make the suite pass. One lesson at a time works too:
//! `cargo test -p async-from-scratch --test future_waker`.

use std::collections::HashMap;
use std::future::Future;
use std::io;
use std::pin::Pin;
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::task::{Context, Poll, Wake, Waker};
use std::thread::Thread;

/// Scaffolding, not an exercise: poll a future exactly once with a waker that
/// does nothing, and report what it answered.
///
/// `Pin::new` is enough here because every future in this crate is `Unpin`:
/// none of them holds a pointer into itself, so moving one is harmless. The
/// pinning section is where that stops being true.
pub fn poll_once<F: Future + Unpin>(fut: &mut F) -> Poll<F::Output> {
    let mut cx = Context::from_waker(Waker::noop());
    Pin::new(fut).poll(&mut cx)
}

// ---------------------------------------------------------------------------
// Lesson: future-why-async
// ---------------------------------------------------------------------------

/// The stack a Rust thread reserves by default, in bytes.
pub const THREAD_STACK_RESERVATION: usize = 2 * 1024 * 1024;

/// Lesson: future-why-async
///
/// One paused send, represented as a plain value rather than a parked thread:
/// exactly what resuming needs, and nothing else. Which subscriber, and which
/// attempt this is. No stack, no kernel task structure, no scheduler slot.
pub struct PendingSend {
    pub subscriber_id: u64,
    pub attempt: u8,
}

/// Lesson: future-why-async
///
/// Thread-per-connection gives every in-flight send its own thread. Return the
/// stack those `sends` threads reserve between them.
pub fn thread_per_send_bytes(_sends: usize) -> usize {
    todo!("one thread apiece, and each one reserves its stack up front")
}

/// Lesson: future-why-async
///
/// Now price the same `sends` when each paused send is a value instead. Ask the
/// type how big it is rather than counting the fields by eye: padding is real.
pub fn paused_value_bytes(_sends: usize) -> usize {
    todo!("how many bytes does one PendingSend occupy?")
}

// ---------------------------------------------------------------------------
// Lesson: future-trait
// ---------------------------------------------------------------------------

/// Lesson: future-trait
///
/// The smallest possible future: it is finished before anyone asks. Implement
/// `poll` so it hands the value back on the first call.
///
/// The `Option` is not decoration. `poll` receives `&mut self`, not `self`, so
/// the value has to be moved out of somewhere, and a future that has answered
/// `Ready` is spent: the contract says never poll it again. Make the second
/// poll say so loudly rather than returning a copy.
pub struct Ready<T>(Option<T>);

/// Construct a future that is already finished.
pub fn ready<T>(value: T) -> Ready<T> {
    Ready(Some(value))
}

impl<T: Unpin> Future for Ready<T> {
    type Output = T;

    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<T> {
        todo!("nothing to wait for, so there is no waker to lodge")
    }
}

/// Lesson: future-trait
///
/// A future whose body is observable: polling it appends one line to a shared
/// log. That makes inertness testable rather than a claim you have to trust.
///
/// `new` must do no work at all. It moves its arguments in and returns. Every
/// visible effect belongs in `poll`, which appends `sending to {email}` to the
/// log and answers with the address's length.
pub struct SendConfirmation {
    email: String,
    log: Arc<std::sync::Mutex<Vec<String>>>,
}

impl SendConfirmation {
    pub fn new(_email: &str, _log: Arc<std::sync::Mutex<Vec<String>>>) -> Self {
        todo!("move the arguments in; calling a constructor is not calling a body")
    }
}

impl Future for SendConfirmation {
    type Output = usize;

    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<usize> {
        todo!("this is where the body finally runs")
    }
}

// ---------------------------------------------------------------------------
// Lesson: future-state-machine
// ---------------------------------------------------------------------------

/// Stands in for the fetch an `async fn` would await: the id's address.
pub fn fetch_email(id: u64) -> String {
    format!("subscriber-{id}@example.com")
}

/// Stands in for the send an `async fn` would await: the provider's receipt.
pub fn send_receipt(email: &str) -> String {
    format!("queued {email}")
}

/// Lesson: future-state-machine
///
/// The enum an `async fn` desugars to, written by hand. This is the source it
/// stands for:
///
/// ```text
/// async fn deliver(id: u64) -> String {
///     let email = fetch_email(id).await;         // await point 1
///     let receipt = send_receipt(&email).await;  // await point 2
///     receipt
/// }
/// ```
///
/// Add one variant per await point, plus the `Done` the machine lands in. Give
/// each variant exactly the locals that are alive across its await: `id` is
/// what building the fetch needs, `email` is what the send needs while it is
/// pending, and `receipt` is born after the last await, so it never becomes a
/// field at all.
///
/// One poll advances one state, because each child future here answers on its
/// second ask. So: `Pending` on the way to `awaiting-fetch`, `Pending` on the
/// way to `awaiting-send`, then `Ready(receipt)` as the machine reaches `done`.
/// Wake before each `Pending`: progress is possible immediately, and a
/// `Pending` that lodges no wake is the lost-wakeup bug from the next lesson.
///
/// Polling once more after `Ready` is a contract violation. Panic on it.
pub enum DeliverFuture {
    /// What `deliver(id)` is the instant it is constructed, holding the
    /// argument that was moved into it and nothing else.
    Start { id: u64 },
    // TODO: one variant per await point, plus Done.
}

impl DeliverFuture {
    pub fn new(id: u64) -> Self {
        DeliverFuture::Start { id }
    }

    /// The machine's current state, so a test can watch it advance: `"start"`,
    /// `"awaiting-fetch"`, `"awaiting-send"`, or `"done"`.
    pub fn state_name(&self) -> &'static str {
        todo!("name the variant you are sitting in")
    }
}

impl Future for DeliverFuture {
    type Output = String;

    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<String> {
        todo!("match on the current state, run to the next await point, store the next state")
    }
}

// ---------------------------------------------------------------------------
// Lesson: future-waker
// ---------------------------------------------------------------------------

/// Lesson: future-waker
///
/// A waker you can assert on. `std::task::Wake` is std's safe front door to the
/// two-word handle from the lesson: implement it once and `Waker::from`
/// assembles the vtable for you, no `RawWakerVTable` by hand.
///
/// Note the receivers. `wake` consumes an `Arc<Self>` because a waker is shared
/// and cloneable, and `waker` borrows one because the counter has to outlive
/// every handle it hands out.
///
/// Implementing `wake` is enough. `wake_by_ref` has a default that goes through
/// it, which is why a future may use either and still be counted here.
#[derive(Default)]
pub struct WakeCounter {
    wakes: AtomicUsize,
}

impl WakeCounter {
    pub fn new() -> Arc<Self> {
        Arc::new(Self::default())
    }

    /// How many times anything has rung this doorbell.
    pub fn count(&self) -> usize {
        self.wakes.load(Ordering::SeqCst)
    }

    /// Hand out a `Waker` that reports back to this counter.
    pub fn waker(self: &Arc<Self>) -> Waker {
        todo!("Waker::from wants an Arc<impl Wake>, and this counter must survive the handle")
    }
}

impl Wake for WakeCounter {
    fn wake(self: Arc<Self>) {
        todo!("record one ring of the doorbell")
    }
}

/// Lesson: future-waker
///
/// A future that is not ready yet, on purpose, a fixed number of times.
///
/// `CountdownFuture::new(n)` answers `Pending` on its first `n` polls and
/// `Ready` on the next, and the value it produces is the total number of polls
/// it received, the final one included. The count is the lesson: a future
/// advances only when something polls it, and constructing one advances it
/// zero times.
///
/// Before every `Pending`, wake the waker `cx` carries. Progress is possible
/// straight away here, so this future is its own wake source. Returning
/// `Pending` without lodging a wake somewhere is a silent, permanent sleep: no
/// panic, no error, and under a correct executor the program simply stops.
pub struct CountdownFuture {
    remaining: u32,
    polls: u32,
}

impl CountdownFuture {
    pub fn new(remaining: u32) -> Self {
        Self { remaining, polls: 0 }
    }

    /// How many polls this future has received so far.
    pub fn polls(&self) -> u32 {
        self.polls
    }
}

impl Future for CountdownFuture {
    type Output = u32;

    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<u32> {
        todo!("count the poll, spend one of the remaining Pendings, and ring the doorbell")
    }
}

// ---------------------------------------------------------------------------
// Lesson: future-block-on
// ---------------------------------------------------------------------------

/// Lesson: future-block-on
///
/// The executor's own waker, wrapping the handle of the thread that is driving
/// the future. Waking it has one job: release that thread from its park.
///
/// The token behaviour matters and is worth reading up on: an unpark that
/// arrives before the park leaves a token, so the next park returns at once.
/// That is what closes the race between a future answering `Pending` and the
/// executor reaching `park`.
pub struct ThreadWaker(pub Thread);

impl Wake for ThreadWaker {
    fn wake(self: Arc<Self>) {
        todo!("release the thread this waker was built from")
    }
}

/// Lesson: future-block-on
///
/// An executor, all of it. Drive `fut` on the calling thread until it answers
/// `Ready`, and return that value.
///
/// Two things to get right. `poll` wants `Pin<&mut Self>`, so the future needs
/// a stable address before the loop starts. And on `Pending` the thread must
/// sleep at zero CPU rather than spin: polling in a tight loop is busy-waiting,
/// which is worse than the blocked thread async set out to replace.
pub fn block_on<F: Future>(_fut: F) -> F::Output {
    todo!("pin it, build a waker from ThreadWaker, then poll and sleep until woken")
}

/// Lesson: future-block-on
///
/// Two futures, run concurrently on one thread. `Join` owns both children and
/// polls them; no runtime hook is involved, which is the composition claim from
/// the Future trait lesson paid in code.
///
/// Poll each child that is still running, keep whatever output comes back, and
/// answer `Ready` with the pair only once both have finished. A child that
/// answered `Ready` must never be polled again: that is why the fields are
/// `Option`, and a test counts polls to check it.
pub struct Join<A: Future, B: Future> {
    a: Option<A>,
    b: Option<B>,
    a_out: Option<A::Output>,
    b_out: Option<B::Output>,
}

/// Combine two futures into one that finishes when both have.
pub fn join<A: Future, B: Future>(a: A, b: B) -> Join<A, B> {
    Join { a: Some(a), b: Some(b), a_out: None, b_out: None }
}

// The four bounds are `self.get_mut()` asking a question: a struct is Unpin
// only when every field is, and two of these fields hold the children's
// outputs.
impl<A, B> Future for Join<A, B>
where
    A: Future + Unpin,
    B: Future + Unpin,
    A::Output: Unpin,
    B::Output: Unpin,
{
    type Output = (A::Output, B::Output);

    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {
        todo!("poll whichever children are still running, and finish when both have")
    }
}

// ---------------------------------------------------------------------------
// Lesson: future-epoll
// ---------------------------------------------------------------------------

/// Lesson: future-epoll
///
/// A non-blocking read returns immediately, carrying bytes the kernel had
/// buffered or saying `WouldBlock`. Translate one such result into the answer
/// poll owes its caller.
///
/// `WouldBlock` is not a failure, it is `Pending` spoken in errno. Every other
/// error is a real one and belongs in the future's output, not swallowed here.
pub fn readiness(_result: io::Result<usize>) -> Poll<io::Result<usize>> {
    todo!("one of these three outcomes is not an error at all")
}

/// Lesson: future-epoll
///
/// The reactor's table: which waker is filed under which file descriptor. The
/// epoll instance itself is the kernel's business, and this is the bookkeeping
/// beside it, the part that turns readiness back into a poll.
///
/// - `register` files a waker under an fd, replacing whatever was there. The
///   newest poll's waker is the live one, because a task can be re-polled and
///   handed a different waker each time.
/// - `notify_ready` takes the waker filed under `fd`, rings it, and reports
///   whether there was one. Take, not clone: the registration is spent, and a
///   task that is still not ready re-registers on its next poll.
///
/// The assertion worth remembering is the one about the fds you did not
/// notify. They cost nothing on this path: no scan, no wake, no poll.
pub struct Reactor {
    registrations: HashMap<u32, Waker>,
}

impl Reactor {
    pub fn new() -> Self {
        Self { registrations: HashMap::new() }
    }

    /// How many fds currently have a waker filed under them.
    pub fn registered(&self) -> usize {
        self.registrations.len()
    }

    pub fn register(&mut self, _fd: u32, _waker: Waker) {
        todo!("file this waker under this fd")
    }

    pub fn notify_ready(&mut self, _fd: u32) -> bool {
        todo!("ring whoever was waiting on this fd, once")
    }
}
