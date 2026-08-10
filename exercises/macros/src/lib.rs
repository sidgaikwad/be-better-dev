//! Macros.
//!
//! Eight exercises across the section's five lessons. Run `cargo test -p
//! macros-exercises` to see what is red, then replace each `todo!()` and make
//! the suite pass.
//!
//! One mechanical rule shapes this whole crate. Every file under `tests/` is
//! compiled as its own separate crate, and a `macro_rules!` definition is
//! private to the crate that wrote it. `#[macro_export]` is what lifts a
//! definition to this crate's root so that `use macros_exercises::*;` over
//! there imports it. That is also why the transcribers below are asked to
//! spell their paths out in full: the code a macro expands into has to compile
//! at a call site that imported nothing and may have named its own locals
//! anything at all.
//!
//! Several stubs carry the placeholder matcher `( $( $tokens:tt )* )`, which
//! swallows any token stream. It is there so the shipped crate compiles at
//! every call site in `tests/`. Replacing it with a matcher that says what the
//! macro actually accepts is part of each exercise.

/// Helpers the macros expand into. Nothing here is an exercise; it exists so a
/// transcriber has somewhere real to point.
pub mod text {
    /// Trim surrounding whitespace and lowercase an address.
    pub fn normalize_email(raw: &str) -> String {
        raw.trim().to_lowercase()
    }
}

/// Lesson: macro-why-they-exist
///
/// A function receives values. `check_positive(confirmed - expected)` is handed
/// `-2`, and nothing it does can recover the fact that the caller wrote
/// `confirmed - expected`. A macro receives tokens, so it can put the source
/// text of its own argument into the message. That is the trick `assert!` and
/// `dbg!` run on you every day, and it is the third of the three walls a
/// function cannot climb.
///
/// Make `check_positive!(expr)` do nothing when the value is greater than zero,
/// and panic otherwise with a message carrying both the argument's source text
/// and its value. One standard macro turns captured tokens back into a string
/// literal; you have seen it in every `stringify!`-shaped error message.
///
/// Evaluate the argument once, not twice. The transcriber is code, and code
/// that names `$value` twice runs it twice.
#[macro_export]
macro_rules! check_positive {
    ( $( $tokens:tt )* ) => {
        todo!("panic with the argument's source text, not only its value")
    };
}

/// Lesson: macro-rules-read-and-write
///
/// `vec![a, b, c]` takes any number of arguments because a matcher can repeat.
/// Build that power yourself. `vec_of![1, 2, 3]` should produce a `Vec` holding
/// those three values, `vec_of![]` an empty one, and a trailing comma should be
/// tolerated the way every formatter assumes it is.
///
/// There are two halves to write, and they mirror each other. In the matcher,
/// `$( ... ),*` captures a comma-separated group zero or more times. In the
/// transcriber, `$( ... )*` replays its body once per capture, in order. A
/// `Vec` is built by pushing, so ask yourself what the replayed body should be.
///
/// Note the square brackets at the call site. The delimiter around a macro's
/// arguments is convention only: `vec_of![1, 2]` and `vec_of!(1, 2)` are the
/// same call.
#[macro_export]
macro_rules! vec_of {
    ( $( $tokens:tt )* ) => {
        todo!("one push per captured item")
    };
}

/// Lesson: macro-rules-read-and-write
///
/// Arms are tried top to bottom and the first matcher that fits wins, so their
/// order is part of the meaning. Unlike `match` there is no exhaustiveness
/// proof: a call no arm matches is simply an error at the call site.
///
/// Write `log_line!` so it answers four shapes:
///
/// ```text
/// log_line!(warn, "disk almost full")   ->  "[WARN] disk almost full"
/// log_line!(error, "connection lost")   ->  "[ERROR] connection lost"
/// log_line!(trace, "cache miss")        ->  "[trace] cache miss"
/// log_line!("subscriber confirmed")     ->  "[INFO] subscriber confirmed"
/// ```
///
/// The third is the general shape: any level name at all, printed as the caller
/// wrote it. The `ident` fragment captures a name, and `stringify!` turns it
/// back into text.
///
/// Here is the part worth slowing down for. A `$level:ident` matcher matches
/// the token `warn` perfectly well, so where you place that arm decides whether
/// the first two are ever reached. The test asserts on the uppercase forms,
/// which is how it can tell what order you chose.
#[macro_export]
macro_rules! log_line {
    ( $( $tokens:tt )* ) => {
        todo!("four arms, and the general one is not the first")
    };
}

/// Lesson: macro-rules-read-and-write
///
/// Expand to a call to `normalize_email` on `$raw`, binding the argument to a
/// local named `raw` first so it is evaluated exactly once.
///
/// Two traps, both invisible until the macro is called from somewhere that is
/// not this file.
///
/// The path. Writing `text::normalize_email(...)` works while you are testing
/// it here and breaks in `tests/`, where `text` was never imported and `crate`
/// means the test crate. `$crate` expands to a path to the crate the macro was
/// *defined* in, whatever the call site turns out to be. Every expansion you
/// will ever read in the wild is built this way.
///
/// The binding. The `raw` your transcriber introduces is not the caller's
/// `raw`. `macro_rules!` is hygienic: locals created by an expansion live in
/// their own naming universe, invisible to the call site and unable to see it.
/// The test keeps a `raw` of its own alive across the call to prove it.
#[macro_export]
macro_rules! subscriber_email {
    ( $raw:expr ) => {{
        let _ = $raw;
        todo!("normalize it, and say which crate that function lives in")
    }};
}

/// Lesson: macro-cargo-expand
///
/// Run `cargo expand` on anything and the first thing you notice is the paths.
/// `::core::clone::Clone`, `::std::collections::HashMap`: absolute, and never
/// abbreviated. Generated code cannot assume the call site imported anything,
/// and it cannot assume the short names still mean what they usually mean.
///
/// Expand to a `String` reading `"<title>: <count>"`.
///
/// The test calls this twice: once from an ordinary module, and once from a
/// module that has defined its own `format!` and its own `String`. The obvious
/// transcriber compiles in the first place and not the second, which is the
/// whole reason real expansions look the way they do.
#[macro_export]
macro_rules! render_report {
    ( $title:expr, $count:expr ) => {{
        let _ = ($title, $count);
        todo!("write the paths out in full")
    }};
}

/// Lesson: macro-proc-consumer-side
///
/// Procedural macros come in three shapes, and an application developer meets
/// all three as a consumer long before writing one. A custom derive
/// (`serde::Deserialize`, `thiserror::Error`) reads your item and *appends*
/// impls beside it. An attribute macro (`#[tokio::main]`) receives the item and
/// *replaces* it, which is why deleting the attribute leaves you with an
/// `async fn main` the language has no use for. A function-like one
/// (`sqlx::query!`) takes arbitrary tokens and does arbitrary work, up to
/// opening a database connection from inside `cargo build`.
///
/// The derives that ship with the compiler are the same machinery wearing the
/// first coat, so this exercise uses them. The test needs this type printed
/// with `{:?}`, assigned without moving out of the original binding, compared
/// with `==`, and used as a `HashMap` key. Add the derives that make all of
/// that work, and write no impl by hand. The compiler names each missing one in
/// turn, which is the fastest way to learn the set.
///
/// The test also asserts the type's size. That is the other half of the lesson:
/// a derive appends and never edits, so no number of them can change your
/// fields or your layout.
pub struct SubscriberId(pub u64);

/// Lesson: macro-when-not-to-write
///
/// The legitimate residue. No generic can supply a different constant per type,
/// so "one impl per type, each carrying its own value" is genuinely out of
/// reach for the two tools that come first. This is the shape the standard
/// library uses to implement traits for tuples arity by arity, and the shape
/// serde's derive exists to fill.
pub trait WireTag {
    /// The name this type travels under on the wire.
    const TAG: &'static str;

    fn tag(&self) -> &'static str {
        Self::TAG
    }
}

/// Lesson: macro-when-not-to-write
///
/// Write the transcriber so the call below, and the one in `tests/`, each
/// generate one `impl WireTag` per pair. The stub matches the input and emits
/// nothing at all, which is why the test cannot find the impls it needs.
///
/// This is item position rather than expression position. A transcriber may
/// emit items, and a repetition works there exactly as it does inside a block:
/// three pairs in, three impl blocks out.
///
/// Name the trait `$crate::WireTag`. The test invokes this macro from a module
/// that has imported nothing, which is the situation every downstream crate is
/// in, and an unqualified `WireTag` means nothing there.
#[macro_export]
macro_rules! impl_wire_tag {
    ( $( $tokens:tt )* ) => {};
}

impl_wire_tag! {
    u8 => "u8",
    bool => "bool",
    String => "string",
}

/// Lesson: macro-when-not-to-write
///
/// Function first, generics second, macro last. Here is a requirement that
/// looks like it wants a macro and does not: the same logic for every ordered
/// element type. A macro would give you a call site per type and a signature
/// nowhere. A generic gives you one definition, checked once, that the IDE can
/// complete and the type checker can hold you to.
///
/// Return a reference to the largest item, or `None` for an empty slice.
///
/// When it passes, write yourself one sentence: what would the macro version
/// have bought here, and what would it have cost? If the honest answer to the
/// first half is "nothing", you have found the rule this lesson is made of.
pub fn largest<T: PartialOrd>(_items: &[T]) -> Option<&T> {
    todo!("generics second, macro last")
}
