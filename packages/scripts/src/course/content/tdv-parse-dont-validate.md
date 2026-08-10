The fix for the leaky cauldron is a type that cannot hold an invalid name. The chapter starts a new `domain` module and defines a tuple struct, the one-field shape from Part 1's structs lesson:

```rust
//! src/domain.rs

pub struct SubscriberName(String);
```

This is a proper new type, not an alias. Assigning a `String` to it is `error[E0308]: mismatched types`, and it inherits none of `String`'s methods. More important: the field is _private_. `pub` on the struct exports the type, not its insides. Trust but verify, from the request handler:

```rust
let subscriber_name = crate::domain::SubscriberName(form.name.clone());
```

```
error[E0603]: tuple struct constructor `SubscriberName` is private
```

A tuple struct's constructor is just a function whose visibility follows its fields, so outside the `domain` module a `SubscriberName` cannot be built at all. Which lets us install exactly one door:

```rust
impl SubscriberName {
    /// Returns an instance of `SubscriberName` if the input satisfies all
    /// our validation constraints on subscriber names. It panics otherwise.
    pub fn parse(s: String) -> SubscriberName {
        // ...the same three checks as is_valid_name...
        if is_empty_or_whitespace || is_too_long || contains_forbidden_characters {
            panic!("{} is not a valid subscriber name.", s)
        } else {
            Self(s)
        }
    }
}
```

The body is a shameless copy of `is_valid_name`. The difference is the return type: not a `bool` about a `String`, but a `SubscriberName`. Since `parse` is the only way to obtain one, every `SubscriberName` in the entire program satisfies the constraints, by construction. (That `panic!` is the wrong choice, and it gets its own lesson shortly.)

Now thread the proof through the domain:

```rust
pub struct NewSubscriber {
    pub email: String,
    pub name: SubscriberName,
}

pub async fn insert_subscriber(
    pool: &PgPool,
    new_subscriber: &NewSubscriber,
) -> Result<(), sqlx::Error> { /* ... */ }
```

`insert_subscriber` can now be certain the name is valid by reading nothing but its own signature. Calling it with an empty name is not caught, it is _unrepresentable_: there is no way to write that program. The judgment went from global back to local. The book calls the technique type-driven development, inherited from Haskell, F# and OCaml; the Rust community calls this particular move the newtype pattern. It is the same instinct as the enums lesson making `{ type: "cash", iban }` impossible, applied to a constraint on a single value.

## Why ownership makes it stick

Would `pub struct SubscriberName(pub String)` be so bad? It breaks the guarantee twice over:

```rust
let liar = SubscriberName("".to_string());     // bypass parse entirely

let mut started_well = SubscriberName::parse("A valid name".to_string());
started_well.0 = "".to_string();               // pass parse, then rot
```

The private field forbids both, and ownership finishes the job. Once `parse` returns, the caller owns a value it has no way to reach inside. Move it across functions, store it in a `NewSubscriber`, lend it out by reference: nothing can invalidate the check, because mutation would need access the module never granted. The invariant is established once, at the boundary, and holds for the value's whole lifetime. Compare the `bool`, which was stale the moment it was computed.

## What the wrapper costs

Nothing. `SubscriberName` is one `String` field: no tag, no indirection, the same three-word pointer/length/capacity header from the stack-and-heap lesson. The wall exists purely in the type system and is gone by the time code is generated, the same "abstractions compile away" story as the enum niche optimization.

## Predict, then verify

```rust
use std::mem::size_of;

println!("{}", size_of::<String>());
println!("{}", size_of::<SubscriberName>());
```

What prints?

Answer: `24` and `24` (on a 64-bit target). A newtype adds no discriminant and no allocation; at runtime it _is_ its field, plus a compile-time identity. Everything this lesson bought, the sealed constructor and the program-wide guarantee, costs zero bytes and zero instructions.
