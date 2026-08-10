//! Lesson: test-integration-tests
//!
//! Every file in `tests/` compiles as its own crate, linked against the library
//! exactly as a stranger's crate would be. So this file can see `App`,
//! `Response` and nothing else, and it drives the app the way a user does: a
//! method and a path in, a response out.

use testing_exercises::*;

#[test]
fn the_health_check_is_mounted_where_it_claims_to_be() {
    // COMPILE ERROR: the handler behind this route is `pub(crate)`, and a file
    // in tests/ is not that crate. Uncomment the next line to read it yourself:
    //
    //   error[E0603]: function `health_check` is private
    //     --> tests/test_integration_tests.rs:27:39
    //      |
    //   27 |     let response = testing_exercises::health_check();
    //      |                                       ^^^^^^^^^^^^ private function
    //      |
    //   note: the function `health_check` is defined here
    //     --> src/lib.rs:91:1
    //      |
    //   91 | pub(crate) fn health_check() -> Response {
    //      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //
    // let response = testing_exercises::health_check();
    //
    // Unit tests inside the module reach it; integration tests cannot, by
    // construction. `pub(crate)` is no help either: this crate is not that
    // crate. What is reachable is the route, which is the thing worth
    // asserting on anyway.
    let app = App::new();
    let response = app.handle("GET", "/health_check", "");
    assert_eq!(response.status, 200);
    assert_eq!(response.body, "", "a health check has nothing to say");
}

#[test]
fn the_route_is_part_of_the_contract() {
    let app = App::new();
    assert_eq!(
        app.handle("GET", "/health-check", "").status,
        404,
        "a hyphen is not an underscore, and only a routed test can tell"
    );
    assert_eq!(
        app.handle("POST", "/health_check", "").status,
        405,
        "the path exists, the verb does not: that is a 405, not a 404"
    );
}

#[test]
fn a_valid_subscription_is_accepted() {
    let app = App::new();
    let response = app.handle("POST", "/subscriptions", "ursula@example.com");
    assert_eq!(response.status, 200);
}

#[test]
fn an_empty_payload_is_rejected() {
    let app = App::new();
    assert_eq!(
        app.handle("POST", "/subscriptions", "").status,
        400,
        "the API did not return a 400 when the payload was empty"
    );
}

/// The state written by one request is read back through another, never by
/// reaching into `App`. Swap the storage for a database tomorrow and this test
/// still holds, which is the property that makes a black box suite survive a
/// rewrite.
#[test]
fn a_subscriber_can_be_read_back_through_the_api() {
    let app = App::new();
    assert_eq!(app.handle("GET", "/subscriptions", "").body, "0");

    app.handle("POST", "/subscriptions", "ursula@example.com");
    app.handle("POST", "/subscriptions", "le-guin@example.com");
    assert_eq!(app.handle("GET", "/subscriptions", "").body, "2");
}

#[test]
fn a_rejected_subscription_is_not_recorded() {
    let app = App::new();
    app.handle("POST", "/subscriptions", "");
    assert_eq!(
        app.handle("GET", "/subscriptions", "").body,
        "0",
        "a 400 that still writes is the bug this test exists for"
    );
}

#[test]
fn unknown_paths_are_404() {
    let app = App::new();
    assert_eq!(app.handle("GET", "/newsletters", "").status, 404);
    assert_eq!(app.handle("POST", "/", "").status, 404);
}
