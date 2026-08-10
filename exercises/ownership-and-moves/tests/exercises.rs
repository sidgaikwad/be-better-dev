//! The specification. When these pass, the section is done.

use std::cell::RefCell;
use std::rc::Rc;

use ownership_and_moves::*;

#[test]
fn stack_and_heap_shapes() {
    // Three words: pointer, length, capacity.
    assert_eq!(string_stack_size(), 24, "a String header is ptr + len + cap");
    assert!(!literal_allocates("hello"), "a literal lives in the binary, not the heap");
}

#[test]
fn one_allocation_for_a_known_size() {
    let v = preallocated_range(1000);
    assert_eq!(v.len(), 1000);
    assert_eq!(v[0], 0);
    assert_eq!(v[999], 999);
    // Growth by doubling would overshoot to 1024. Landing exactly on 1000 is
    // the observable proof that a single up-front allocation happened.
    assert_eq!(v.capacity(), 1000, "growing by doubling would leave slack here");
}

#[test]
fn moves_transfer_ownership() {
    let original = String::from("hello");
    let loud = shout(original);
    assert_eq!(loud, "hello!");
    // `original` cannot be named here: it was moved into `shout`. Uncomment
    // the next line to see the compiler say so.
    // println!("{original}");
}

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

#[test]
fn receivers_are_an_ownership_contract() {
    let sub = Subscriber::new("ada@example.com", "Ada");

    // &self borrows: the subscriber is still usable afterward.
    assert_eq!(sub.domain(), "example.com");
    assert_eq!(sub.name, "Ada");

    // self consumes: this is the last use of `sub`.
    assert_eq!(sub.into_email(), "ada@example.com");
}

#[test]
fn clone_only_what_the_signature_demands() {
    let names = ["ferris", "ada", "ferris", "grace"];
    assert_eq!(sorted_unique(&names), vec!["ada", "ferris", "grace"]);
    // The input is untouched: it was borrowed, not consumed.
    assert_eq!(names.len(), 4);
}
