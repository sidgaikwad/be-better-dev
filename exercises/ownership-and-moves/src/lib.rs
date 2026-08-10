//! Ownership and moves.
//!
//! Seven exercises, one per lesson in the section. Run `cargo test -p
//! ownership-and-moves` to see what is red, then delete each `todo!()` and make
//! the suite pass.

/// Lesson: stack-and-heap
///
/// Return the number of bytes this `String` occupies on the stack, not the
/// length of its text. Answer it from the three-word picture in the lesson
/// rather than by guessing, then check yourself with the test.
pub fn string_stack_size() -> usize {
    todo!("how many bytes is a String's stack header on a 64-bit target?")
}

/// Lesson: stack-and-heap
///
/// `text` is a string literal. Return true if evaluating `let s = text;`
/// allocates on the heap, false if it does not.
pub fn literal_allocates(_text: &'static str) -> bool {
    todo!("does binding a &'static str reach the allocator?")
}

/// Lesson: cost-of-allocation
///
/// Build a `Vec<i32>` holding `0..n` while performing exactly one heap
/// allocation, no matter how large `n` is.
///
/// The test asserts on capacity, which is how you can tell a grow-and-copy
/// happened: repeated doubling lands on a power of two, a single up-front
/// allocation lands on exactly `n`.
pub fn preallocated_range(_n: usize) -> Vec<i32> {
    todo!("one allocation, not log2(n) of them")
}

/// Lesson: one-owner
///
/// Take ownership of `s`, append `"!"`, and return it.
///
/// Write this so the caller's original binding is moved in rather than copied:
/// the signature already says so, which is the point of the exercise.
pub fn shout(_s: String) -> String {
    todo!("consume, modify, hand back")
}

/// Lesson: copy-vs-move
///
/// A point on a grid. Make this type usable after assignment, so that
/// `let b = a;` leaves `a` alive, without writing an explicit `.clone()` at
/// any call site.
///
/// One derive does it. The lesson explains why this type is allowed to have it
/// and why `Subscriber` below is not.
#[derive(Debug, PartialEq)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

/// Lesson: copy-vs-move
///
/// Return the sum of every point's `x`, reading `points` without consuming it.
/// The caller still needs its vector afterward.
pub fn total_x(_points: &[Point]) -> f64 {
    todo!("borrow the slice, do not take it")
}

/// Lesson: drop-cleanup
///
/// A guard that records its own destruction, so a test can observe *when* Drop
/// runs rather than taking the lesson's word for it.
///
/// Implement `Drop` so that dropping a `Tracker` pushes its `name` onto the
/// shared log. The test asserts the order, which is the whole lesson: values
/// drop in reverse declaration order.
pub struct Tracker {
    pub name: &'static str,
    pub log: std::rc::Rc<std::cell::RefCell<Vec<&'static str>>>,
}

// TODO: impl Drop for Tracker

/// Lesson: functions-take-ownership
///
/// Return the email's domain (everything after the `@`) without allocating a
/// new `String`, and without consuming the subscriber.
///
/// If your first instinct is to return `String`, read the return type again:
/// it is asking for a view into data the caller already owns.
pub struct Subscriber {
    pub email: String,
    pub name: String,
}

impl Subscriber {
    pub fn new(email: &str, name: &str) -> Self {
        Self { email: email.to_string(), name: name.to_string() }
    }

    pub fn domain(&self) -> &str {
        todo!("slice the email, do not rebuild it")
    }

    /// Lesson: functions-take-ownership
    ///
    /// Consume the subscriber and hand back just the email. The `into_` prefix
    /// is the ecosystem's convention for exactly this receiver.
    pub fn into_email(self) -> String {
        todo!("a self receiver consumes; give the field away")
    }
}

/// Lesson: clone-judgment
///
/// `names` is borrowed, but the caller wants an owned, sorted, de-duplicated
/// list back. Clone exactly as much as that requires and no more.
///
/// The test checks the result. Reviewing your own answer afterward is the real
/// exercise: count how many allocations you performed, and whether each one
/// was forced by the signature or chosen by you.
pub fn sorted_unique(_names: &[&str]) -> Vec<String> {
    todo!("own the output, borrow the input")
}
