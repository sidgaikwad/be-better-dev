//! Structs, enums, pattern matching.
//!
//! Eight exercises across the section's six lessons, all in one newsletter:
//! subscribers get built, confirmed, and taken apart, and deliveries get
//! reported on. Run `cargo test -p structs-enums-matching` to see what is red,
//! then delete each `todo!()` and make the suite pass.
//!
//! Two exercises are missing types rather than missing bodies, so their test
//! files do not compile until you write them. Start with `Subscriber` and
//! `Delivery`; everything else runs meanwhile with `cargo test --test
//! option_basics` and friends.

// ---------------------------------------------------------------------------
// Lesson: structs-and-impl
// ---------------------------------------------------------------------------

/// Lesson: structs-and-impl
///
/// One person on the list. The fields are already right; the derives are not.
///
/// The suite asks this type to print itself in a failure message, to be
/// duplicated explicitly, and to be compared field by field. Add exactly the
/// derives that buy those three things, and no more: one of the four you met in
/// the ownership section is structurally impossible here, and the compiler will
/// say so if you try it.
pub struct Subscriber {
    pub email: String,
    pub name: String,
    pub confirmed: bool,
}

impl Subscriber {
    /// An associated function with no receiver: Rust's constructor convention.
    /// `new` is a name, not a keyword. This one is written for you.
    pub fn new(email: &str, name: &str) -> Self {
        Self { email: email.to_string(), name: name.to_string(), confirmed: false }
    }

    /// Lesson: structs-and-impl
    ///
    /// The `&self` receiver: read, and leave the caller holding everything it
    /// had. Return the part of the email after the `@`, or `None` when there is
    /// no `@` at all.
    ///
    /// Returning `Option<&str>` rather than `&str` is the design decision here.
    /// "This address has no domain" is a real answer, not an empty string.
    pub fn domain(&self) -> Option<&str> {
        todo!("borrow the email and hand back a slice of it, or None")
    }

    /// Lesson: structs-and-impl
    ///
    /// The `&mut self` receiver: change the value in place and return nothing.
    /// The caller keeps the subscriber and sees the change.
    pub fn confirm(&mut self) {
        todo!("mutate through the exclusive borrow the receiver already gives you")
    }

    /// Lesson: structs-and-impl
    ///
    /// The `self` receiver: consume the subscriber and hand back its two owned
    /// fields as `(email, name)`. The value is gone after this call, which the
    /// test proves by keeping the line that would use it, commented out.
    ///
    /// Nothing here should allocate. The Strings already exist; move them.
    pub fn into_parts(self) -> (String, String) {
        todo!("a self receiver consumes; give the fields away")
    }
}

// ---------------------------------------------------------------------------
// Lesson: enums-sum-types
// ---------------------------------------------------------------------------

/// Lesson: enums-sum-types
///
/// What happened to one send. A delivery is queued, or it went out with a
/// message id, or it bounced with a reason: exactly one of those, always.
///
/// Finish the type. It needs two more variants, each carrying the data that
/// only makes sense for it:
///
/// - the message id of a send that went out, as a `String`
/// - the reason a send bounced, as a `String`
///
/// Use named fields (`Variant { field: Type }`) rather than positional ones;
/// the tests construct these by name. The point of the exercise is what becomes
/// unwritable once you do: there is no `Delivery` carrying both a message id
/// and a bounce reason, and none claiming to be sent while carrying neither.
///
/// `Delivery` is also the subject of the match-exhaustive lesson, so its test
/// file stays red until this type exists.
#[derive(Debug, Clone, PartialEq)]
pub enum Delivery {
    Queued,
    // TODO: the two remaining outcomes
}

impl Delivery {
    /// Lesson: enums-sum-types
    ///
    /// Return the message id if this delivery has one.
    ///
    /// Only one variant can answer, and the field is reachable only from inside
    /// that variant's arm. That is the guarantee the type bought: no other arm
    /// can even name `message_id`.
    pub fn message_id(&self) -> Option<&str> {
        todo!("one arm has an id to give; the rest have nothing")
    }
}

/// Lesson: enums-sum-types
///
/// Return `(size_of::<Option<u8>>(), size_of::<Option<&u8>>())` in bytes.
///
/// Predict both numbers before you measure. A `u8` uses all 256 of its bit
/// patterns for real values; a reference never uses one of its patterns at all.
/// Only one of these two Options has to pay for a separate tag.
pub fn option_sizes() -> (usize, usize) {
    todo!("one of these is bigger than the type it wraps, and one is not")
}

// ---------------------------------------------------------------------------
// Lesson: option-basics
// ---------------------------------------------------------------------------

/// Lesson: option-basics
///
/// Find the subscriber with this email and return the domain of that email.
///
/// Two steps, each of which can come up empty: the lookup may find nobody, and
/// the address it finds may have no domain. Write this as a pipeline of Option
/// combinators, with no `match` and no `if let`. The combinator that chains a
/// step which itself returns an Option is the one that flattens the two Nones
/// into one.
///
/// The explicit lifetime is doing real work: it says the returned slice borrows
/// from `subs`, not from `email`.
pub fn domain_for<'a>(_subs: &'a [Subscriber], _email: &str) -> Option<&'a str> {
    todo!("chain the second fallible step onto the first, no match")
}

/// Lesson: option-basics
///
/// Greet whoever this email belongs to: `"Welcome back, Ada"` for a known
/// subscriber, `"Welcome, guest"` for an unknown one.
///
/// The other half of the Option shape: transform while inside, then exit once,
/// at the boundary where a concrete `String` is required, with an explicit
/// story for `None`. Build the greeting only on the path that needs it.
pub fn greeting_for(_subs: &[Subscriber], _email: &str) -> String {
    todo!("transform inside the Option, then leave it with a fallback")
}

// ---------------------------------------------------------------------------
// Lesson: result-basics
// ---------------------------------------------------------------------------

/// Lesson: result-basics
///
/// Everything that can go wrong when confirming a subscription.
///
/// The variants are written. What is missing is the conversion `?` performs on
/// its way out: `confirm_by_token` calls `str::parse`, which fails with
/// `std::num::ParseIntError`, and that is not a `ConfirmError`. Implement the
/// standard conversion trait from `ParseIntError` into this type and `?` will
/// apply it for you at the call site.
///
/// Keep the original error inside `Malformed` rather than discarding it. The
/// caller who wants to print a reason will thank you.
#[derive(Debug, PartialEq)]
pub enum ConfirmError {
    /// The token was not a number.
    Malformed(std::num::ParseIntError),
    /// A number, but no subscriber sits at that position.
    UnknownSubscriber(usize),
}

// TODO: impl From<std::num::ParseIntError> for ConfirmError

/// Lesson: result-basics
///
/// A confirmation link carries a token: the subscriber's position in the list,
/// written as text and possibly padded with whitespace. Confirm that subscriber
/// and return their email.
///
/// Two failures, two `?`s, one flat happy path:
///
/// - the token does not parse, which the `From` impl above turns into
///   `ConfirmError::Malformed`
/// - it parses but points past the end of the list, which is
///   `ConfirmError::UnknownSubscriber` carrying the index that missed
///
/// The second failure starts life as an Option. The Option lesson named the
/// combinator that upgrades one into a Result by supplying the error absence
/// implies, and its output is something `?` accepts.
pub fn confirm_by_token(_subs: &mut [Subscriber], _token: &str) -> Result<String, ConfirmError> {
    todo!("parse with ?, look up with ?, confirm, return the email")
}

// ---------------------------------------------------------------------------
// Lesson: match-exhaustive
// ---------------------------------------------------------------------------

/// Lesson: match-exhaustive
///
/// Describe a delivery in one line, destructuring the payload in the same
/// stroke that identifies the variant:
///
/// - `Queued` becomes `"waiting in the queue"`
/// - `Sent` becomes `"delivered as <message id>"`
/// - `Bounced` becomes `"bounced: <reason>"`
///
/// List every variant. Do not add a `_` arm: each variant here has its own
/// answer, so a wildcard cannot produce the right string anyway, and the suite
/// is built to catch one that tries.
///
/// The reason to care is what happens when a `Delivered` variant lands next
/// quarter. Every listed match fails to compile with the file and line, which
/// is a complete worklist of the places that must decide what the new state
/// means. A `_` arm silently absorbs it instead:
///
/// ```text
/// error[E0004]: non-exhaustive patterns: `&Delivery::Bounced { .. }` not covered
///   --> src/lib.rs:8:11
///    |
///  8 |     match delivery {
///    |           ^^^^^^^^ pattern `&Delivery::Bounced { .. }` not covered
///    |
/// note: `Delivery` defined here
///    |
///  4 |     Bounced { reason: String },
///    |     ------- not covered
///    = note: the matched value is of type `&Delivery`
/// ```
pub fn delivery_report(_delivery: &Delivery) -> String {
    todo!("one arm per variant, each destructuring what it needs")
}

/// Lesson: match-exhaustive
///
/// How a mail server's status code should be read.
///
/// This type is complete. The exercise is `classify` below.
#[derive(Debug, PartialEq)]
pub enum Bounce {
    /// 2xx: accepted, not a bounce at all.
    Accepted,
    /// 4xx: temporary, worth another attempt.
    Soft(u16),
    /// 5xx, or a temporary failure with no attempts left: stop trying.
    Hard(u16),
    /// Anything else.
    Unknown(u16),
}

/// Lesson: match-exhaustive
///
/// Classify `code` given how many retries the send has left:
///
/// - 200 through 299 is `Accepted`
/// - 400 through 499 is `Soft`, carrying the code, while `retries_left > 0`
/// - 400 through 499 with no retries left is `Hard`: temporary in theory, final
///   in practice
/// - 500 through 599 is `Hard` however many retries remain
/// - anything else is `Unknown`
///
/// Two features carry this. A guard (`if retries_left > 0`) refines a pattern
/// with a runtime condition, and a binding names what the pattern matched so
/// the arm can put it in the variant. Arm order decides which of the two 4xx
/// arms wins, so write them in the order that makes the second one reachable;
/// swap them and the compiler warns you about the one that can never run.
pub fn classify(_code: u16, _retries_left: u32) -> Bounce {
    todo!("range patterns, one guard, and a binding to carry the code along")
}

// ---------------------------------------------------------------------------
// Lesson: patterns-everywhere
// ---------------------------------------------------------------------------

/// Lesson: patterns-everywhere
///
/// Parse one CSV-ish import line, `"email, name"`, into an unconfirmed
/// subscriber. Trim the whitespace around both fields. Reject the line (return
/// `None`) when it has no comma, when the email has no `@`, or when the email's
/// local part, the domain, or the name is empty.
///
/// Write the two structural rejections as guard clauses at the top, so the
/// happy path stays flat and unindented. `let` alone cannot host a pattern that
/// might not fit:
///
/// ```text
/// error[E0005]: refutable pattern in local binding
///  --> src/lib.rs:2:9
///   |
/// 2 |     let Some((email, name)) = line.split_once(',');
///   |         ^^^^^^^^^^^^^^^^^^^ pattern `None` not covered
///   |
///   = note: `let` bindings require an "irrefutable pattern", like a `struct`
///           or an `enum` with only one variant
/// help: you might want to use `let...else` to handle the variant that isn't matched
/// ```
///
/// The compiler is naming the fix. The form it suggests binds in the *outer*
/// scope for the rest of the function, which is what `if let` cannot do.
pub fn parse_row(_line: &str) -> Option<Subscriber> {
    todo!("two guard clauses that diverge, then a flat happy path")
}

/// Lesson: patterns-everywhere
///
/// Drain the import queue from the back, one line at a time, and return the
/// emails of the rows that parsed. Rows that do not parse are skipped. The
/// queue must be empty when you return.
///
/// Both loop-shaped patterns appear here: one drives the loop until the queue
/// hands back `None`, the other does something extra in the single case that
/// interests you. Neither needs a `match`, and neither needs an index.
pub fn drain_rows(_queue: &mut Vec<String>) -> Vec<String> {
    todo!("pop until None; keep the rows that parsed")
}
