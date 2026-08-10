//! Lesson: test-property-based
//!
//! No `quickcheck`, no `proptest`, no `fake`. The generator is `Lcg`, the
//! shrinking is missing, and everything else about the technique is here:
//! state a property, sample the input space, report the counterexample.

use std::collections::HashSet;

use testing_exercises::*;

#[test]
fn the_parser_handles_the_examples_you_would_have_written_by_hand() {
    assert_eq!(parse_hms("0:0:0"), Some((0, 0, 0)));
    assert_eq!(parse_hms("23:59:59"), Some((23, 59, 59)));
    assert_eq!(parse_hms("9:5:1"), Some((9, 5, 1)));
}

#[test]
fn the_parser_rejects_what_is_not_a_time() {
    assert_eq!(parse_hms("24:00:00"), None, "hours stop at 23");
    assert_eq!(parse_hms("12:60:00"), None, "minutes stop at 59");
    assert_eq!(parse_hms("12:00:60"), None, "seconds stop at 59");
    assert_eq!(parse_hms("12:00"), None, "three parts, not two");
    assert_eq!(parse_hms("1:2:3:4"), None, "three parts, not four");
    assert_eq!(parse_hms("noon"), None);
    assert_eq!(parse_hms(""), None);
}

/// The generator carries the precondition. Every string it produces must be one
/// the property is actually claimed to hold for, or the failure you get is in
/// the test rather than the code.
#[test]
fn the_generator_only_produces_valid_times() {
    let mut rng = Lcg::new(4);
    for _ in 0..500 {
        let input = random_hms(&mut rng);
        let (hours, minutes, seconds) =
            parse_hms(&input).unwrap_or_else(|| panic!("generated {input:?}, which is not a time"));
        assert!(hours <= 23, "generated hour {hours} out of range");
        assert!(minutes <= 59, "generated minute {minutes} out of range");
        assert!(seconds <= 59, "generated second {seconds} out of range");
    }
}

/// A generator that keeps returning one input samples nothing, and every
/// property over it passes vacuously. 200 draws from 86400 possible times
/// should be nearly all distinct.
#[test]
fn the_generator_actually_varies() {
    let mut rng = Lcg::new(11);
    let mut seen = HashSet::new();
    for _ in 0..200 {
        seen.insert(random_hms(&mut rng));
    }
    assert!(
        seen.len() > 100,
        "only {} distinct inputs in 200 draws; a stuck generator makes every property pass",
        seen.len()
    );
}

/// The property the book's warm-up states: no validly built time is rejected.
/// Three hand-written cases could not have found a parser that is merely too
/// strict, because the input it chokes on is the one you did not think of.
#[test]
fn no_generated_time_is_rejected() {
    for seed in [1, 42, 1337, 90210] {
        let counterexample = find_counterexample(seed, 1000, |input| parse_hms(input).is_some());
        assert_eq!(
            counterexample, None,
            "seed {seed} produced a time the parser rejected"
        );
    }
}

/// A property that is false on purpose, to prove the driver reports rather than
/// merely returns false. What comes back is the input itself, which is the
/// entire diagnosis.
#[test]
fn a_false_property_yields_the_input_that_broke_it() {
    let counterexample = find_counterexample(7, 1000, |input| !input.starts_with("23:"));
    let found = counterexample.expect("1000 draws without a single hour 23 is not plausible");
    assert!(
        found.starts_with("23:"),
        "the counterexample must be the failing input, got {found:?}"
    );
    assert!(parse_hms(&found).is_some(), "it should still be a well formed time");
}

/// Same seed, same sequence, same counterexample. Without this a property
/// failure in CI is a rumour: the crate reports an input, you rerun, and the
/// run that failed is gone.
#[test]
fn a_failure_is_reproducible_from_its_seed() {
    let first = find_counterexample(7, 1000, |input| !input.starts_with("23:"));
    let second = find_counterexample(7, 1000, |input| !input.starts_with("23:"));
    assert_eq!(first, second, "the seed is the whole reproduction recipe");
}

/// Sampling is not proof. `None` means no counterexample turned up in the draws
/// taken, and the honest reading of a green property test is "confidence over a
/// much wider range than I would have written by hand", not "correct".
#[test]
fn zero_cases_passes_and_proves_nothing() {
    assert_eq!(
        find_counterexample(1, 0, |_| false),
        None,
        "a property that is false for every input still passes when nothing is generated"
    );
}
