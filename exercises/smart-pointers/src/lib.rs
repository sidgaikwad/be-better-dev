//! Smart pointers and interior mutability.
//!
//! Eight exercises across the section's six lessons. Run `cargo test -p
//! smart-pointers` to see what is red, then delete each `todo!()` and make the
//! suite pass.
//!
//! Three of these are type-level: their test file does not compile until a type
//! in here is right. That is deliberate, and it is why the tests are split one
//! file per lesson. A sibling that does not compile never blocks you, so
//! `cargo test --test ptr_arc` keeps working while `ptr_box` is still red.

use std::cell::RefCell;
use std::rc::Rc;
use std::sync::Arc;

/// Lesson: ptr-box
///
/// An expression tree: numbers, negation, addition. Written the obvious way it
/// does not compile.
///
/// ```text
/// error[E0072]: recursive type `Expr` has infinite size
///   |
///   |     Neg(Expr),
///   |         ---- recursive without indirection
///   |
/// help: insert some indirection (e.g., a `Box`, `Rc`, or `&`) to break the cycle
/// ```
///
/// ```ignore
/// pub enum Expr {
///     Number(f64),
///     Neg(Expr),
///     Add(Expr, Expr),
/// }
/// ```
///
/// Add the two missing variants with the indirection that gives the size
/// equation a finite answer. Every operand has exactly one owner and no reason
/// to be shared, so reach for the pointer that promises the least.
pub enum Expr {
    Number(f64),
    // TODO: Neg, holding one operand. Add, holding two.
}

impl Expr {
    /// Lesson: ptr-box
    ///
    /// Evaluate the tree.
    ///
    /// The recursion writes itself once the type is right: one match arm per
    /// variant, and the recursive arms call `eval` straight through the handle,
    /// because auto-deref does the unwrapping for you.
    pub fn eval(&self) -> f64 {
        todo!("one arm per variant; the recursive arms evaluate their operands")
    }
}

/// Lesson: ptr-box
///
/// The service picks an email backend at startup: the real client in
/// production, a fake everywhere else. Both implement this one trait.
pub trait EmailClient {
    fn send(&self, to: &str) -> String;
}

pub struct Postmark;

impl EmailClient for Postmark {
    fn send(&self, to: &str) -> String {
        format!("postmark -> {to}")
    }
}

pub struct FakeMailer;

impl EmailClient for FakeMailer {
    fn send(&self, to: &str) -> String {
        format!("fake -> {to}")
    }
}

/// Lesson: ptr-box
///
/// Return a `Postmark` when `env` is `"production"` and a `FakeMailer`
/// otherwise.
///
/// COMPILE ERROR: the unwrapped version cannot be written. `impl Trait` in
/// return position names one concrete type, and this function has two.
///
/// ```text
/// error[E0308]: `if` and `else` have incompatible types
///   |
///   |     if env == "production" { Postmark } else { FakeMailer }
///   |                              --------          ^^^^^^^^^^ expected `Postmark`,
///   |                              |                            found `FakeMailer`
///   |                              expected because of this
/// ```
///
/// ```ignore
/// pub fn backend(env: &str) -> impl EmailClient {
///     if env == "production" { Postmark } else { FakeMailer }
/// }
/// ```
///
/// Two types of two different sizes cannot both sit inline in one return slot.
/// The signature below already says where they go instead; write the body.
pub fn backend(_env: &str) -> Box<dyn EmailClient> {
    todo!("put the chosen backend somewhere both types fit")
}

/// Lesson: ptr-deref-drop
///
/// A smart pointer of your own. The lesson defines one as exactly two traits,
/// so implement both, plus the mutable twin of the first:
///
/// - `Deref<Target = T>`, so the wrapper stands in for the value it holds:
///   `tracked.len()` finds a `String`'s method, and `&Tracked<String>` coerces
///   where a `&str` is wanted.
/// - `DerefMut`, so the value can be modified in place through the wrapper.
///   Whether a pointer offers this is a design statement: `Box` does, `Rc` and
///   `Arc` deliberately do not.
/// - `Drop`, pushing `label` onto `log`, so a test can observe *when* the
///   release happens rather than taking the lesson's word for it.
///
/// The test then runs the lesson's closing trap: a real binding against
/// `let _ = ...`.
pub struct Tracked<T> {
    value: T,
    label: &'static str,
    log: Rc<RefCell<Vec<&'static str>>>,
}

impl<T> Tracked<T> {
    pub fn new(label: &'static str, value: T, log: Rc<RefCell<Vec<&'static str>>>) -> Self {
        Self { value, label, log }
    }
}

// TODO: impl Deref, DerefMut, and Drop for Tracked<T>

/// Lesson: ptr-rc-weak
///
/// One parsed template, referenced by every queued delivery job.
pub struct Template {
    pub html: String,
}

/// Lesson: ptr-rc-weak
///
/// Hand `count` delivery jobs an owner each of the same template. Jobs finish
/// in any order, so no one of them is special enough to own it outright and the
/// html must survive until the last one is done.
///
/// The test asserts on `Rc::strong_count` before and after, and on
/// `Rc::ptr_eq`. That second assertion is what tells a count bump from a fresh
/// allocation: rebuilding the template per job would satisfy the first check
/// and fail this one.
pub fn queue_jobs(_tpl: &Rc<Template>, _count: usize) -> Vec<Rc<Template>> {
    todo!("one owner per job, one allocation in total")
}

/// Lesson: ptr-rc-weak
///
/// A tree: parents own their children, children point back at their parent.
///
/// As declared, this leaks. Wire both directions with the owning handle and
/// parent and child hold each other's count at 1 forever: safe Rust,
/// unreachable memory, never freed. Nothing here fails to compile, which is the
/// lesson's point. The compiler guarantees no dangling pointers and no double
/// frees; it does not guarantee no leaks.
///
/// Change `parent` to the non-owning handle, fix `new` to match, then wire both
/// directions in `adopt`. The tests assert the counts, and assert that a child
/// whose parent has died says so instead of keeping it alive.
pub struct Node {
    pub name: &'static str,
    pub children: RefCell<Vec<Rc<Node>>>,
    pub parent: RefCell<Option<Rc<Node>>>,
}

impl Node {
    pub fn new(name: &'static str) -> Rc<Node> {
        Rc::new(Node { name, children: RefCell::new(Vec::new()), parent: RefCell::new(None) })
    }

    /// Make `child` one of `parent`'s children, and point the child back at it.
    pub fn adopt(_parent: &Rc<Node>, _child: &Rc<Node>) {
        todo!("one direction owns; the other must not, or the cycle closes")
    }

    /// The node's parent, if it is still alive.
    pub fn parent(&self) -> Option<Rc<Node>> {
        todo!("ask the back-pointer whether the value is still there")
    }
}

/// Lesson: ptr-arc
///
/// What `parallel_sum` reports back: the total, and the id of the thread that
/// summed each chunk. The ids are how the test proves the work really crossed a
/// thread boundary, which is the thing `Rc` is not allowed to do.
#[derive(Debug)]
pub struct SumReport {
    pub total: u64,
    pub threads: Vec<std::thread::ThreadId>,
}

/// Lesson: ptr-arc
///
/// Sum `numbers` across `workers` threads, every thread reading the same
/// allocation rather than a copy of it. Return one report entry per worker.
///
/// COMPILE ERROR: the same function written with `Rc` is rejected before it can
/// ever run.
///
/// ```text
/// error[E0277]: `Rc<Vec<u64>>` cannot be sent between threads safely
///   = note: the trait `Send` is not implemented for `Rc<Vec<u64>>`
/// ```
///
/// The test checks `Arc::strong_count` after the call, so answer the lesson's
/// closing question before you write this: it is the same program.
pub fn parallel_sum(_numbers: &Arc<Vec<u64>>, _workers: usize) -> SumReport {
    todo!("a handle per worker, moved in; then join them all back")
}

/// Lesson: ptr-cell-refcell
///
/// A mailer that counts what it sends and keeps a log of where. `send` takes
/// `&self` because the mailer is shared: handlers hold references to it, or it
/// sits behind an `Rc`, which only ever hands out `&T`. With plain fields, that
/// is rejected.
///
/// ```text
/// error[E0594]: cannot assign to `self.sent`, which is behind a `&` reference
/// ```
///
/// Give each field the interior-mutability wrapper that fits what it holds, and
/// fix `new` to match. The two are not the same wrapper: the counter is a small
/// `Copy` value that can be swapped whole, so nothing needs checking at all,
/// while the log has to hand out a real reference into a growing `Vec`, so its
/// rule moves to runtime. The tests name the API of each, and one of them pins
/// down the panic the second choice buys you.
pub struct Mailer {
    pub sent: u64,
    pub log: Vec<String>,
}

impl Mailer {
    pub fn new() -> Self {
        Self { sent: 0, log: Vec::new() }
    }

    /// Record one delivery: bump the counter, push `to` onto the log.
    pub fn send(&self, _to: &str) {
        todo!("mutate through &self, legally")
    }
}

/// Lesson: ptr-choosing
///
/// Questions 0 and 1 of the lesson's three: does this code need ownership at
/// all, and if so, how many owners?
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Owners {
    /// None. This code only reads a value someone else keeps.
    Borrowed,
    /// None. This code mutates a value someone else keeps.
    BorrowedMut,
    /// One, and the value can live inline.
    One,
    /// One, but the value must live on the heap: recursive, huge, or `dyn`.
    OneOnHeap,
    /// Several, with lifetimes only runtime knows.
    Many,
}

/// Lesson: ptr-choosing
///
/// Question 2: which threads see it?
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Threads {
    One,
    Many,
}

/// Lesson: ptr-choosing
///
/// Question 3: who mutates, and through what?
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Mutation {
    /// Only the single owner, or whoever holds a `&mut`.
    OwnerOnly,
    /// Through a shared handle, and the value is `Copy`.
    ThroughSharesCopy,
    /// Through a shared handle, and the value is not `Copy`.
    ThroughShares,
}

/// Lesson: ptr-choosing
///
/// Answer the three questions and spell the type they produce: `"T"`, `"&T"`,
/// `"Box<T>"`, `"Rc<RefCell<T>>"`, and so on, exactly as the lesson's table
/// spells them.
///
/// Keep the lesson's structure and the function stays short. The mutation
/// answer picks the interior layer, the owner and thread answers pick the layer
/// that wraps it, and nesting is how the two compose. The test reads like the
/// table, including the row the lesson's closing question lands on.
pub fn choose(_owners: Owners, _threads: Threads, _mutation: Mutation) -> String {
    todo!("build the interior layer first, then wrap it")
}
