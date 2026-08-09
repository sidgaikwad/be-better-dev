Structs say "all of these fields at once." Enums say "exactly one of these shapes at a time," and they are the half of data modelling most languages are missing.

## An enum value is one variant, with data

```rust
enum PaymentMethod {
    Cash,
    Card { last_four: String },
    Transfer { iban: String, bic: String },
}

let payment = PaymentMethod::Card { last_four: String::from("4242") };
```

Each variant can carry its own fields. A `PaymentMethod` is never two of these, never none of these; the type makes the "one of" structural instead of documentary. Compare the workaround this replaces in TypeScript-flavored designs: one object with `type: string` plus a pile of optional fields, where nothing stops `{ type: "cash", iban: "..." }` from existing. The enum simply cannot represent that state.

This is the tool behind the book's chapter 2 domain modelling and chapter 8's error design: real domains are full of "one of" (an order is pending _or_ shipped _or_ cancelled; a delivery attempt succeeded _or_ failed with a reason), and enums let the type system carry those facts.

## What an enum is in memory

An enum value is a _discriminant_ (a small integer tag saying which variant) plus enough space for the largest variant's payload:

```rust
enum Shape {
    Circle(f64),          // 8 bytes of payload
    Rect(f64, f64),       // 16 bytes of payload
}
// size: 16 bytes payload + tag + padding = 24 bytes
```

Every `Shape` is the size of the biggest case. This is the C tagged union, with the compiler guaranteeing you can never read the wrong arm.

The compiler is also smarter than the naive layout. When a type has spare unused bit patterns, the tag hides in them: `Option<Box<T>>` is one word, not two, because "null pointer" is a bit pattern `Box` can never be, so `None` uses it. This _niche optimization_ is why Option-wrapping a reference costs literally nothing, and it is a first taste of a theme the performance section measures directly: Rust's abstractions are designed to compile away.

## Option and Result are just enums

The two most important types in the standard library carry no magic:

```rust
enum Option<T> { None, Some(T) }
enum Result<T, E> { Ok(T), Err(E) }
```

Both are ordinary enums, defined in library code you can read. Their power comes entirely from the "exactly one variant" guarantee plus the language _forcing_ you to acknowledge which variant you hold before touching the payload. That forcing mechanism is pattern matching, and it gets its own lessons next.

## Predict, then verify

```rust
use std::mem::size_of;

println!("{}", size_of::<Option<u8>>());
println!("{}", size_of::<Option<&u8>>());
```

`u8` is 1 byte; a reference is 8. What prints, and why are the answers shaped so differently?

Answer: `2` and `8`. `Option<u8>` needs a real tag byte because all 256 `u8` patterns are legal values, so 1 byte of payload + 1 tag. `Option<&u8>` is 8, no bigger than the bare reference: references can never be null, so `None` borrows the null pattern as its tag. Whether an Option costs anything depends on whether the inner type has a niche, and now you can predict which.
