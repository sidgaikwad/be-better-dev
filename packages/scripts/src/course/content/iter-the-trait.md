Here is the entire `Iterator` trait, as far as obligations go:

```rust
pub trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}
```

One associated type, one required method, and roughly 75 provided methods layered on top (`map`, `filter`, `sum`, all of the next lesson's vocabulary). The return type does the talking, in the language of "Option: absence made visible": `Some(item)` means here is the next value, `None` means the sequence is over. No separate hasNext check, no sentinel value, no exception for exhaustion.

## Driving one by hand

```rust
let scores = vec![88, 92];
let mut it = scores.iter();

assert_eq!(it.next(), Some(&88));
assert_eq!(it.next(), Some(&92));
assert_eq!(it.next(), None);
assert_eq!(it.next(), None);    // Vec's iterator stays exhausted
```

Two details carry the design. `next` takes `&mut self`: an iterator is a cursor, every call advances its state, hence `let mut it`. And the items are `&i32`, references, because `iter()` borrows the vector; that choice is one of three, and it gets its own lesson shortly. (The trait itself does not promise `None` forever after the first `None`; `Vec`'s iterator behaves, and `.fuse()` buys the guarantee when it matters.)

## Implementing it for a domain type

When the newsletter's delivery worker hits a failed send, it retries on an exponential backoff schedule. A schedule is a sequence, so say it in the trait:

```rust
struct Backoff {
    next_ms: u64,
    cap_ms: u64,
}

impl Iterator for Backoff {
    type Item = u64;

    fn next(&mut self) -> Option<u64> {
        let wait = self.next_ms;
        self.next_ms = (self.next_ms * 2).min(self.cap_ms);
        Some(wait)
    }
}
```

State lives in an ordinary struct ("Structs and impl blocks"); `next` returns the current wait and doubles it, up to a cap. Note what it never does: return `None`. This iterator is infinite, and that is legal, because callers decide how much they want:

```rust
let backoff = Backoff { next_ms: 100, cap_ms: 800 };
for wait in backoff.take(4) {
    println!("retrying in {wait}ms");    // 100, 200, 400, 800
}
```

Two things arrived free. `take` is a provided method: implement `next` and all 75, the whole adapter library, work on `Backoff` unchanged. And the `for` loop works because `for` accepts any `IntoIterator`, and every `Iterator` gets a blanket `IntoIterator` impl that returns itself. That is the machinery behind every for loop you have written since "if let, let-else, destructuring", and its ownership story is two lessons away.

## What an iterator is in memory

`Backoff` is sixteen bytes of stack. `scores.iter()` is barely more: a slice iterator is two pointers, the current position and one past the end; `next` compares them, hands back the element, bumps the pointer. Compare "Slices: borrowing a view": a slice is pointer plus length, and its iterator is pointer plus end. No allocation, no per-element protocol object (a JavaScript generator allocates a `{value, done}` object per step), no virtual dispatch. A method on a small struct advancing two words of state: keep that picture, because it is why the zero-cost examination at the end of this section has a chance of coming out clean.

## Predict, then verify

```rust
let mut b = Backoff { next_ms: 100, cap_ms: 400 };
b.next();
b.next();
b.next();
println!("{:?}", b.next());
```

What prints?

Answer: `Some(400)`. The three discarded calls returned 100, 200, and 400 while the internal state ran 200, 400, then `min(800, 400)` pinned it at the cap. The fourth call yields `Some(400)`, and so would every call after it, forever. Nothing in the trait obliges a sequence to end; bounding it is the caller's job with `take`, which is the right division of labor: the schedule cannot know how many attempts the worker's policy allows.
