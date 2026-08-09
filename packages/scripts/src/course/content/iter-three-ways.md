The "if let, let-else, destructuring" lesson ended on a warning: `for (_, n) in &pairs` left the vector alive, and dropping the `&` consumed it. Time to name the machinery. A `for` loop calls `IntoIterator::into_iter` on whatever you hand it, and a `Vec` offers three routes in:

```rust
for s in &subscribers { }        // subscribers.iter():      s is &Subscriber
for s in &mut subscribers { }    // subscribers.iter_mut():  s is &mut Subscriber
for s in subscribers { }         // subscribers.into_iter(): s is Subscriber
```

The ampersand on the collection picks the method, and the loop variable's type names the contract:

- `&Subscriber`: shared borrow, "&T: look, don't touch". The default. The vector is intact afterward.
- `&mut Subscriber`: exclusive borrow, "&mut T: one writer, no readers"; nothing else may touch the vector during the loop.
- `Subscriber`: each element moves out, "Passing values into functions" with the loop body as the callee. The vector is gone afterward.

## Each form in its place

Confirmation clicks arrive; flip flags in place with `iter_mut`:

```rust
fn apply_confirmations(subs: &mut Vec<Subscriber>, confirmed: &[String]) {
    for sub in subs.iter_mut() {
        if confirmed.contains(&sub.email) {
            sub.confirmed = true;
        }
    }
}
```

And when the output should own the data, `into_iter` moves instead of copying:

```rust
let emails: Vec<String> = subscribers.into_iter().map(|s| s.email).collect();
```

Each `String` moves out of its `Subscriber` straight into the new vector: a 24-byte header per element ("Copy or move"), heap text untouched, no cloning. Try the same through borrows and the compiler stops you:

```rust
let emails: Vec<String> = subscribers.iter().map(|s| s.email).collect();
```

```text
error[E0507]: cannot move out of `s.email` which is behind a shared reference
```

`iter()` hands the closure `&Subscriber`, and moving a field out through a shared borrow would gut a value you only borrowed. The honest options: clone each element with `.map(|s| s.email.clone())`, spending the copy that "Clone: when copying is correct" taught you to price, or consume the vector because its job is done. (For iterators of references, the `.copied()` and `.cloned()` adapters cross from `&T` to `T` wholesale.)

The default instinct is the one that preferred `&[T]` parameters in "Slices: borrowing a view": reach for `iter()`, escalate to `iter_mut()` only to edit in place, and to `into_iter()` only when the data's next home is the output.

## One level deeper: where the Vec goes

`into_iter` is not an exception to ownership; it is ownership, transferred. `Vec::into_iter` takes `self`: the pointer, length, and capacity from "Stack and heap, for real" move into the returned `IntoIter` struct, and the old binding dies at compile time. Elements move out one per `next` call. Break out of the loop halfway and "Drop: deterministic cleanup" finishes the story: `IntoIter`'s destructor drops the unvisited elements and frees the buffer. Nothing is duplicated, nothing leaks, and using the vector afterward is the same borrow-of-moved-value error you first met in "One owner per value".

## Predict, then verify

```rust
let names = vec![String::from("Ada"), String::from("Grace")];
let lens: Vec<usize> = names.iter().map(|n| n.len()).collect();
let upper: Vec<String> = names.into_iter().map(|n| n.to_uppercase()).collect();
println!("{lens:?} {upper:?}");
```

Does this compile, and would it still if the two middle lines swapped places?

Answer: it compiles and prints `[3, 5] ["ADA", "GRACE"]`. `iter()` takes a shared borrow that ends once `lens` is built; `into_iter()` then consumes `names`. Swapped, it fails: `names` would move on the first line, and the `iter()` call becomes a borrow of a moved value. Borrows first, consumption last: the ordering discipline of the ownership section, now applied to pipelines.
