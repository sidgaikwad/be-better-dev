//! Lesson: enums-sum-types
//!
//! This file does not compile until `Delivery` has all three variants. The
//! error is the exercise: the compiler knows the full set of shapes, which is
//! the property every later lesson in this section is built on.

use structs_enums_matching::*;

#[test]
fn a_variant_carries_only_its_own_data() {
    let queued = Delivery::Queued;
    let sent = Delivery::Sent { message_id: "m-1".to_string() };
    let bounced = Delivery::Bounced { reason: "mailbox full".to_string() };

    assert_eq!(sent.message_id(), Some("m-1"));
    assert_eq!(bounced.message_id(), None, "a bounce has no message id to give");
    assert_eq!(queued.message_id(), None);

    // The states are exclusive by construction. There is no way to write a
    // Delivery holding a message id and a bounce reason at once, which is the
    // state a struct with two optional fields would happily represent.
    assert_ne!(sent, bounced);
    assert_ne!(sent, queued);
}

#[test]
fn the_tag_hides_in_a_niche_when_the_type_has_one() {
    let (byte, reference) = option_sizes();
    assert_eq!(byte, 2, "all 256 u8 patterns are legal, so the tag needs its own byte");
    assert_eq!(reference, 8, "a reference is never null, so None borrows that pattern");
    assert_eq!(
        reference,
        std::mem::size_of::<&u8>(),
        "Option-wrapping a reference costs literally nothing"
    );
}
