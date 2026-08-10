//! Lesson: pin-contract

use std::pin::pin;

use pinning::*;

#[test]
fn a_mutable_borrow_is_the_permission_to_move() {
    let mut first = Anchored::new("first");
    let mut second = Anchored::new("second");
    let first_slot = &first as *const Anchored as usize;

    swap_anchored(&mut first, &mut second);

    assert_eq!(first.label(), "second", "two memcpys, and the source never said `move`");
    assert_eq!(second.label(), "first");
    assert_eq!(
        &first as *const Anchored as usize, first_slot,
        "the slots kept their addresses and the values traded places between them: a machine \
         that had recorded an address inside the first slot is now sitting in the second one"
    );
}

#[test]
fn box_pin_hands_a_value_one_address_for_life() {
    let mut anchored = Box::pin(Anchored::new("root task"));
    let lives_at = address_of(anchored.as_mut());

    assert_eq!(address_of(anchored.as_mut()), lives_at, "polling twice reads the same address");

    let mut travelled = anchored; // Pin<Box<T>> is itself free to move
    assert_eq!(
        address_of(travelled.as_mut()),
        lives_at,
        "moving Pin<Box<T>> moves the pointer, not the pinned bytes, which is what tokio::spawn \
         relies on when it parks your future in a heap-allocated task"
    );
}

#[test]
fn the_pin_macro_nails_a_value_into_this_frame() {
    let mut shutdown = pin!(Anchored::new("shutdown"));
    let lives_at = address_of(shutdown.as_mut());

    // Lending the pin by &mut on every turn is the select! shape: the future
    // has to survive between iterations without changing address while it does.
    for _ in 0..3 {
        assert_eq!(
            address_of(shutdown.as_mut()),
            lives_at,
            "pin! costs no allocation and the address still never moves"
        );
    }
}

#[test]
fn reading_through_a_pin_needs_no_unpin() {
    // Anchored is not Unpin, and address_of works on it anyway: Pin<Ptr> derefs
    // unconditionally, because reading was never the direction that could move
    // a value out of its place.
    let mut anchored = pin!(Anchored::new("worker"));
    let through_the_pin = address_of(anchored.as_mut());
    let through_the_deref = &*anchored as *const Anchored as usize;

    assert_eq!(
        through_the_pin, through_the_deref,
        "Pin is repr(transparent): at runtime it is exactly the pointer inside it"
    );
}

#[test]
fn the_promise_starts_late_so_one_last_move_is_free() {
    let value = Anchored::new("shutdown");
    let on_the_stack = &value as *const Anchored as usize;

    // Box::pin moves the value once, onto the heap, and the promise begins
    // after that move. Nothing had been promised before it.
    let mut pinned = Box::pin(value);

    assert_ne!(
        address_of(pinned.as_mut()),
        on_the_stack,
        "the value it pinned is the copy on the heap, not the original slot"
    );
    assert_eq!(
        pinned.label(),
        "shutdown",
        "no flag was set and no byte changed: the value never learns it is pinned, the pointer \
         promises on its behalf"
    );
}
