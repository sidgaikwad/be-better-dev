//! Lesson: iter-three-ways

use iterators_closures::*;

fn list() -> Vec<Subscriber> {
    vec![
        Subscriber::new("ada@mail.dev", false),
        Subscriber::new("grace@mail.dev", false),
    ]
}

#[test]
fn iter_leaves_the_caller_holding_everything() {
    let subs = list();
    let emails = cloned_emails(&subs);

    assert_eq!(emails, vec!["ada@mail.dev", "grace@mail.dev"]);
    // The borrow ended with the call. Both the copies and the originals exist.
    assert_eq!(subs.len(), 2);
    assert_eq!(subs[0].email, "ada@mail.dev");
}

#[test]
fn iter_mut_leaves_the_caller_holding_edited_data() {
    let mut subs = list();
    confirm_all(&mut subs, &["grace@mail.dev", "nobody@mail.dev"]);

    assert!(!subs[0].confirmed, "only the listed addresses flip");
    assert!(subs[1].confirmed, "and this one was edited in place, not replaced");
    assert_eq!(subs.len(), 2, "nothing was added or removed");
}

#[test]
fn confirming_twice_is_harmless() {
    let mut subs = list();
    confirm_all(&mut subs, &["ada@mail.dev"]);
    confirm_all(&mut subs, &["ada@mail.dev"]);

    assert!(subs[0].confirmed);
    // The exclusive borrow lasted exactly as long as each call, which is why a
    // second call is allowed at all.
    assert!(!subs[1].confirmed);
}

#[test]
fn into_iter_leaves_the_caller_holding_nothing() {
    let subs = list();
    let emails = into_emails(subs);

    assert_eq!(emails, vec!["ada@mail.dev", "grace@mail.dev"]);
    // `subs` cannot be named here: into_emails took the vector by value, so the
    // pointer, length, and capacity moved into the iterator and the binding died
    // at compile time. Uncomment the line to hear it from the compiler.
    // println!("{}", subs.len());
}

#[test]
fn the_two_routes_agree_on_the_answer_and_differ_on_the_price() {
    let subs = list();
    // Same output either way. The difference is that this one allocated a fresh
    // String per element, and the next one moved the existing ones.
    let borrowed = cloned_emails(&subs);
    let owned = into_emails(subs);

    assert_eq!(borrowed, owned);
}
