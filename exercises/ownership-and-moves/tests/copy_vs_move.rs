//! Lesson: copy-vs-move
//!
//! This file does not compile until `Point` is Copy. That is the exercise: the
//! error is the lesson. Other exercises still run, so work them with
//! `cargo test --test one_owner` and friends while this one is red.

use ownership_and_moves::*;

#[test]
fn copy_types_survive_assignment() {
    let a = Point { x: 1.5, y: 2.5 };
    let b = a;
    // Both bindings are live, so Point must be Copy.
    assert_eq!(a, b);
    assert_eq!(a.x + b.x, 3.0);
}

#[test]
fn borrowing_leaves_the_caller_whole() {
    let points = vec![Point { x: 1.0, y: 0.0 }, Point { x: 2.0, y: 0.0 }];
    assert_eq!(total_x(&points), 3.0);
    // The vector survived the call, which is what taking &[Point] promised.
    assert_eq!(points.len(), 2);
}
