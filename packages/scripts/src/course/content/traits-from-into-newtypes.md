The Result lesson made a promise: "`?` calls `From::from` on the error on its way out." Time to meet the trait doing that work, because it is also the trait behind the newsletter service's most important type.

## From, and Into for free

```rust
pub trait From<T> {
    fn from(value: T) -> Self;
}
```

That is the whole trait: one infallible conversion. Give the last lesson's error enum a `From` for a lower-level error:

```rust
impl From<std::io::Error> for SubscribeError {
    fn from(e: std::io::Error) -> Self {
        SubscribeError::SendFailed(e.to_string())
    }
}
```

Now `?` has what it needs, because `expr?` expands to roughly:

```rust
match expr {
    Ok(value) => value,
    Err(e) => return Err(From::from(e)),
}
```

Inside a function returning `Result<_, SubscribeError>`, any `?` on an `io::Error` result converts at the return edge, silently, through that impl. One `From` per underlying error and every `?` in the crate cooperates. This is the hook the ecosystem generates code for: `thiserror`'s `#[from]` attribute writes impls like the one above, as the errors section will show.

You also got `Into` without writing it. std carries a blanket impl, the trick from the bounds lesson: `impl<T, U> Into<U> for T where U: From<T>`. So the rule is: implement `From`, never `Into` directly, and both directions plus every function bounded on either come along.

## TryFrom: conversions that can refuse

`From` promises success. Turning arbitrary user input into a subscriber email must be able to say no, and that is `TryFrom`:

```rust
pub struct SubscriberEmail(String);

impl TryFrom<String> for SubscriberEmail {
    type Error = String;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        if value.contains('@') && !value.starts_with('@') {
            Ok(SubscriberEmail(value))
        } else {
            Err(format!("`{value}` is not a valid subscriber email"))
        }
    }
}
```

(The real service validates harder; the shape is the point. `type Error` is an associated type: the impl fixes its error type once, rather than taking it as a generic parameter.)

`SubscriberEmail` is a one-field tuple struct, a _newtype_, and it costs nothing at runtime: a struct's memory is just its fields, so `size_of::<SubscriberEmail>()` equals `size_of::<String>()`, the same 24-byte header from the one-owner lesson. What it buys is compile-time proof. The only way to obtain one is `try_from`, so _holding_ a `SubscriberEmail` means validation already happened. Downstream functions take `SubscriberEmail`, not `String`, and unvalidated input becomes unrepresentable. Zero to Production builds this exact type in chapter 6; the slogan worth keeping is "parse, don't validate."

## The orphan rule, and the newtype's second job

Try to give `Vec<String>` a `Display`:

```rust
impl std::fmt::Display for Vec<String> { /* ... */ }
```

```
error[E0117]: only traits defined in the current crate can be
              implemented for types defined outside of the crate
  |
  = note: define and implement a trait or new type instead
```

Both the trait and the type are foreign. If your crate could write this impl, so could every other crate in your build, and the compiler would have no principled way to pick a winner. The orphan rule preserves coherence: an impl is legal only if the trait or the type is local. `impl EmailClient for Vec<String>` is fine (local trait); `impl Display for SubscriberEmail` is fine (local type); foreign-for-foreign never is.

The escape hatch is the error's own note, and it is the same tool again:

```rust
use std::fmt;

struct Recipients(Vec<SubscriberEmail>);

impl fmt::Display for Recipients {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} confirmed recipients", self.0.len())
    }
}
```

`Recipients` is local, so the impl is legal, and the wrapper still adds zero bytes.

## Predict, then verify

Only `TryFrom` was implemented above. Does this line compile?

```rust
let email: SubscriberEmail = String::from("ada@example.com").try_into()?;
```

Answer: yes. std carries the mirror blanket impl, `TryInto<U> for T where U: TryFrom<T>`, exactly as `Into` mirrors `From`, so the one `TryFrom` impl bought `try_into` too. The trailing `?` works because `try_into` returns a `Result`, and it will convert the error with, of course, `From`.
