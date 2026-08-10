//! Lesson: unsafe-sound-abstractions

use unsafe_and_ffi::*;

#[test]
fn the_wrapper_discharges_the_contract_for_every_caller() {
    let v = vec![10, 20, 30];
    assert_eq!(get(&v, 0), Some(10));
    assert_eq!(get(&v, 2), Some(30));
    assert_eq!(get(&v, 3), None, "one past the end is the first index the check must reject");
    assert_eq!(get(&v, usize::MAX), None, "an adversarial caller is still a safe caller");
    assert_eq!(get(&[], 0), None);
}

#[test]
fn both_halves_are_writable_at_the_same_time() {
    let mut data = [1, 2, 3, 4, 5, 6];
    let (left, right) = split_at_mut(&mut data, 2);

    // Two `&mut` into one array, live together. This is the pair of lines safe
    // Rust cannot hand out, and the unsafe inside is what pays for them.
    left[0] = 100;
    right[0] = 200;
    assert_eq!(*left, [100, 2]);
    assert_eq!(*right, [200, 4, 5, 6]);

    // The borrow checker governs the halves from here. Once they are dead the
    // original is usable again, which is the safe signature doing its job.
    assert_eq!(data, [100, 2, 200, 4, 5, 6]);
}

#[test]
fn the_edges_split_cleanly() {
    let mut data = [1, 2, 3];

    let (left, right) = split_at_mut(&mut data, 0);
    assert!(left.is_empty());
    assert_eq!(right.len(), 3);

    let (left, right) = split_at_mut(&mut data, 3);
    assert_eq!(left.len(), 3, "splitting at len is legal: the second half is empty");
    assert!(right.is_empty());

    let empty: &mut [i32] = &mut [];
    let (left, right) = split_at_mut(empty, 0);
    assert!(left.is_empty() && right.is_empty());
}

#[test]
#[should_panic]
fn a_split_past_the_end_panics_instead_of_fabricating_a_slice() {
    let mut data = [1, 2, 3];
    // Without the assertion this call builds a slice ten elements past the
    // allocation. That is UB at creation, before a single element is read, and
    // it arrives through a call containing no `unsafe` at all: the definition
    // of an unsound API.
    let _halves = split_at_mut(&mut data, 13);
}
