//! Lesson: exclusive-references

use borrowing_and_lifetimes::*;

#[test]
fn exclusive_borrows_mutate_in_place() {
    let mut name = String::from("Ada");
    confirm_in_place(&mut name);
    assert_eq!(name, "Ada (confirmed)");
}

#[test]
fn appending_respects_the_aliasing_rule() {
    let mut target = vec![1, 2];
    append_all(&mut target, &[3, 4]);
    assert_eq!(target, vec![1, 2, 3, 4]);

    // Self-append: the caller must copy out first, because target cannot be
    // borrowed shared and exclusive at once.
    let mut same = vec![1, 2];
    let copy = same.clone();
    append_all(&mut same, &copy);
    assert_eq!(same, vec![1, 2, 1, 2]);
}
