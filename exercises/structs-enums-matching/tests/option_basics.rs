//! Lesson: option-basics

use structs_enums_matching::*;

fn list() -> Vec<Subscriber> {
    vec![
        Subscriber::new("ada@example.com", "Ada"),
        // On the list, but the address never had a domain to begin with.
        Subscriber::new("grace", "Grace"),
    ]
}

#[test]
fn a_pipeline_carries_the_question_all_the_way_down() {
    let subs = list();

    assert_eq!(domain_for(&subs, "ada@example.com"), Some("example.com"));

    // Two different reasons for absence, one None. That is the flattening:
    // `map` would have handed back Some(None) for the second of these.
    assert_eq!(domain_for(&subs, "grace"), None, "found the subscriber, found no domain");
    assert_eq!(domain_for(&subs, "nobody@example.com"), None, "found no subscriber at all");
}

#[test]
fn the_pipeline_borrows_rather_than_consumes() {
    let subs = list();
    assert_eq!(domain_for(&subs, "ada@example.com"), Some("example.com"));
    // The slice went in borrowed and the &str came back borrowed from it, so
    // the caller's vector is untouched and still usable.
    assert_eq!(subs.len(), 2);
    assert_eq!(subs[0].name, "Ada");
}

#[test]
fn leaving_option_land_needs_a_story_for_none() {
    let subs = list();
    assert_eq!(greeting_for(&subs, "ada@example.com"), "Welcome back, Ada");
    assert_eq!(greeting_for(&subs, "nobody@example.com"), "Welcome, guest");
    // No check was written for the missing subscriber, yet the missing case was
    // not ignored: the type made it impossible to skip.
}
