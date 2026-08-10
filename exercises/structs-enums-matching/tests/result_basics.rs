//! Lesson: result-basics

use structs_enums_matching::*;

fn list() -> Vec<Subscriber> {
    vec![Subscriber::new("ada@example.com", "Ada"), Subscriber::new("grace@example.com", "Grace")]
}

#[test]
fn the_happy_path_reads_top_to_bottom() {
    let mut subs = list();

    assert_eq!(confirm_by_token(&mut subs, "1").unwrap(), "grace@example.com");
    assert!(subs[1].confirmed, "confirming is the point; the email is just the receipt");
    assert!(!subs[0].confirmed, "and only the one the token named");

    // Whitespace is the mail client's doing, not the subscriber's.
    assert_eq!(confirm_by_token(&mut subs, "  0\n").unwrap(), "ada@example.com");
    assert!(subs[0].confirmed);
}

#[test]
fn question_mark_converts_the_error_on_its_way_out() {
    let mut subs = list();

    let err = confirm_by_token(&mut subs, "not-a-number").unwrap_err();
    assert!(
        matches!(err, ConfirmError::Malformed(_)),
        "the parse failed with a ParseIntError, and From turned it into this one"
    );

    // The original error survived the conversion, so the caller can still say
    // what went wrong.
    let ConfirmError::Malformed(source) = err else {
        panic!("expected a malformed token");
    };
    assert!(!source.to_string().is_empty(), "keep the source error, do not discard it");
}

#[test]
fn absence_becomes_an_error_the_caller_can_read() {
    let mut subs = list();

    assert_eq!(
        confirm_by_token(&mut subs, "7").unwrap_err(),
        ConfirmError::UnknownSubscriber(7),
        "the error names the index that missed"
    );
    assert!(subs.iter().all(|sub| !sub.confirmed), "a failed confirmation changes nothing");
}
