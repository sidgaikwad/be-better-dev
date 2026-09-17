The broken counter from the last lesson needed `unsafe` to compile. That was not a workaround; that was the lesson. Rust's answer to data races is not a sanitizer or a code review checklist. It is a type error. Watch it fire on `Rc`, the reference-counted pointer from the smart pointers section:

```rust
use std::rc::Rc;
use std::thread;

fn main() {
    let subscribers = Rc::new(vec![String::from("ada@example.com")]);
    let handle = thread::spawn(move || {
        println!("{} to notify", subscribers.len());
    });
    handle.join().unwrap();
}
```

```text
error[E0277]: `Rc<Vec<String>>` cannot be sent between threads safely
   = help: the trait `Send` is not implemented for `Rc<Vec<String>>`
note: required by a bound in `spawn`
```

We even used `move` and transferred ownership outright. Still refused. Two marker traits explain why.

## What each trait asserts

- `T: Send` asserts that ownership of a `T` can move to another thread and the value stays safe to use there.
- `T: Sync` asserts that a `&T` can be handed to another thread; equivalently, `T` is `Sync` exactly when `&T` is `Send`. Many threads holding shared references at once is fine.

Like `Copy` from the "Copy or move" lesson, these are marker traits: no methods, pure declarations. Unlike most traits, they are auto traits: the compiler implements them structurally, so a struct is `Send` when every field is `Send`. The newsletter's `Subscriber` struct crosses threads with zero ceremony. Implementing either by hand is `unsafe`, because you would be vouching for a guarantee the compiler cannot check.

## Why Rc stays home and Arc travels

`Rc`'s reference count is a plain integer. `clone` bumps it with an ordinary load, add, store: hand clones to two threads and you get the last lesson's lost-update race on the count itself. Drop the final two clones simultaneously and both may conclude "I was last" (double free), or neither does (leak). `Rc` is `!Send` and `!Sync` because it is built from unsynchronized parts, and the marker records that fact in the type.

`Arc` is the same idea with an atomic count, which the "Clone: when copying is correct" lesson priced at one atomic increment per clone. It is `Send` and `Sync` whenever `T` is both. The pattern generalizes: `Cell` and `RefCell` mutate through `&self` with no synchronization, so they may move to another thread but never be shared (`Send` but `!Sync`). `Mutex<T>` is `Sync` even when `T` alone is not, because it supplies the missing synchronization. That story is two lessons away.

## The aliasing rule becomes fearless concurrency

A data race needs sharing, a write, and no synchronization. The exclusive references lesson banned "shared and writable at once" within one thread; `Send` and `Sync` extend that ban across threads. `spawn` demands `F: Send + 'static`, so everything crossing must be `Send`; sharing requires `Sync`; and the types that would permit unsynchronized writes (`Rc`, `RefCell`) fail the check. Every program that compiles has provably lost at least one of the three ingredients. That is the famous claim, stated exactly: in safe Rust, a data race is a compile-time error. C++ deploys sanitizers hoping to observe at runtime what rustc refuses to build.

One honest boundary: the guarantee covers data races. Race conditions in the broad sense, two valid operations interleaving in an unfortunate order, and deadlocks, remain design problems; the concurrency patterns section returns to them.

## Predict, then verify

```rust
use std::cell::RefCell;
use std::sync::Arc;
use std::thread;

fn main() {
    let host = Arc::new(RefCell::new(String::from("smtp.example.com")));
    let shared = Arc::clone(&host);
    let handle = thread::spawn(move || {
        *shared.borrow_mut() = String::from("smtp-fallback.example.com");
    });
    handle.join().unwrap();
}
```

Does this compile?

Answer: no. `RefCell`'s borrow flags are ordinary integers, so `RefCell<String>` is `!Sync`, and `Arc<T>` is only `Send` when `T: Send + Sync`. The error reads `RefCell<String>` cannot be shared between threads safely and points at `spawn`'s bound. Note that `Arc` did nothing wrong; it faithfully reports its contents' capabilities, because markers compose structurally. The fix is `Arc<Mutex<String>>`, and the compiler has just walked you from a would-be heap corruption to a one-line type substitution.
