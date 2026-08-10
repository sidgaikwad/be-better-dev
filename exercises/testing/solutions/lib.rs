//! Reference solutions. Read these after you have something passing.
//!
//! Where a solution had a choice to make, the comment says which way it went
//! and why, since that judgment is the part worth copying. The doc examples
//! here are the ones the stub asks you to write, and `cargo test` runs them.

use std::cell::RefCell;

/// Parse a subscriber name.
///
/// ```
/// use testing_exercises::parse_subscriber_name;
///
/// assert_eq!(parse_subscriber_name("  Ursula  ").unwrap(), "Ursula");
/// assert!(parse_subscriber_name("   ").is_err());
/// ```
///
/// Order matters: the empty check runs first so a whitespace-only name is
/// reported as empty rather than as something more obscure. Returning the
/// message as a String rather than a bool is what lets a test assert on which
/// rule fired.
pub fn parse_subscriber_name(s: &str) -> Result<String, String> {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return Err("subscriber name cannot be empty".to_string());
    }
    if trimmed.chars().count() > 256 {
        return Err("subscriber name is longer than 256 characters".to_string());
    }
    const FORBIDDEN: [char; 9] = ['/', '(', ')', '"', '<', '>', '\\', '{', '}'];
    if let Some(c) = trimmed.chars().find(|c| FORBIDDEN.contains(c)) {
        return Err(format!("subscriber name contains the forbidden character {c:?}"));
    }
    Ok(trimmed.to_string())
}

/// Return `part` as a percentage of `whole`.
///
/// ```
/// # use testing_exercises::percentage_of;
/// assert_eq!(percentage_of(3, 4), 75.0);
/// ```
///
/// A zero denominator has no answer, so this panics rather than inventing one.
/// A doc example can be tested against that too: mark the fence `should_panic`.
///
/// ```should_panic
/// # use testing_exercises::percentage_of;
/// percentage_of(1, 0);
/// ```
///
/// The message is fixed and specific because `#[should_panic(expected = ...)]`
/// matches a substring of it. A vague message like "invalid input" would match
/// half the panics in a codebase, and the test would pass on the wrong bug.
pub fn percentage_of(part: u32, whole: u32) -> f64 {
    if whole == 0 {
        panic!("whole must not be zero");
    }
    f64::from(part) / f64::from(whole) * 100.0
}

#[derive(Debug, PartialEq)]
pub struct Response {
    pub status: u16,
    pub body: String,
}

pub struct App {
    subscribers: RefCell<Vec<String>>,
}

pub(crate) fn health_check() -> Response {
    Response { status: 200, body: String::new() }
}

impl App {
    pub fn new() -> Self {
        Self { subscribers: RefCell::new(Vec::new()) }
    }

    /// Matching on the path first and the method second is what makes 405 and
    /// 404 mean different things: the path is known but the verb is wrong, or
    /// nothing is there at all. Both are part of the contract, and both are
    /// invisible to a test that calls `health_check()` directly.
    pub fn handle(&self, method: &str, path: &str, body: &str) -> Response {
        match path {
            "/health_check" => match method {
                "GET" => health_check(),
                _ => Response { status: 405, body: String::new() },
            },
            "/subscriptions" => match method {
                "POST" if body.is_empty() => Response { status: 400, body: String::new() },
                "POST" => {
                    self.subscribers.borrow_mut().push(body.to_string());
                    Response { status: 200, body: String::new() }
                }
                "GET" => Response {
                    status: 200,
                    body: self.subscribers.borrow().len().to_string(),
                },
                _ => Response { status: 405, body: String::new() },
            },
            _ => Response { status: 404, body: String::new() },
        }
    }
}

/// Turn a title into a URL slug.
///
/// ```
/// # use testing_exercises::slugify;
/// assert_eq!(slugify("Hello, World!"), "hello-world");
/// ```
///
/// Only ASCII letters and digits survive, so "Café Rust" becomes "caf-rust".
/// Writing that down in the example is the honest move: a reader who needs
/// non-ASCII slugs learns it here instead of in production.
///
/// ```
/// # use testing_exercises::slugify;
/// assert_eq!(slugify("Café Rust"), "caf-rust");
/// ```
///
/// The hidden `#` lines above run but do not render, which is how a published
/// example stays down to the one line that teaches something.
pub fn slugify(title: &str) -> String {
    let mut slug = String::new();
    for c in title.chars() {
        if c.is_ascii_alphanumeric() {
            slug.push(c.to_ascii_lowercase());
        } else if !slug.ends_with('-') {
            // One separator per run, not one per character, so "  &  " does
            // not turn into four dashes.
            slug.push('-');
        }
    }
    slug.trim_matches('-').to_string()
}

pub struct Lcg {
    state: u64,
}

impl Lcg {
    pub fn new(seed: u64) -> Self {
        Self { state: seed }
    }

    pub fn next_u64(&mut self) -> u64 {
        self.state =
            self.state.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        self.state >> 33
    }

    pub fn below(&mut self, bound: u64) -> u64 {
        self.next_u64() % bound
    }
}

/// Three draws, in exactly the ranges the parser accepts. The generator is
/// where the precondition of the property lives, and every input it can produce
/// must be one the property is actually claimed to hold for.
pub fn random_hms(rng: &mut Lcg) -> String {
    let hours = rng.below(24);
    let minutes = rng.below(60);
    let seconds = rng.below(60);
    format!("{hours}:{minutes}:{seconds}")
}

/// `?` on Option gives the early return for free, so the shape of the parse is
/// visible instead of buried in nested matches. The trailing `parts.next()`
/// check is what rejects "1:2:3:4", which a three-element destructure would
/// silently accept.
pub fn parse_hms(s: &str) -> Option<(u8, u8, u8)> {
    let mut parts = s.split(':');
    let hours: u8 = parts.next()?.parse().ok()?;
    let minutes: u8 = parts.next()?.parse().ok()?;
    let seconds: u8 = parts.next()?.parse().ok()?;
    if parts.next().is_some() {
        return None;
    }
    if hours > 23 || minutes > 59 || seconds > 59 {
        return None;
    }
    Some((hours, minutes, seconds))
}

/// The loop at the heart of a property testing crate. Returning the input
/// rather than a bool is the whole value: a failure you cannot reproduce is
/// noise, and the seed plus this string reproduces it exactly.
///
/// Stopping at the first counterexample is deliberate. The second one is
/// usually the same bug, and shrinking, which this does not do, is the better
/// use of the remaining iterations.
pub fn find_counterexample(
    seed: u64,
    cases: u32,
    property: impl Fn(&str) -> bool,
) -> Option<String> {
    let mut rng = Lcg::new(seed);
    for _ in 0..cases {
        let input = random_hms(&mut rng);
        if !property(&input) {
            return Some(input);
        }
    }
    None
}

/// All four numbers appear because any one of them can be the surprise: the
/// tolerance was tighter than you remembered, or the expectation itself is
/// stale. Fixing the precision at three places keeps the message readable and
/// keeps it stable, since the raw difference here prints as
/// 0.19999999999999996.
pub fn check_close(actual: f64, expected: f64, tolerance: f64) -> Result<(), String> {
    let difference = (actual - expected).abs();
    if difference <= tolerance {
        return Ok(());
    }
    Err(format!("expected {expected:.3} +/- {tolerance:.3}, got {actual:.3} (off by {difference:.3})"))
}

/// Separating the check from the panic is what makes the message testable: the
/// suite can assert on the string without arranging to catch an unwind.
pub fn assert_close(actual: f64, expected: f64, tolerance: f64) {
    if let Err(message) = check_close(actual, expected, tolerance) {
        panic!("{message}");
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Subscriber {
    pub name: String,
    pub email: String,
    pub confirmed: bool,
}

pub struct SubscriberBuilder {
    name: String,
    email: String,
    confirmed: bool,
}

impl SubscriberBuilder {
    /// The defaults exist once. Adding a fourth field later touches this line
    /// and nothing else, whereas struct literals in forty tests would all need
    /// editing.
    pub fn new() -> Self {
        Self {
            name: "Ursula Le Guin".to_string(),
            email: "ursula@example.com".to_string(),
            confirmed: false,
        }
    }

    /// Taking `self` by value rather than `&mut self` is what lets the calls
    /// chain into one expression. The cost is that the builder is consumed, so
    /// a test that wants two variants calls `new()` twice, which is usually
    /// what it wanted anyway.
    pub fn name(mut self, name: &str) -> Self {
        self.name = name.to_string();
        self
    }

    pub fn email(mut self, email: &str) -> Self {
        self.email = email.to_string();
        self
    }

    pub fn confirmed(mut self, confirmed: bool) -> Self {
        self.confirmed = confirmed;
        self
    }

    pub fn build(self) -> Subscriber {
        Subscriber { name: self.name, email: self.email, confirmed: self.confirmed }
    }
}

pub trait EmailSender {
    fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), String>;
}

#[derive(Debug, Clone, PartialEq)]
pub struct SentEmail {
    pub to: String,
    pub subject: String,
    pub body: String,
}

pub struct FakeEmailSender {
    sent: RefCell<Vec<SentEmail>>,
    response: Result<(), String>,
    expected: Option<usize>,
}

impl FakeEmailSender {
    pub fn new() -> Self {
        Self { sent: RefCell::new(Vec::new()), response: Ok(()), expected: None }
    }

    pub fn failing(message: &str) -> Self {
        Self {
            sent: RefCell::new(Vec::new()),
            response: Err(message.to_string()),
            expected: None,
        }
    }

    pub fn expect(mut self, count: usize) -> Self {
        self.expected = Some(count);
        self
    }

    pub fn sent(&self) -> Vec<SentEmail> {
        self.sent.borrow().clone()
    }
}

/// The recording happens before the response is consulted, so a scripted
/// failure still leaves evidence that the call was made. A fake that only
/// records successes cannot answer "did we even try?", which is the first
/// question asked about a failed delivery.
impl EmailSender for FakeEmailSender {
    fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), String> {
        self.sent.borrow_mut().push(SentEmail {
            to: to.to_string(),
            subject: subject.to_string(),
            body: body.to_string(),
        });
        self.response.clone()
    }
}

/// Verification on drop, the trick wiremock hangs its whole design on. Drop
/// runs at a deterministic point, so an expectation cannot be forgotten by a
/// test that returns early or never got around to asserting.
///
/// The `panicking()` guard is not optional: a panic raised while another panic
/// is unwinding aborts the process, so without it a single real assertion
/// failure would take down the whole test binary and hide itself.
impl Drop for FakeEmailSender {
    fn drop(&mut self) {
        if std::thread::panicking() {
            return;
        }
        if let Some(expected) = self.expected {
            let actual = self.sent.borrow().len();
            assert_eq!(
                actual, expected,
                "expected {expected} email(s), the fake received {actual}"
            );
        }
    }
}

/// Taking `&dyn EmailSender` is the seam. Production passes a Postmark client,
/// the suite passes a recorder, and this function cannot tell the difference,
/// which is the property that makes it testable without a network.
pub fn confirm_subscription(
    sender: &dyn EmailSender,
    subscriber: &Subscriber,
) -> Result<(), String> {
    if subscriber.confirmed {
        return Ok(());
    }
    let body = format!("Hi {}, please confirm your subscription.", subscriber.name);
    sender.send(&subscriber.email, "Please confirm your subscription", &body)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// One rule per test. When three rules share a test, the first failure
    /// hides the other two and the name no longer says what broke.
    #[test]
    fn trims_surrounding_whitespace() {
        assert_eq!(parse_subscriber_name("  Ursula  ").unwrap(), "Ursula");
    }

    /// Asserting on the message, not merely on `is_err`, is what catches the
    /// day this starts failing for the length rule instead.
    #[test]
    fn rejects_whitespace_only_names() {
        assert_eq!(
            parse_subscriber_name("   ").unwrap_err(),
            "subscriber name cannot be empty"
        );
    }

    #[test]
    fn rejects_names_with_a_forbidden_character() {
        assert_eq!(
            parse_subscriber_name("Ursula</b>").unwrap_err(),
            "subscriber name contains the forbidden character '<'"
        );
    }

    /// Private access, used for the one thing the public API cannot reach. A
    /// unit test can call this; the files in tests/ cannot.
    #[test]
    fn the_health_check_handler_answers_200() {
        assert_eq!(health_check().status, 200);
    }
}
