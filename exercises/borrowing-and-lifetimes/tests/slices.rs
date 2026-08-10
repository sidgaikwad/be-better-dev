//! Lesson: slices

use borrowing_and_lifetimes::*;

#[test]
fn slices_are_views_into_the_callers_data() {
    let sentence = String::from("hello world");
    assert_eq!(first_word(&sentence), "hello");
    assert_eq!(first_word("single"), "single");
    assert_eq!(first_word(""), "");
}

#[test]
fn out_of_range_windows_return_none_instead_of_panicking() {
    let values = [1, 2, 3, 4, 5];
    assert_eq!(window_sum(&values, 1, 4), Some(9));
    assert_eq!(window_sum(&values, 0, 5), Some(15));
    assert_eq!(window_sum(&values, 2, 2), Some(0), "an empty window sums to zero");
    assert_eq!(window_sum(&values, 1, 99), None, "past the end is None, not a panic");
    assert_eq!(window_sum(&values, 4, 1), None, "a backwards range is None too");
}
