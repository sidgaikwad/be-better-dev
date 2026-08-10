//! Pinning.
//!
//! Eight exercises across the section's five lessons, every one of them from
//! the consuming side. You will build a value that points into itself and watch
//! a move ruin it, park futures with `pin!` and `Box::pin`, and poll a machine
//! by hand through a `Pin<&mut _>`. You will write no `unsafe`, no
//! `Pin::new_unchecked`, and no structural projection: that is the API-author
//! half of the subject, and it is deliberately absent.
//!
//! Only std is involved: `std::pin`, `std::marker::PhantomPinned`,
//! `std::future` and `std::task`. No runtime, no `pin-project`.
//!
//! Run `cargo test -p pinning` to see what is red, then delete each `todo!()`
//! and make the suite pass. One lesson at a time works too:
//! `cargo test -p pinning --test pin_unpin`.
//!
//! Every address in here is compared as an integer and never followed. A stale
//! pointer is a fact you can observe safely; dereferencing one is undefined
//! behaviour, and the whole point of the section is that the language stops you
//! reaching that line in the first place.

use std::future::Future;
use std::marker::PhantomPinned;
use std::pin::Pin;
use std::task::{Context, Poll};

// ---------------------------------------------------------------------------
// Lesson: pin-self-referential
// ---------------------------------------------------------------------------

/// Lesson: pin-self-referential
///
/// A value that points into itself, written by hand. This is the shape rustc
/// builds for you when a local borrowed across an `.await` becomes a field
/// beside the thing it borrows.
///
/// The field has to be a raw pointer. There is no lifetime you could name for
/// "the field next to me", so safe Rust has no way to spell this and the
/// compiler is the only one allowed to build it.
///
/// Four methods to write:
///
/// - `link` records where `value` lives right now.
/// - `value_address` reports where `value` lives right now.
/// - `recorded_address` reports the address `link` stored, as an integer.
/// - `is_intact` says whether those two still agree.
///
/// Note what `recorded_address` does not do: follow the pointer. Comparing
/// addresses tells you the truth about a stale pointer without committing the
/// undefined behaviour that reading one would be.
pub struct SelfRef {
    value: String,
    recorded: *const String,
}

impl SelfRef {
    /// A fresh value with nothing recorded yet. Like an async machine in its
    /// start state, it holds no self-reference and is safe to move anywhere.
    pub fn new(value: &str) -> Self {
        Self { value: value.to_string(), recorded: std::ptr::null() }
    }

    pub fn value(&self) -> &str {
        &self.value
    }

    /// Lesson: pin-self-referential
    ///
    /// Point `recorded` at this value's own `value` field. The cast to a raw
    /// pointer is what ends the borrow: raw pointers carry no lifetime, which
    /// is exactly why the compiler will store one and then stop checking it.
    pub fn link(&mut self) {
        todo!("record the address of the field sitting next to you")
    }

    /// Lesson: pin-self-referential
    ///
    /// Where `value` sits at this instant, as an integer.
    pub fn value_address(&self) -> usize {
        todo!("take a reference to the field, cast it to a raw pointer, cast that to usize")
    }

    /// Lesson: pin-self-referential
    ///
    /// The address `link` wrote down, as an integer. Cast it; never read
    /// through it.
    pub fn recorded_address(&self) -> usize {
        todo!("a pointer is just bytes, and these are the bytes")
    }

    /// Lesson: pin-self-referential
    ///
    /// True when the recorded address still names this value's own field.
    ///
    /// A move is a byte copy that rewrites nothing, so this is the question a
    /// resumed state machine cannot ask and the compiler has to answer for it.
    pub fn is_intact(&self) -> bool {
        todo!("compare the two addresses; equal means the pointer still aims at home")
    }
}

// ---------------------------------------------------------------------------
// Lesson: pin-contract
// ---------------------------------------------------------------------------

/// Lesson: pin-contract
///
/// A stand-in for a polled state machine: a value that must not move again.
///
/// Nothing here can actually crash, because there is no self-reference to
/// break. The `PhantomPinned` field is the declaration that moving this value
/// after pinning would be a bug, and it is the one std tool a type uses to opt
/// out of `Unpin`. Ships complete; it is the material for the exercises below.
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

/// Lesson: pin-contract
///
/// The address a pinned value sits at, as an integer.
///
/// Reading was never the dangerous direction, so `Pin<Ptr>` implements `Deref`
/// for every `Ptr` with no `Unpin` bound anywhere. Get at the value that way
/// and take its address. Do not unwrap the pin, and do not add a bound to the
/// signature: this has to work for `Anchored` too.
pub fn address_of<T>(_value: Pin<&mut T>) -> usize {
    todo!("deref through the Pin, take a reference, cast it to usize")
}

/// Lesson: pin-contract
///
/// Exchange the two values behind these exclusive borrows.
///
/// The exercise is one line, and the point is what the line proves: nothing in
/// your source says "move", you were handed nothing but two `&mut`, and yet
/// both values end up at a different address. `&mut T` **is** the permission to
/// move `T`, which is the permission `poll` must not grant.
///
/// COMPILE ERROR: the same body cannot be written against pinned borrows.
///
/// ```text
/// error[E0277]: `PhantomPinned` cannot be unpinned
///    |
///    |     std::mem::swap(a.get_mut(), b.get_mut());
///    |                      ^^^^^^^ within `Anchored`, the trait `Unpin` is not
///    |                              implemented for `PhantomPinned`
///    |
///    = note: consider using the `pin!` macro
///            consider using `Box::pin` if you need to access the pinned value
///            outside of the current scope
/// note: required by a bound in `Pin::<&'a mut T>::get_mut`
/// ```
///
/// ```ignore
/// pub fn swap_anchored(a: Pin<&mut Anchored>, b: Pin<&mut Anchored>) {
///     std::mem::swap(a.get_mut(), b.get_mut());
/// }
/// ```
///
/// Every safe exit is bolted, and the bolt is a trait bound rather than a
/// runtime check. Write the unpinned version below and read the test.
pub fn swap_anchored(_a: &mut Anchored, _b: &mut Anchored) {
    todo!("one std function, and the two &mut you already hold are all it wants")
}

// ---------------------------------------------------------------------------
// Lesson: pin-unpin
// ---------------------------------------------------------------------------

/// A witness that a type claims the auto trait. Scaffolding, not an exercise:
/// calling it is the whole assertion, because a type that is not `Unpin` makes
/// the call fail to compile.
pub fn assert_unpin<T: Unpin>() {}

/// The same witness for a value whose type has no name, such as the future an
/// `async` block compiles to.
pub fn assert_unpin_value<T: Unpin>(_value: &T) {}

/// Lesson: pin-unpin
///
/// Append `extra` to a pinned `String`.
///
/// `Pin`'s job is refusing to hand out `&mut`, and here it folds immediately:
/// `String` has no field pointing at another field, so moving one after pinning
/// breaks nothing and the contract asks nothing of it. Take the plain `&mut`
/// back and get on with your day. No `unsafe` belongs in this body.
pub fn append_through_pin(_s: Pin<&mut String>, _extra: &str) {
    todo!("Pin<&mut T> where T: Unpin is &mut T with paperwork; ask for the &mut")
}

/// Lesson: pin-unpin
///
/// Six types, and the one question the auto trait asks about each: does moving
/// a value of this type after it was pinned break anything?
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Candidate {
    /// `String`: three words here, the text somewhere else.
    OwnedString,
    /// `Vec<u8>`.
    ByteVec,
    /// `SelfRef` from this crate, which really does hold a pointer into itself.
    SelfReferential,
    /// `Anchored` from this crate, which has a `PhantomPinned` field.
    PhantomPinnedStruct,
    /// The future an `async fn` or `async` block compiles to.
    AsyncMachine,
    /// `Pin<Box<F>>`, where `F` is that future.
    PinnedBoxOfAsyncMachine,
}

/// Lesson: pin-unpin
///
/// Return true when the named type is `Unpin`.
///
/// Two of the six are not, and one of the four that are will surprise you.
/// Answer from the rule rather than from the vibe: `Unpin` is an auto trait,
/// granted to any type whose fields all have it, and `PhantomPinned` is the
/// only field in std that withholds it. Read each answer back afterwards and
/// say out loud what the trait actually claims, because it is not "cannot be
/// moved" and it is not "safe to move".
pub fn is_unpin(_candidate: Candidate) -> bool {
    todo!("ask what the fields are, not whether moving the value would be wise")
}

// ---------------------------------------------------------------------------
// Lesson: pin-in-the-wild
// ---------------------------------------------------------------------------

/// Lesson: pin-in-the-wild
///
/// A future you can drive by hand: `Pending` for its first `pending_polls`
/// polls, then `Ready` carrying the total number of polls it received, the
/// final one included.
///
/// Writing a `Future` impl is one of the two places an application developer
/// ever types a `Pin` receiver. The body is ordinary code: every field here is
/// `Unpin`, so the struct is, so `Pin::get_mut` hands back a plain `&mut Self`
/// with nothing unsafe about it.
///
/// Wake before every `Pending`. Progress is possible immediately here, so this
/// future is its own wake source, and a `Pending` that lodges no wake is a
/// silent permanent sleep under any real executor.
pub struct Countdown {
    remaining: u32,
    polls: u32,
}

impl Countdown {
    pub fn new(pending_polls: u32) -> Self {
        Self { remaining: pending_polls, polls: 0 }
    }

    /// How many polls this future has received so far.
    pub fn polls(&self) -> u32 {
        self.polls
    }
}

impl Future for Countdown {
    type Output = u32;

    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<u32> {
        todo!("unwrap the pin into a plain &mut Self, count the poll, spend one Pending")
    }
}

/// Lesson: pin-in-the-wild
///
/// Poll a future once through a borrow, with a waker that does nothing.
///
/// The `Unpin` bound is the load-bearing part. It is what lets `Pin::new`
/// manufacture the promise out of a bare `&mut` for free: no allocation, no
/// `unsafe`, no ceremony, because moving this value after pinning was never
/// going to break anything.
pub fn poll_borrowed<F: Future + Unpin>(_fut: &mut F) -> Poll<F::Output> {
    todo!("wrap the borrow in the promise, build a Context from Waker::noop(), poll once")
}

/// Lesson: pin-in-the-wild
///
/// Drive `fut` to completion on this thread and return its output. A test
/// driver, not an executor: it spins rather than parking, which is fine when
/// every future in the suite can make progress on demand.
///
/// Read the bound and note what is missing. There is no `F: Unpin` here,
/// because the futures this has to accept include async blocks, and the
/// compiler marks every one of those `!Unpin` wholesale. So the cheap move
/// is rejected:
///
/// ```text
/// error[E0277]: `F` cannot be unpinned
///    |
///    |     Pin::new(&mut fut).poll(&mut cx)
///    |     -------- ^^^^^^^^ the trait `Unpin` is not implemented for `F`
///    |
///    = note: consider using the `pin!` macro
///            consider using `Box::pin` if you need to access the pinned value
///            outside of the current scope
/// help: consider further restricting type parameter `F` with trait `Unpin`
///    |
///    | pub fn drive<F: Future + std::marker::Unpin>(fut: F) -> F::Output {
///    |                        ++++++++++++++++++++
/// ```
///
/// Do not take the `help`. Adding the bound narrows the function to the futures
/// that never needed it, which is the opposite of the job. Take one of the two
/// `note`s instead: park the machine at an address it will never leave, then
/// poll it there. The future never escapes this function, so one of the two
/// tools is free and the other costs an allocation.
pub fn drive<F: Future>(_fut: F) -> F::Output {
    todo!("give it a permanent address first, then loop until it answers Ready")
}

/// Lesson: pin-in-the-wild
///
/// A worker holding one in-flight job between polls.
///
/// The field type is the playbook's second line. A future that has to live in a
/// struct needs two things at once: a home that will not move under it, and a
/// type you can write down, since the machine an `async` block compiles to has
/// no nameable type. `Pin<Box<dyn Future<Output = T>>>` buys both for one
/// allocation. Real code adds `+ Send` so the task can cross threads; there are
/// no threads here.
pub struct Worker {
    job: Option<Pin<Box<dyn Future<Output = u32>>>>,
}

impl Worker {
    pub fn new() -> Self {
        Self { job: None }
    }

    /// True when no job is in flight.
    pub fn is_idle(&self) -> bool {
        self.job.is_none()
    }

    /// Lesson: pin-in-the-wild
    ///
    /// Take on a job. Any future with the right output is welcome, which is
    /// what the trait object buys; the heap is what makes it storable.
    pub fn accept<F: Future<Output = u32> + 'static>(&mut self, _fut: F) {
        todo!("one call gives it a permanent home and a nameable type at the same time")
    }

    /// Lesson: pin-in-the-wild
    ///
    /// Poll the current job once, panicking if there is none.
    ///
    /// `Ready` also clears the slot: a future that has answered is spent, and
    /// polling it again is a contract violation.
    ///
    /// The field is already a `Pin<Box<_>>`, so no new pinning happens here.
    /// Turning it into the `Pin<&mut _>` that `poll` wants is one method call,
    /// and it is the same one you would use on any pinned handle.
    pub fn poll_job(&mut self) -> Poll<u32> {
        todo!("borrow the pinned box as a pinned reference, poll it, and clear the slot on Ready")
    }
}

// ---------------------------------------------------------------------------
// Lesson: pin-mental-model
// ---------------------------------------------------------------------------

/// Lesson: pin-mental-model
///
/// Four moments in a real service where the question "do I need to pin this?"
/// comes up.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Situation {
    /// A `select!` loop polls `&mut shutdown` on every iteration, so the future
    /// has to survive between them. It all happens inside one function.
    LentAcrossLoopIterations,
    /// A struct field has to hold an in-flight future whose type has no name.
    StoredInAStructField,
    /// A future built two lines above and awaited on the spot.
    AwaitedWhereItWasMade,
    /// An `async fn` that calls itself, so its machine would contain itself and
    /// the size equation would have no finite answer.
    RecursiveAsyncFn,
}

/// Lesson: pin-mental-model
///
/// What a consumer reaches for.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Tool {
    /// `std::pin::pin!`: a stable address in the current frame, no allocation,
    /// gone when the scope ends.
    PinMacro,
    /// `Box::pin`: one allocation, and the pinned value may outlive the scope
    /// that made it, sit in a field, or become a trait object.
    BoxPin,
    /// Nothing at all.
    Nothing,
}

/// Lesson: pin-mental-model
///
/// Answer each situation with the tool it calls for.
///
/// This is the entire consuming playbook, three lines long, and one of the four
/// answers is the one people get wrong in the other direction: pinning a future
/// preemptively is not hygiene, it buys nothing on the normal path and costs an
/// allocation and a layer of noise.
pub fn playbook(_situation: Situation) -> Tool {
    todo!("two of these want the same tool; one of them wants no tool at all")
}
