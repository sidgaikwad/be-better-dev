//! Testing.
//!
//! Nine exercises across the section's six lessons. Run `cargo test -p
//! testing-exercises` to see what is red, then delete each `todo!()` and make
//! the suite pass.
//!
//! This crate is meta: you are writing code *about* testing, so read the test
//! files in `tests/` as part of each exercise rather than only as a grader.
//!
//! It has no dependencies, deliberately. The book reaches for `quickcheck`,
//! `fake`, `wiremock` and `tokio` in this section, and those crates are worth
//! knowing. But the ideas underneath them are small enough to build by hand,
//! and building them once is what makes the crates legible later. So the
//! property exercise ships its own random number generator, and the mock
//! server becomes an in-process fake. Where a hand-rolled version differs from
//! the real crate, the doc comment says how.

// Scaffolding: an unwritten exercise leaves private fields unread, and the
// dead_code warnings would bury the failures you actually want to read. Delete
// this line when the suite is green, and check that nothing is still unused.
#![allow(dead_code)]

use std::cell::RefCell;

// ---------------------------------------------------------------------------
// Lesson: test-unit-tests
// ---------------------------------------------------------------------------

/// Lesson: test-unit-tests
///
/// Parse a subscriber name, or explain why it is not one. Trim the surrounding
/// whitespace first, then apply three rules in this order, returning the first
/// message that applies:
///
/// - empty after trimming: `"subscriber name cannot be empty"`
/// - longer than 256 characters: `"subscriber name is longer than 256 characters"`
/// - contains any of `/ ( ) " < > \ { }`: `"subscriber name contains the
///   forbidden character '/'"`, with the offending character shown by its
///   `Debug` formatting, which is where those single quotes come from
///
/// The book counts graphemes for the length rule and pulls in a crate to do
/// it. Counting `chars` is the std-only stand-in and differs on text like
/// "a\u{0301}", which is one grapheme and two chars.
pub fn parse_subscriber_name(_s: &str) -> Result<String, String> {
    todo!("trim, then check the three rules in order")
}

/// Lesson: test-unit-tests
///
/// Return `part` as a percentage of `whole`.
///
/// Panicking is part of this function's contract: when `whole` is zero there is
/// no answer to return, so panic with the message `"whole must not be zero"`.
/// The test pins that string with `#[should_panic(expected = "...")]`, which is
/// what stops the test passing on some other panic that happened to fire first.
pub fn percentage_of(_part: u32, _whole: u32) -> f64 {
    todo!("one panic with a fixed message, one arithmetic answer")
}

// ---------------------------------------------------------------------------
// Lesson: test-integration-tests
// ---------------------------------------------------------------------------

/// Lesson: test-integration-tests
///
/// The response an `App` hands back. Public because the test in `tests/` is a
/// separate crate and can only see public items.
#[derive(Debug, PartialEq)]
pub struct Response {
    pub status: u16,
    pub body: String,
}

/// Lesson: test-integration-tests
///
/// A miniature newsletter service, standing in for the book's actix-web app so
/// the exercise stays about the test posture rather than about a framework.
///
/// Its subscriber list is private. The integration test never reads it, and
/// never calls a handler directly: it drives the app the way a user would, by
/// method and path, and reads results back through the same door. Routing is
/// part of your contract, and a test that calls the handler function proves
/// nothing about it.
pub struct App {
    subscribers: RefCell<Vec<String>>,
}

/// The handler behind `GET /health_check`. Reachable from unit tests inside
/// this crate and from nowhere else, which the integration test demonstrates
/// with a commented-out call.
pub(crate) fn health_check() -> Response {
    Response { status: 200, body: String::new() }
}

impl App {
    pub fn new() -> Self {
        Self { subscribers: RefCell::new(Vec::new()) }
    }

    /// Lesson: test-integration-tests
    ///
    /// Route one request. `body` is the raw request body, which for a
    /// subscription is the new subscriber's email.
    ///
    /// - `GET /health_check`: 200, empty body, from the `health_check` helper
    /// - `POST /subscriptions` with a non-empty body: 200, empty body, and the
    ///   email joins the list
    /// - `POST /subscriptions` with an empty body: 400, empty body, no new
    ///   subscriber
    /// - `GET /subscriptions`: 200, body is the subscriber count in decimal
    /// - a known path with any other method: 405, empty body
    /// - anything else: 404, empty body
    ///
    /// Match on the path before the method. Get that backwards and an unknown
    /// path answers 405, which is the kind of bug only a black box test finds.
    pub fn handle(&self, _method: &str, _path: &str, _body: &str) -> Response {
        todo!("path first, then method, then the request's own validity")
    }
}

// ---------------------------------------------------------------------------
// Lesson: test-doc-tests
// ---------------------------------------------------------------------------

/// Lesson: test-doc-tests
///
/// Turn a title into a URL slug: lowercase, every run of non-alphanumeric
/// characters collapsed to a single `-`, and no leading or trailing `-`.
/// "Hello, World!" becomes "hello-world". Treat only ASCII letters and digits
/// as alphanumeric, so "Café Rust" becomes "caf-rust"; that is a real
/// limitation, and the doc comment is where you would admit it.
///
/// Two things to write here, not one:
///
/// 1. the function body, which `tests/test_doc_tests.rs` checks;
/// 2. a doc example in this comment, which `cargo test --doc` checks.
///
/// For the example, open a fenced code block (three backticks) below this
/// paragraph, import the function through its public path,
/// `use testing_exercises::slugify;`, and assert on a call. Prefix the import
/// line with `#` and a space to run it but hide it from the rendered page.
/// Then rename this function and watch the doc test go red: that is the whole
/// point of the harness, documentation drift turned into a failing build.
pub fn slugify(_title: &str) -> String {
    todo!("lowercase the alphanumerics, collapse everything else, trim the edges")
}

// ---------------------------------------------------------------------------
// Lesson: test-property-based
// ---------------------------------------------------------------------------

/// Lesson: test-property-based
///
/// A linear congruential generator, the smallest thing that will produce a
/// stream of numbers. Provided, not an exercise.
///
/// It stands in for `quickcheck`'s `Gen`. Same seed, same sequence, so a
/// failing property is reproducible from its seed alone. What it does not have
/// is shrinking: `quickcheck` re-runs a failure on progressively simpler inputs
/// and reports the smallest one, so you debug a two-element vector instead of a
/// forty-element one. That is the feature worth reaching for a crate to get.
pub struct Lcg {
    state: u64,
}

impl Lcg {
    pub fn new(seed: u64) -> Self {
        Self { state: seed }
    }

    /// The next number in the stream. The high bits of an LCG are the good
    /// ones, so the low 33 are discarded.
    pub fn next_u64(&mut self) -> u64 {
        self.state =
            self.state.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        self.state >> 33
    }

    /// The next number below `bound`, which must not be zero.
    pub fn below(&mut self, bound: u64) -> u64 {
        self.next_u64() % bound
    }
}

/// Lesson: test-property-based
///
/// Draw one random time from `rng` and format it as `"H:M:S"`, unpadded, with
/// the hour in `0..=23` and the minutes and seconds in `0..=59`.
///
/// This is the book's warm-up generator, and the precondition lives here: the
/// property "this input parses" is only true of inputs that were valid to begin
/// with. Feeding a parser arbitrary strings and expecting success tests the
/// generator, not the parser.
pub fn random_hms(_rng: &mut Lcg) -> String {
    todo!("three draws from rng, in ranges the parser is supposed to accept")
}

/// Lesson: test-property-based
///
/// Parse `"H:M:S"` into its three parts, or `None` if it is not a time: wrong
/// number of parts, a part that is not a number, or an hour above 23 or a
/// minute or second above 59.
pub fn parse_hms(_s: &str) -> Option<(u8, u8, u8)> {
    todo!("split on ':', and let None flow through the failures")
}

/// Lesson: test-property-based
///
/// Run `property` over `cases` generated inputs and return the first input it
/// rejects, or `None` if every one held.
///
/// This is the loop inside a property testing crate, minus the shrinking. Note
/// what it returns: not a bool, but the counterexample itself. A property test
/// that reports only "failed" leaves you no better off than a coin flip, and
/// the input that broke it is the entire diagnosis.
///
/// A caution the lesson is explicit about, and this signature makes concrete:
/// `None` means no counterexample was found in `cases` draws, not that none
/// exists. Sampling raises confidence. It does not prove anything.
pub fn find_counterexample(
    _seed: u64,
    _cases: u32,
    _property: impl Fn(&str) -> bool,
) -> Option<String> {
    todo!("generate, check, and return the first input that fails")
}

// ---------------------------------------------------------------------------
// Lesson: test-suite-architecture
// ---------------------------------------------------------------------------

/// Lesson: test-suite-architecture
///
/// Compare two floats and, when they are too far apart, produce the failure
/// message you would want to read at 2am. `Ok(())` when the difference is at
/// most `tolerance`, inclusive.
///
/// The message is the exercise. It has to name all four numbers, because any
/// one of them could be the surprise:
///
/// ```text
/// check_close(1.2, 1.0, 0.05)
///   == Err("expected 1.000 +/- 0.050, got 1.200 (off by 0.200)".to_string())
/// ```
///
/// Three decimal places on every number, which is also what keeps the string
/// stable enough for a test to assert on.
pub fn check_close(_actual: f64, _expected: f64, _tolerance: f64) -> Result<(), String> {
    todo!("compare, and on failure format all four numbers to three places")
}

/// Lesson: test-suite-architecture
///
/// The assertion built on `check_close`. Provided, so you can see the shape: a
/// custom assertion is a check that returns a message, plus a panic that
/// delivers it. A test fails by panicking, which is why this is all it takes.
pub fn assert_close(actual: f64, expected: f64, tolerance: f64) {
    if let Err(message) = check_close(actual, expected, tolerance) {
        panic!("{message}");
    }
}

/// Lesson: test-suite-architecture
///
/// A newsletter subscriber. Fields are public so a test can build one in a
/// literal when that is clearer than a builder.
#[derive(Debug, Clone, PartialEq)]
pub struct Subscriber {
    pub name: String,
    pub email: String,
    pub confirmed: bool,
}

/// Lesson: test-suite-architecture
///
/// Test data with defaults, so each test states only what it cares about. When
/// every test spells out all three fields, a fourth field means editing every
/// test, and a reader cannot tell which of the three the test depends on.
///
/// Implement the five methods. The defaults are `"Ursula Le Guin"`,
/// `"ursula@example.com"` and `false`. Each setter takes `self` by value and
/// returns `Self` so calls chain, which is the shape you have seen on
/// iterators: consume, adjust, hand back.
pub struct SubscriberBuilder {
    name: String,
    email: String,
    confirmed: bool,
}

impl SubscriberBuilder {
    pub fn new() -> Self {
        todo!("the defaults live here, once, instead of in every test")
    }

    pub fn name(self, _name: &str) -> Self {
        todo!("overwrite one field, return the builder")
    }

    pub fn email(self, _email: &str) -> Self {
        todo!("overwrite one field, return the builder")
    }

    pub fn confirmed(self, _confirmed: bool) -> Self {
        todo!("overwrite one field, return the builder")
    }

    pub fn build(self) -> Subscriber {
        todo!("move the fields across; the builder is spent")
    }
}

// ---------------------------------------------------------------------------
// Lesson: test-async-wiremock
// ---------------------------------------------------------------------------

/// Lesson: test-async-wiremock
///
/// The seam. Production sends through Postmark over HTTPS; a test sends through
/// something that records the call and returns immediately.
///
/// `wiremock` cuts this seam lower down, at the socket: it runs a real HTTP
/// server on a random port, so URL joining, header encoding and JSON
/// serialization all still run for real, and only the remote party is
/// simulated. Cutting at the trait, as here, skips all of that. Both are
/// legitimate; know which bugs each one can no longer see.
pub trait EmailSender {
    fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), String>;
}

/// Lesson: test-async-wiremock
///
/// One recorded call.
#[derive(Debug, Clone, PartialEq)]
pub struct SentEmail {
    pub to: String,
    pub subject: String,
    pub body: String,
}

/// Lesson: test-async-wiremock
///
/// A fake email sender: it records what it was asked to send and returns a
/// scripted answer, the way a mounted `Mock` does.
///
/// The constructors are provided. What is missing is the two impls below.
pub struct FakeEmailSender {
    sent: RefCell<Vec<SentEmail>>,
    response: Result<(), String>,
    expected: Option<usize>,
}

impl FakeEmailSender {
    /// A fake that accepts everything.
    pub fn new() -> Self {
        Self { sent: RefCell::new(Vec::new()), response: Ok(()), expected: None }
    }

    /// A fake that records the call and then fails, the way a 500 from
    /// Postmark would.
    pub fn failing(message: &str) -> Self {
        Self {
            sent: RefCell::new(Vec::new()),
            response: Err(message.to_string()),
            expected: None,
        }
    }

    /// Record an expectation of exactly `count` sends, checked on drop. This is
    /// `wiremock`'s `.expect(1)`.
    pub fn expect(mut self, count: usize) -> Self {
        self.expected = Some(count);
        self
    }

    /// Every call the fake received, in order.
    pub fn sent(&self) -> Vec<SentEmail> {
        self.sent.borrow().clone()
    }
}

// TODO: impl EmailSender for FakeEmailSender
//
// Record the call, then return the scripted response. Record it even when the
// response is an error: the request really was made, and a test about failure
// handling wants to see it. Note the receiver the trait gives you is `&self`,
// which is why the recording buffer is a RefCell.

// TODO: impl Drop for FakeEmailSender
//
// If an expectation was set and the count does not match, panic with a message
// containing `expected {expected} email(s), the fake received {actual}`.
//
// This is the part of wiremock worth stealing: nothing in the test asserts that
// the request was sent, and the verdict still lands, at the deterministic
// moment the fake leaves scope. Guard the check with
// `std::thread::panicking()`: panicking inside a drop that is already unwinding
// another panic aborts the process, which would bury the real failure.

/// Lesson: test-async-wiremock
///
/// Send one subscriber their confirmation email through `sender`.
///
/// - an already confirmed subscriber gets nothing sent at all;
/// - anyone else gets one email, to their address, with the subject
///   `"Please confirm your subscription"` and a body containing their name;
/// - an error from the sender is the caller's error too.
pub fn confirm_subscription(
    _sender: &dyn EmailSender,
    _subscriber: &Subscriber,
) -> Result<(), String> {
    todo!("decide whether to send, then let the sender's answer be yours")
}

// ---------------------------------------------------------------------------
// Lesson: test-unit-tests
// ---------------------------------------------------------------------------

/// Lesson: test-unit-tests
///
/// The last exercise, and the only one where you write the assertions.
///
/// `#[cfg(test)]` means this module is compiled only when building tests, so it
/// costs the shipped library nothing. Being a child module, `use super::*` puts
/// every item above in scope, private ones included, which is the one thing the
/// files in `tests/` cannot do.
///
/// Replace each `todo!()` with assertions covering the three rules of
/// `parse_subscriber_name`, and run them with `cargo test --lib`. Make the
/// failure messages carry the diagnosis: prefer `assert_eq!`, which prints both
/// sides, over `assert!`, which prints only the source text of the expression
/// that was false.
///
/// The outer file `tests/test_unit_tests.rs` checks the same function through
/// the public API, so these are yours to write rather than yours to satisfy.
/// Then ask the lesson's question about each one: could a user of this crate
/// observe what I just asserted? Anything that fails that question is either
/// untestable by anyone or a gap in the public surface.
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn trims_surrounding_whitespace() {
        let parsed = parse_subscriber_name("  Ursula  ");
        todo!("what should {parsed:?} be? assert it")
    }

    #[test]
    fn rejects_whitespace_only_names() {
        let parsed = parse_subscriber_name("   ");
        todo!("assert on the error inside {parsed:?}, not merely that there was one")
    }

    #[test]
    fn rejects_names_with_a_forbidden_character() {
        todo!("pick one of the nine, and pin the message that names it")
    }

    /// One test the files in `tests/` could not write at all: `health_check` is
    /// `pub(crate)`, so only a test inside this crate can call it. Use that
    /// power sparingly. A behaviour no user can observe is either not worth
    /// asserting or missing from the public surface.
    #[test]
    fn the_health_check_handler_answers_200() {
        let response = health_check();
        todo!("assert on {response:?}")
    }
}
