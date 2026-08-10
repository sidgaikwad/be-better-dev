//! Lesson: ptr-cell-refcell
//!
//! This file does not compile until `Mailer`'s fields carry the right wrappers.
//! The API each test uses is the clue: one field is read with `get`, the other
//! is read with `borrow`.

use std::rc::Rc;

use smart_pointers::*;

#[test]
fn a_shared_mailer_still_counts_and_logs_what_it_sends() {
    // Rc hands out &Mailer and nothing else, so every send below goes through a
    // shared reference. That is the tension the whole lesson is about.
    let mailer = Rc::new(Mailer::new());
    let handler_a = Rc::clone(&mailer);
    let handler_b = Rc::clone(&mailer);

    handler_a.send("ada@example.com");
    handler_b.send("grace@example.com");

    assert_eq!(mailer.sent.get(), 2, "a Copy counter swapped whole: no flag, no branch, no cost");
    assert_eq!(
        *mailer.log.borrow(),
        vec![String::from("ada@example.com"), String::from("grace@example.com")]
    );
}

#[test]
fn temporary_guards_never_overlap() {
    let mailer = Mailer::new();

    mailer.send("a@example.com");
    mailer.send("b@example.com");

    assert_eq!(
        mailer.log.borrow().len(),
        2,
        "each borrow was a temporary that dropped at the end of its own statement"
    );
}

#[test]
#[should_panic(expected = "already borrowed")]
fn a_held_read_guard_turns_the_next_write_into_a_runtime_panic() {
    let mailer = Mailer::new();

    // A guard is a value, so this borrow lasts until the guard drops at the end
    // of the scope, not until its last use. `_reader` is never read again and
    // the panic still fires.
    let _reader = mailer.log.borrow();

    // A reader and a writer overlapping: the exact bug the borrow checker
    // rejects for free at compile time, except this one waited until runtime.
    mailer.send("boom@example.com");
}
