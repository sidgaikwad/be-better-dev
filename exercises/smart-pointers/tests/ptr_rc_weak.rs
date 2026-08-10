//! Lesson: ptr-rc-weak

use std::rc::Rc;

use smart_pointers::*;

#[test]
fn cloning_an_rc_bumps_a_count_and_copies_nothing() {
    let tpl = Rc::new(Template { html: String::from("<h1>Welcome</h1>") });
    assert_eq!(Rc::strong_count(&tpl), 1);

    let jobs = queue_jobs(&tpl, 50);
    assert_eq!(jobs.len(), 50);
    assert_eq!(Rc::strong_count(&tpl), 51, "the original owner, plus one per job");
    assert!(
        Rc::ptr_eq(&tpl, &jobs[0]),
        "one allocation shared 51 ways; a fresh Rc::new per job would pass the count \
         check and fail this one"
    );

    drop(jobs);
    assert_eq!(Rc::strong_count(&tpl), 1, "every job that finished gave its claim back");
    assert_eq!(tpl.html, "<h1>Welcome</h1>", "and the value outlived all of them");
}

#[test]
fn the_parent_owns_the_child_and_the_child_only_points_back() {
    let parent = Node::new("root");
    let child = Node::new("leaf");
    Node::adopt(&parent, &child);

    assert_eq!(parent.children.borrow().len(), 1);
    assert_eq!(Rc::strong_count(&child), 2, "this binding, plus the parent's children vector");
    assert_eq!(
        Rc::strong_count(&parent),
        1,
        "the back-pointer must not own, or neither count can ever reach zero"
    );
    assert_eq!(Rc::weak_count(&parent), 1, "a claim on the allocation header, not on the value");
    assert_eq!(child.parent().map(|node| node.name), Some("root"));
}

#[test]
fn a_weak_back_pointer_reports_a_dead_parent_instead_of_keeping_it_alive() {
    let child = Node::new("leaf");
    {
        let parent = Node::new("root");
        Node::adopt(&parent, &child);
        assert!(child.parent().is_some(), "alive, and reachable from below");
        assert_eq!(Rc::strong_count(&child), 2);
    }

    assert!(
        child.parent().is_none(),
        "upgrade() answers None once the value is gone; an owning back-pointer would \
         have held the parent up forever"
    );
    assert_eq!(
        Rc::strong_count(&child),
        1,
        "the parent released its child as it dropped, which a leaked parent never does"
    );
}
