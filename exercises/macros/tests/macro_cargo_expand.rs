//! Lesson: macro-cargo-expand

use macros_exercises::*;

#[test]
fn the_ordinary_call_site_reads_the_way_you_expect() {
    let report: String = render_report!("confirmed", 3);
    assert_eq!(report, "confirmed: 3");
}

/// The same call from a module that has redefined the names a careless
/// expansion would reach for. Nothing here is realistic on its own; it is a
/// stand-in for the thousand call sites a published macro cannot see, one of
/// which will eventually have a `String` of its own.
///
/// Read a real expansion with `cargo expand` and you will find this defended
/// against everywhere: `::core::clone::Clone`, `::std::vec::Vec`, absolute
/// paths from the root of a named crate rather than whatever is in scope.
mod hostile {
    #[allow(unused_macros)]
    macro_rules! format {
        ( $( $tokens:tt )* ) => {
            "sabotaged"
        };
    }

    #[allow(dead_code)]
    struct String;

    #[test]
    fn the_expansion_does_not_depend_on_the_call_site() {
        // Annotated with an absolute path, because `String` means something
        // else in this module. That is precisely the problem the transcriber
        // has, and it has to solve it the same way.
        let report: ::std::string::String = macros_exercises::render_report!("confirmed", 3);
        assert_eq!(
            report, "confirmed: 3",
            "a leading :: is what makes generated code immune to the call site"
        );
    }
}
