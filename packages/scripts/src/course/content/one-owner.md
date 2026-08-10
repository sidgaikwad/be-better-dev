Rust's memory management is one rule and two consequences.

**The rule: every value has exactly one owner.** When the owner goes out of scope, the value is freed. Assignment transfers ownership; it does not copy the value.

```rust
let a = String::from("hello");
let b = a;                     // ownership moves from a to b
println!("{}", a);             // error: borrow of moved value: `a`
```

## What a move is, physically

Recall the shape of a `String`: three words on the stack (ptr, len, cap) pointing at a heap buffer. The move `let b = a` copies _those three words_ into `b`. That is the entire runtime cost: a 24-byte memcpy. The heap buffer is not touched, not copied, not moved anywhere.

```
before:  a { ptr ─┐ len 5 cap 5 }        heap: "hello"
                  └────────────────────────▶
after:   a  (dead, compiler refuses to read it)
         b { ptr ─┐ len 5 cap 5 }
                  └────────────────────────▶  same buffer
```

After the copy there would be _two_ pointers to one buffer, and when both went out of scope the buffer would be freed twice: the classic double-free, memory corruption, security-advisory territory. Every language must prevent this somehow. C trusts you. Garbage-collected languages never free eagerly at all. Rust instead declares the old binding dead at compile time. There is no flag at runtime, no cost; `a` simply stops being a name you may use, and the _compiler_ enforces it.

That is the trick to internalise: **a move is a cheap bitwise copy plus a compile-time death sentence for the source.**

## Reading the error like a native

```
error[E0382]: borrow of moved value: `a`
 --> src/main.rs:3:20
  |
2 |     let b = a;
  |             - value moved here
3 |     println!("{}", a);
  |                    ^ value borrowed here after move
  = note: move occurs because `a` has type `String`,
          which does not implement the `Copy` trait
```

The compiler names the exact line the value moved, the line you illegally used it, and _why the type moves at all_ (no `Copy`). Rust error messages repay close reading; they are the best teacher in the toolchain, and this course quotes them on purpose.

## Predict, then verify

`a` holds a 10 MB `String`, and you run `let b = a;`. Roughly how much data is copied?

Answer: 24 bytes. The three-word header moves; the 10 MB buffer stays exactly where it is. Moves never get more expensive as the data grows, which is why Rust code passes huge values around by move without a second thought, and why the expensive operation gets a loud, explicit name: `.clone()`.
