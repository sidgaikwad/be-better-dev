//! Lesson: traits-monomorphization

use traits_and_generics::*;

#[test]
fn impl_trait_in_argument_position_is_the_same_generic() {
    // Two concrete types reach one source function, so the compiled program
    // holds two stamped copies of it, each calling a known `send` directly.
    let fake = RecordingClient::new();
    send_reminder(&fake, "ada@example.com").unwrap();
    assert_eq!(fake.calls(), vec!["ada@example.com"]);

    let postmark = Postmark::new("secret-token");
    send_reminder(&postmark, "grace@example.com").unwrap();
    assert_eq!(postmark.calls(), vec!["grace@example.com"]);

    // A third call with a type already used adds no copy: copies are stamped
    // per concrete type, not per call site.
    send_reminder(&fake, "alan@example.com").unwrap();
    assert_eq!(fake.calls(), vec!["ada@example.com", "alan@example.com"]);
}

#[test]
fn impl_trait_in_return_position_names_a_type_you_cannot_write() {
    let greet = confirmation_email(String::from("Ada"));
    assert_eq!(greet(), "Hi Ada, confirm your subscription");
    assert_eq!(
        greet(),
        "Hi Ada, confirm your subscription",
        "Fn, not FnOnce: calling it did not consume it"
    );

    // Each call to confirmation_email returns the same one concrete type, which
    // is why these two closures can share a binding.
    let mut greeters = vec![confirmation_email(String::from("Grace"))];
    greeters.push(confirmation_email(String::from("Alan")));
    assert_eq!(greeters[0](), "Hi Grace, confirm your subscription");
    assert_eq!(greeters[1](), "Hi Alan, confirm your subscription");
}
