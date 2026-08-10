//! Iterators and closures.
//!
//! Eight exercises across the section's six lessons. Run
//! `cargo test -p iterators-closures` to see what is red, then delete each
//! `todo!()` and make the suite pass.
//!
//! Two of these are answered with a signature rather than a body: `retry`
//! ships with a trait bound too strict to compile against its own test, and
//! `Fibonacci` ships with no `Iterator` impl at all. Those two test files do
//! not compile until you fix that, so work the rest with
//! `cargo test --test <lesson>` meanwhile.

/// Lesson: iter-closures-capture
///
/// Return a greeter that renders `hello, <name>` and can be called any number
/// of times.
///
/// Written the plain way, the closure captures `name` by reference, and
/// returning it would hand the caller a reference to a local that is about to
/// die: the dangling reference lifetimes exist to prevent. One keyword forces
/// every capture in by value instead.
///
/// The return type says `Fn`, not `FnOnce`, so calling the greeter must not
/// consume it. The test calls it twice.
pub fn make_greeter(_name: String) -> impl Fn() -> String {
    || todo!("the closure has to own what it greets")
}

/// Lesson: iter-closures-capture
///
/// A closure is an anonymous struct with one field per capture, so its size is
/// something you can measure rather than believe.
///
/// Declare a `u64` and a `String`, then build two closures that read both: one
/// left to capture on its own, one forced to capture by value. Return
/// `(size_of_val(&by_ref), size_of_val(&by_val))`.
///
/// Predict both numbers before you run the test. Neither of them includes the
/// text on the heap.
pub fn capture_sizes() -> (usize, usize) {
    todo!("build both closures over the same two variables, then measure them")
}

/// Lesson: iter-fn-traits
///
/// Call `op` up to `attempts` times, stopping at the first call that returns
/// true, and report whether any attempt succeeded.
///
/// The bound below is stricter than the job needs, and the test proves it: the
/// closure it passes keeps a tally of its own attempts, so it mutates what it
/// captured, and `tests/iter_fn_traits.rs` will not compile until the bound
/// admits such a closure.
///
/// ```text
/// error[E0594]: cannot assign to `attempt`, as it is a captured variable
///               in a `Fn` closure
///   |
///   |     let succeeded = retry(5, || {
///   |                     -----    -- in this closure
///   |                     |
///   |                     expects `Fn` instead of `FnMut`
///   |         attempt += 1;
///   |         ^^^^^^^^^^^^ cannot assign
/// ```
///
/// Widen it to the least demanding of the three traits that still allows
/// repeated calls. One more thing has to change once you do, and the compiler
/// will name it: calling that kind of closure is a `&mut self` method call on
/// the hidden struct.
pub fn retry<F: Fn() -> bool>(_attempts: u32, _op: F) -> bool {
    todo!("call op until it succeeds or the attempts run out")
}

/// Lesson: iter-fn-traits
///
/// Build a test for "is this address at `domain`" and hand it back as a value
/// the caller can keep and call forever. `"ada@mail.dev"` belongs to
/// `mail.dev`; `"ada@notmail.dev"` does not.
///
/// The closure outlives the call that made it, so it cannot borrow `domain`.
/// Owning a capture and only reading it is still `Fn`: `move` decides how
/// variables get in, the trait reflects what the body does with them after.
///
/// This is the other way to return a closure. `impl Fn` names one concrete
/// anonymous type the compiler infers; `Box<dyn Fn>` erases it behind a
/// pointer, so two functions returning different closures can share one
/// signature, at the cost of an allocation and a virtual call.
pub fn domain_matcher(_domain: String) -> Box<dyn Fn(&str) -> bool> {
    Box::new(|_email| todo!("own the domain, then only read it"))
}

/// Lesson: iter-the-trait
///
/// The Fibonacci sequence as an iterator: 0, 1, 1, 2, 3, 5, and on forever.
///
/// The state is here. What is missing is the trait impl, and it has exactly one
/// required method: `next`, taking `&mut self`, returning the next item. Write
/// that one method and roughly 75 others turn up on their own, which is what
/// the test spends most of its length proving.
///
/// Nothing here should ever return `None`. An infinite iterator is legal, and
/// bounding it is the caller's job.
pub struct Fibonacci {
    pub current: u64,
    pub upcoming: u64,
}

impl Fibonacci {
    /// Starts the sequence at 0, 1.
    pub fn new() -> Self {
        Self { current: 0, upcoming: 1 }
    }
}

// TODO: impl Iterator for Fibonacci

/// A newsletter subscriber. Given, not an exercise: the pipelines below work on
/// slices and vectors of these.
#[derive(Debug, Clone, PartialEq)]
pub struct Subscriber {
    pub email: String,
    pub confirmed: bool,
}

impl Subscriber {
    pub fn new(email: &str, confirmed: bool) -> Self {
        Self { email: email.to_string(), confirmed }
    }
}

/// Lesson: iter-adapters-consumers
///
/// Return up to `limit` confirmed subscribers as `(position, domain)` pairs,
/// where the domain is whatever follows the `@`. Addresses with no `@` are
/// dropped rather than reported.
///
/// `position` is the subscriber's index in `subs`, which pins the one place the
/// order of the chain is observable: number the list before you narrow it, or
/// the positions describe the result instead of the input.
///
/// Say the whole thing as one chain. Nothing is allocated until its last call.
pub fn confirmed_domains(_subs: &[Subscriber], _limit: usize) -> Vec<(usize, &str)> {
    todo!("number first, then narrow, and stop early")
}

/// Lesson: iter-adapters-consumers
///
/// Parse every line into an email address, all or nothing. A line is valid when
/// it holds exactly one `@` with something on both sides. Return the whole list,
/// or the error from the first line that failed, formatted
/// `invalid email: <line>`.
///
/// A loop with an early return would work. Write it as a chain instead: mapping
/// a fallible parse over the lines yields an iterator of `Result`s, and
/// `collect` can turn that into a single `Result<Vec<_>, _>` directly. It
/// short-circuits, so the lines after the first failure are never parsed at all.
/// That is the part people do not expect, and the part the test checks.
pub fn parse_emails(_lines: &[&str]) -> Result<Vec<String>, String> {
    todo!("one Result per line in, one Result for the batch out")
}

/// Lesson: iter-adapters-consumers
///
/// Sum the first two even numbers in `1..=limit`, and report how many numbers
/// the filter actually tested on the way there. Return `(sum, tested)`.
///
/// The count has to come from inside the filter's own closure, which means that
/// closure mutates a counter it captured: the `FnMut` of the earlier lesson,
/// doing real work in the middle of a pipeline.
///
/// The count is the point. Laziness is not only deferred work, it is work that
/// never happens, and this is how you observe that from outside.
pub fn tested_while_summing(_limit: u32) -> (u32, u32) {
    todo!("the counter lives outside the chain; the closure reaches out and bumps it")
}

/// Lesson: iter-three-ways
///
/// Flip `confirmed` to true on every subscriber whose email appears in
/// `confirmed`, editing the caller's slice in place.
///
/// The caller keeps their data and sees the edits, so neither the shared route
/// in nor the consuming one will do.
pub fn confirm_all(_subs: &mut [Subscriber], _confirmed: &[&str]) {
    todo!("the loop needs the exclusive route in")
}

/// Lesson: iter-three-ways
///
/// Return every subscriber's email, leaving the caller's slice intact.
///
/// Same output as `into_emails` below, different bargain. Reading through a
/// shared borrow cannot move a `String` out of a subscriber you only borrowed,
/// so this one buys an allocation per element. Price it deliberately: here it is
/// the honest answer rather than a lazy one, because the caller still needs
/// their vector.
pub fn cloned_emails(_subs: &[Subscriber]) -> Vec<String> {
    todo!("borrow to read, and pay for exactly the strings you keep")
}

/// Lesson: iter-three-ways
///
/// Take the subscribers apart and return just their emails, moving each
/// `String` out rather than copying it.
///
/// COMPILE ERROR: through a shared borrow this body is rejected.
///
/// ```text
/// error[E0507]: cannot move out of `s.email` which is behind a shared reference
///   |
///   |     subs.iter().map(|s| s.email).collect()
///   |                         ^^^^^^^ move occurs because `s.email` has type
///   |                         `String`, which does not implement the `Copy` trait
/// ```
///
/// ```ignore
/// pub fn into_emails(subs: Vec<Subscriber>) -> Vec<String> {
///     subs.iter().map(|s| s.email).collect()
/// }
/// ```
///
/// The signature already took the vector by value, so nothing here needs to be
/// cloned. Pick the route in that hands the closure a `Subscriber` instead of a
/// `&Subscriber`, and each 24-byte header moves straight into the output while
/// the heap text never budges.
pub fn into_emails(_subs: Vec<Subscriber>) -> Vec<String> {
    todo!("consume the vector; its Strings have somewhere better to be")
}

/// Lesson: iter-zero-cost
///
/// Sum the slice with an index loop, the way you would write it in C.
///
/// This and `sum_iter` are the section's closing experiment. The test can only
/// prove the two agree; the rest of the claim lives in Compiler Explorer at
/// `-C opt-level=3`, where both should come out as one vectorized loop. The
/// difference is that this version emits a bounds check per element and needs
/// the optimizer to prove it away first.
pub fn sum_index(_values: &[u64]) -> u64 {
    todo!("a running total and an index")
}

/// Lesson: iter-zero-cost
///
/// The same sum, said as a pipeline.
///
/// This one has no bounds check to delete. A slice iterator walks a pointer
/// toward an end pointer, so out of bounds is not a state it can reach. That is
/// the practical reason idiomatic Rust leans on iterators: they do not beg the
/// optimizer to remove safety checks, they never generate them.
pub fn sum_iter(_values: &[u64]) -> u64 {
    todo!("one consumer, no loop")
}
