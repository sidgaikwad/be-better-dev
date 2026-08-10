//! Lesson: one-owner

use ownership_and_moves::*;

#[test]
fn moves_transfer_ownership() {
    let original = String::from("hello");
    let loud = shout(original);
    assert_eq!(loud, "hello!");
    // `original` cannot be named here: it was moved into `shout`. Uncomment
    // the next line to see the compiler say so.
    // println!("{original}");
}
