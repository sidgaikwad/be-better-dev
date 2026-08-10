//! Lesson: unsafe-ffi

use std::mem::{offset_of, size_of};

use unsafe_and_ffi::*;

#[test]
fn repr_c_pins_the_layout_both_sides_have_to_agree_on() {
    // Declaration order, each field at the next offset its alignment allows:
    // tag at 0, three bytes of padding, len at 4, flag at 8, then three bytes
    // of tail padding so an array of these stays aligned.
    assert_eq!(offset_of!(Header, tag), 0, "C lays fields out in declaration order");
    assert_eq!(offset_of!(Header, len), 4, "three bytes of padding align the u32");
    assert_eq!(offset_of!(Header, flag), 8);
    assert_eq!(
        size_of::<Header>(),
        12,
        "Rust's own layout reorders this into 8 bytes, which C would never compute"
    );
}

#[test]
fn an_extern_c_function_is_ordinary_to_call_from_rust() {
    // No block, no bridge, no conversion layer. The call compiles to the same
    // instruction C would emit; what the boundary costs is trust, not cycles.
    assert_eq!(payload_len(Header { tag: 1, len: 7, flag: 0 }), 7);
    assert_eq!(payload_len(Header { tag: 1, len: 7, flag: 1 }), 14);
}

#[test]
fn the_abi_travels_in_the_function_pointer_type() {
    let callback: extern "C" fn(Header) -> u32 = payload_len;
    let h = Header { tag: 9, len: 21, flag: 1 };
    assert_eq!(call_via_abi(callback, h), 42, "the C convention carried the argument both ways");
    assert_eq!(h.len, 21, "Header is Copy, so the callback got a duplicate, not the original");
}

#[test]
fn a_nullable_callback_costs_no_tag_byte() {
    assert_eq!(
        nullable_callback_size(),
        size_of::<extern "C" fn(Header) -> u32>(),
        "None takes the null pattern that a valid function pointer can never hold"
    );
    assert_eq!(nullable_callback_size(), size_of::<usize>(), "one pointer, nothing more");
}
