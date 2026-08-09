Two `String` parameters, one production incident waiting to happen:

```rust
pub fn send_welcome(email: String, name: String) { /* ... */ }

send_welcome(form.name, form.email);   // compiles, emails the wrong field
```

Both arguments are `String`, so the swap type-checks. There is a second, quieter problem: suppose the handler validates the name on entry with `is_valid_name(&name)`. Three calls deeper, nothing about `name`'s type records that the check ever ran, so every layer must either re-validate or trust its caller. The enums lesson named this disease: states the type system permits but the domain forbids.

## Wrap it in a newtype

The fix costs one line plus a constructor. Chapter 6 of the book builds it for the newsletter:

```rust
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

impl AsRef<str> for SubscriberEmail {
    fn as_ref(&self) -> &str {
        &self.0
    }
}
```

Read it with the last three lessons in hand. The struct is `pub`, the field is not (visibility lesson), so outside `src/domain` the only way to obtain a `SubscriberEmail` is `parse`. `parse` takes `String` by value because it stores it (functions-take-ownership), and returns `Result` because invalid user input is expected, not a bug (result-basics). `AsRef<str>` lends the inner text back out, so the SQL layer writes `new_subscriber.email.as_ref()` wherever a `&str` is needed: the consumer side of the `impl AsRef` bound from the signatures lesson.

(The book pins `validator = "0.14"` for `validate_email`. Newer validator releases moved the check onto a trait: `use validator::ValidateEmail;` then `s.validate_email()`. Same check, new spelling.)

With `NewSubscriber { email: SubscriberEmail, name: SubscriberName }`, the swap bug becomes a compile error: expected `SubscriberEmail`, found `SubscriberName`. Better still, possession is proof. If a `SubscriberEmail` exists anywhere, `parse` succeeded at some point; there is no other origin. Downstream functions take `SubscriberEmail`, delete their defensive re-checks, and become total: no invalid value can reach them. Validation happens once, at the boundary, and the fact that it happened travels with the value. The wider community calls this "parse, don't validate": convert unstructured data into a richer type at the edge instead of checking a boolean and passing raw data along.

## One level deeper

The wrapper is free. `SubscriberEmail` has exactly one field, so its layout is identical to `String`: the same three stack words, the same heap buffer, no tag, no indirection. `parse` and `as_ref` compile down to nothing; the distinction lives entirely in the type checker.

TypeScript's nearest tool is a branded type, `string & { __brand: "Email" }`. It is structural, erased at runtime, and one `as` cast defeats it. The Rust newtype is nominal, and its guarantee rests on enforced visibility: code outside the module physically cannot construct one or touch the inner field. The module is therefore the trust boundary, which argues for keeping domain modules small. `subscriber_email.rs` is short enough that "every line that could produce an invalid email" fits in a single review.

## Predict, then verify

From a route handler, outside `src/domain`, a teammate writes:

```rust
let email = SubscriberEmail("whatever".to_string());
```

What does the compiler say?

Answer: `error[E0423]: cannot initialize a tuple struct which contains private fields`. The same line inside `subscriber_email.rs` compiles, and so does one in its `#[cfg(test)] mod tests`, since children see their ancestors' private items (visibility lesson). That asymmetry is the entire design: one small module holds the construction privilege, and the rest of the crate holds only proofs.
