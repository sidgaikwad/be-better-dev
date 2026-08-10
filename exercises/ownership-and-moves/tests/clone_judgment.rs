//! Lesson: clone-judgment

use ownership_and_moves::*;

#[test]
fn clone_only_what_the_signature_demands() {
    let names = ["ferris", "ada", "ferris", "grace"];
    assert_eq!(sorted_unique(&names), vec!["ada", "ferris", "grace"]);
    // The input is untouched: it was borrowed, not consumed.
    assert_eq!(names.len(), 4);
}
