Moving a value into every function that wants to read it would be unbearable. Borrowing is the alternative: lend access without giving up ownership.

## A reference is a pointer with rules

```rust
let s = String::from("hello");
let r: &String = &s;
println!("{} has length {}", r, r.len());
println!("{}", s);   // s still owns the string; nothing moved
```

At the machine level `r` is just a pointer, one word, holding the address of `s`. What makes it a _reference_ rather than a raw pointer is the contract the compiler enforces around it:

- the referent must outlive the reference (no dangling)
- while shared references exist, nobody mutates the referent

Neither rule exists at runtime. There is no metadata, no reference count, no check when you dereference. The rules are proven at compile time and then erased; using a reference costs exactly what using a pointer costs in C.

## Shared means shared by everyone, mutable by no one

Any number of `&T` references can exist at once:

```rust
let s = String::from("hello");
let a = &s;
let b = &s;
let c = &s;
println!("{a} {b} {c}");   // fine: three readers, zero writers
```

But a shared reference does not permit mutation, even by the owner while borrows are live:

```rust
let mut s = String::from("hello");
let r = &s;
s.push_str(" world");   // error: cannot borrow `s` as mutable
println!("{r}");        //        because it is also borrowed as immutable
```

Why so strict? Recall the Vec lesson: `push` may reallocate, and `r`'s pointer would then aim at freed memory. The compiler cannot know whether this particular `push` reallocates, so the rule is categorical: **readers present, no writers.**

## Ergonomics you get for free

Two pieces of sugar make references pleasant:

- **Auto-deref on method calls.** `r.len()` works on `&String`, `&&String`, however deep; the compiler inserts the dereferences.
- **Deref coercion.** A `&String` converts to `&str` automatically at call sites, which is why a function taking `&str` accepts both `&my_string` and a literal. Same for `&Vec<T>` to `&[T]`.

This is why the idiomatic signature takes `&str`, not `&String`: it accepts strictly more callers at zero cost.

## Predict, then verify

```rust
fn len_of(s: &String) -> usize {
    s.len()
}

let s = String::from("hello");
let n = len_of(&s);
let m = len_of(&s);
```

Does the second call compile, and what happened to `s`'s ownership along the way?

Answer: it compiles, and ownership never moved. Each call lends `s` for the duration of the call; the borrow ends when the function returns, so the next borrow is free to start. Borrows are scoped loans, not transfers, which is exactly why reading APIs should take references.
