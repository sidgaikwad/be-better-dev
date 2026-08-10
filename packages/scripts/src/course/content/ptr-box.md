This enum will not compile:

```rust
enum Expr {
    Number(f64),
    Neg(Expr),
    Add(Expr, Expr),
}
```

```
error[E0072]: recursive type `Expr` has infinite size
  |
  |     Neg(Expr),
  |         ---- recursive without indirection
  |
help: insert some indirection (e.g., a `Box`, `Rc`, or `&`) to break the cycle
```

From the enums lesson: an enum's size is its largest variant plus a tag, computed at compile time. Here the size of `Expr` depends on the size of `Expr`. The equation has no finite answer, so the compiler refuses. The suggested fix, `Neg(Box<Expr>)`, works because a `Box` is always one word, no matter what it points at.

## A pointer that owns

`Box::new(value)` moves the value to the heap and hands you back a one-word pointer that _owns_ it. That is the whole type. From the stack and heap lesson you know what changed physically: the value now lives in allocator-managed memory, and only the pointer sits on the stack.

A `Box` behaves like any owned value. Moving it copies the word, not the contents; when it goes out of scope, its `Drop` frees the heap allocation, exactly once, per the drop lesson.

```rust
let a: Box<[u8; 4096]> = Box::new([0; 4096]);
let b = a;              // copies 8 bytes; the 4 KiB never moves
// println!("{}", a.len());   // error: borrow of moved value `a`
```

So `Box` earns its place whenever a value must live behind a pointer but still have exactly one owner: recursive types like `Expr`, values too large to keep copying across stack frames, and one more case that matters constantly in real services.

## Trait objects need a home

Sometimes the _type_ is not known until runtime. The newsletter service picks an email backend at startup: Postmark in production, a fake in tests. Both implement one trait, and the app stores whichever it got:

```rust
struct App {
    email: Box<dyn EmailClient>,
}
```

Different concrete types have different sizes, so the field cannot hold them inline; it holds a pointer to one on the heap. `Box<dyn Trait>` is the owning version of that, the same way `Box<T>` is the owning version of `&T`. One honesty note on width: `Box<Expr>` is one word, but `Box<dyn EmailClient>` is two, the data pointer plus a pointer to the trait's method table. The traits section covers what that table costs to call through.

## What you pay

- **Creation:** one heap allocation, the cost you measured in the allocation lesson.
- **Access:** one pointer chase, which can be a cache miss if the target is cold.
- **At rest:** one word. `Option<Box<T>>` is also one word, because null is a bit pattern `Box` can never be, the niche trick from the enums lesson.
- **Nothing else.** No reference count, no lock, no runtime check. `Box` is the smart pointer that costs the least because it promises the least: one owner, on the heap.

That last line is also the reason not to box things by habit. A small struct passed around by value or by `&T` needs no allocation at all. Reach for `Box` when size forces your hand: recursive, huge, or `dyn`.

## Predict, then verify

```rust
fn build() -> Box<[u8; 1_048_576]> {
    Box::new([0; 1_048_576])
}

let a = build();
let b = a;
```

Roughly how many bytes are copied at `let b = a`?

Answer: eight. The megabyte was placed on the heap once, inside `build`, and every move after that copies only the pointer word. Returning the `Box` from the function is the same story: one word travels back, the buffer never moves. One production footnote: in unoptimized debug builds, `Box::new([0; N])` may build the array on the stack first and copy it into the allocation, which can overflow the stack for very large `N`. Release builds and the compiler's placement optimizations usually elide that copy, but it is a known wart worth recognizing if a debug binary blows the stack where release runs fine.
