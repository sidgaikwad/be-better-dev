//! Lesson: lifetime-annotations

use borrowing_and_lifetimes::*;

#[test]
fn longest_ties_the_output_to_both_inputs() {
    let a = String::from("long string is long");
    let b = String::from("short");
    assert_eq!(longest(&a, &b), "long string is long");
    assert_eq!(longest(&b, &a), "long string is long");
    assert_eq!(longest("tie", "eit"), "tie", "first wins a tie");
}

#[test]
fn first_of_makes_the_narrower_promise() {
    let outer = String::from("outer value");
    let result;
    {
        let inner = String::from("inner");
        // Only `a`'s lifetime reaches the return type, so the result stays
        // valid past the inner scope. Swapping this to `longest` would not
        // compile, which is the whole point of the narrower signature.
        result = first_of(&outer, &inner);
    }
    assert_eq!(result, "outer value");
}
