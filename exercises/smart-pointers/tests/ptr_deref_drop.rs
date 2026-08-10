//! Lesson: ptr-deref-drop
//!
//! This file does not compile until `Tracked<T>` implements `Deref`. Every line
//! below asks the wrapper to stand in for the value it holds, which is the half
//! of a smart pointer that `Deref` provides; the other half is what the drop
//! tests observe.

use std::cell::RefCell;
use std::rc::Rc;

use smart_pointers::*;

fn greet(name: &str) -> String {
    format!("hello, {name}")
}

#[test]
fn deref_lets_the_wrapper_stand_in_for_its_value() {
    let log = Rc::new(RefCell::new(Vec::new()));
    let mut name = Tracked::new("name", String::from("Alice"), Rc::clone(&log));

    assert_eq!(name.len(), 5, "a String method, found through your Deref impl");
    name.push_str(" B."); // &mut Tracked<String> to &mut String, via DerefMut
    assert_eq!(
        greet(&name),
        "hello, Alice B.",
        "coercion is transitive: &Tracked<String> to &String to &str, no cast anywhere"
    );
    assert_eq!(*name, "Alice B.", "and the explicit deref still says the same thing");
}

#[test]
fn drop_releases_at_the_end_of_the_binding_that_holds_it() {
    let log = Rc::new(RefCell::new(Vec::new()));
    {
        let _held = Tracked::new("held", (), Rc::clone(&log));
        assert!(log.borrow().is_empty(), "a named binding lives to the end of its scope");
    }
    assert_eq!(*log.borrow(), vec!["held"], "released on the way out, deterministically");
}

#[test]
fn a_wildcard_pattern_drops_it_on_the_spot() {
    let log = Rc::new(RefCell::new(Vec::new()));

    let _ = Tracked::new("wildcard", (), Rc::clone(&log));
    assert_eq!(
        *log.borrow(),
        vec!["wildcard"],
        "`_` binds nothing, so it died mid-statement; when the value is a lock guard, \
         this is the line that protects nothing"
    );

    let _kept = Tracked::new("kept", (), Rc::clone(&log));
    assert_eq!(
        *log.borrow(),
        vec!["wildcard"],
        "one underscore apart, and this one is still holding"
    );
}
