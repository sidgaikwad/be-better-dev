Shared references let everyone read. To let someone write, Rust has a second kind of reference with the opposite deal.

## &mut T: one writer, zero readers

```rust
let mut s = String::from("hello");
let r = &mut s;
r.push_str(" world");
println!("{r}");
```

An exclusive (mutable) reference grants mutation, and the compiler guarantees it is the _only_ live way to reach the value while it exists. Not just the only mutable one: the only one, period.

```rust
let mut s = String::from("hello");
let r1 = &mut s;
let r2 = &mut s;      // error: cannot borrow `s` as mutable more than once
println!("{r1}");
```

```rust
let mut s = String::from("hello");
let shared = &s;
let excl = &mut s;    // error: cannot borrow as mutable while borrowed as immutable
println!("{shared}");
```

The whole rule fits in one line: **any number of readers, or exactly one writer, never both.** People call it "aliasing XOR mutation".

## Why this rule carries the language

Two payoffs, one defensive and one offensive:

**It rules out data corruption patterns.** Iterator invalidation is the classic: mutating a collection while iterating it. In C++ this compiles and corrupts; in JavaScript it silently skips elements. In Rust, the iterator holds a shared borrow, mutation needs an exclusive one, and the program is rejected:

```rust
let mut v = vec![1, 2, 3];
for x in &v {
    v.push(*x);   // error: cannot borrow `v` as mutable
}
```

**It licenses optimization.** If the compiler sees `&mut T`, it _knows_ nothing else reads or writes that memory, so it can keep values in registers, reorder freely, and skip redundant loads. C has to be pessimistic because any two pointers might alias. Rust's rules turn "no aliasing" from a hope into a checked fact, and that is a real part of why idiomatic Rust performs like careful C.

The same rule also makes data races in threaded code a compile error rather than a 3 a.m. incident. That story arrives with `Send` and `Sync` in Part 2, but it is this rule doing the work.

## Reborrowing, briefly

Passing `r: &mut T` to a function that takes `&mut T` does not move your reference away permanently; the compiler _reborrows_ it for the call and hands control back after. That is why you can call `r.push_str(...)` twice in a row. You will mostly not notice reborrowing until a complex case surfaces it; it is enough to know the name.

## Predict, then verify

```rust
let mut v = vec![1, 2, 3];
let first = &v[0];
v.push(4);
println!("{first}");
```

Which line does the compiler blame, and what would go wrong at runtime if it were allowed?

Answer: `v.push(4)` is rejected because `v` is borrowed by `first` until its last use on the final line. If allowed, the push could reallocate the buffer, leaving `first` pointing into freed memory: a use-after-free, the exact bug from the allocation lesson, prevented by the exact rule from this one.
