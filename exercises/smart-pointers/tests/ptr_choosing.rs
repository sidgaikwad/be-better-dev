//! Lesson: ptr-choosing

use smart_pointers::*;

#[test]
fn question_zero_settles_most_of_them() {
    assert_eq!(
        choose(Owners::Borrowed, Threads::One, Mutation::OwnerOnly),
        "&T",
        "most function parameters never get past question zero, and it is free"
    );
    assert_eq!(choose(Owners::BorrowedMut, Threads::One, Mutation::OwnerOnly), "&mut T");
}

#[test]
fn one_owner_is_the_default_and_the_heap_is_a_forced_move() {
    assert_eq!(
        choose(Owners::One, Threads::One, Mutation::OwnerOnly),
        "T",
        "the default; every row under it is for a shape ownership alone cannot express"
    );
    assert_eq!(
        choose(Owners::OneOnHeap, Threads::One, Mutation::OwnerOnly),
        "Box<T>",
        "recursive, huge, or dyn: box when size forces your hand, not by habit"
    );
}

#[test]
fn the_thread_question_picks_between_the_two_counted_pointers() {
    assert_eq!(choose(Owners::Many, Threads::One, Mutation::OwnerOnly), "Rc<T>");
    assert_eq!(
        choose(Owners::Many, Threads::Many, Mutation::OwnerOnly),
        "Arc<T>",
        "templates loaded at startup and never written: many owners, many threads, \
         and no lock layer to pay for"
    );
}

#[test]
fn the_mutation_answer_nests_inside_the_ownership_answer() {
    assert_eq!(
        choose(Owners::One, Threads::One, Mutation::ThroughSharesCopy),
        "Cell<T>",
        "the mailer's counter: no reference given out, so there is nothing to check"
    );
    assert_eq!(choose(Owners::One, Threads::One, Mutation::ThroughShares), "RefCell<T>");
    assert_eq!(
        choose(Owners::Many, Threads::One, Mutation::ThroughShares),
        "Rc<RefCell<T>>",
        "read it inside out: a node, mutable through shares, shared on one thread"
    );
    assert_eq!(
        choose(Owners::Many, Threads::Many, Mutation::ThroughShares),
        "Arc<Mutex<T>>",
        "the same two answers with the thread question flipped"
    );
}
