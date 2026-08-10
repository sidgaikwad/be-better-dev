//! Lesson: ptr-box
//!
//! This file does not compile until `Expr` has variants for negation and
//! addition. That is the exercise: the error the lesson quotes is what you meet
//! if you write them without indirection. Other exercises still run, so work
//! them with `cargo test --test ptr_rc_weak` and friends while this one is red.

use std::mem::size_of;

use smart_pointers::*;

fn num(value: f64) -> Box<Expr> {
    Box::new(Expr::Number(value))
}

#[test]
fn a_tree_that_only_exists_because_of_indirection() {
    assert_eq!(Expr::Number(4.0).eval(), 4.0);

    // -(1 + 2)
    let expr = Expr::Neg(Box::new(Expr::Add(num(1.0), num(2.0))));
    assert_eq!(expr.eval(), -3.0);
}

#[test]
fn depth_lives_on_the_heap_and_never_in_the_value() {
    let mut tree = Expr::Number(0.0);
    for i in 1..=100 {
        tree = Expr::Add(Box::new(tree), num(f64::from(i)));
    }
    assert_eq!(tree.eval(), 5050.0);

    assert!(
        size_of::<Expr>() <= 3 * size_of::<usize>(),
        "a tag plus at most two one-word handles: the value's own size never grows with the tree"
    );
}

#[test]
fn one_return_type_for_two_backends() {
    assert_eq!(backend("production").send("ada@example.com"), "postmark -> ada@example.com");
    assert_eq!(backend("test").send("ada@example.com"), "fake -> ada@example.com");

    assert_eq!(
        size_of::<Box<Expr>>(),
        size_of::<usize>(),
        "a Box to a sized type is one word, whatever it points at"
    );
    assert_eq!(
        size_of::<Box<dyn EmailClient>>(),
        2 * size_of::<usize>(),
        "a trait object handle is two: the data pointer plus the method table"
    );
}
