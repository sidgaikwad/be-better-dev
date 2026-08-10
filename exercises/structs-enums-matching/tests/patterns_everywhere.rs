//! Lesson: patterns-everywhere

use structs_enums_matching::*;

#[test]
fn let_else_binds_the_happy_path_in_the_outer_scope() {
    let sub = parse_row("ada@example.com, Ada").expect("a well formed row parses");
    assert_eq!(sub.email, "ada@example.com", "the fields are trimmed");
    assert_eq!(sub.name, "Ada");
    assert!(!sub.confirmed, "an imported row has not confirmed anything yet");
}

#[test]
fn the_shapes_that_do_not_fit_are_rejected() {
    assert!(parse_row("ada@example.com").is_none(), "no comma, no row");
    assert!(parse_row("ada, Ada").is_none(), "no @, no email");
    assert!(parse_row("@example.com, Ada").is_none(), "no local part");
    assert!(parse_row("ada@, Ada").is_none(), "no domain");
    assert!(parse_row("ada@example.com,   ").is_none(), "no name");
}

#[test]
fn while_let_drains_the_queue_until_it_answers_none() {
    let mut queue = vec![
        "ada@example.com, Ada".to_string(),
        "junk with no comma".to_string(),
        "grace@example.com, Grace".to_string(),
    ];

    // Popped from the back, so the last row queued is the first one handled.
    assert_eq!(drain_rows(&mut queue), vec!["grace@example.com", "ada@example.com"]);
    assert!(queue.is_empty(), "popping until None is what empties it");
}

#[test]
fn an_empty_queue_is_not_a_special_case() {
    let mut queue: Vec<String> = Vec::new();
    assert!(drain_rows(&mut queue).is_empty(), "the loop simply never runs");
}
