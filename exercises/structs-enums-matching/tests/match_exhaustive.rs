//! Lesson: match-exhaustive
//!
//! Needs `Delivery` finished before it compiles. See the enums-sum-types
//! exercise.

use structs_enums_matching::*;

#[test]
fn every_variant_gets_an_answer_of_its_own() {
    assert_eq!(delivery_report(&Delivery::Queued), "waiting in the queue");
    assert_eq!(
        delivery_report(&Delivery::Sent { message_id: "m-1".to_string() }),
        "delivered as m-1"
    );
    assert_eq!(
        delivery_report(&Delivery::Bounced { reason: "mailbox full".to_string() }),
        "bounced: mailbox full"
    );

    // Three variants, three different strings, each quoting its own payload.
    // A `_` arm returns one answer for every case it swallows, so it cannot
    // satisfy all three lines above. The wildcard is not banned by style here;
    // it is ruled out by what the function has to do.
}

#[test]
fn the_payload_comes_out_in_the_same_stroke_as_the_variant() {
    let sent = Delivery::Sent { message_id: "abc-123".to_string() };
    assert!(delivery_report(&sent).contains("abc-123"), "the arm destructures what it matched");
    // The report borrowed the delivery, so it is still here to send again.
    assert_eq!(sent.message_id(), Some("abc-123"));
}

#[test]
fn a_guard_refines_the_pattern_a_binding_names() {
    assert_eq!(classify(250, 3), Bounce::Accepted);
    assert_eq!(classify(200, 0), Bounce::Accepted, "success does not consult the retry budget");

    assert_eq!(classify(421, 2), Bounce::Soft(421), "4xx with attempts left is worth retrying");
    assert_eq!(classify(421, 0), Bounce::Hard(421), "the same code, out of attempts, is final");

    assert_eq!(classify(550, 3), Bounce::Hard(550), "5xx is final however many attempts remain");
    assert_eq!(classify(550, 0), Bounce::Hard(550));

    assert_eq!(classify(99, 3), Bounce::Unknown(99));
    assert_eq!(classify(600, 1), Bounce::Unknown(600), "nothing above 5xx is a status we know");
}
