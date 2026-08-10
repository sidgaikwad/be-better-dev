//! Reference solutions. Read these after you have something passing.
//!
//! Where a solution had a choice to make, the comment says which way it went
//! and why, since that judgment is the part worth copying.

use std::cell::{Cell, RefCell};
use std::ops::{Deref, DerefMut};
use std::rc::{Rc, Weak};
use std::sync::Arc;
use std::thread;

/// `Box` is the cheapest pointer that owns: one word, one allocation, no count
/// and no runtime check. Each operand has exactly one owner, so nothing here
/// earns an `Rc`. The indirection is what gives the size equation a finite
/// answer: `Expr` is now a tag plus at most two words, whatever the tree's
/// depth, because the depth lives on the heap.
pub enum Expr {
    Number(f64),
    Neg(Box<Expr>),
    Add(Box<Expr>, Box<Expr>),
}

impl Expr {
    pub fn eval(&self) -> f64 {
        match self {
            Expr::Number(value) => *value,
            // `operand` is a &Box<Expr>, and auto-deref finds `eval` through it
            // without a single explicit `*`.
            Expr::Neg(operand) => -operand.eval(),
            Expr::Add(left, right) => left.eval() + right.eval(),
        }
    }
}

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

/// The two backends are different sizes, so the return slot holds a pointer to
/// one on the heap instead of the value itself. `Box<dyn Trait>` is the owning
/// form of `&dyn Trait`, and it is two words wide rather than one: the data
/// pointer plus a pointer to the trait's method table.
pub fn backend(env: &str) -> Box<dyn EmailClient> {
    if env == "production" { Box::new(Postmark) } else { Box::new(FakeMailer) }
}

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

/// This one impl buys both halves of the illusion: auto-deref on method calls,
/// and deref coercion at call sites, which is transitive and so gets from
/// `&Tracked<String>` to `&str` in two hops. Both are resolved entirely at
/// compile time. The design warning from the lesson applies to whether you
/// write this at all: implement `Deref` only for types that genuinely are
/// pointers to their target, never to inherit a field's methods.
impl<T> Deref for Tracked<T> {
    type Target = T;

    fn deref(&self) -> &T {
        &self.value
    }
}

/// Offering `DerefMut` is a statement about the type, not a formality. This
/// wrapper has exactly one owner, so handing out `&mut T` cannot alias.
/// `Rc` and `Arc` withhold it for precisely the opposite reason.
impl<T> DerefMut for Tracked<T> {
    fn deref_mut(&mut self) -> &mut T {
        &mut self.value
    }
}

/// The release valve. It runs at the end of the scope where the value came to
/// rest, on every path out, which is the whole reason guards work.
impl<T> Drop for Tracked<T> {
    fn drop(&mut self) {
        self.log.borrow_mut().push(self.label);
    }
}

pub struct Template {
    pub html: String,
}

/// `Rc::clone(tpl)` over `tpl.clone()` is convention, not pedantry: it says
/// "count bump, not deep copy" at the call site, which is exactly where a
/// reader deciding whether this loop is expensive is looking. Fifty jobs, one
/// allocation, fifty plain (non-atomic) increments.
pub fn queue_jobs(tpl: &Rc<Template>, count: usize) -> Vec<Rc<Template>> {
    (0..count).map(|_| Rc::clone(tpl)).collect()
}

pub struct Node {
    pub name: &'static str,
    pub children: RefCell<Vec<Rc<Node>>>,
    /// The one field that decides whether this type leaks. `Weak` is a claim on
    /// the allocation header rather than on the value, so it does not hold the
    /// parent's strong count above zero.
    pub parent: RefCell<Weak<Node>>,
}

impl Node {
    pub fn new(name: &'static str) -> Rc<Node> {
        let children = RefCell::new(Vec::new());
        Rc::new(Node { name, children, parent: RefCell::new(Weak::new()) })
    }

    /// The convention for tree shapes: ownership points down, the way back up
    /// is non-owning, and so the cycle never closes and both counts can still
    /// reach zero. Making the child own its parent as well compiles fine and
    /// leaks both nodes forever.
    pub fn adopt(parent: &Rc<Node>, child: &Rc<Node>) {
        parent.children.borrow_mut().push(Rc::clone(child));
        *child.parent.borrow_mut() = Rc::downgrade(parent);
    }

    /// `upgrade` is the check a raw back-pointer could not perform. The weak
    /// count keeps the allocation header alive after the value itself is
    /// dropped, which is exactly what lets this answer `None` instead of
    /// dangling.
    pub fn parent(&self) -> Option<Rc<Node>> {
        self.parent.borrow().upgrade()
    }
}

#[derive(Debug)]
pub struct SumReport {
    pub total: u64,
    pub threads: Vec<std::thread::ThreadId>,
}

/// One atomic increment per worker, and the vector is never copied. The clone
/// is not ceremony: `thread::spawn` demands a `'static` closure, so each thread
/// must be an owner in its own right rather than a borrower of `main`'s handle.
/// This is also the shape to keep off a hot path. Four clones per call is
/// invisible; a clone per message across many cores puts every core on the same
/// cache line.
pub fn parallel_sum(numbers: &Arc<Vec<u64>>, workers: usize) -> SumReport {
    let workers = workers.max(1);
    let chunk = numbers.len().div_ceil(workers);
    let mut handles = Vec::with_capacity(workers);

    for worker in 0..workers {
        let data = Arc::clone(numbers);
        handles.push(thread::spawn(move || {
            let start = (worker * chunk).min(data.len());
            let end = (start + chunk).min(data.len());
            (data[start..end].iter().sum::<u64>(), thread::current().id())
        }));
    }

    let mut report = SumReport { total: 0, threads: Vec::with_capacity(workers) };
    // `join` is what makes the count assertion deterministic: by the time this
    // loop ends, every worker's handle has already been dropped.
    for handle in handles {
        let (partial, id) = handle.join().expect("a worker panicked");
        report.total += partial;
        report.threads.push(id);
    }
    report
}

pub struct Mailer {
    pub sent: Cell<u64>,
    pub log: RefCell<Vec<String>>,
}

impl Mailer {
    pub fn new() -> Self {
        Self { sent: Cell::new(0), log: RefCell::new(Vec::new()) }
    }

    /// Two different wrappers, because the two values are different. `Cell`
    /// never hands out a reference to its interior, so no reference can be
    /// invalidated by a write and there is nothing to check: `get` copies out,
    /// `set` replaces whole, zero runtime cost. The log has to give out a real
    /// `&mut Vec<String>`, so `RefCell` keeps a flag beside it and checks that
    /// flag, which is the panic the tests pin down. Both borrows here are
    /// temporaries that drop at the end of their own statement, which is why
    /// calling `send` twice in a row is fine.
    pub fn send(&self, to: &str) {
        self.sent.set(self.sent.get() + 1);
        self.log.borrow_mut().push(to.to_string());
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Owners {
    Borrowed,
    BorrowedMut,
    One,
    OneOnHeap,
    Many,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Threads {
    One,
    Many,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Mutation {
    OwnerOnly,
    ThroughSharesCopy,
    ThroughShares,
}

/// The whole point of the lesson is that this is mechanical, and the code shows
/// it: two small matches, no judgment left over. Read the result inside out.
///
/// One honest simplification. The thread question decides the interior layer
/// too, because neither `Cell` nor `RefCell` is thread-safe, so a `Copy` value
/// mutated across threads lands on `Mutex<T>` here. In real code that case is
/// usually an atomic instead, which is Part 2's subject.
pub fn choose(owners: Owners, threads: Threads, mutation: Mutation) -> String {
    let inner = match (mutation, threads) {
        (Mutation::OwnerOnly, _) => String::from("T"),
        (Mutation::ThroughSharesCopy, Threads::One) => String::from("Cell<T>"),
        (Mutation::ThroughShares, Threads::One) => String::from("RefCell<T>"),
        (_, Threads::Many) => String::from("Mutex<T>"),
    };

    match owners {
        // Question 0 short-circuits everything under it, and it is the answer
        // for most function parameters in most Rust programs.
        Owners::Borrowed => String::from("&T"),
        Owners::BorrowedMut => String::from("&mut T"),
        Owners::One => inner,
        Owners::OneOnHeap => format!("Box<{inner}>"),
        Owners::Many => match threads {
            Threads::One => format!("Rc<{inner}>"),
            Threads::Many => format!("Arc<{inner}>"),
        },
    }
}
