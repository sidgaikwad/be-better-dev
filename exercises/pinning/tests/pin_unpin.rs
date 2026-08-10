//! Lesson: pin-unpin
//!
//! Every answer `is_unpin` gives about a nameable type is co-signed here by an
//! `assert_unpin` call, which is a compile-time question rather than a runtime
//! one: a type that does not claim the auto trait makes the line fail to build.

use std::pin::Pin;

use pinning::*;

#[test]
fn pin_of_an_unpin_type_is_a_mutable_borrow_with_paperwork() {
    let mut body = String::from("Newsletter");

    // Pin::new is itself the claim: it is safe only because String is Unpin.
    append_through_pin(Pin::new(&mut body), " (updated)");

    assert_eq!(body, "Newsletter (updated)", "get_mut handed the plain &mut straight back");
}

#[test]
fn nearly_every_type_claims_the_auto_trait() {
    assert!(
        is_unpin(Candidate::OwnedString),
        "a String's pointer aims at its buffer, never at itself"
    );
    assert!(is_unpin(Candidate::ByteVec), "the same three words, and the same shrug");

    assert_unpin::<String>();
    assert_unpin::<Vec<u8>>();
    assert_unpin::<u64>();
}

#[test]
fn a_struct_that_points_into_itself_is_still_unpin() {
    assert!(
        is_unpin(Candidate::SelfReferential),
        "Unpin does not mean `safe to move`. Raw pointers are Unpin, the compiler cannot see \
         that this one aims at the field beside it, and so SelfRef claims the trait while a \
         move quietly wrecks it"
    );

    // The compiler agrees, which is the uncomfortable part: nothing about
    // SelfRef asks for the contract, so nothing enforces it.
    assert_unpin::<SelfRef>();
}

#[test]
fn two_types_withhold_it() {
    assert!(
        !is_unpin(Candidate::PhantomPinnedStruct),
        "PhantomPinned is the one field in std that withholds the auto trait, and it is how a \
         type asks the compiler to enforce the contract for it"
    );
    assert!(
        !is_unpin(Candidate::AsyncMachine),
        "marked !Unpin wholesale, with no analysis of whether the body borrows across an await"
    );

    // COMPILE ERROR: `async { 2 + 2 }` holds no references at all, and its
    // future is still not Unpin. Uncomment either line to watch it happen.
    //
    // error[E0277]: `{async block@tests/pin_unpin.rs:NN:NN}` cannot be unpinned
    //    |
    //    |     assert_unpin_value(&async { 2 + 2 });
    //    |     ------------------ ^^^^^^^^^^^^^^^^ the trait `Unpin` is not
    //    |                                         implemented for `{async block}`
    //    |
    //    = note: consider using the `pin!` macro
    //            consider using `Box::pin` if you need to access the pinned
    //            value outside of the current scope
    //
    // assert_unpin_value(&async { 2 + 2 });
    // assert_unpin::<Anchored>();

    // The version that compiles: pin it first, and the pin is Unpin.
    let anchored = Box::pin(Anchored::new("shutdown"));
    assert_unpin_value(&anchored);
}

#[test]
fn pinning_to_the_heap_hands_movement_back() {
    assert!(
        is_unpin(Candidate::PinnedBoxOfAsyncMachine),
        "moving the box moves one pointer; the pinned bytes never go anywhere, so one \
         allocation buys back complete freedom of movement"
    );

    assert_unpin::<Pin<Box<Anchored>>>();
    assert_unpin::<Pin<Box<dyn std::future::Future<Output = u32>>>>();
}
