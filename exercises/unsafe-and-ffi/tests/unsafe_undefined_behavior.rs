//! Lesson: unsafe-undefined-behavior

use unsafe_and_ffi::*;

#[test]
fn every_byte_has_an_answer_not_a_bit_pattern() {
    assert!(!byte_to_bool(0));
    assert!(byte_to_bool(1));
    assert!(byte_to_bool(2), "2 is a byte meaning true, not a bool holding 2");

    for b in 0..=u8::MAX {
        assert_eq!(byte_to_bool(b), b != 0, "byte {b} must convert, not reinterpret");
    }
}

#[test]
fn the_guard_only_guards_what_comes_after_it() {
    let x = 42i32;
    // SAFETY: &x is a live, initialized, aligned i32 that nothing writes to for
    // the length of this call, which is the non-null half of the contract.
    assert_eq!(unsafe { read_or_zero(&x) }, 42);

    // SAFETY: null is the other input the contract allows.
    let zero = unsafe { read_or_zero(std::ptr::null()) };
    assert_eq!(zero, 0, "reading before checking would fault or be deleted outright");
}

#[test]
fn a_valid_reference_is_never_null_which_is_what_buys_the_niche() {
    // The claim the transmuted-reference example in the lesson breaks: because
    // no valid `&i32` is null, `Option<&i32>` can spend the null pattern on
    // `None` and carry no tag byte at all. Fabricate an invalid reference and
    // every layout decision resting on this collapses with it.
    assert_eq!(
        std::mem::size_of::<Option<&i32>>(),
        std::mem::size_of::<&i32>(),
        "None is stored as the null pattern, so there is nowhere for a tag to hide"
    );
}
