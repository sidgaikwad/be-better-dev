The new `insert_subscriber` signature comes with a surprise. The SQL query used to bind `form.name`; now it holds a `SubscriberName`, and `cargo check` objects:

```
error[E0308]: mismatched types
   |
50 |         new_subscriber.name,
   |         ^^^^^^^^^^^^^^^^^^^ expected `&str`,
   |                             found struct `SubscriberName`
```

The wall works in both directions: outsiders cannot put an unchecked `String` in, and now we cannot get the text out. `sqlx` needs a `&str`. Given a private field, the module can export access in exactly three shapes, and they are the three method receivers from Part 1's structs lesson, each an ownership contract:

```rust
impl SubscriberName {
    pub fn inner(self) -> String { self.0 }                  // give it away
    pub fn inner_mut(&mut self) -> &mut str { &mut self.0 }  // open the vault
    pub fn inner_ref(&self) -> &str { &self.0 }              // let them look
}
```

`inner` consumes: the caller receives the owned `String` and the `SubscriberName` is gone, moved, exactly like a by-value parameter. It is honest when the proof's work is finished and someone genuinely needs the raw data, but the caller cannot keep both.

`inner_mut` is disqualified outright. Handing out `&mut` to the inner value lets any caller rewrite it into anything, which is `pub String` with extra steps: the loss of control is total.

`inner_ref` lends read-only access. From the "&mut T: one writer, no readers" lesson: while that shared borrow is live, nobody can mutate or drop the name. The caller gets to read the value with no power to compromise it. Both `inner` and `inner_ref` would satisfy `sqlx`; `inner_ref` states the intent better.

## The trait that already says this

Rust's standard library ships a trait designed for exactly this usage:

```rust
pub trait AsRef<T: ?Sized> {
    fn as_ref(&self) -> &T;
}
```

Implement `AsRef<T>` when your type is similar enough to a `T` that a `&self` can honestly hand out a `&T`. That is `inner_ref`'s signature wearing a standard name:

```rust
impl AsRef<str> for SubscriberName {
    fn as_ref(&self) -> &str {
        &self.0
    }
}
```

The standard name buys ergonomics. A function declared

```rust
pub fn do_something<T: AsRef<str>>(s: T) {
    let s = s.as_ref();
    // ...
}
```

accepts a `SubscriberName`, a `String`, or a `&str` without the caller learning any conversion method. `std::fs` runs on this pattern: `create_dir<P: AsRef<Path>>` takes `String`, `PathBuf`, `OsString`, anything path-shaped. Conversion traits (`AsRef` here, `From`/`Into`, and `TryFrom` later this section) are shared vocabulary the whole ecosystem standardises on: implement them and your type plugs into generic code in crates that have never heard of it. So the book deletes `inner_ref`, implements `AsRef<str>`, and the query binds `new_subscriber.name.as_ref()`. It compiles.

## What as_ref does in memory

`&self.0` produces a `&str`, the fat pointer from the slices lesson: an address into the `String`'s heap buffer plus a length. No allocation, no copy, and the borrow checker keeps the name alive and immutable for as long as the slice is used. In generic callers, `T: AsRef<str>` monomorphizes per concrete type, so the call compiles down to a field borrow. Reading through the abstraction costs the same as touching the field directly, which is the only price at which an invariant-carrying type survives in a request path.

## Predict, then verify

```rust
let name = SubscriberName::parse("Ursula Le Guin".to_string());
let text: String = name.inner();
println!("{}", name.as_ref());
```

What does the compiler say?

Answer: `borrow of moved value: name`. `inner` takes `self`, so extracting the owned `String` consumed the `SubscriberName`; the value and its proof left together. That is the trade `inner` makes and `as_ref` avoids: a shared borrow reads the text while the validated value, and the guarantee it carries, stays alive for the rest of the program.
