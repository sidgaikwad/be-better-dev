//! Lesson: mod-builders

use std::time::Duration;

use modules_api_design::*;

fn sender() -> SubscriberEmail {
    SubscriberEmail::parse("news@example.com".to_string())
        .expect("mod-newtypes builds the parser this builder's sender type needs")
}

#[test]
fn required_inputs_are_parameters_optional_ones_are_methods() {
    let client = EmailClient::builder("https://api.postmarkapp.com".to_string(), sender())
        .build()
        .expect("an https base url with the default retry count is valid");

    // Nothing at this call site named a timeout or a retry count, and both have
    // values. Defaults belong in the constructor, in one place, rather than at
    // every call site or in a language feature Rust deliberately does not have.
    assert_eq!(client.timeout(), Duration::from_secs(10));
    assert_eq!(client.retries(), 3);

    assert_eq!(client.base_url(), "https://api.postmarkapp.com");
    assert_eq!(client.sender().as_str(), "news@example.com");
}

#[test]
fn setters_chain_and_name_what_they_set() {
    let client = EmailClient::builder("https://api.postmarkapp.com".to_string(), sender())
        .timeout(Duration::from_millis(200))
        .retries(1)
        .build()
        .unwrap();

    // Compare this with the four positional arguments the lesson starts from.
    // Every optional value above is labelled by the method that set it, and the
    // two required ones could not be forgotten because they are parameters.
    assert_eq!(client.timeout(), Duration::from_millis(200));
    assert_eq!(client.retries(), 1);
}

#[test]
fn build_is_where_construction_is_allowed_to_fail() {
    let err = EmailClient::builder("http://api.postmarkapp.com".to_string(), sender())
        .build()
        .expect_err("plaintext would put the authorization token on the wire");
    assert!(err.contains("https"), "the message should say what build refused: {err}");

    let err = EmailClient::builder("https://api.postmarkapp.com".to_string(), sender())
        .retries(9)
        .build()
        .expect_err("nine retries is a denial of service with extra steps");
    assert!(err.contains("retries"), "the message should say what build refused: {err}");

    // The setters themselves never fail. Holding validation until build is what
    // lets them chain, and a half-configured builder is not wrong yet.
}

// COMPILE ERROR: error[E0382]: use of moved value: `partial`
//
// A consuming builder takes `self`, so the first call moves `partial` and the
// second has nothing left to use. The discarded return value trips a second
// diagnostic on the same line, the one the signatures lesson asked for:
//
//     warning: unused return value of `EmailClientBuilder::retries` that must
//     be used
//
// Chain the calls, or rebind with `let partial = partial.retries(1);`. A
// &mut self builder would compile this as written, which is exactly the trade
// between the two conventions.
//
// #[test]
// fn a_builder_can_be_configured_in_statements() {
//     let partial = EmailClient::builder("https://api.postmarkapp.com".to_string(), sender());
//     partial.retries(1);
//     let _client = partial.build().unwrap();
// }
