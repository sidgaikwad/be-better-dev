A mailer that counts what it sends:

```rust
struct Mailer { sent: u64 }

impl Mailer {
    fn send(&self, to: &str) {
        // ... deliver ...
        self.sent += 1;
    }
}
```

```
error[E0594]: cannot assign to `self.sent`, which is behind a `&` reference
```

Why is `send` taking `&self` at all? Because the mailer is shared: many handlers hold a reference to it, or it sits behind the `Rc` from two lessons ago, which only hands out `&T`. Changing to `&mut self` would forbid the sharing. This is a genuine tension: a value that is logically shared, with one small corner that must mutate.

## Interior mutability

The standard library's answer is a family of types whose methods mutate through `&self`, legally. Underneath them all is `UnsafeCell`, the one primitive the compiler recognizes as "mutation may happen behind this shared reference". Nobody uses it raw; you use safe wrappers that keep aliasing XOR mutation true by some other enforcement. This lesson covers the two single-threaded wrappers.

## Cell: whole values in, whole values out

```rust
use std::cell::Cell;

struct Mailer { sent: Cell<u64> }

impl Mailer {
    fn send(&self, to: &str) {
        self.sent.set(self.sent.get() + 1);
    }
}
```

`Cell`'s trick is refusing to ever hand out a reference to its interior. `get` copies the value out (which is why it requires `Copy`), `set` replaces it wholesale. If no reference into the inside can exist, no reference can be invalidated by a write, so there is nothing to check: no flag, no panic, zero runtime cost. For counters, flags, and small `Copy` values, `Cell` is exactly right and completely safe.

## RefCell: the borrow checker, moved to runtime

For a non-`Copy` value, a `Vec` of sent messages say, copying whole values out is no longer viable; you need a real reference inside. `RefCell` allows it by keeping a borrow flag next to the value. `borrow()` returns a `Ref<T>` guard and bumps the reader count; `borrow_mut()` returns a `RefMut<T>` and demands the flag be clear. The guards implement `Deref` and `Drop`, last lesson's pattern exactly: the borrow ends when the guard drops.

The law is unchanged from the exclusive references lesson, any number of readers XOR one writer. Only the enforcement moved, from compile time to runtime, and so did the failure mode:

```rust
use std::cell::RefCell;

let log = RefCell::new(Vec::new());
let r = log.borrow();
log.borrow_mut().push(String::from("sent"));
```

```
thread 'main' panicked at 'already borrowed: BorrowMutError'
```

A `BorrowMutError` panic means: this program reached a state where a writer and a reader overlap, the exact bug the borrow checker rejects for free at compile time, except here it fired in production. Note one timing difference from the borrow-checker-proofs lesson: compile-time borrows end at their last _use_, but a guard is a value, so its borrow ends at _drop_. `r` above is never used, and the program still panics, because the guard lives to scope end.

## A scalpel, not a default

`RefCell` costs one flag word and a branch per borrow, which is cheap. The real price is trading a compile error for a possible panic. So the order of resort is: first try restructuring so `&mut` flows normally; reach for `RefCell` when sharing is structural. The legitimate homes: `Rc<RefCell<T>>` for shared mutable graphs on one thread, caches and memoization behind `&self`, and test doubles, like the newsletter tests' fake email client recording requests through the trait's `&self` methods. Neither `Cell` nor `RefCell` is thread-safe; across threads, interior mutability is spelled `Mutex`, `RwLock`, or atomics.

## Predict, then verify

```rust
let log = RefCell::new(vec![String::from("a")]);
log.borrow_mut().push(String::from("b"));
log.borrow_mut().push(String::from("c"));
println!("{:?}", log.borrow());
```

Two mutable borrows of the same `RefCell`. Panic or print?

Answer: it prints all three strings. Each `borrow_mut()` here is a temporary that drops at the end of its own statement, so the borrows never overlap; by the time the second begins, the first guard is gone. Compare the panicking example above, where binding the guard to `r` kept the borrow alive. With runtime borrows, _when guards drop_ is the whole game, which is exactly the Drop-timing instinct you built in the drop lesson.
