//! Lesson: macro-proc-consumer-side
//!
//! This file does not compile until `SubscriberId` carries the right derives.
//! That is the exercise: the compiler names one missing trait at a time. Other
//! exercises still run meanwhile, with `cargo test --test macro_why_they_exist`
//! and friends.

use std::collections::HashMap;

use macros_exercises::*;

#[test]
fn derives_append_impls_and_edit_nothing() {
    let id = SubscriberId(7);

    // Assignment leaves the original binding alive, so the type is Copy.
    let same = id;
    assert_eq!(id, same, "PartialEq comes from a derive, not from a handwritten impl");
    assert_eq!(format!("{id:?}"), "SubscriberId(7)", "Debug prints the shape it was given");

    // A HashMap key is the assertion that catches Eq and Hash together.
    let mut owners: HashMap<SubscriberId, &str> = HashMap::new();
    owners.insert(id, "ada");
    assert_eq!(owners.get(&SubscriberId(7)), Some(&"ada"));

    // Six derives later the type is still exactly its one u64. A derive only
    // ever adds code beside your item, which is why stacking them composes and
    // why adding one can never change a layout you were relying on.
    assert_eq!(
        std::mem::size_of::<SubscriberId>(),
        8,
        "generated impls live next to the type, never inside it"
    );
}
