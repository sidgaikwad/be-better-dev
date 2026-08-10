//! Lesson: pin-mental-model
//!
//! The section in review. The playbook assertions are judgment; the last test
//! walks the six sentences in code and leans on the other lessons' exercises,
//! so work it once the rest are green.

use pinning::*;

#[test]
fn a_future_lent_by_reference_is_pinned_where_it_stands() {
    assert_eq!(
        playbook(Situation::LentAcrossLoopIterations),
        Tool::PinMacro,
        "&mut F is a Future only when F: Unpin, and this one never leaves the function, so the \
         allocation-free tool is enough"
    );
}

#[test]
fn a_future_that_outlives_its_scope_earns_an_allocation() {
    assert_eq!(
        playbook(Situation::StoredInAStructField),
        Tool::BoxPin,
        "a field outlives every frame, and Pin<Box<dyn Future>> buys a stable home and a \
         nameable type in one move"
    );
    assert_eq!(
        playbook(Situation::RecursiveAsyncFn),
        Tool::BoxPin,
        "the same indirection that gives the size equation a finite answer"
    );
}

#[test]
fn the_normal_path_asks_for_nothing() {
    assert_eq!(
        playbook(Situation::AwaitedWhereItWasMade),
        Tool::Nothing,
        "pinning preemptively is not hygiene: .await pins the child inside the parent and the \
         runtime pins the root, so a blanket Box::pin buys an allocation and nothing else"
    );
}

#[test]
fn the_six_sentences_in_code() {
    // Sentences 2 and 3: a value that points into itself, copied byte for byte
    // to a new address, is wrong afterwards and nothing warned anyone.
    let mut machine = SelfRef::new("issue 12");
    machine.link();
    let relocated = Box::new(machine);
    assert!(!relocated.is_intact(), "a move is a byte copy that rewrites nothing");

    // Sentences 4 and 6: give it one address for life instead, and the promise
    // holds however far the handle travels.
    let mut parked = Box::pin(SelfRef::new("issue 12"));
    parked.as_mut().get_mut().link();
    assert!(parked.is_intact(), "linked at the address it will keep until drop");

    let travelled = parked;
    assert!(
        travelled.is_intact(),
        "the promise is about where the value lives, not about where the pointer to it lives"
    );

    // Sentence 5, and the sting in it: SelfRef is Unpin, so get_mut above was
    // safe and the compiler was never enforcing anything here. The contract
    // only binds types that ask for it, which in practice means async machines.
    assert!(is_unpin(Candidate::SelfReferential));
    assert_unpin::<SelfRef>();
}
