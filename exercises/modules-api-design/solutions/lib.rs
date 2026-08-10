//! Reference solutions. Read these after you have something passing.
//!
//! Almost every choice in this section is a design choice rather than a correct
//! answer, so the comments say which way each one went and why. That judgment is
//! the part worth copying.

use std::time::Duration;

// Lesson: mod-module-tree.
//
// Two lines, and they do different jobs. `mod issues;` joins the files under
// src/issues/ to the crate and fixes their canonical paths at
// `crate::issues::...`. It is not `pub mod`, so no caller can walk that tree.
//
// `pub use` then publishes the two items at the crate root. Callers get a flat
// namespace, the directory underneath is free to grow, and rustdoc documents the
// items where they are re-exported rather than where they happen to live.
// `pub use issues::*;` would also compile; naming the items keeps the crate's
// public surface something you can read off a single line.
mod issues;

pub use issues::{slug_module_path, slugify};

mod secrets {
    /// Crate-private, inside a private module. Reachable from anywhere in this
    /// crate, invisible to `tests/` and to any downstream user, so its name and
    /// signature can change in a patch release without breaking anyone.
    ///
    /// Revealing nothing for short tokens is deliberate: a four character
    /// secret shown in full is still a leak.
    pub(crate) fn mask_token(token: &str) -> String {
        let total = token.chars().count();
        let hidden = if total > 4 { total - 4 } else { total };
        let mut masked = "*".repeat(hidden);
        masked.extend(token.chars().skip(hidden));
        masked
    }
}

/// The public half of the pair. Callers get the formatted summary; the masking
/// rule stays an implementation detail that can be tightened later without a
/// major version bump.
pub fn settings_summary(name: &str, token: &str) -> String {
    format!("{name}: {}", secrets::mask_token(token))
}

/// `impl AsRef<str>` is the widest reasonable front door: `&str`, `String`,
/// `&String`, and anything else that can lend a `&str` all pass through one
/// signature, and none of them has to clone to get here. Inside a crate a plain
/// `&str` would be simpler and would still take two of the three; the bound
/// earns its keep on boundary functions like this one.
///
/// `#[must_use]` because the returned value is the entire point of the call.
#[must_use]
pub fn normalize_name(name: impl AsRef<str>) -> String {
    name.as_ref().trim().to_string()
}

/// `&[String]` rather than `&Vec<String>`. A vector reference deref-coerces to
/// a slice for free, so nothing is lost, and arrays and sub-slices become legal
/// arguments instead of compile errors. Narrowing the parameter widened the API.
pub fn total_len(parts: &[String]) -> usize {
    parts.iter().map(String::len).sum()
}

#[derive(Debug, Clone, PartialEq)]
pub struct SubscriberEmail(String);

impl SubscriberEmail {
    /// The whole design rests on the field being private: this function is the
    /// only origin of a `SubscriberEmail` outside this module, so holding one is
    /// proof the checks ran. Returning `Result` rather than panicking says the
    /// failure is expected input, not a bug.
    ///
    /// The message quotes the input because an error a log cannot act on is
    /// half an error.
    pub fn parse(raw: String) -> Result<Self, String> {
        let parts: Vec<&str> = raw.split('@').collect();
        let well_formed = parts.len() == 2
            && !parts[0].is_empty()
            && !parts[1].is_empty()
            && !raw.chars().any(char::is_whitespace);

        if well_formed {
            Ok(Self(raw))
        } else {
            Err(format!("{raw} is not a valid subscriber email."))
        }
    }

    /// A view. The elided lifetime ties the `&str` to `&self`, so the compiler
    /// stops anyone holding it past the wrapper's life. Costs nothing: the
    /// newtype has the same layout as the `String` inside it.
    pub fn as_str(&self) -> &str {
        &self.0
    }

    /// The handover. Consuming `self` moves the `String` out rather than
    /// copying it, and the caller leaves with a plain value and no wrapper.
    pub fn into_inner(self) -> String {
        self.0
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct SubscriberName(String);

impl SubscriberName {
    /// Storing the trimmed text rather than the raw input means the
    /// normalization happens once, at the boundary, and every later reader gets
    /// the clean value. That is the "parse, don't validate" half of the lesson:
    /// the type holds the result of the check, not a note that one was made.
    ///
    /// Counting `chars()` is a simplification. Real code counts grapheme
    /// clusters, since a user-visible character can span several chars.
    pub fn parse(raw: String) -> Result<Self, String> {
        let trimmed = raw.trim();
        let forbidden = ['/', '(', ')', '"', '<', '>', '\\', '{', '}'];

        if trimmed.is_empty() {
            return Err(format!("{raw:?} is not a valid subscriber name."));
        }
        if trimmed.chars().count() > 256 {
            return Err(format!("{trimmed:?} is longer than the 256 characters allowed."));
        }
        if trimmed.chars().any(|ch| forbidden.contains(&ch)) {
            return Err(format!("{trimmed:?} contains a forbidden character."));
        }

        Ok(Self(trimmed.to_string()))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Two parameters, two distinct types. The swap that type-checked when both
/// were `String` is now `error[E0308]: mismatched types`, caught at the call
/// site instead of in the outbox.
pub fn welcome_line(email: &SubscriberEmail, name: &SubscriberName) -> String {
    format!("Welcome, {}. Confirmations go to {}.", name.as_str(), email.as_str())
}

/// Debug is derived, not skipped: the API guidelines ask every public type for
/// it, and `expect_err` in the suite cannot print a Result without it.
#[derive(Debug)]
pub struct EmailClient {
    base_url: String,
    sender: SubscriberEmail,
    timeout: Duration,
    retries: u32,
}

impl EmailClient {
    /// Required inputs are parameters, options are methods. The defaults live
    /// here and nowhere else, so there is one line to change when 10 seconds
    /// turns out to be wrong.
    pub fn builder(base_url: String, sender: SubscriberEmail) -> EmailClientBuilder {
        EmailClientBuilder {
            base_url,
            sender,
            timeout: Duration::from_secs(10),
            retries: 3,
        }
    }

    /// Accessors, not `pub` fields. Public fields would let a caller edit a
    /// base URL that `build` already vetted, which is the invariant the newtype
    /// lesson spent its time defending.
    pub fn base_url(&self) -> &str {
        &self.base_url
    }

    pub fn sender(&self) -> &SubscriberEmail {
        &self.sender
    }

    /// `Duration` and `u32` are `Copy`, so these hand back values. Returning
    /// `&Duration` would borrow the client for as long as the caller kept it,
    /// for no gain.
    pub fn timeout(&self) -> Duration {
        self.timeout
    }

    pub fn retries(&self) -> u32 {
        self.retries
    }
}

#[derive(Debug)]
pub struct EmailClientBuilder {
    base_url: String,
    sender: SubscriberEmail,
    timeout: Duration,
    retries: u32,
}

impl EmailClientBuilder {
    /// `self -> Self` rather than `&mut self`. Chains read as one expression,
    /// and a builder that has been used is moved-from, so a stale one cannot be
    /// built twice by accident. The move is a handful of stack words that the
    /// optimizer routinely erases.
    #[must_use]
    pub fn timeout(mut self, timeout: Duration) -> Self {
        self.timeout = timeout;
        self
    }

    #[must_use]
    pub fn retries(mut self, retries: u32) -> Self {
        self.retries = retries;
        self
    }

    /// Validation waits until here because a half-configured builder is not
    /// wrong yet. Rejecting at `build` also keeps the setters infallible, which
    /// is what lets them chain.
    pub fn build(self) -> Result<EmailClient, String> {
        if !self.base_url.starts_with("https://") {
            return Err(format!("{} is not an https base url.", self.base_url));
        }
        if self.retries > 5 {
            return Err(format!("{} is more retries than the 5 this client allows.", self.retries));
        }

        Ok(EmailClient {
            base_url: self.base_url,
            sender: self.sender,
            timeout: self.timeout,
            retries: self.retries,
        })
    }
}

/// Shorten `body` to at most `max_chars` characters for a preview line.
///
/// Returns the text unchanged when it already fits. When it does not, the
/// result is the first `max_chars` characters followed by `"..."`. Counts
/// characters, not bytes, so a multi-byte character is never cut in half.
///
/// # Examples
///
/// ```rust
/// # use modules_api_design::preview;
/// assert_eq!(preview("welcome aboard", 7), "welcome...");
/// assert_eq!(preview("hi", 7), "hi");
/// ```
///
/// # Panics
///
/// Panics with `max_chars must be greater than zero` when `max_chars` is 0. A
/// preview of nothing is a caller bug, not a runtime condition.
///
/// The example above is compiled and run by `cargo test`, as its own crate
/// linked against this library. That is why it can only reach public API, and
/// why it cannot drift: change the behaviour and the doc test goes red with
/// everything else.
pub fn preview(body: &str, max_chars: usize) -> String {
    assert!(max_chars > 0, "max_chars must be greater than zero");

    // Counting chars twice rather than slicing bytes. `&body[..max_chars]` is
    // the tempting one-liner and it panics on a multi-byte boundary.
    if body.chars().count() <= max_chars {
        return body.to_string();
    }

    let mut short: String = body.chars().take(max_chars).collect();
    short.push_str("...");
    short
}
