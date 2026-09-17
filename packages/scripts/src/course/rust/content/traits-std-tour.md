Print a `Subscriber` from the structs lesson and the compiler stops you:

```rust
let sub = Subscriber { email, name, confirmed: false };
println!("{sub:?}");
```

```
error[E0277]: `Subscriber` doesn't implement `Debug`
  |
  = help: the trait `Debug` is not implemented for `Subscriber`
  = note: add `#[derive(Debug)]` to `Subscriber` or manually `impl Debug for Subscriber`
```

Everything std does with your types, printing, comparing, hashing, defaulting, goes through traits you opt into, usually with one derive line. This lesson is the working set.

## Debug and Display

`#[derive(Debug)]` buys `{:?}`: a mechanical, programmer-facing dump of the structure, derivable because there is nothing to decide. `Display` is `{}`: text for humans, and deliberately _not_ derivable, because presentation is a decision std refuses to guess.

The pair earns its keep on error types. Give the enums lesson's style of error enum a `Display` so production logs read as sentences:

```rust
use std::fmt;

#[derive(Debug)]
pub enum SubscribeError {
    InvalidEmail(String),
    SendFailed(String),
}

impl fmt::Display for SubscribeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidEmail(reason) => write!(f, "invalid subscriber email: {reason}"),
            Self::SendFailed(reason) => write!(f, "failed to send confirmation: {reason}"),
        }
    }
}
```

`match` is doing its exhaustive job from the match lesson: add a variant and this impl stops compiling until the new case is worded. `Debug` plus `Display` is exactly what `std::error::Error` requires, and the error-handling section builds on this pair.

## PartialEq, Eq, and Hash

`==` is not built in; it is a call to `PartialEq::eq`, and the derive compares field by field. Why "Partial"? Floats. IEEE 754 makes `NaN != NaN`, so `f64` equality is not reflexive: some value does not equal itself. `Eq` adds no methods; it is a marker promising full reflexivity, which is why `f64` implements `PartialEq` but never `Eq`.

`Hash` matters the moment a type becomes a key. `HashMap` (properly introduced next section; think TS's `Map` for now) demands `Eq + Hash` and one law: equal values must hash equally. Derive both together and the law holds by construction. Implement one by hand inconsistently and inserted keys silently become unfindable.

## Default

```rust
#[derive(Debug, Default)]
struct RetryPolicy {
    attempts: u32,    // 0
    backoff_ms: u64,  // 0
    jitter: bool,     // false
}

let policy = RetryPolicy { attempts: 3, ..Default::default() };
```

Derived `Default` calls each field's own `Default::default()`: numbers zero, bools false, `String` and `Vec` empty. Combined with struct-update syntax from the structs lesson, it is the standard pattern for config structs: name what differs, default the rest.

## One level deeper: derives are code, not magic

A derive is compile-time code generation. `#[derive(PartialEq)]` expands into an ordinary `impl PartialEq for Subscriber` before type checking; there is no reflection and no runtime metadata, and the generated impl inlines and monomorphizes like anything hand-written. One honest footnote from the dispatch unit: std's _formatting_ machinery deliberately erases argument types behind pointer-based dispatch, so every `println!` in your binary shares one formatting engine instead of stamping a copy per type. The static-versus-dynamic trade you now know, decided by std in favor of code size.

## Predict, then verify

```rust
#[derive(Debug, PartialEq)]
struct Point { x: f64, y: f64 }

let a = Point { x: f64::NAN, y: 1.0 };
println!("{}", a == a);
```

What prints?

Answer: `false`. The derived `PartialEq` compares fields with their own `==`, and `NAN == NAN` is false, so this `Point` does not equal itself. It is also why adding `Eq` to that derive list would not compile (`Eq` requires every field to be `Eq`, and `f64` is not), and why floats cannot be `HashMap` keys without a wrapper type that makes an explicit policy about NaN. The type system is quoting the IEEE spec at you.
