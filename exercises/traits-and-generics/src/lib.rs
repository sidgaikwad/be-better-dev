//! Traits and generics.
//!
//! One newsletter service, three ways to send an email, and the machinery that
//! lets one function accept all of them. Run `cargo test -p traits-and-generics`
//! to see what is red, then work down the file deleting `todo!()`s.
//!
//! Several exercises here are type-level: until you solve them their test file
//! does not compile. Keep working the rest with `cargo test --test
//! traits_bounds_and_where` and friends while that one is red.

use std::cell::RefCell;
use std::fmt;
use std::rc::Rc;

/// Every client in this crate writes one line per API call into a shared log,
/// so a test can see how many calls a delivery actually made. None of the
/// lessons depend on this type; it is the observation window.
pub type CallLog = Rc<RefCell<Vec<String>>>;

/// The one way a delivery goes wrong here.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SendError {
    pub reason: String,
}

impl SendError {
    /// The `impl Into<String>` argument is the bounds lesson arriving early:
    /// this accepts a `&str` or a `String` because both convert into `String`.
    pub fn new(reason: impl Into<String>) -> Self {
        Self { reason: reason.into() }
    }
}

/// Lesson: traits-capability-contracts
///
/// The capability every email client must have, plus the one it gets for free.
///
/// `send` is required, so each implementor writes its own. `send_to_all` is a
/// default method: you write it once, here, against `self.send` and nothing
/// else, and every implementor inherits it. It must stop at the first failure
/// and report it, which is one character of work if you remember what `?` does
/// inside a function returning `Result`.
pub trait EmailClient {
    fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), SendError>;

    fn send_to_all(
        &self,
        _recipients: &[String],
        _subject: &str,
        _body: &str,
    ) -> Result<(), SendError> {
        todo!("one required method is all this body may use, and `?` does the stopping")
    }
}

/// The fake client, the one a test injects. It records the recipient of every
/// call it accepts.
pub struct RecordingClient {
    log: CallLog,
}

impl RecordingClient {
    pub fn new() -> Self {
        Self { log: Rc::new(RefCell::new(Vec::new())) }
    }

    /// Share a log with the caller, so a client that has been moved into a
    /// `Box<dyn EmailClient>` can still be observed from outside the box.
    pub fn with_log(log: CallLog) -> Self {
        Self { log }
    }

    /// One entry per API call. A call carrying several recipients joins them
    /// with commas, which is how a test tells a loop from a batch.
    pub fn calls(&self) -> Vec<String> {
        self.log.borrow().clone()
    }

    pub fn record(&self, recipients: &str) {
        self.log.borrow_mut().push(recipients.to_string());
    }
}

/// The production client. It carries an API token, and its provider offers a
/// batch endpoint, which is why it is the one that overrides `send_to_all`.
pub struct Postmark {
    pub token: String,
    log: CallLog,
}

impl Postmark {
    pub fn new(token: &str) -> Self {
        Self { token: token.to_string(), log: Rc::new(RefCell::new(Vec::new())) }
    }

    pub fn with_log(token: &str, log: CallLog) -> Self {
        Self { token: token.to_string(), log }
    }

    pub fn calls(&self) -> Vec<String> {
        self.log.borrow().clone()
    }

    pub fn record(&self, recipients: &str) {
        self.log.borrow_mut().push(recipients.to_string());
    }
}

/// Lesson: traits-capability-contracts
///
/// Record the recipient and report success. Refuse a `to` that holds no `@`,
/// the way the provider's API would, with a `SendError` whose reason names the
/// rejected address.
///
/// This impl block is the whole opt-in: `send_to_all` arrives with it, because
/// the trait already wrote that method against `send`.
impl EmailClient for RecordingClient {
    fn send(&self, _to: &str, _subject: &str, _body: &str) -> Result<(), SendError> {
        todo!("record the recipient, and refuse an address with no `@`")
    }
}

/// Lesson: traits-capability-contracts
///
/// Two methods this time. `send` fails with `SendError::new("missing API
/// token")` when the token is empty, which is this crate's stand-in for an
/// unauthenticated request, and otherwise records the single recipient.
///
/// Then override the inherited `send_to_all`: Postmark's provider has a batch
/// endpoint, so make one call recording every recipient joined with `,`,
/// instead of looping. The token check applies there too. Callers cannot tell
/// the difference between the default and the override; the tests can.
impl EmailClient for Postmark {
    fn send(&self, _to: &str, _subject: &str, _body: &str) -> Result<(), SendError> {
        todo!("check the token, then record")
    }
}

/// Lesson: traits-capability-contracts
///
/// A type with an inherent `send` of exactly the trait's signature, and no
/// impl block. Rust traits are nominal, not structural, so it gets nothing:
///
/// ```text
/// error[E0599]: no method named `send_to_all` found for struct `Postcard`
///   |
///   |     Postcard.send_to_all(&recipients, "Welcome", "You are in");
///   |              ^^^^^^^^^^^ method not found in `Postcard`
///   |
///   = help: items from traits can only be used if the trait is implemented
///           and in scope
/// ```
///
/// COMPILE ERROR: that call is what this lesson's test file makes, so the file
/// does not compile until you add an `impl EmailClient for Postcard` block. Its
/// `send` may delegate straight to the inherent one below, which is the point:
/// the matching method was never the door. The impl block is.
pub struct Postcard;

impl Postcard {
    pub fn send(&self, _to: &str, _subject: &str, _body: &str) -> Result<(), SendError> {
        Ok(())
    }
}

// TODO: impl EmailClient for Postcard

/// Lesson: traits-bounds-and-where
///
/// Send the confirmation email through whichever client the caller has, with
/// subject "Confirm your subscription" and body "The link is inside".
///
/// Inside a generic function `C` is opaque: you may move it, borrow it, drop
/// it, and nothing else, because the body has to work for every possible `C`.
/// So the first attempt is rejected at the definition, before any caller
/// exists:
///
/// ```text
/// error[E0599]: no method named `send` found for reference `&C` in the current scope
///   |
///   = help: items from traits can only be used if the type parameter
///           is bounded by the trait
/// ```
///
/// Name the capability in the signature and the body becomes legal.
pub fn send_confirmation<C>(_client: &C, _email: &str) -> Result<(), SendError> {
    todo!("the body may use exactly the methods the signature asked for")
}

/// Lesson: traits-bounds-and-where
///
/// Return a reference to the largest element. Assume a non-empty slice.
///
/// ```text
/// error[E0369]: binary operation `>` cannot be applied to type `&T`
/// help: consider restricting type parameter `T`
///   |
/// 1 | pub fn largest<T: std::cmp::PartialOrd>(list: &[T]) -> &T {
///   |                 ++++++++++++++++++++++
/// ```
///
/// `>` is sugar for a trait method like any other, and an unbounded `T`
/// promised nothing. A C++ template would have let this through until someone
/// instantiated it; Rust puts the whole negotiation in the signature.
pub fn largest<T>(_list: &[T]) -> &T {
    todo!("which trait owns `>`?")
}

/// Lesson: traits-bounds-and-where
///
/// Return `"<display> (<debug>)"`: the human wording, then the programmer's
/// dump in parentheses.
///
/// The `where` clause below grants `Debug`, and only `Debug`:
///
/// ```text
/// error[E0277]: `T` doesn't implement `std::fmt::Display`
///   |
///   = note: in format strings you may be able to use `{:?}` instead
/// ```
///
/// Every type you plan to pass implements both, and that is not the question:
/// this function must hold for all `T: Debug`, and some of those have no
/// `Display`. Widen the clause. Generic code never gets a capability it did not
/// ask for, which is what makes the signature a complete contract.
pub fn delivery_label<T>(_value: &T) -> String
where
    T: fmt::Debug,
{
    todo!("format it twice, two different traits")
}

/// Lesson: traits-monomorphization
///
/// The same job as `send_confirmation`, spelled the other way, with subject
/// "Reminder" and body "Your link is still valid".
///
/// `impl EmailClient` in argument position declares an anonymous type parameter
/// with that bound, and it monomorphizes identically: the compiler stamps one
/// specialized copy per concrete type the function is called with, and every
/// `send` inside a copy is a direct call to a known function. The named
/// `<C: EmailClient>` form is only required when a caller needs a turbofish or
/// when two arguments must share one type, and neither applies here.
pub fn send_reminder(_client: &impl EmailClient, _email: &str) -> Result<(), SendError> {
    todo!("same body as the generic version, shorter signature")
}

/// Lesson: traits-monomorphization
///
/// Return a closure that renders `"Hi Ada, confirm your subscription"` for the
/// given name.
///
/// Every closure has its own unnameable type, so this return type can only be
/// spelled `impl Fn() -> String`. The caller learns the capability and not the
/// type; the compiler still knows the real one, so calling it is static and
/// nothing is boxed. `Fn` rather than `FnOnce` promises it survives being
/// called twice, which the test checks, so mind who owns `name`.
pub fn confirmation_email(_name: String) -> impl Fn() -> String {
    move || todo!("format the line, and keep the closure callable more than once")
}

/// Lesson: traits-trait-objects
///
/// Build the client the configuration asks for, decided at runtime: the
/// recording fake when `use_fake`, otherwise a `Postmark` with the token
/// "secret-token". Both take the caller's `log`, so the test can watch a client
/// it no longer owns.
///
/// The obvious spelling is rejected:
///
/// ```text
/// error[E0308]: `if` and `else` have incompatible types
///   |
///   |         Postmark::with_log("secret-token", log)
///   |         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ expected `RecordingClient`,
///   |                                                found `Postmark`
///   |
///   = help: you could change the return type to be a boxed trait object
/// ```
///
/// COMPILE ERROR: `impl EmailClient` demands one compile-time answer and
/// `use_fake` is runtime data. The return type below is the compiler's own
/// suggestion, and the `Box` is not decoration: `dyn EmailClient` is unsized,
/// like `str`, so it has to live behind a pointer.
///
/// ```ignore
/// pub fn make_client(use_fake: bool, log: CallLog) -> impl EmailClient {
///     if use_fake {
///         RecordingClient::with_log(log)
///     } else {
///         Postmark::with_log("secret-token", log)
///     }
/// }
/// ```
pub fn make_client(_use_fake: bool, _log: CallLog) -> Box<dyn EmailClient> {
    todo!("erase the type, and give the value somewhere sized to live")
}

/// Lesson: traits-trait-objects
///
/// Send one email through every client in order, stopping at the first failure.
///
/// A `Vec<Box<dyn EmailClient>>` holds a `RecordingClient` and a `Postmark`
/// side by side; a `Vec<C>` with a generic `C` holds exactly one concrete type,
/// which is what the test's mixed vector is really asserting. This function is
/// also compiled once no matter how many client types exist, which is the cure
/// when monomorphization's binary-size bill comes due.
pub fn broadcast(
    _clients: &[Box<dyn EmailClient>],
    _to: &str,
    _subject: &str,
    _body: &str,
) -> Result<(), SendError> {
    todo!("iterate, dispatch through the vtable, and let `?` stop you")
}

/// Lesson: traits-trait-objects
///
/// Return `(size_of::<&Postmark>(), size_of::<&dyn EmailClient>())` on this
/// target, measured rather than typed in as literals.
///
/// Predict the pair before you write it: one of these is a plain address, and
/// the other has to carry something extra so that a call knows where to go.
pub fn pointer_widths() -> (usize, usize) {
    todo!("which pointer needs a second word, and what lives at the end of it?")
}

/// Lesson: traits-std-tour
///
/// The service's error type. `Debug` is derived, because a mechanical dump has
/// nothing to decide. `Display` is deliberately not derivable: presentation is a
/// decision std refuses to guess, so make it. One sentence per variant:
///
/// ```text
/// InvalidEmail(reason) -> invalid subscriber email: {reason}
/// SendFailed(reason)   -> failed to send confirmation: {reason}
/// ```
///
/// Write it with `match` and notice what the compiler would do if someone added
/// a variant tomorrow. You do not implement `to_string`: std's blanket
/// `impl<T: Display> ToString for T` hands it over the moment this compiles.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SubscribeError {
    InvalidEmail(String),
    SendFailed(String),
}

impl fmt::Display for SubscribeError {
    fn fmt(&self, _f: &mut fmt::Formatter<'_>) -> fmt::Result {
        todo!("match on self and word each variant for a human")
    }
}

/// Lesson: traits-std-tour
///
/// A config struct. Add the derive that makes `RetryPolicy { attempts: 3,
/// ..Default::default() }` legal, so a caller names what differs and defaults
/// the rest. The derived impl calls each field's own `default()`: numbers zero,
/// bools false.
#[derive(Debug)]
pub struct RetryPolicy {
    pub attempts: u32,
    pub backoff_ms: u64,
    pub jitter: bool,
}

/// Lesson: traits-std-tour
///
/// A `HashMap` key. `HashMap` demands `Eq + Hash` and enforces one law: equal
/// values must hash equally. Derive the pair together and the law holds by
/// construction; hand-write one of them inconsistently and inserted keys
/// silently become unfindable.
#[derive(Debug, Clone)]
pub struct SubscriberKey {
    pub email: String,
    pub list_id: u32,
}

impl SubscriberKey {
    pub fn new(email: &str, list_id: u32) -> Self {
        Self { email: email.to_string(), list_id }
    }
}

/// Lesson: traits-std-tour
///
/// Add `PartialEq` here. Then try adding `Eq` too and read the error: IEEE 754
/// says `NaN != NaN`, so `f64` equality is not reflexive, and `Eq` is exactly
/// the marker promising that it is. A derived `PartialEq` compares fields with
/// their own `==`, so this type inherits the float's answer. The test pins that
/// down, and it is also why a float cannot be a `HashMap` key without a wrapper
/// that makes an explicit policy about NaN.
#[derive(Debug, Clone, Copy)]
pub struct OpenRate {
    pub value: f64,
}

/// Lesson: traits-from-into-newtypes
///
/// A validated subscriber email. The inner `String` is private, so the only way
/// to obtain one is the conversion below: holding a `SubscriberEmail` means
/// validation already happened, and every function downstream can stop asking.
///
/// Implement `TryFrom<String>`, accepting a value that contains `@` and does not
/// start with one, and rejecting anything else with exactly
/// `` format!("`{value}` is not a valid subscriber email") ``. Implement
/// `TryFrom` and never `TryInto`: std carries the blanket
/// `impl<T, U> TryInto<U> for T where U: TryFrom<T>`, so `try_into` arrives on
/// its own, and the test uses both spellings to prove it.
#[derive(Debug)]
pub struct SubscriberEmail(String);

impl SubscriberEmail {
    pub fn as_str(&self) -> &str {
        &self.0
    }

    pub fn into_inner(self) -> String {
        self.0
    }
}

impl TryFrom<String> for SubscriberEmail {
    type Error = String;

    fn try_from(_value: String) -> Result<Self, Self::Error> {
        todo!("parse, do not validate: refuse to build the value at all")
    }
}

/// Lesson: traits-from-into-newtypes
///
/// One infallible conversion, and the hook `?` runs on.
///
/// `expr?` expands to roughly `match expr { Ok(v) => v, Err(e) => return
/// Err(From::from(e)) }`, so this single impl makes every `?` on a `SendError`
/// cooperate inside any function returning `Result<_, SubscribeError>`. Map it
/// onto `SendFailed`, carrying the error's reason across unchanged.
///
/// You get `Into` for nothing: std's blanket `impl<T, U> Into<U> for T where
/// U: From<T>` covers it, which is why the rule is to implement `From` and
/// never `Into` directly.
impl From<SendError> for SubscribeError {
    fn from(_error: SendError) -> Self {
        todo!("which variant does a failed delivery belong in?")
    }
}

/// Lesson: traits-from-into-newtypes
///
/// Validate the raw input, send the confirmation through the client with
/// subject "Confirm your subscription" and body "The link is inside", and
/// return the address that was confirmed.
///
/// Two fallible steps, two different stories. The `send` step's error converts
/// on its way out of `?`, because you wrote the `From` impl above. The
/// validation step's error is a `String`, no `From<String>` for
/// `SubscribeError` exists, and `?` alone will not compile there: reshape that
/// error into an `InvalidEmail` yourself before the `?` reaches it. The
/// asymmetry is the lesson. `?` is not magic, it is a `From` call.
pub fn confirm_subscriber(
    _client: &impl EmailClient,
    _raw_email: String,
) -> Result<String, SubscribeError> {
    todo!("one `?` converts on its own; the other needs help first")
}

/// Lesson: traits-from-into-newtypes
///
/// The orphan rule: an impl is legal only if the trait or the type is local to
/// this crate.
///
/// ```text
/// error[E0117]: only traits defined in the current crate can be implemented
///               for types defined outside of the crate
///   |
///   | impl std::fmt::Display for Vec<SubscriberEmail> {
///   |      ^^^^^^^^^^^^^^^^^^^^^^^---------------------
///   |      |                      |
///   |      |                      `Vec` is not defined in the current crate
///   |
///   = note: define and implement a trait or new type instead
/// ```
///
/// COMPILE ERROR: `Display` is foreign and `Vec` is foreign, so that impl can
/// never be written here. If this crate could write it, so could every other
/// crate in the build, and nothing would decide the winner. The note names the
/// fix and it is the newtype again: `Recipients` is local, so the impl below is
/// legal, and the wrapper still adds zero bytes. Write `"{n} confirmed
/// recipients"`.
pub struct Recipients(pub Vec<SubscriberEmail>);

impl fmt::Display for Recipients {
    fn fmt(&self, _f: &mut fmt::Formatter<'_>) -> fmt::Result {
        todo!("count what is inside the wrapper; `write!` is the whole body")
    }
}
