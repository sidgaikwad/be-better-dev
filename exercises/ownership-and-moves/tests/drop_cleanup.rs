//! Lesson: drop-cleanup

use std::cell::RefCell;
use std::rc::Rc;

use ownership_and_moves::*;

#[test]
fn drop_runs_in_reverse_declaration_order() {
    let log = Rc::new(RefCell::new(Vec::new()));
    {
        let _first = Tracker { name: "first", log: Rc::clone(&log) };
        let _second = Tracker { name: "second", log: Rc::clone(&log) };
        assert!(log.borrow().is_empty(), "nothing drops before the scope ends");
    }
    assert_eq!(*log.borrow(), vec!["second", "first"], "last in, first out");
}

#[test]
fn drop_follows_the_value_when_it_moves() {
    let log = Rc::new(RefCell::new(Vec::new()));
    let tracker = Tracker { name: "moved", log: Rc::clone(&log) };
    {
        let _inner = tracker; // ownership moves into the inner scope
        assert!(log.borrow().is_empty());
    } // dropped here, at the end of wherever ownership came to rest
    assert_eq!(*log.borrow(), vec!["moved"]);
}
