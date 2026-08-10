//! The specification. When these pass, the section is done.

use borrowing_and_lifetimes::*;

#[test]
fn shared_borrows_accept_every_caller() {
    let owned = String::from("ferris");
    // One signature, three shapes of argument. That is what &str buys.
    assert_eq!(text_len(&owned), 6);
    assert_eq!(text_len("literal"), 7);
    assert_eq!(text_len(&owned[0..3]), 3);
    // Nothing moved: the caller still owns its String.
    assert_eq!(owned, "ferris");
}

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

#[test]
fn a_borrow_ends_at_its_last_use() {
    let mut v = vec![10, 20, 30];
    assert_eq!(first_then_clear(&mut v), Some(10));
    assert!(v.is_empty(), "the vector was cleared after the read finished");

    let mut empty: Vec<i32> = Vec::new();
    assert_eq!(first_then_clear(&mut empty), None);
}

#[test]
fn returning_owned_data_escapes_the_dangling_problem() {
    let greeting = build_greeting();
    assert_eq!(greeting, "hello");
    // It is owned, so it outlives the function that built it without any
    // lifetime annotation being involved.
    drop(greeting);
}

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

#[test]
fn a_borrowing_struct_walks_without_copying() {
    let text = String::from("one two three");
    let mut parser = Parser::new(&text);

    assert_eq!(parser.remaining(), "one two three");
    assert_eq!(parser.next_word(), Some("one"));
    assert_eq!(parser.next_word(), Some("two"));
    assert_eq!(parser.remaining(), "three");
    assert_eq!(parser.next_word(), Some("three"));
    assert_eq!(parser.next_word(), None);
}

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
