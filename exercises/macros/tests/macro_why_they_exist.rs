//! Lesson: macro-why-they-exist

use macros_exercises::*;

#[test]
fn a_healthy_value_expands_to_nothing_that_fires() {
    check_positive!(1 + 1);
    check_positive!(42);
}

#[test]
fn the_message_names_the_expression_the_caller_wrote() {
    let confirmed = 3;
    let expected = 5;

    let outcome = std::panic::catch_unwind(move || {
        check_positive!(confirmed - expected);
    });

    let payload = outcome.expect_err("a value of -2 has to panic");
    let message = payload
        .downcast_ref::<String>()
        .expect("panic! with format arguments carries a String payload");

    // This is the wall a function cannot climb. `check_positive(-2)` receives
    // the number and nothing else; the source text is gone by the time the call
    // happens. The macro saw tokens, so it still has both.
    assert!(
        message.contains("confirmed - expected"),
        "a function would only have received -2, but got: {message}"
    );
    assert!(message.contains("-2"), "the value belongs in the message too, but got: {message}");
}
