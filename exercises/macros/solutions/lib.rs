//! Reference solutions. Read these after you have something passing.
//!
//! Every macro here is `#[macro_export]`ed, because `tests/` is a set of
//! separate crates and an unexported `macro_rules!` never leaves the crate that
//! defined it. Where a solution had a choice to make, the comment says which
//! way it went and why, since that judgment is the part worth copying.

pub mod text {
    pub fn normalize_email(raw: &str) -> String {
        raw.trim().to_lowercase()
    }
}

/// The macro binds the argument to a local before testing it, so `$value` is
/// evaluated once even though the message mentions it again. `stringify!` reads
/// the captured tokens rather than the value, which is the whole point: the
/// message can name `confirmed - expected` while a function would only ever
/// have seen `-2`.
#[macro_export]
macro_rules! check_positive {
    ( $value:expr ) => {{
        let value = $value;
        if value <= 0 {
            ::std::panic!("{} is not positive: {}", ::std::stringify!($value), value);
        }
    }};
}

/// `$( $item:expr ),*` captures zero or more comma-separated expressions, and
/// `$( ... )*` in the transcriber replays the push once per capture. `*` rather
/// than `+` is what makes `vec_of![]` legal, and `$(,)?` absorbs the trailing
/// comma a formatter likes to add.
///
/// The `allow` is not decoration either: `vec_of![]` expands to zero pushes, so
/// the `mut` really is unused there. Generated code is linted exactly like code
/// you typed, which is a useful thing to have seen once.
#[macro_export]
macro_rules! vec_of {
    ( $( $item:expr ),* $(,)? ) => {{
        #[allow(unused_mut)]
        let mut items = ::std::vec::Vec::new();
        $( items.push($item); )*
        items
    }};
}

/// Four arms, and the order is load-bearing. `$level:ident` matches the token
/// `warn` as happily as it matches `trace`, so the two named arms have to sit
/// above the general one or they are unreachable. Moving the general arm to the
/// top does not fail to compile; it just quietly returns "[warn]" instead of
/// "[WARN]", which is why the test asserts on the uppercase forms.
#[macro_export]
macro_rules! log_line {
    ( warn, $msg:expr ) => {
        ::std::format!("[WARN] {}", $msg)
    };
    ( error, $msg:expr ) => {
        ::std::format!("[ERROR] {}", $msg)
    };
    ( $level:ident, $msg:expr ) => {
        ::std::format!("[{}] {}", ::std::stringify!($level), $msg)
    };
    ( $msg:expr ) => {
        ::std::format!("[INFO] {}", $msg)
    };
}

/// `$crate` is the only way to name the defining crate from inside a
/// transcriber. It expands to `crate` when the macro is used here and to
/// `::macros_exercises` when it is used from a test crate, so one definition
/// serves both.
///
/// The `raw` binding is invisible to the caller and the caller's `raw` is
/// invisible to it. Hygiene gives that for free, so the local can be named for
/// what it holds instead of `__macro_internal_raw_v2`.
#[macro_export]
macro_rules! subscriber_email {
    ( $raw:expr ) => {{
        let raw = $raw;
        $crate::text::normalize_email(raw)
    }};
}

/// `::std::format!` rather than `format!`, for the same reason `cargo expand`
/// shows you `::core::clone::Clone` rather than `Clone`. A leading `::` starts
/// the path at the crate root of `std` itself, so nothing the call site has
/// defined, imported, or shadowed can redirect it.
#[macro_export]
macro_rules! render_report {
    ( $title:expr, $count:expr ) => {
        ::std::format!("{}: {}", $title, $count)
    };
}

/// Six derives, six generated impls, and the struct itself is reprinted
/// unchanged: still one `u64`, still 8 bytes. `Copy` needs `Clone` and `Eq`
/// needs `PartialEq`, which is why they come in pairs, and `Hash` plus `Eq` is
/// what a `HashMap` key requires.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct SubscriberId(pub u64);

pub trait WireTag {
    const TAG: &'static str;

    fn tag(&self) -> &'static str {
        Self::TAG
    }
}

/// The `ty` fragment captures a whole type, `literal` captures the tag, and the
/// repetition emits one impl block per pair. A generic could not do this: the
/// constant differs per type, and there is nothing to be generic over.
///
/// `$crate::WireTag` matters more here than anywhere else in the crate, because
/// this expansion lands in whatever crate called it, next to a type that crate
/// owns.
#[macro_export]
macro_rules! impl_wire_tag {
    ( $( $ty:ty => $tag:literal ),+ $(,)? ) => {
        $(
            impl $crate::WireTag for $ty {
                const TAG: &'static str = $tag;
            }
        )+
    };
}

impl_wire_tag! {
    u8 => "u8",
    bool => "bool",
    String => "string",
}

/// One definition, checked once, for every ordered element type. A macro
/// version would have bought nothing: the arity is fixed, the values are
/// ordinary, and the only variation is a type, which is exactly what a type
/// parameter is for. It would have cost the signature, and with it the
/// documentation, the completion, and the error message that names the caller's
/// mistake instead of the macro's insides.
pub fn largest<T: PartialOrd>(items: &[T]) -> Option<&T> {
    items.iter().reduce(|a, b| if b > a { b } else { a })
}
