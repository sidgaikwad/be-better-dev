Function boundaries are where ownership stops being a puzzle on paper and starts shaping API design.

## Passing by value moves

A function parameter is a new binding, and binding a non-`Copy` value moves it:

```rust
fn shout(s: String) -> String {
    s.to_uppercase()
}

let name = String::from("ferris");
let loud = shout(name);
println!("{}", name);    // error: value moved into `shout`
```

`shout` now owns `name`'s string, and when `shout` returns, that string is dropped inside it (the uppercased result is a fresh allocation). The caller keeps nothing.

Returning transfers ownership the other way. This compiles and involves zero copies of buffer data, just header moves:

```rust
fn shout(s: String) -> String {
    // could also mutate and return s itself
    s.to_uppercase()
}

let name = String::from("ferris");
let name = shout(name);   // move in, move out, rebind
```

## What a signature promises

Because moves are visible in types, a Rust signature documents its ownership contract:

- `fn f(s: String)`: "I consume this; you are done with it."
- `fn f(s: &str)`: "I only need to look at it." (borrowing, next section)
- `fn f(s: &mut String)`: "I will modify yours in place."
- `fn f() -> String`: "I produce a value that becomes yours."

Reading unfamiliar Rust, the parameter types alone tell you which caller data survives the call. There is no equivalent information in a TypeScript signature; every object argument there is silently shared, and whether the callee mutates it is knowable only by reading its body.

Taking `String` by value is _correct_ when consumption is the point: a constructor storing the string in a struct should take `String`, not `&str`, so the caller sees the handover in the signature (and no hidden clone happens inside).

## The clone escape hatch

Need to keep using a value after passing it somewhere that consumes it? Copy it explicitly:

```rust
let name = String::from("ferris");
let loud = shout(name.clone());   // a real second heap buffer
println!("{}", name);             // fine, original untouched
```

`.clone()` on a `String` allocates a new buffer and copies the bytes. The cost is honest and visible at the call site, which is the whole design: cheap operations are implicit, expensive ones have names.

## Predict, then verify

```rust
fn takes(v: Vec<i32>) { }

let v = vec![1, 2, 3];
takes(v);
takes(v);
```

What does the compiler say about the second call?

Answer: `use of moved value: v`, pointing at the first `takes(v)` as the move site, and it will suggest the fix itself: "consider cloning the value". Whether to clone or to restructure (should `takes` borrow instead?) is the actual engineering decision, and it is the next lesson's subject.
