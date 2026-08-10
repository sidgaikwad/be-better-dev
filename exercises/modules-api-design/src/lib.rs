//! Modules, visibility, API design.
//!
//! Eight exercises across the section's six lessons. Run `cargo test -p
//! modules-api-design` to see what is red, then delete each `todo!()` and make
//! the suite pass.
//!
//! This section is about the shape of an API rather than the work behind it, so
//! the suite in `tests/` is the contract. Integration tests compile as their own
//! crate and see exactly what a user of the library sees: a name they can import
//! is a name you published, a name they cannot reach is one you kept. Two of the
//! files do not compile until a signature widens or an item is re-exported. That
//! is the exercise, and the error is the lesson.

use std::time::Duration;

// ---------------------------------------------------------------------------
// Lesson: mod-module-tree
//
// `src/issues/mod.rs` and `src/issues/slug.rs` are on disk, complete, and the
// compiler has never opened them. A file under `src/` is inert until a module
// declares it, which is why `cargo check` is clean today and rust-analyzer grays
// those files out with "file not included in module tree".
//
// Two lines belong here. The first mounts the directory as a module of this
// crate root, which is also what fixes the canonical path of everything inside
// it. The second republishes what that module exports, `slugify` and
// `slug_module_path`, at the crate root, so that `tests/mod_module_tree.rs`
// reaches them through `use modules_api_design::*`.
//
// Leave the module declaration itself private. The tests should be able to name
// the items without naming the tree: that decoupling is what lets you rename the
// file behind the facade later and change nothing for a caller.
// ---------------------------------------------------------------------------

// TODO: mount the module that lives in src/issues/
// TODO: re-export its two items at the crate root

// ---------------------------------------------------------------------------
// Lesson: mod-visibility
// ---------------------------------------------------------------------------

mod secrets {
    /// Lesson: mod-visibility
    ///
    /// Mask an API token for display. Keep the last four characters, replace
    /// every character before them with `*`, one star per hidden character. A
    /// token of four characters or fewer reveals nothing: stars all the way.
    ///
    /// This helper is `pub(crate)`, inside a private module. Anything in this
    /// crate may call it; `tests/` cannot see it at all, and neither can a
    /// downstream user. Promoting it to `pub` would add it to the contract you
    /// have to keep, and every `pub` you withhold is a promise you did not make.
    ///
    /// Until `settings_summary` calls it, `cargo build` warns that this
    /// function is never used. That lint only works because privacy makes the
    /// claim provable: a `pub` item might have a caller the compiler cannot see.
    pub(crate) fn mask_token(_token: &str) -> String {
        todo!("star out the head, keep the tail")
    }
}

/// Lesson: mod-visibility
///
/// Format a one-line settings summary, `"<name>: <masked token>"`.
///
/// This is the only way the tests can observe the masking, because the helper
/// that does it is crate-private. Publish the outcome, keep the mechanism: call
/// `secrets::mask_token` rather than re-implementing it here.
pub fn settings_summary(_name: &str, _token: &str) -> String {
    todo!("delegate to the crate-private helper")
}

// ---------------------------------------------------------------------------
// Lesson: mod-signatures
// ---------------------------------------------------------------------------

/// Lesson: mod-signatures
///
/// Trim the whitespace around a subscriber's name and return the owned result.
///
/// The signature below is the one the lesson opens with, and it is wrong: it
/// takes ownership of a value it only reads, so every caller that still needs
/// its `String` has to clone first. Widen the parameter until all three shapes
/// in `tests/mod_signatures.rs` compile: `&str`, `String`, and `&String`.
/// Plain `&str` gets two of the three. One bound gets all three, and it is the
/// bound `File::open` uses to accept four path types through one door.
///
/// Add `#[must_use]` while you are here. Discarding the result of a pure
/// transform is always a bug, and the compiler will say so for free.
pub fn normalize_name(_name: String) -> String {
    todo!("borrow in, own out: widen the parameter, keep the return type")
}

/// Lesson: mod-signatures
///
/// Sum the lengths in bytes of every part.
///
/// `&Vec<String>` accepts exactly one shape: a reference to a vector. The test
/// also passes an array and a sub-slice, which hold the same elements in the
/// same layout and are rejected out of hand. One narrower type admits all
/// three, and it is the universal front door for contiguous data.
pub fn total_len(_parts: &Vec<String>) -> usize {
    todo!("what does &Vec<T> refuse that its slice does not?")
}

// ---------------------------------------------------------------------------
// Lesson: mod-newtypes
// ---------------------------------------------------------------------------

/// Lesson: mod-newtypes
///
/// A validated subscriber email.
///
/// The field is private and stays private: that is the entire guarantee.
/// Outside this crate the only way to obtain a `SubscriberEmail` is `parse`, so
/// possession is proof that validation ran, and functions downstream can drop
/// their defensive re-checks.
#[derive(Debug, Clone, PartialEq)]
pub struct SubscriberEmail(String);

impl SubscriberEmail {
    /// Lesson: mod-newtypes
    ///
    /// Parse a raw address. Valid means: exactly one `@`, a non-empty part on
    /// each side of it, and no whitespace anywhere.
    ///
    /// Takes `String` by value because it stores the value (deliberate
    /// consumption is the exception to borrow-in), and returns `Result` because
    /// bad user input is expected rather than a bug.
    ///
    /// # Errors
    ///
    /// Returns `Err` for anything that fails the rules above. The message must
    /// quote the input it rejected, so a log line says which address was wrong.
    pub fn parse(_raw: String) -> Result<Self, String> {
        todo!("validate, then wrap; there is no other way in")
    }

    /// Lesson: mod-newtypes
    ///
    /// Lend the inner text out as a view. Borrows `self`, allocates nothing.
    pub fn as_str(&self) -> &str {
        todo!("a view into what the struct already owns")
    }

    /// Lesson: mod-newtypes
    ///
    /// Hand the inner `String` over, consuming the wrapper. The `into_` prefix
    /// is the convention that tells a reader which receiver they got.
    pub fn into_inner(self) -> String {
        todo!("a self receiver consumes; give the field away")
    }
}

/// Lesson: mod-newtypes
///
/// A validated subscriber name. Same construction privilege as the email above,
/// and a different type, which is the point: two `String` parameters can be
/// swapped at a call site and two newtypes cannot.
#[derive(Debug, Clone, PartialEq)]
pub struct SubscriberName(String);

impl SubscriberName {
    /// Lesson: mod-newtypes
    ///
    /// Parse a raw name. Trim it first and store the trimmed text. Valid means:
    /// not empty once trimmed, at most 256 characters, and free of the
    /// characters that break rendering downstream: `/ ( ) " < > \ { }`.
    ///
    /// # Errors
    ///
    /// Returns `Err` naming the rejected input when any rule above fails.
    pub fn parse(_raw: String) -> Result<Self, String> {
        todo!("trim, check, wrap")
    }

    /// Lesson: mod-newtypes
    ///
    /// Lend the inner text out as a view.
    pub fn as_str(&self) -> &str {
        todo!("a view into what the struct already owns")
    }
}

/// Lesson: mod-newtypes
///
/// Build the welcome line: `"Welcome, <name>. Confirmations go to <email>."`
///
/// Both parameters are borrowed views of already-validated values, and their
/// types are different, so the argument swap that the lesson opens with becomes
/// a compile error instead of an email to the wrong address.
pub fn welcome_line(_email: &SubscriberEmail, _name: &SubscriberName) -> String {
    todo!("format the two accessors into one line")
}

// ---------------------------------------------------------------------------
// Lesson: mod-builders
// ---------------------------------------------------------------------------

/// Lesson: mod-builders
///
/// A configured email client.
///
/// Its fields are private and it has no public constructor, so every value of
/// this type came through `build` and satisfies whatever `build` checks.
///
/// `Debug` is derived because the API guidelines ask every public type for it,
/// and because `Result<EmailClient, String>` cannot be unwrapped without it.
#[derive(Debug)]
pub struct EmailClient {
    // TODO: the private fields `build` fills in. The accessors below say what
    // they have to be.
}

impl EmailClient {
    /// Lesson: mod-builders
    ///
    /// Start building a client. The two required inputs are ordinary
    /// parameters, which is why they cannot be forgotten, and the defaults for
    /// everything else are set here, in one place: a 10 second timeout and 3
    /// retries.
    pub fn builder(_base_url: String, _sender: SubscriberEmail) -> EmailClientBuilder {
        todo!("seed the builder with the required values and the defaults")
    }

    /// Lesson: mod-builders
    pub fn base_url(&self) -> &str {
        todo!("a view into the client's own string")
    }

    /// Lesson: mod-builders
    pub fn sender(&self) -> &SubscriberEmail {
        todo!("a view, not a clone")
    }

    /// Lesson: mod-builders
    pub fn timeout(&self) -> Duration {
        todo!("Duration is Copy, so this one can hand back a value")
    }

    /// Lesson: mod-builders
    pub fn retries(&self) -> u32 {
        todo!("Duration is Copy, and so is u32")
    }
}

/// Lesson: mod-builders
///
/// The half-built client. Consuming builder: every setter takes `self` and
/// returns `Self`, so calls chain into one expression and a builder that has
/// been used is moved-from and unusable. `std::process::Command` made the other
/// choice, `&mut self`, which reads better when configuration is conditional.
#[derive(Debug)]
pub struct EmailClientBuilder {
    // TODO: everything `build` needs, required values and options alike.
}

impl EmailClientBuilder {
    /// Lesson: mod-builders
    ///
    /// Override the request timeout.
    ///
    /// `#[must_use]` is here because throwing away a configured builder is
    /// always a mistake. It is the attribute the signatures lesson asked for,
    /// on exactly the kind of method it named.
    #[must_use]
    pub fn timeout(self, _timeout: Duration) -> Self {
        todo!("set the field, hand the builder back")
    }

    /// Lesson: mod-builders
    ///
    /// Override the retry count.
    #[must_use]
    pub fn retries(self, _retries: u32) -> Self {
        todo!("set the field, hand the builder back")
    }

    /// Lesson: mod-builders
    ///
    /// Assemble the client.
    ///
    /// Construction has rules, so this is where it can fail rather than at a
    /// setter: a builder is not wrong until it is finished.
    ///
    /// # Errors
    ///
    /// Returns `Err` when the base URL is not `https://` (the authorization
    /// token would travel in plaintext) or when more than 5 retries are asked
    /// for. Each message must name what was refused.
    pub fn build(self) -> Result<EmailClient, String> {
        todo!("check the rules, then move the fields across")
    }
}

// ---------------------------------------------------------------------------
// Lesson: mod-doc-tests
// ---------------------------------------------------------------------------

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
/// Lesson: mod-doc-tests. The block above is not decoration: `cargo test`
/// extracts it, compiles it as its own crate linked against this library, and
/// runs it, so it fails the suite the moment it stops being true. Being a
/// separate crate is also why it can only use the public API, and why the `# `
/// line compiles but does not render. The same claims are asserted again in
/// `tests/mod_doc_tests.rs`, so the suite stands on its own either way.
pub fn preview(_body: &str, _max_chars: usize) -> String {
    todo!("count characters, not bytes, and say so when max_chars is zero")
}
