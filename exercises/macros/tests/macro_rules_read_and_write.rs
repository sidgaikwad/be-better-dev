//! Lesson: macro-rules-read-and-write

use macros_exercises::*;

#[test]
fn repetition_turns_a_list_into_a_vec() {
    let three: Vec<i32> = vec_of![1, 2, 3];
    assert_eq!(three, vec![1, 2, 3]);

    // `*` means zero or more, so the empty call is a legal call. `+` would have
    // rejected it with "unexpected end of macro invocation".
    let empty: Vec<i32> = vec_of![];
    assert!(empty.is_empty(), "zero or more includes zero");

    // `$(,)?` is the standard idiom for tolerating the comma a formatter adds.
    let trailing: Vec<&str> = vec_of!["ada", "grace",];
    assert_eq!(trailing.len(), 2, "a trailing comma must not change the meaning of a call");

    // Each capture arrived as one parsed expression, sealed as if parenthesized.
    // This is the line between macro_rules! and C's #define: the second element
    // is 12, not 3 * 4 gone wrong.
    let sums: Vec<i32> = vec_of![1 + 2, 3 * 4];
    assert_eq!(sums, vec![3, 12]);
}

#[test]
fn the_first_arm_that_fits_wins() {
    let warn: String = log_line!(warn, "disk almost full");
    let error: String = log_line!(error, "connection lost");

    // If the general `$level:ident` arm sits above these two, it swallows them
    // and you get "[warn]" here instead. Same macro, same call, different order.
    assert_eq!(warn, "[WARN] disk almost full", "the named arms have to be reachable");
    assert_eq!(error, "[ERROR] connection lost");

    let trace: String = log_line!(trace, "cache miss");
    assert_eq!(trace, "[trace] cache miss", "the general arm prints the ident as written");

    let plain: String = log_line!("subscriber confirmed");
    assert_eq!(plain, "[INFO] subscriber confirmed", "one argument is its own shape");
}

#[test]
fn hygiene_keeps_the_expansions_locals_out_of_yours() {
    let raw = "still mine";

    let cleaned: String = subscriber_email!("  Ada@Example.COM  ");
    assert_eq!(cleaned, "ada@example.com");

    // The expansion binds a local called `raw` too. Hygiene puts the two in
    // different naming universes, so neither shadows nor sees the other.
    assert_eq!(raw, "still mine", "the expansion's `raw` is a different variable entirely");
}

/// A module that has imported nothing at all, which is the situation every
/// downstream crate is in. Reaching the macro by its full path is fine; the
/// question is whether what it expands into can be resolved from here.
mod caller {
    #[test]
    fn the_expansion_carries_its_own_path_home() {
        let cleaned: String = macros_exercises::subscriber_email!("\tGrace@Example.com\n");
        assert_eq!(
            cleaned, "grace@example.com",
            "only a `$crate::` path resolves from a call site that imported nothing"
        );
    }
}
