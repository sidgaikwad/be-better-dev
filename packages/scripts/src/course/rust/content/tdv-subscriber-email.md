The renamed integration test wants a `400 Bad Request` for every invalid payload. Empty names now get one. Then:

```
The API did not return a 400 Bad Request when the payload was empty email.
```

No email validation exists yet, and writing a correct `is_valid_email` from scratch is a trap. The format is spread across RFC 6854, RFC 5322 and RFC 2822, it is genuinely messy, and the HTML specification is _willfully_ non-compliant with all of them. The sane move is a crate that has stared long at the problem: `validator`. (The book pins `0.14` and calls the free function `validate_email`; in current releases the check moved onto a trait, `ValidateEmail`, so today's code calls `s.validate_email()`.)

The strategy is the one that worked for names: a newtype that stores the proof. Along the way `domain.rs` becomes a `domain/` directory, one file per type (`subscriber_name.rs`, `subscriber_email.rs`, `new_subscriber.rs`), with `mod.rs` re-exporting through `pub use` so nothing outside the module notices. Tests come first, and they are all rejections:

```rust
#[test]
fn email_missing_at_symbol_is_rejected() {
    let email = "ursuladomain.com".to_string();
    assert_err!(SubscriberEmail::parse(email));
}
// also: the empty string, and "@domain.com" (missing local part)
```

Then `parse` delegates the judgment:

```rust
use validator::validate_email;

#[derive(Debug)]
pub struct SubscriberEmail(String);

impl SubscriberEmail {
    pub fn parse(s: String) -> Result<SubscriberEmail, String> {
        if validate_email(&s) {
            Ok(Self(s))
        } else {
            Err(format!("{} is not a valid subscriber email.", s))
        }
    }
}
```

Green. But every test checks _invalid_ inputs. We could hard-code `ursula@domain.com` and assert it parses, but that certifies one string. The interesting risk runs the other way: is the validation too strict? Does it bounce addresses that real people use?

## Testing a property instead of examples

Flip the approach: build a generator that produces valid emails at random, and assert the parser never rejects one. We stop verifying examples and start verifying a property: "no valid email address is rejected". Property-based testing widens the tested input space enormously and confidence rises with it, with one caveat the book states up front: it does not _prove_ correctness. Random sampling is not an exhaustive sweep of the input space.

Two crates do the work. `fake` generates realistic data: `SafeEmail().fake()` yields a fresh plausible email on every call. `quickcheck` runs the loop: it calls a property function 100 times by default with generated inputs, and when the property returns `false` it _shrinks_ the failing input toward the smallest case that still fails, turning "some 60-character email broke it" into a minimal repro. (`proptest` is the other mainstream option, overlapping domains, each shining in its niche; the book picks quickcheck for its lighter macro surface.)

The crates meet at quickcheck's `Arbitrary` trait: `arbitrary` builds an instance from a randomness source `g`, and `shrink` has a default (an empty shrinker) so we only need `arbitrary`. A plain random `String` would be garbage that rightly fails validation, so we generate through a fixture confined to the valid space:

```rust
#[derive(Debug, Clone)]
struct ValidEmailFixture(pub String);

impl quickcheck::Arbitrary for ValidEmailFixture {
    fn arbitrary<G: quickcheck::Gen>(g: &mut G) -> Self {
        Self(SafeEmail().fake_with_rng(g))
    }
}

#[quickcheck_macros::quickcheck]
fn valid_emails_are_parsed_successfully(valid_email: ValidEmailFixture) -> bool {
    SubscriberEmail::parse(valid_email.0).is_ok()
}
```

Why does `g` slot straight into `fake`? In quickcheck 0.9, `Gen` requires `RngCore` from `rand-core`, and `fake_with_rng` accepts any `Rng`, which every `RngCore` implementor gets for free. Two crates that never planned for each other interoperate through community-standard traits, the same dividend `AsRef` paid last unit. It is also why the book pins `fake = "~2.3"`: the `rand` versions must line up with quickcheck 0.9. quickcheck 1.0 later made `Gen` an opaque struct that hides its RNG, so current project code seeds its own `StdRng` from `u64::arbitrary(g)` and hands that to `fake_with_rng`.

Now every test run pushes 100 realistic emails through `parse`: dotted local parts, digits, hyphens, domains you would not think to write down. An accidentally over-strict rule survives three hand-picked examples; it rarely survives that barrage. Add `dbg!(&valid_email.0);` and run `cargo test valid_emails -- --nocapture` to watch the generated inputs scroll by.

## Predict, then verify

Suppose `parse` had a bug rejecting emails whose local part contains a digit, and `SafeEmail` produces `bella_kirlin5@example.net`. quickcheck catches it. Will the reported counterexample be some minimal email like `a0@a.io`, or the raw generated one?

Answer: the raw one. Shrinking runs through `Arbitrary::shrink`, and `ValidEmailFixture` keeps the default empty shrinker, so quickcheck reports the first failing fixture as-is. Built-ins like `Vec<u32>` ship real shrinkers that hunt for minimal cases; writing one for emails would mean generating progressively simpler _valid_ emails, effort this fixture deliberately skips.
