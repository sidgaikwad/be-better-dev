//! Reference solutions. Read these after you have something passing.
//!
//! Where a solution had a choice to make, the comment says which way it went
//! and why, since that judgment is the part worth copying.

/// Debug for honest test failures, Clone for the explicit duplicate the suite
/// asks for, PartialEq for field-by-field `==`. Copy is the one that cannot be
/// here: two Strings own heap buffers, and a bitwise duplicate of an owner is
/// exactly the double free the ownership rules exist to prevent.
#[derive(Debug, Clone, PartialEq)]
pub struct Subscriber {
    pub email: String,
    pub name: String,
    pub confirmed: bool,
}

impl Subscriber {
    pub fn new(email: &str, name: &str) -> Self {
        Self { email: email.to_string(), name: name.to_string(), confirmed: false }
    }

    /// `&self` borrows, so the caller keeps the subscriber. The returned slice
    /// points into the email the subscriber still owns, and its elided lifetime
    /// ties it to `&self`, so nobody can hold it past the subscriber's death.
    ///
    /// `split_once` rather than `split('@').nth(1)`: both work, but split_once
    /// says "at most one split" in the name, and returns the halves as a tuple
    /// the next lesson destructures.
    pub fn domain(&self) -> Option<&str> {
        self.email.split_once('@').map(|(_, domain)| domain)
    }

    /// `&mut self` is the exclusive borrow, spelled as a receiver. Returning ()
    /// rather than Self is deliberate: this is the in-place form, and a caller
    /// who wants a new value can build one instead.
    pub fn confirm(&mut self) {
        self.confirmed = true;
    }

    /// `self` consumes. Moving the two fields out costs nothing: no allocation,
    /// no copy of the text, just two String headers handed over. `confirmed` is
    /// dropped along with the husk of the struct.
    pub fn into_parts(self) -> (String, String) {
        (self.email, self.name)
    }
}

/// Named fields rather than positional ones because `Sent(String)` at a call
/// site does not say what the String is. The states are mutually exclusive by
/// construction: no value of this type carries both a message id and a bounce
/// reason, so the invalid combinations a struct-with-optional-fields would
/// allow simply have no representation here.
#[derive(Debug, Clone, PartialEq)]
pub enum Delivery {
    Queued,
    Sent { message_id: String },
    Bounced { reason: String },
}

impl Delivery {
    /// The `Sent` arm is the only place `message_id` exists, so it is the only
    /// arm that can return one. `_ =>` is honest here: the remaining variants
    /// genuinely share one behavior (they have no id), which is the case the
    /// match-exhaustive lesson allows the wildcard.
    pub fn message_id(&self) -> Option<&str> {
        match self {
            Delivery::Sent { message_id } => Some(message_id),
            _ => None,
        }
    }
}

/// 2 and 8. Every one of the 256 `u8` bit patterns is a legal value, so the
/// tag needs a byte of its own: 1 payload + 1 tag. A reference can never be
/// null, so that unused pattern is a niche the tag hides in, and `Option<&u8>`
/// is exactly the size of the bare reference. Wrapping a reference in Option
/// costs nothing.
pub fn option_sizes() -> (usize, usize) {
    (std::mem::size_of::<Option<u8>>(), std::mem::size_of::<Option<&u8>>())
}

/// Two fallible steps chained with `and_then`. `map` would have produced
/// `Option<Option<&str>>`, one layer per question asked; `and_then` flattens,
/// because the closure it takes already returns an Option.
///
/// The result borrows from `subs`, which is what the `'a` on the slice and the
/// return type says. `email` gets no named lifetime because nothing in the
/// output comes from it.
pub fn domain_for<'a>(subs: &'a [Subscriber], email: &str) -> Option<&'a str> {
    subs.iter().find(|sub| sub.email == email).and_then(Subscriber::domain)
}

/// Stay inside the Option while transforming, exit once with a fallback.
/// `unwrap_or_else` rather than `unwrap_or`: the fallback allocates a String,
/// and `unwrap_or` would build it on every call, including the ones that never
/// need it.
pub fn greeting_for(subs: &[Subscriber], email: &str) -> String {
    subs.iter()
        .find(|sub| sub.email == email)
        .map(|sub| format!("Welcome back, {}", sub.name))
        .unwrap_or_else(|| "Welcome, guest".to_string())
}

#[derive(Debug, PartialEq)]
pub enum ConfirmError {
    /// The token was not a number.
    Malformed(std::num::ParseIntError),
    /// A number, but no subscriber sits at that position.
    UnknownSubscriber(usize),
}

/// This impl is the entire mechanism behind `?`'s error conversion: the
/// operator calls `From::from` on the error on its way out, so one impl makes
/// every `parse()?` in the crate return a ConfirmError. Keeping the source
/// error inside the variant rather than discarding it is what lets a caller
/// print why the parse failed. `thiserror` writes impls like this for you.
impl From<std::num::ParseIntError> for ConfirmError {
    fn from(err: std::num::ParseIntError) -> Self {
        ConfirmError::Malformed(err)
    }
}

/// Two `?`s, no nesting, and the failure paths stay visible as single
/// characters. The first converts through the `From` impl above; the second
/// starts as the Option that `get_mut` returns and becomes a Result via
/// `ok_or`, which is where the error for "absent" gets named.
///
/// `ok_or_else` would be the choice if building the error were expensive.
/// `ConfirmError::UnknownSubscriber(index)` is a discriminant plus a usize, so
/// the eager form costs nothing worth avoiding.
pub fn confirm_by_token(subs: &mut [Subscriber], token: &str) -> Result<String, ConfirmError> {
    let index: usize = token.trim().parse()?;
    let subscriber = subs.get_mut(index).ok_or(ConfirmError::UnknownSubscriber(index))?;
    subscriber.confirm();
    Ok(subscriber.email.clone())
}

/// Every variant listed, no wildcard. The bindings pull each payload out in the
/// same stroke that identifies the variant, and `message_id` is nameable only
/// inside the arm where it exists.
///
/// The cost of a `_` arm here would not show up today. It would show up the day
/// a `Delivered` variant is added, when this function keeps compiling and
/// quietly reports the new state as whatever the wildcard said.
pub fn delivery_report(delivery: &Delivery) -> String {
    match delivery {
        Delivery::Queued => "waiting in the queue".to_string(),
        Delivery::Sent { message_id } => format!("delivered as {message_id}"),
        Delivery::Bounced { reason } => format!("bounced: {reason}"),
    }
}

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

/// The guarded 4xx arm has to come first: first match wins, so putting the
/// unguarded one above it would make the guarded arm unreachable, and the
/// compiler would warn (`unreachable_pattern`) rather than silently pick wrong.
///
/// `code @ 400..=499` binds the value the range matched so the arm can carry it
/// into the variant. Once the guarded arm has taken the retryable 4xx codes,
/// what is left of 4xx is final, so one `400..=599` arm covers it together with
/// 5xx rather than repeating the body. The last arm is a bare binding, which
/// matches everything remaining and is what makes this exhaustive over all
/// 65536 u16 values without a `_`.
pub fn classify(code: u16, retries_left: u32) -> Bounce {
    match code {
        200..=299 => Bounce::Accepted,
        code @ 400..=499 if retries_left > 0 => Bounce::Soft(code),
        code @ 400..=599 => Bounce::Hard(code),
        code => Bounce::Unknown(code),
    }
}

/// Two let-else guard clauses, then a flat happy path. Each `else` must
/// diverge, which is why they return; in exchange the bindings live in the
/// function's own scope rather than inside a nested block, and the interesting
/// code never indents.
///
/// The `if` at the end handles emptiness, which is a value check rather than a
/// shape check, and so is not a pattern's job.
pub fn parse_row(line: &str) -> Option<Subscriber> {
    let Some((email, name)) = line.split_once(',') else {
        return None;
    };
    let (email, name) = (email.trim(), name.trim());
    let Some((local, domain)) = email.split_once('@') else {
        return None;
    };
    if local.is_empty() || domain.is_empty() || name.is_empty() {
        return None;
    }
    Some(Subscriber::new(email, name))
}

/// `while let` drives the drain: `pop` hands back `Some` until the queue is
/// empty and `None` ends the loop, so the emptiness condition and the value are
/// one expression. `if let` inside handles the single case worth acting on.
///
/// `into_parts` is used rather than `sub.email.clone()`: the subscriber is
/// finished with, so moving the String out beats allocating a second one.
pub fn drain_rows(queue: &mut Vec<String>) -> Vec<String> {
    let mut emails = Vec::new();
    while let Some(line) = queue.pop() {
        if let Some(subscriber) = parse_row(&line) {
            let (email, _name) = subscriber.into_parts();
            emails.push(email);
        }
    }
    emails
}
