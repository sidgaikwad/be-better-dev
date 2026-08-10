//! Lesson: iter-fn-traits
//!
//! This file does not compile until `retry` widens its bound. That is the
//! exercise: the error names the trait the closure below actually implements.
//! Other lessons still run, so work them with `cargo test --test iter_the_trait`
//! and friends while this one is red.

use iterators_closures::*;

#[test]
fn an_fnmut_closure_accumulates_state_across_calls() {
    let mut log: Vec<u32> = Vec::new();
    let mut attempt = 0;

    // Both captures are mutated, so this closure is FnMut and not Fn.
    let succeeded = retry(5, || {
        attempt += 1;
        log.push(attempt);
        attempt == 3
    });

    assert!(succeeded);
    // The borrow of `log` ended when `retry` returned, so it can be read here.
    assert_eq!(log, vec![1, 2, 3], "retry stops at the first success");
}

#[test]
fn state_survives_a_run_that_never_succeeds() {
    let mut calls = 0;
    let succeeded = retry(4, || {
        calls += 1;
        false
    });

    assert!(!succeeded);
    assert_eq!(calls, 4, "every attempt was spent");
}

fn healthcheck() -> bool {
    true
}

#[test]
fn the_widened_bound_still_accepts_everything_narrower() {
    // A plain fn captures nothing and implements all three traits.
    assert!(retry(3, healthcheck));

    // And every Fn closure is also an FnMut: this one only reads its capture.
    let ready = false;
    assert!(!retry(2, || ready));
}

#[test]
fn a_boxed_closure_owns_its_state_and_outlives_its_maker() {
    let is_ours = {
        let domain = String::from("mail.dev");
        domain_matcher(domain)
    };

    assert!(is_ours("ada@mail.dev"));
    assert!(!is_ours("ada@example.com"));
    assert!(
        !is_ours("ada@notmail.dev"),
        "the @ has to line up, not just the tail of the string"
    );
}

#[test]
fn two_matchers_share_one_signature() {
    // The point of erasing the type: these are different anonymous structs, and
    // a Vec can still hold both.
    let matchers = vec![
        domain_matcher(String::from("mail.dev")),
        domain_matcher(String::from("example.com")),
    ];
    let hits = matchers.iter().filter(|m| m("ada@example.com")).count();
    assert_eq!(hits, 1);
}
