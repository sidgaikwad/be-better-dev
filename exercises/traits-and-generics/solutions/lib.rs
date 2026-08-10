//! Reference solutions. Read these after you have something passing.
//!
//! Where a solution had a choice to make, the comment says which way it went
//! and why, since that judgment is the part worth copying.

use std::cell::RefCell;
use std::fmt;
use std::rc::Rc;

pub type CallLog = Rc<RefCell<Vec<String>>>;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SendError {
    pub reason: String,
}

impl SendError {
    pub fn new(reason: impl Into<String>) -> Self {
        Self { reason: reason.into() }
    }
}

pub trait EmailClient {
    fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), SendError>;

    /// Written against the required method alone, so one `impl` of `send` buys
    /// the whole surface. `?` is what makes the loop stop at the first failure
    /// and hand the error to the caller, and it works inside a trait body
    /// exactly as it does anywhere else.
    fn send_to_all(
        &self,
        recipients: &[String],
        subject: &str,
        body: &str,
    ) -> Result<(), SendError> {
        for to in recipients {
            self.send(to, subject, body)?;
        }
        Ok(())
    }
}

pub struct RecordingClient {
    log: CallLog,
}

impl RecordingClient {
    pub fn new() -> Self {
        Self { log: Rc::new(RefCell::new(Vec::new())) }
    }

    pub fn with_log(log: CallLog) -> Self {
        Self { log }
    }

    pub fn calls(&self) -> Vec<String> {
        self.log.borrow().clone()
    }

    pub fn record(&self, recipients: &str) {
        self.log.borrow_mut().push(recipients.to_string());
    }
}

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

/// One method implemented, two available. Nothing here mentions `send_to_all`,
/// and the fake still has it.
impl EmailClient for RecordingClient {
    fn send(&self, to: &str, _subject: &str, _body: &str) -> Result<(), SendError> {
        if !to.contains('@') {
            return Err(SendError::new(format!("`{to}` was rejected by the provider")));
        }
        self.record(to);
        Ok(())
    }
}

impl EmailClient for Postmark {
    fn send(&self, to: &str, _subject: &str, _body: &str) -> Result<(), SendError> {
        if self.token.is_empty() {
            return Err(SendError::new("missing API token"));
        }
        self.record(to);
        Ok(())
    }

    /// The override is invisible to callers: same signature, same contract, one
    /// API call instead of n. That is the whole argument for default methods
    /// being overridable rather than final.
    fn send_to_all(
        &self,
        recipients: &[String],
        _subject: &str,
        _body: &str,
    ) -> Result<(), SendError> {
        if self.token.is_empty() {
            return Err(SendError::new("missing API token"));
        }
        self.record(&recipients.join(","));
        Ok(())
    }
}

pub struct Postcard;

impl Postcard {
    pub fn send(&self, _to: &str, _subject: &str, _body: &str) -> Result<(), SendError> {
        Ok(())
    }
}

/// The impl block is the opt-in, and it can be this thin. `Postcard::send`
/// names the inherent method: inherent methods win over trait methods during
/// resolution, so this delegates rather than recursing.
impl EmailClient for Postcard {
    fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), SendError> {
        Postcard::send(self, to, subject, body)
    }
}

/// The bound is checked in both directions and only once each way: the body may
/// use exactly the trait's methods, and a caller must pass a type that opted in.
/// Neither side has to look at the other.
pub fn send_confirmation<C: EmailClient>(client: &C, email: &str) -> Result<(), SendError> {
    client.send(email, "Confirm your subscription", "The link is inside")
}

/// `PartialOrd` rather than `Ord`, because `>` is all this needs and floats
/// can be compared but not totally ordered. Asking for the narrower capability
/// keeps `largest(&[2.5, 0.5])` legal.
pub fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut best = &list[0];
    for item in list {
        if item > best {
            best = item;
        }
    }
    best
}

/// Two format traits, two bounds. `where` rather than inline angle brackets is
/// a readability call and nothing more; the two spellings mean the same thing.
pub fn delivery_label<T>(value: &T) -> String
where
    T: fmt::Debug + fmt::Display,
{
    format!("{value} ({value:?})")
}

/// Identical machine code to `send_confirmation`. `impl EmailClient` in
/// argument position is an anonymous type parameter, so this is still
/// monomorphized once per concrete client.
pub fn send_reminder(client: &impl EmailClient, email: &str) -> Result<(), SendError> {
    client.send(email, "Reminder", "Your link is still valid")
}

/// `move` takes ownership of `name` into the closure, which is what lets the
/// returned value outlive this call. Borrowing instead would leave the closure
/// pointing at a dead local, and reading `name` rather than consuming it is
/// what keeps this an `Fn` instead of an `FnOnce`.
pub fn confirmation_email(name: String) -> impl Fn() -> String {
    move || format!("Hi {name}, confirm your subscription")
}

/// The runtime `if` is the entire reason for the `dyn`. Each arm boxes a
/// different concrete type, and both boxes have the same type here: a data
/// pointer plus a vtable pointer.
pub fn make_client(use_fake: bool, log: CallLog) -> Box<dyn EmailClient> {
    if use_fake {
        Box::new(RecordingClient::with_log(log))
    } else {
        Box::new(Postmark::with_log("secret-token", log))
    }
}

/// One compiled function for every client type there will ever be. The `&Box<dyn
/// EmailClient>` from the iterator derefs to the trait object, and each `send`
/// is an indirect call through that value's vtable.
pub fn broadcast(
    clients: &[Box<dyn EmailClient>],
    to: &str,
    subject: &str,
    body: &str,
) -> Result<(), SendError> {
    for client in clients {
        client.send(to, subject, body)?;
    }
    Ok(())
}

/// Measured, not asserted from memory. `&Postmark` is thin because the compiler
/// already knows where that type's `send` lives; erase the type and every
/// pointer to it grows a word for the vtable.
pub fn pointer_widths() -> (usize, usize) {
    (std::mem::size_of::<&Postmark>(), std::mem::size_of::<&dyn EmailClient>())
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SubscribeError {
    InvalidEmail(String),
    SendFailed(String),
}

/// `match` doing its exhaustive job: add a variant and this impl stops
/// compiling until the new case is worded, which is the property that keeps a
/// hand-written `Display` honest as the enum grows.
impl fmt::Display for SubscribeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidEmail(reason) => write!(f, "invalid subscriber email: {reason}"),
            Self::SendFailed(reason) => write!(f, "failed to send confirmation: {reason}"),
        }
    }
}

/// Derived `Default` recurses into the fields rather than inventing values, so
/// the defaults here are `u32`'s zero, `u64`'s zero, and `bool`'s false. When a
/// sensible default is not a zero, that is the signal to write the impl by hand.
#[derive(Debug, Default)]
pub struct RetryPolicy {
    pub attempts: u32,
    pub backoff_ms: u64,
    pub jitter: bool,
}

/// `Eq` and `Hash` derived together, in one line, is the cheapest way to keep
/// the "equal values hash equally" law true. `Eq` adds no methods; it is the
/// marker saying the equality here is total.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct SubscriberKey {
    pub email: String,
    pub list_id: u32,
}

impl SubscriberKey {
    pub fn new(email: &str, list_id: u32) -> Self {
        Self { email: email.to_string(), list_id }
    }
}

/// `PartialEq` and no `Eq`. Adding `Eq` would not compile, because the derive
/// requires every field to be `Eq` and `f64` is not, for the reason the test
/// asserts.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct OpenRate {
    pub value: f64,
}

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

/// The real service validates far harder; the shape is the point. `type Error`
/// is an associated type, so the impl fixes the error type once instead of
/// taking it as a generic parameter, and callers always know what a failure
/// looks like.
impl TryFrom<String> for SubscriberEmail {
    type Error = String;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        if value.contains('@') && !value.starts_with('@') {
            Ok(SubscriberEmail(value))
        } else {
            Err(format!("`{value}` is not a valid subscriber email"))
        }
    }
}

/// The reason moves across rather than being reformatted, so the low-level
/// detail survives to the log while the variant supplies the context. This is
/// the impl `thiserror`'s `#[from]` attribute writes for you.
impl From<SendError> for SubscribeError {
    fn from(error: SendError) -> Self {
        SubscribeError::SendFailed(error.reason)
    }
}

/// `map_err` on the first step and a bare `?` on the second, and the difference
/// is entirely about which conversions exist. Writing `From<String> for
/// SubscribeError` to make the first one implicit too would be a bad trade: it
/// would silently turn every stray `String` error in the crate into an invalid
/// email.
pub fn confirm_subscriber(
    client: &impl EmailClient,
    raw_email: String,
) -> Result<String, SubscribeError> {
    let email = SubscriberEmail::try_from(raw_email).map_err(SubscribeError::InvalidEmail)?;
    client.send(email.as_str(), "Confirm your subscription", "The link is inside")?;
    Ok(email.into_inner())
}

pub struct Recipients(pub Vec<SubscriberEmail>);

/// Legal because `Recipients` is defined here. The trait is foreign and the
/// `Vec` inside is foreign, but coherence only asks that one of the two names
/// in `impl Trait for Type` belongs to this crate.
impl fmt::Display for Recipients {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} confirmed recipients", self.0.len())
    }
}
