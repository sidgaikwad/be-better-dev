//! Lesson: iter-the-trait
//!
//! This file does not compile until `Fibonacci` implements `Iterator`. Only the
//! first test calls a method you wrote; every one after it calls something
//! nobody wrote for this type, which is the whole payoff.

use iterators_closures::*;

#[test]
fn next_is_the_only_obligation() {
    let mut fib = Fibonacci::new();

    // An iterator is a cursor: `next` takes &mut self, so this binding is mut.
    assert_eq!(fib.next(), Some(0));
    assert_eq!(fib.next(), Some(1));
    assert_eq!(fib.next(), Some(1));
    assert_eq!(fib.next(), Some(2));
    assert_eq!(fib.next(), Some(3));
    assert_eq!(fib.next(), Some(5));
}

#[test]
fn the_whole_adapter_vocabulary_arrives_for_free() {
    let first_ten: Vec<u64> = Fibonacci::new().take(10).collect();
    assert_eq!(first_ten, vec![0, 1, 1, 2, 3, 5, 8, 13, 21, 34]);

    let even: Vec<u64> = Fibonacci::new().filter(|n| n % 2 == 0).take(4).collect();
    assert_eq!(even, vec![0, 2, 8, 34], "filter has never heard of Fibonacci");

    let doubled: u64 = Fibonacci::new().map(|n| n * 2).take(5).sum();
    assert_eq!(doubled, 14, "0 + 1 + 1 + 2 + 3, doubled");

    let numbered: Vec<(usize, u64)> = Fibonacci::new().enumerate().take(3).collect();
    assert_eq!(numbered, vec![(0, 0), (1, 1), (2, 1)]);

    // Two independent cursors over the same sequence, one a step ahead.
    let neighbours: Vec<(u64, u64)> = Fibonacci::new().zip(Fibonacci::new().skip(1)).take(4).collect();
    assert_eq!(neighbours, vec![(0, 1), (1, 1), (1, 2), (2, 3)]);

    assert_eq!(
        Fibonacci::new().position(|n| n == 21),
        Some(8),
        "position is a consumer, and it short-circuits on an infinite sequence"
    );
}

#[test]
fn an_infinite_iterator_is_the_callers_problem() {
    let mut seen = Vec::new();

    // `for` accepts any IntoIterator, and every Iterator gets that impl free,
    // returning itself. The sequence never ends, so `take` is the only reason
    // this loop terminates.
    for n in Fibonacci::new().take(4) {
        seen.push(n);
    }

    assert_eq!(seen, vec![0, 1, 1, 2]);
}

#[test]
fn the_cursor_carries_its_position_into_an_adapter() {
    let mut fib = Fibonacci::new();
    fib.next();
    fib.next();
    fib.next();

    // The three discarded calls advanced the state, and `take` picks up where
    // they left off rather than restarting.
    let rest: Vec<u64> = fib.take(3).collect();
    assert_eq!(rest, vec![2, 3, 5]);
}
