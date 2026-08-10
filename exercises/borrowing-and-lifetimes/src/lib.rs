//! Borrowing and lifetimes.
//!
//! This crate leans harder on reading the compiler than on writing code. Several
//! exercises ship a program that is rejected today and ask you to restructure it
//! until it is accepted, without weakening what it does.

/// Lesson: shared-references
///
/// Return the length of the text without taking ownership of it.
///
/// Take the widest parameter type that still works, so a `String`, a literal,
/// and a slice of another string can all call this. The lesson names it.
pub fn text_len(_text: &str) -> usize {
    todo!("borrow to read; pick the type with the widest front door")
}

/// Lesson: exclusive-references
///
/// Append `" (confirmed)"` to the subscriber's name in place.
///
/// The caller keeps their `String`, so this needs the other kind of reference.
pub fn confirm_in_place(_name: &mut String) {
    todo!("mutate through an exclusive borrow")
}

/// Lesson: exclusive-references
///
/// Push every element of `extra` onto `target`.
///
/// The obvious first attempt trips the aliasing rule. Read the error before
/// reaching for a fix: it will tell you exactly which two borrows overlap.
pub fn append_all(_target: &mut Vec<i32>, _extra: &[i32]) {
    todo!("one writer, and no readers of the same data at the same time")
}

/// Lesson: borrow-checker-proofs
///
/// Return the first element and then clear the vector, in that order, without
/// the borrow checker rejecting the sequence.
///
/// This is the non-lexical-lifetimes exercise: the fix is not a clone or a
/// restructure of the data, it is where the borrow's *last use* falls.
pub fn first_then_clear(_v: &mut Vec<i32>) -> Option<i32> {
    todo!("end the borrow before the mutation begins")
}

/// Lesson: dangling-references
///
/// COMPILE ERROR: this function cannot be written as declared.
///
/// ```text
/// error[E0106]: missing lifetime specifier
///   |
///   | fn build_greeting() -> &String {
///   |                        ^ expected named lifetime parameter
///   = help: this function's return type contains a borrowed value, but there
///           is no value for it to be borrowed from
/// ```
///
/// The signature promises a borrow with nothing to borrow from. Fix it by
/// changing what the function returns, not by inventing a lifetime.
///
/// ```ignore
/// pub fn build_greeting() -> &String {
///     let greeting = String::from("hello");
///     &greeting
/// }
/// ```
pub fn build_greeting() -> String {
    todo!("return the owned value and let the move carry it out")
}

/// Lesson: lifetime-annotations
///
/// Return whichever of the two inputs is longer.
///
/// This is the signature elision cannot write for you: two input references,
/// one returned. Annotate it so the compiler can check callers, then read the
/// test that proves the annotation does real work.
pub fn longest<'a>(_a: &'a str, _b: &'a str) -> &'a str {
    todo!("say how the output's region relates to the inputs'")
}

/// Lesson: lifetime-annotations
///
/// Return the first input, ignoring the second entirely.
///
/// Deliberately a narrower promise than `longest`: only `a` can come back out,
/// so only `a`'s lifetime should appear in the return type. The test calls this
/// with a short-lived second argument to prove the difference matters.
pub fn first_of<'a>(_a: &'a str, _b: &str) -> &'a str {
    todo!("tie the output to a alone")
}

/// Lesson: lifetimes-in-structs
///
/// A parser that borrows the text it walks rather than owning a copy.
///
/// Add the lifetime parameter this struct needs, then implement the two
/// methods. Afterward, read the closing exercise in the lesson and decide
/// whether a real parser in your own code should look like this or own its
/// input.
pub struct Parser<'a> {
    pub input: &'a str,
    pub position: usize,
}

impl<'a> Parser<'a> {
    pub fn new(input: &'a str) -> Self {
        Self { input, position: 0 }
    }

    /// Return the rest of the input from the current position, as a borrow.
    pub fn remaining(&self) -> &'a str {
        todo!("slice from position to the end")
    }

    /// Advance past the next word and return it, or None at the end of input.
    /// Words are separated by single spaces.
    pub fn next_word(&mut self) -> Option<&'a str> {
        todo!("find the next space, slice up to it, move position past it")
    }
}

/// Lesson: slices
///
/// Return the first word of `text`, or the whole string when it holds no space.
///
/// No allocation: the return type is a view into the caller's data. Elision
/// already ties the output's lifetime to the input, which is why this signature
/// needs no annotation while `longest` did.
pub fn first_word(_text: &str) -> &str {
    todo!("a view, not a copy")
}

/// Lesson: slices
///
/// Sum a window of the slice, from `start` up to but not including `end`.
///
/// Return None rather than panicking when the range does not fit. The lesson
/// names the method that turns an out-of-range slice into an Option.
pub fn window_sum(_values: &[i32], _start: usize, _end: usize) -> Option<i32> {
    todo!("indexing panics; something else returns Option")
}
