Not everything moves. This compiles:

```rust
let a: i32 = 5;
let b = a;
println!("{}", a);   // fine, a is alive and well
```

Yet the almost identical `String` version is a compile error. The difference is one trait.

## Copy types

A type is `Copy` when duplicating its bits produces a second, fully independent, valid value. An `i32` is 4 bytes with no pointer inside; copy the bytes and you have two honest integers. Nothing is shared, so nothing can be double-freed.

For a `Copy` type, `let b = a` performs the same bitwise copy a move would, and then simply _does not kill `a`_. Both bindings stay usable.

`Copy` types include: every integer and float type, `bool`, `char`, shared references `&T`, and tuples or arrays made only of `Copy` types.

Deliberately not `Copy`: `String`, `Vec<T>`, `Box<T>`, `File`, any type owning a resource. Their bits contain a pointer to something owned; bitwise duplication would create exactly the shared-ownership problem moves exist to prevent. Also not `Copy`: `&mut T`, because two live mutable references to one place is the aliasing bug Rust is built to rule out.

The rule of thumb: **plain data copies, resources move.**

## Making your own types Copy

```rust
#[derive(Clone, Copy)]
struct Point {
    x: f64,
    y: f64,
}
```

Two doubles, no pointers: bit-copying is honest, so `Copy` is allowed. The compiler enforces honesty structurally: put a `String` field inside and the derive refuses to compile. Note that `Copy` requires `Clone`; `Copy` is the marker saying "copying is free and implicit", `Clone` is the method saying "copying is possible, call me explicitly".

Whether to derive it is a design decision, not a formality. A small coordinate type wants `Copy` for ergonomics. A `UserId(u64)` newtype could be `Copy`, and many teams still leave it off so ids move like the meaningful tokens they are. You will make this call in the type-driven design section of the book (chapter 6).

## Predict, then verify

```rust
let t = (String::from("hi"), 5);
let u = t;
println!("{}", t.1);
```

Does this compile? The second field is an `i32`, which is `Copy`.

Answer: no. A tuple containing a non-`Copy` type is itself not `Copy`, and moving `t` moves the whole tuple, both fields together. The compiler tracks moves per binding here, and the whole of `t` is gone. (In some positions Rust does track field-level moves, such as `let (s, n) = t;`, which moves the fields into two new bindings; destructuring is the idiomatic way to take a tuple apart.)
