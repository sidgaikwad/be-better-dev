//! Lesson: iter-adapters-consumers

use iterators_closures::*;

fn list() -> Vec<Subscriber> {
    vec![
        Subscriber::new("ada@mail.dev", false),
        Subscriber::new("grace@mail.dev", true),
        Subscriber::new("broken-address", true),
        Subscriber::new("alan@example.com", true),
        Subscriber::new("edsger@example.com", true),
    ]
}

#[test]
fn a_pipeline_numbers_before_it_narrows() {
    let subs = list();

    assert_eq!(
        confirmed_domains(&subs, 2),
        vec![(1, "mail.dev"), (3, "example.com")],
        "the index is the subscriber's place in the input, not in the result"
    );
}

#[test]
fn filter_map_drops_what_it_cannot_transform() {
    let subs = list();
    let all = confirmed_domains(&subs, 10);

    assert_eq!(all, vec![(1, "mail.dev"), (3, "example.com"), (4, "example.com")]);
    assert!(
        !all.iter().any(|(i, _)| *i == 2),
        "the address with no @ produced None, and None means drop"
    );
}

#[test]
fn take_bounds_the_result() {
    let subs = list();
    assert!(confirmed_domains(&subs, 0).is_empty());
    assert_eq!(confirmed_domains(&subs, 1).len(), 1);
    assert_eq!(confirmed_domains(&subs, 99).len(), 3, "asking for more than exists is fine");
}

#[test]
fn the_input_survives_a_pipeline_that_borrows_it() {
    let subs = list();
    let found = confirmed_domains(&subs, 3);

    // The pairs borrow out of `subs`, so the vector is still here and still
    // holds everything it started with.
    assert_eq!(found.len(), 3);
    assert_eq!(subs.len(), 5);
    assert_eq!(subs[1].email, "grace@mail.dev");
}

#[test]
fn collecting_into_result_gives_all_or_nothing() {
    let good = ["ada@mail.dev", "grace@mail.dev"];

    assert_eq!(
        parse_emails(&good),
        Ok(vec![String::from("ada@mail.dev"), String::from("grace@mail.dev")]),
        "every line parsed, so the batch is one Ok holding the whole Vec"
    );
}

#[test]
fn the_first_error_becomes_the_whole_answer() {
    let mixed = ["ada@mail.dev", "not-an-email", "also@bad@dev", "@nobody"];

    assert_eq!(
        parse_emails(&mixed),
        Err(String::from("invalid email: not-an-email")),
        "collect stops at the first Err; the two later failures are never reached"
    );

    assert_eq!(parse_emails(&["@nobody"]), Err(String::from("invalid email: @nobody")));
    assert_eq!(parse_emails(&["nobody@"]), Err(String::from("invalid email: nobody@")));
    assert_eq!(parse_emails(&[]), Ok(Vec::new()), "no lines is a successful batch of nothing");
}

#[test]
fn laziness_is_work_that_never_happens() {
    let (sum, tested) = tested_while_summing(10);

    assert_eq!(sum, 6, "2 + 4, and no further");
    assert_eq!(
        tested, 4,
        "take had its two after testing 1, 2, 3, 4, so 5 through 10 never entered the pipeline"
    );
}

#[test]
fn a_short_range_just_runs_out() {
    let (sum, tested) = tested_while_summing(3);

    assert_eq!(sum, 2, "only one even number exists here");
    assert_eq!(tested, 3, "take never got its second item, so the range was walked to the end");
}
