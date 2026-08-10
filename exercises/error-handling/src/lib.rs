//! Error handling in depth.
//!
//! Eight exercises across the section's six lessons. Run `cargo test -p
//! error-handling` to see what is red, then delete each `todo!()` and make the
//! suite pass.
//!
//! The section's examples lean on sqlx, reqwest, thiserror, and anyhow. This
//! crate has no dependencies, so it ships hand-rolled stand-ins for the foreign
//! error types, uses `Box<dyn Error + Send + Sync>` where the lesson reaches for
//! `anyhow::Error`, and asks you to write by hand what
//! `#[derive(thiserror::Error)]` would have generated. That last part is the
//! point: the derive writes `Display`, `Error`, and `From` impls, and you cannot
//! judge what it wrote for you until you have written them once yourself.
//!
//! Some exercises are type-level, so the test file for that lesson fails to
//! compile until you finish it. Work the other lessons meanwhile with
//! `cargo test --test err_two_audiences` and friends.

use std::error::Error;
use std::fmt;

// The layer below, provided complete. Read it, wrap it, leave it alone.

/// Stands in for `sqlx::Error`: the failure a database driver hands back. It
/// has a cause of its own, so every chain in this crate has somewhere to end.
#[derive(Debug)]
pub struct DatabaseError {
    pub message: String,
    pub cause: std::io::Error,
}

impl DatabaseError {
    /// The failure the exercises start from: a query that died when the
    /// connection to Postgres dropped underneath it.
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

/// Stands in for `reqwest::Error`: the call out to the email provider failed.
/// This one is a root cause, so it keeps the default `source` of `None`.
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

/// What one request produced: the status the user sees, and the error value the
/// operator is going to need. Provided complete.
#[derive(Debug)]
pub struct Outcome {
    pub status: u16,
    pub error: Option<StoreTokenError>,
}

/// Lesson: err-two-audiences
///
/// The handler in the lesson gets the user's half right and the operator's half
/// badly wrong:
///
/// ```text
/// if store_token(&mut transaction, subscriber_id, &token).await.is_err() {
///     return HttpResponse::InternalServerError().finish();
/// }
/// ```
///
/// `is_err()` reads the variant and throws the value away, so nothing about the
/// root cause survives to the request-level log. Write the version that leaves
/// the status the user receives exactly as it is on both paths, and hands the
/// error value onward for the operator.
pub fn store_token_outcome(_result: Result<(), StoreTokenError>) -> Outcome {
    todo!("one Result, two audiences: a status for the user, the value itself for the operator")
}

/// Lesson: err-error-trait
///
/// The storage layer's own error. It wraps the driver failure and says what the
/// operation meant in domain terms.
///
/// Give it two impls: `Display`, the one line an operator reads, and
/// `std::error::Error` with `source` returning the `DatabaseError` inside.
/// Both are required. The default `source` returns `None`, and a wrapper that
/// leaves it there severs the chain for every generic consumer, which is the
/// bug the lesson's predict-then-verify walks through.
#[derive(Debug)]
pub struct StoreTokenError(pub DatabaseError);

// TODO: impl fmt::Display for StoreTokenError
// TODO: impl Error for StoreTokenError, with source() handing back the wrapped cause

/// Lesson: err-error-trait
///
/// Walk a source chain and collect what each level says, starting with the
/// error you were handed and ending at the root cause. This is the lesson's
/// `error_chain_fmt` with the formatter swapped for a `Vec` so a test can
/// assert on it.
///
/// A `while let` over `source()` is the shape. The chain ends where `source`
/// returns `None`.
pub fn error_chain(_e: &dyn Error) -> Vec<String> {
    todo!("start at e, follow source() to the root, collecting each level's Display")
}

/// Lesson: err-layered-enums
///
/// The subscription layer's error vocabulary: one variant per way its pipeline
/// can fail, each wrapping the layer below.
#[derive(Debug)]
pub enum SubscribeError {
    Validation(String),
    Pool(DatabaseError),
    InsertSubscriber(DatabaseError),
    StoreToken(StoreTokenError),
    SendEmail(EmailError),
}

// Lesson: err-layered-enums
//
// Three of the five variants get a From impl, which is what lets `?` convert
// them on the way out of `subscribe` with nothing written at the call site.
//
// TODO: impl From<String> for SubscribeError, producing Validation
// TODO: impl From<StoreTokenError> for SubscribeError
// TODO: impl From<EmailError> for SubscribeError
//
// The other two do not get one, and cannot:
//
// COMPILE ERROR: error[E0119]: conflicting implementations of trait
//                `From<DatabaseError>` for type `SubscribeError`
//    |
//    | impl From<DatabaseError> for SubscribeError {
//    | ------------------------------------------- first implementation here
//    | ...
//    | impl From<DatabaseError> for SubscribeError {
//    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ conflicting implementation
//
//     impl From<DatabaseError> for SubscribeError {
//         fn from(e: DatabaseError) -> Self {
//             Self::Pool(e)
//         }
//     }
//
//     impl From<DatabaseError> for SubscribeError {
//         fn from(e: DatabaseError) -> Self {
//             Self::InsertSubscriber(e)
//         }
//     }
//
// From dispatches on the type alone, and the type alone does not say which
// operation failed. Where the type is ambiguous, name the operation at the call
// site in `subscribe` instead.

/// The fallible steps of the pipeline, pre-baked so the exercise is about
/// propagation rather than about I/O. Provided complete.
pub struct SubscribeSteps {
    /// Validating the form: `Ok(email)`, or `Err(message)` written for the user.
    pub validate: Result<String, String>,
    /// Acquiring a connection and opening a transaction.
    pub begin: Result<(), DatabaseError>,
    /// Inserting the subscriber row, yielding its id.
    pub insert: Result<u64, DatabaseError>,
    /// Storing the confirmation token.
    pub store_token: Result<(), StoreTokenError>,
    /// Sending the confirmation email.
    pub send_email: Result<(), EmailError>,
}

impl SubscribeSteps {
    /// Every step succeeds. Tests start here and break one step at a time.
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

/// Lesson: err-layered-enums
///
/// Run the pipeline: validate the form, open a transaction, insert the
/// subscriber, store the confirmation token, send the confirmation email. Stop
/// at the first failure and report it as a `SubscribeError`.
///
/// Write the body flat, one `?` per step and no nested matches. Two of the five
/// steps fail as the same `DatabaseError`, so `?` alone cannot tell them apart:
/// name the operation there with `map_err`. An enum variant constructor is a
/// plain function, so it can be passed to `map_err` directly.
pub fn subscribe(_steps: SubscribeSteps) -> Result<Subscriber, SubscribeError> {
    todo!("five steps, five `?`, no nesting")
}

// Lesson: err-thiserror
//
// Write by hand what `#[derive(thiserror::Error)]` would have generated for the
// enum above. It is two impls:
//
//   - `fmt::Display`, one arm per variant. `Validation` carries a message
//     already written for its reader, so it displays exactly that string, which
//     is all `#[error("{0}")]` means. Every other arm is this layer's own
//     sentence about what it was trying to do, and `Pool` and
//     `InsertSubscriber` need different sentences even though they hold the
//     same type: telling those two operations apart in the report is the entire
//     reason they are two variants.
//   - `Error`, whose `source` hands back the wrapped cause per variant.
//     `Validation` holds a `String`, which does not implement `Error` and so
//     cannot sit in a chain: its source is `None`. That absence is what
//     thiserror encodes by leaving `#[source]` off a field.
//
// The derive is a compile-time macro. It receives the enum as tokens, computes
// this same text, and hands it back for the compiler to compile. Nothing of it
// survives to runtime.
//
// TODO: impl fmt::Display for SubscribeError
// TODO: impl Error for SubscribeError

/// An opaque error, the stand-in for `anyhow::Error`. Its holder gets
/// `Display`, `Debug`, and the source chain, and nothing to match on. That
/// opacity is the design: it says in the type system that this failure is for
/// reporting, not for reacting to. `Send + Sync + 'static` is what lets it cross
/// thread and task boundaries.
pub type BoxError = Box<dyn Error + Send + Sync + 'static>;

/// Lesson: err-anyhow-opaque
///
/// One layer of added meaning over an opaque error: your message on top, the
/// original underneath.
///
/// Give it `Display`, which prints the message and nothing else, and `Error`,
/// whose `source` is the error it wrapped. The `source` is the half worth
/// getting right: going opaque must not shorten the chain, or the operator's
/// report loses everything below this line.
#[derive(Debug)]
pub struct ContextError {
    pub message: String,
    pub cause: BoxError,
}

// TODO: impl fmt::Display for ContextError
// TODO: impl Error for ContextError

/// Lesson: err-anyhow-opaque
///
/// anyhow's `.context(...)` is not a method on the error type. It is an
/// extension trait implemented for `Result` itself, which is why it reads as
/// `pool.begin().context("...")?` right at the call site, a pattern you will
/// meet across the ecosystem.
///
/// Implement it once, blanket, for every `Result` whose error can be boxed.
pub trait Context<T> {
    /// Convert the error into an opaque one and layer `message` over it,
    /// keeping the original as `source`.
    fn context(self, message: &str) -> Result<T, BoxError>;
}

// TODO: impl<T, E> Context<T> for Result<T, E> where E: Error + Send + Sync + 'static

/// Lesson: err-anyhow-opaque
///
/// The error `subscribe` should have been exposing all along. `SubscribeError`
/// is a tour of the function's implementation: five variants, four of them
/// naming a helper the caller has never heard of, all of them changing the day
/// somebody splits the insert in two. Ask instead what a caller can actually do
/// differently, and the answer is two things. The input was rejected, so tell
/// the user. Or something unexpected broke, so give up and report.
///
/// `Validation` is worth naming because somebody reacts to it. The rest is
/// worth boxing.
#[derive(Debug)]
pub enum SubscriptionError {
    Validation(String),
    Unexpected(BoxError),
}

// Lesson: err-anyhow-opaque
//
// Three impls finish the collapse:
//
//   - `fmt::Display`. `Validation` shows its message. `Unexpected` has no
//     vocabulary of its own, so it forwards to the error it wraps.
//   - `Error`. `Validation` has no source. `Unexpected` forwards too, and
//     forwarding here means returning the wrapped error's *source*, not the
//     wrapped error itself: a layer that says nothing should not appear in the
//     report at all. thiserror spells this whole paragraph `#[error(transparent)]`.
//   - `From<SubscribeError>`. `Validation` maps across; every other variant is
//     boxed whole into `Unexpected`. Boxing is not discarding: the
//     `SubscribeError` keeps its own `Display` and its own `source` inside the
//     box, so the chain that reaches the log is exactly as long as it was.
//
// TODO: impl fmt::Display for SubscriptionError
// TODO: impl Error for SubscriptionError
// TODO: impl From<SubscribeError> for SubscriptionError

/// What the edge sent back: the status code, the body the user reads, and the
/// one log record the operator reads. Provided complete.
#[derive(Debug)]
pub struct HttpResponse {
    pub status: u16,
    pub body: String,
    pub log: Option<String>,
}

impl SubscriptionError {
    /// Lesson: err-web-boundary
    ///
    /// The status code this failure becomes at the edge. actix-web asks the
    /// error itself, through `ResponseError::status_code`; axum asks through
    /// `IntoResponse`. Either way the decision lives in one match, here, and
    /// nowhere else in the codebase.
    ///
    /// 400 for what the user caused and can fix, 500 for what they cannot act
    /// on. Match every variant rather than leaning on a default: an exhaustive
    /// match is what stops a variant added next quarter from silently
    /// inheriting somebody else's status code.
    pub fn status(&self) -> u16 {
        todo!("one match, one decision per variant, no wildcard")
    }
}

/// Lesson: err-web-boundary
///
/// The whole section in one function. Run the pipeline, collapse the failure
/// into the error the edge understands, and answer all three audiences from
/// that one value:
///
/// - the caller gets a status code;
/// - the user gets a body, which for a failure they can fix is the message that
///   tells them how, and for anything else is empty. Internal detail in a
///   response body helps nobody and helps an attacker;
/// - the operator gets exactly one record: the full source chain, each level on
///   its own line, root cause last.
///
/// On success there is no record at all. Errors are logged where they are
/// handled, and this is the only place in the crate that handles one: every
/// layer below propagated with `?` and only added context on the way up.
pub fn handle_subscribe(_steps: SubscribeSteps) -> HttpResponse {
    todo!("status for the caller, body for the user, one record for the operator")
}
