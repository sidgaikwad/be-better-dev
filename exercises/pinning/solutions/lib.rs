//! Reference solutions. Read these after you have something passing.
//!
//! Where a solution had a choice to make, the comment says which way it went
//! and why, since that judgment is the part worth copying.

use std::future::Future;
use std::marker::PhantomPinned;
use std::pin::Pin;
use std::task::{Context, Poll, Waker};

pub struct SelfRef {
    value: String,
    recorded: *const String,
}

impl SelfRef {
    pub fn new(value: &str) -> Self {
        Self { value: value.to_string(), recorded: std::ptr::null() }
    }

    pub fn value(&self) -> &str {
        &self.value
    }

    /// The cast to `*const String` is what makes this legal. As a reference it
    /// would need a lifetime naming the struct itself, which cannot be written;
    /// as a raw pointer it carries no lifetime, so the borrow ends here and the
    /// compiler stops tracking whether the address is still good. That is the
    /// whole bargain: it will store the pointer and it will not check it again.
    pub fn link(&mut self) {
        let here: *const String = &self.value;
        self.recorded = here;
    }

    pub fn value_address(&self) -> usize {
        &self.value as *const String as usize
    }

    /// Casting a raw pointer to an integer is defined for any pointer at all,
    /// valid, dangling, or null. Reading through a stale one would be undefined
    /// behaviour, so nothing in this crate ever does.
    pub fn recorded_address(&self) -> usize {
        self.recorded as usize
    }

    /// The null check only matters before `link` has run; after a move the
    /// second half is what catches it, because the bytes of the pointer came
    /// through the memcpy untouched while the field they name did not.
    pub fn is_intact(&self) -> bool {
        !self.recorded.is_null() && self.recorded_address() == self.value_address()
    }
}

pub struct Anchored {
    label: &'static str,
    _pin: PhantomPinned,
}

impl Anchored {
    pub fn new(label: &'static str) -> Self {
        Self { label, _pin: PhantomPinned }
    }

    pub fn label(&self) -> &'static str {
        self.label
    }
}

/// `Pin<Ptr>: Deref` is unconditional, so `&*value` works for an `Anchored` as
/// readily as for a `String`. Only the mutable door is guarded, which is the
/// shape of the whole contract: reading a pinned value was never a way to move
/// it.
pub fn address_of<T>(value: Pin<&mut T>) -> usize {
    &*value as *const T as usize
}

/// One safe call, no unsafe, no ceremony, and both values change address. This
/// is why `poll` cannot take `&mut self`: `swap`, `replace`, `take` and plain
/// assignment all move a value out of its place, and all of them ask for
/// nothing more than the borrow this function was handed.
pub fn swap_anchored(a: &mut Anchored, b: &mut Anchored) {
    std::mem::swap(a, b);
}

pub fn assert_unpin<T: Unpin>() {}

pub fn assert_unpin_value<T: Unpin>(_value: &T) {}

/// `get_mut` is the safe door, open because `String: Unpin`. Note that nothing
/// about the pinned `String` changed: pinning sets no flag and locks no page,
/// it only changes which programs type-check, and for an `Unpin` type it
/// changes nothing at all.
pub fn append_through_pin(s: Pin<&mut String>, extra: &str) {
    s.get_mut().push_str(extra);
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Candidate {
    OwnedString,
    ByteVec,
    SelfReferential,
    PhantomPinnedStruct,
    AsyncMachine,
    PinnedBoxOfAsyncMachine,
}

pub fn is_unpin(candidate: Candidate) -> bool {
    match candidate {
        // A String's pointer aims at a heap buffer, never at the header's own
        // address, so the header can be copied anywhere and stay correct. Vec
        // is the same three words with the same shrug.
        Candidate::OwnedString | Candidate::ByteVec => true,
        // The surprise. `Unpin` is an auto trait, raw pointers implement it,
        // and the compiler has no idea that this particular `*const String`
        // aims at the field beside it. SelfRef claims `Unpin` and moving one
        // wrecks it: the trait does not mean "safe to move", it means "the pin
        // contract asks nothing of me". A type that needs the contract has to
        // say so itself, with the marker `Anchored` carries.
        Candidate::SelfReferential => true,
        // The one std tool for withholding the auto trait, and the reason
        // `Anchored`'s `get_mut` is a compile error.
        Candidate::PhantomPinnedStruct => false,
        // Marked `!Unpin` wholesale, without any analysis of whether the body
        // actually borrows across an await. Even `async { 2 + 2 }` is. The
        // precise rule would be fragile: one added borrow deep in a function
        // would silently change the trait of a public type.
        Candidate::AsyncMachine => false,
        // Moving the box moves one pointer; the pinned bytes never go anywhere.
        // One allocation buys back complete freedom of movement, which is what
        // makes `Box::pin` the fix for storing futures and for recursion.
        Candidate::PinnedBoxOfAsyncMachine => true,
    }
}

pub struct Countdown {
    remaining: u32,
    polls: u32,
}

impl Countdown {
    pub fn new(pending_polls: u32) -> Self {
        Self { remaining: pending_polls, polls: 0 }
    }

    pub fn polls(&self) -> u32 {
        self.polls
    }
}

impl Future for Countdown {
    type Output = u32;

    /// `self.get_mut()` is the first line of most hand-written `poll` bodies,
    /// and it is safe here for the reason the mental-model lesson gives: both
    /// fields are `u32`, so `Countdown` is `Unpin`, so the pin is asking
    /// nothing of this type and will hand the plain `&mut` straight back.
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<u32> {
        let this = self.get_mut();
        this.polls += 1;
        if this.remaining > 0 {
            this.remaining -= 1;
            // Wake before Pending. Nothing external will ring this doorbell,
            // because the only thing this future waits on is another poll.
            cx.waker().wake_by_ref();
            Poll::Pending
        } else {
            Poll::Ready(this.polls)
        }
    }
}

/// `Pin::new` is the free constructor, available only under `F: Unpin`. It is
/// the honest version of `Pin::new_unchecked`: the bound proves the promise
/// costs nothing, so no one has to sign for it.
pub fn poll_borrowed<F: Future + Unpin>(fut: &mut F) -> Poll<F::Output> {
    let mut cx = Context::from_waker(Waker::noop());
    Pin::new(fut).poll(&mut cx)
}

/// `pin!` over `Box::pin` because the future never leaves this function: it is
/// parked in the frame that is already here, for no allocation, and dies with
/// the scope. `Box::pin` would compile identically and cost one allocation per
/// call, which is the trade the mental-model lesson says to refuse until
/// something actually asks for it.
///
/// `as_mut` on each turn of the loop is the other half: the pin must be
/// reborrowed rather than consumed, because polling once is rarely enough.
pub fn drive<F: Future>(fut: F) -> F::Output {
    let mut fut = std::pin::pin!(fut);
    let mut cx = Context::from_waker(Waker::noop());
    loop {
        if let Poll::Ready(output) = fut.as_mut().poll(&mut cx) {
            return output;
        }
    }
}

pub struct Worker {
    job: Option<Pin<Box<dyn Future<Output = u32>>>>,
}

impl Worker {
    pub fn new() -> Self {
        Self { job: None }
    }

    pub fn is_idle(&self) -> bool {
        self.job.is_none()
    }

    /// `Box::pin(fut)` is a `Pin<Box<F>>`; the field's type is
    /// `Pin<Box<dyn Future<Output = u32>>>`, and the unsizing coercion happens
    /// at the assignment. One expression therefore does both jobs the field
    /// needs: a permanent address, and a type that can be written down.
    pub fn accept<F: Future<Output = u32> + 'static>(&mut self, fut: F) {
        self.job = Some(Box::pin(fut));
    }

    /// No pinning happens here. The value was pinned once, on the way into the
    /// box, and every later poll only reborrows: `as_mut` turns the owned
    /// `Pin<Box<_>>` into the `Pin<&mut _>` that `poll` takes.
    ///
    /// The outcome is computed first and the slot cleared after, so the borrow
    /// of `self.job` has ended before `self.job` is assigned.
    pub fn poll_job(&mut self) -> Poll<u32> {
        let mut cx = Context::from_waker(Waker::noop());
        let outcome = match self.job.as_mut() {
            Some(job) => job.as_mut().poll(&mut cx),
            None => panic!("poll_job called with no job in flight"),
        };
        if outcome.is_ready() {
            self.job = None;
        }
        outcome
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Situation {
    LentAcrossLoopIterations,
    StoredInAStructField,
    AwaitedWhereItWasMade,
    RecursiveAsyncFn,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Tool {
    PinMacro,
    BoxPin,
    Nothing,
}

pub fn playbook(situation: Situation) -> Tool {
    match situation {
        // The `cannot be unpinned` error, in its usual disguise: `&mut F` is a
        // `Future` only when `F: Unpin`. The future stays inside the function,
        // so the free tool is the right one.
        Situation::LentAcrossLoopIterations => Tool::PinMacro,
        // A field outlives every frame, and a `dyn Future` needs a place to
        // live. Both of those are what the allocation buys.
        Situation::StoredInAStructField => Tool::BoxPin,
        // Nothing to do. `.await` pins the child inside the parent's machine
        // and the runtime pins the root, so the normal path is already covered.
        // Pinning here preemptively is not hygiene, it is an allocation and a
        // layer of noise in exchange for nothing.
        Situation::AwaitedWhereItWasMade => Tool::Nothing,
        // Indirection, and the same indirection the pin needs: without the box
        // the machine would contain itself and have no finite size.
        Situation::RecursiveAsyncFn => Tool::BoxPin,
    }
}
