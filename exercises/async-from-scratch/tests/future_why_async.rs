//! Lesson: future-why-async

use async_from_scratch::*;

#[test]
fn a_thread_per_send_prices_the_wait_in_stacks() {
    assert_eq!(
        thread_per_send_bytes(10_000),
        10_000 * THREAD_STACK_RESERVATION,
        "ten thousand in-flight sends, one thread apiece, each reserving its stack"
    );
    assert!(
        thread_per_send_bytes(10_000) > 20_000_000_000,
        "over twenty billion bytes of address space reserved to represent waiting"
    );
}

#[test]
fn a_paused_send_is_a_couple_of_machine_words() {
    assert!(
        std::mem::size_of::<PendingSend>() <= 16,
        "a paused send holds what resumption needs and nothing else"
    );
    assert_eq!(paused_value_bytes(10_000), 10_000 * std::mem::size_of::<PendingSend>());
    assert!(
        paused_value_bytes(10_000) < THREAD_STACK_RESERVATION,
        "ten thousand paused sends fit inside the stack a single thread reserves"
    );
}

#[test]
fn the_ratio_is_the_whole_argument() {
    assert!(
        thread_per_send_bytes(1) / paused_value_bytes(1) > 100_000,
        "one thread costs more than a hundred thousand paused sends: C10K in one division"
    );
    assert_eq!(paused_value_bytes(0), 0, "representing nothing costs nothing");
}
