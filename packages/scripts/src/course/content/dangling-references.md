Every rule so far polices _simultaneous_ access. Lifetimes police access _over time_: a reference must never outlive the thing it points at.

## The bug lifetimes exist to kill

From the stack lesson: a function's frame dies at return. So this is the canonical memory-safety bug, C's dangling pointer:

```rust
fn dangle() -> &String {
    let s = String::from("hello");
    &s
}   // s is dropped here; the returned reference would point at freed memory
```

Rust rejects it at compile time:

```
error[E0106]: missing lifetime specifier
 --> src/main.rs:1:17
  |
1 | fn dangle() -> &String {
  |                ^ expected named lifetime parameter
  = help: this function's return type contains a borrowed value,
          but there is no value for it to be borrowed from
```

Read the help text closely: _no value for it to be borrowed from_. A returned reference must borrow from somewhere that survives the call, and the only candidates are the function's inputs. A function with no reference inputs has nothing valid to return a reference to, so the signature itself is unfulfillable. The fix is to return the owned `String` and move it out, which the ownership lessons already priced: three words.

## A lifetime is a region, not an annotation

Inside function bodies you have already met the same rule wearing different clothes:

```rust
let r;
{
    let x = 5;
    r = &x;          // error[E0597]: `x` does not live long enough
}
println!("{r}");     // r would outlive x
```

The compiler computes, for every reference, the region of code where its referent is alive, and checks that every use of the reference falls inside that region. That region _is_ the lifetime. It exists whether or not you ever write `'a`; annotations, next lesson, are only how you _talk about_ regions across function boundaries, never how you create or extend them.

Two error numbers cover most lifetime trouble, and they are worth recognising on sight:

- **E0106** "missing lifetime specifier": a signature does not say how output borrows relate to input borrows.
- **E0597** "does not live long enough": a concrete value dies while a reference to it is still needed.

## Why this is checked at the boundary

The checker judges each function from signatures alone, and lifetimes are why that scales. When `fn first_word(s: &str) -> &str` promises its output borrows from its input, every caller can be checked without reading the body, and the body can be checked without knowing any caller. A million call sites, each verified locally. Garbage-collected languages solve dangling by keeping everything alive; Rust solves it with paperwork at function boundaries, filed once, checked forever, costing nothing at runtime.

## Predict, then verify

```rust
fn main() {
    let r;
    let x = 5;
    r = &x;
    println!("{r}");
}
```

The earlier example failed. This one has no inner block. Compiles?

Answer: yes. `x` lives to the end of `main`, and `r`'s last use is the `println!`, comfortably inside `x`'s region. Declaration order of `r` and `x` does not matter; what matters is that every _use_ of the reference happens while the referent is alive. Regions, not braces alone.
