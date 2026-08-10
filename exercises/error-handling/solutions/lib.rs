//! Reference solutions. Read these after you have something passing.
//!
//! Where a solution had a choice to make, the comment says which way it went
//! and why, since that judgment is the part worth copying.

use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub struct DatabaseError {
    pub message: String,
    pub cause: std::io::Error,
}

impl DatabaseError {
    pub fn connection_reset() -> Self {
        Self {
            message: "connection closed mid-query".to_string(),
            cause: std::io::Error::new(
                std::io::ErrorKind::ConnectionReset,
                "connection reset by peer",
            ),
        }
    }
}

impl fmt::Display for DatabaseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "error returned from database: {}", self.message)
    }
}

impl Error for DatabaseError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        Some(&self.cause)
    }
}

#[derive(Debug)]
pub struct EmailError {
    pub status: u16,
}

impl fmt::Display for EmailError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "the email API responded with {}", self.status)
    }
}

impl Error for EmailError {}

#[derive(Debug)]
pub struct Outcome {
    pub status: u16,
    pub error: Option<StoreTokenError>,
}

/// The status is identical to what `is_err()` produced, because the user's half
/// was never the problem. The difference is the second field: matching binds
/// the error value instead of collapsing it to a bool, and the value is what
/// the operator's report will be built from further up.
pub fn store_token_outcome(result: Result<(), StoreTokenError>) -> Outcome {
    match result {
        Ok(()) => Outcome { status: 200, error: None },
        Err(e) => Outcome { status: 500, error: Some(e) },
    }
}

#[derive(Debug)]
pub struct StoreTokenError(pub DatabaseError);

/// Display states what the operation meant, in this layer's vocabulary. It says
/// nothing about connections or queries: the cause underneath already does, and
/// repeating it here would add a line to the report without adding information.
impl fmt::Display for StoreTokenError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "A database failure was encountered while trying to store a subscription token.")
    }
}

/// The wrapped error is physically inside the struct either way, and derived
/// Debug would show it. Wiring `source` is what makes it reachable *generically*,
/// which is the only form every consumer of the chain can use.
impl Error for StoreTokenError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        Some(&self.0)
    }
}

/// Taking `&dyn Error` rather than `&impl Error` is deliberate: the walk needs
/// nothing but the vtable, and a trait object accepts the links of a chain,
/// which arrive already erased.
pub fn error_chain(e: &dyn Error) -> Vec<String> {
    let mut chain = vec![e.to_string()];
    let mut current = e.source();
    while let Some(cause) = current {
        chain.push(cause.to_string());
        current = cause.source();
    }
    chain
}

#[derive(Debug)]
pub enum SubscribeError {
    Validation(String),
    Pool(DatabaseError),
    InsertSubscriber(DatabaseError),
    StoreToken(StoreTokenError),
    SendEmail(EmailError),
}

/// Each of these exists because the target variant is the only sensible home
/// for that type. Where that stops being true, as it does for `DatabaseError`,
/// the impl stops being writable.
impl From<String> for SubscribeError {
    fn from(message: String) -> Self {
        Self::Validation(message)
    }
}

impl From<StoreTokenError> for SubscribeError {
    fn from(e: StoreTokenError) -> Self {
        Self::StoreToken(e)
    }
}

impl From<EmailError> for SubscribeError {
    fn from(e: EmailError) -> Self {
        Self::SendEmail(e)
    }
}

// COMPILE ERROR: error[E0119]: conflicting implementations of trait
//                `From<DatabaseError>` for type `SubscribeError`
//
// Two impls of From<DatabaseError> cannot coexist, so `begin` and `insert` are
// distinguished at the call site below instead. Collapsing them into one shared
// DatabaseError variant would compile and would cost the report: one Display
// string would have to describe three different operations.

pub struct SubscribeSteps {
    pub validate: Result<String, String>,
    pub begin: Result<(), DatabaseError>,
    pub insert: Result<u64, DatabaseError>,
    pub store_token: Result<(), StoreTokenError>,
    pub send_email: Result<(), EmailError>,
}

impl SubscribeSteps {
    pub fn all_ok() -> Self {
        Self {
            validate: Ok("ada@example.com".to_string()),
            begin: Ok(()),
            insert: Ok(42),
            store_token: Ok(()),
            send_email: Ok(()),
        }
    }
}

#[derive(Debug, PartialEq)]
pub struct Subscriber {
    pub id: u64,
    pub email: String,
}

/// Five fallible steps, five lines, no nesting. Three of them lean on a From
/// impl and read as bare `?`; the two that fail as the same type name the
/// operation with `map_err`, passing the variant constructor as the function it
/// already is. Both forms still return on the first Err, so a later broken step
/// never runs.
pub fn subscribe(steps: SubscribeSteps) -> Result<Subscriber, SubscribeError> {
    let email = steps.validate?;
    steps.begin.map_err(SubscribeError::Pool)?;
    let id = steps.insert.map_err(SubscribeError::InsertSubscriber)?;
    steps.store_token?;
    steps.send_email?;
    Ok(Subscriber { id, email })
}

/// One arm per variant, and every arm is a decision: which sentence an operator
/// reads when this step is the one that died. `Pool` and `InsertSubscriber`
/// hold the same type and get different sentences, which is the payoff for
/// having kept them apart.
impl fmt::Display for SubscribeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SubscribeError::Validation(message) => write!(f, "{message}"),
            SubscribeError::Pool(_) => {
                write!(f, "Failed to acquire a Postgres connection from the pool.")
            }
            SubscribeError::InsertSubscriber(_) => {
                write!(f, "Failed to insert new subscriber in the database.")
            }
            SubscribeError::StoreToken(_) => {
                write!(f, "Failed to store the confirmation token for a new subscriber.")
            }
            SubscribeError::SendEmail(_) => write!(f, "Failed to send a confirmation email."),
        }
    }
}

/// Validation returns None because a String cannot be a link in a chain, not
/// because the information is unimportant: its Display already carries it. The
/// two DatabaseError arms share a pattern, since the source is the same shape
/// even where the message is not.
impl Error for SubscribeError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            SubscribeError::Validation(_) => None,
            SubscribeError::Pool(e) | SubscribeError::InsertSubscriber(e) => Some(e),
            SubscribeError::StoreToken(e) => Some(e),
            SubscribeError::SendEmail(e) => Some(e),
        }
    }
}

pub type BoxError = Box<dyn Error + Send + Sync + 'static>;

#[derive(Debug)]
pub struct ContextError {
    pub message: String,
    pub cause: BoxError,
}

impl fmt::Display for ContextError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

/// The message is this layer's contribution and the wrapped error is everything
/// below it. Returning it from `source` is what makes `.context(...)` an
/// addition to the report rather than a replacement for it.
impl Error for ContextError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        Some(&*self.cause)
    }
}

pub trait Context<T> {
    fn context(self, message: &str) -> Result<T, BoxError>;
}

/// One blanket impl covers every error in the crate and every error in the
/// ecosystem that meets the bound. The bound is what the opaque type demands:
/// boxing erases the concrete type, so the traits that must survive erasure
/// have to be required up front.
impl<T, E> Context<T> for Result<T, E>
where
    E: Error + Send + Sync + 'static,
{
    fn context(self, message: &str) -> Result<T, BoxError> {
        self.map_err(|e| {
            let wrapped = ContextError { message: message.to_string(), cause: Box::new(e) };
            let boxed: BoxError = Box::new(wrapped);
            boxed
        })
    }
}

#[derive(Debug)]
pub enum SubscriptionError {
    Validation(String),
    Unexpected(BoxError),
}

impl fmt::Display for SubscriptionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SubscriptionError::Validation(message) => write!(f, "{message}"),
            // Transparent: this variant exists to give a failure a slot, not to
            // describe it. Adding a message here would put a sentence in the
            // report that no layer actually authored.
            SubscriptionError::Unexpected(e) => write!(f, "{e}"),
        }
    }
}

impl Error for SubscriptionError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            SubscriptionError::Validation(_) => None,
            // Not `Some(&**e)`. Display already showed the wrapped error, so
            // returning it here would repeat that line and lengthen the chain
            // by a layer that said nothing. Forwarding its source skips this
            // level entirely, which is exactly what transparent means.
            SubscriptionError::Unexpected(e) => e.source(),
        }
    }
}

/// The abstraction boundary, written out. One variant survives because a caller
/// behaves differently for it; the other four are indistinguishable to anyone
/// outside `subscribe` and go in the box whole, Display, source, and all.
impl From<SubscribeError> for SubscriptionError {
    fn from(e: SubscribeError) -> Self {
        match e {
            SubscribeError::Validation(message) => SubscriptionError::Validation(message),
            other => SubscriptionError::Unexpected(Box::new(other)),
        }
    }
}

#[derive(Debug)]
pub struct HttpResponse {
    pub status: u16,
    pub body: String,
    pub log: Option<String>,
}

impl SubscriptionError {
    /// Two variants, two arms, no wildcard. The wildcard is the tempting part
    /// and the part to refuse: it is what would let a third variant ship next
    /// quarter with a status code nobody chose for it.
    pub fn status(&self) -> u16 {
        match self {
            SubscriptionError::Validation(_) => 400,
            SubscriptionError::Unexpected(_) => 500,
        }
    }
}

/// Body and log are built from the same error value and share nothing, which is
/// the two-audiences table with a cell filled in per line. The log is written
/// here and only here: every function below returned its failure instead of
/// logging it, so one incident produces one record.
pub fn handle_subscribe(steps: SubscribeSteps) -> HttpResponse {
    let error = match subscribe(steps) {
        Ok(_) => return HttpResponse { status: 200, body: String::new(), log: None },
        Err(e) => SubscriptionError::from(e),
    };

    let body = match &error {
        // The one person who can fix this is reading the body, so it says how.
        SubscriptionError::Validation(message) => message.clone(),
        // Nothing here is actionable by the user, and the details would be a
        // gift to an attacker. The status code is the whole message.
        SubscriptionError::Unexpected(_) => String::new(),
    };

    HttpResponse { status: error.status(), body, log: Some(error_chain(&error).join("\n")) }
}
