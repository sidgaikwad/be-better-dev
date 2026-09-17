The ownership rule from the one-owner lesson is strict: every value has exactly one owner. Mostly that maps cleanly onto programs. Sometimes it has no honest answer.

Take the newsletter service: one parsed email template, referenced by fifty queued delivery jobs. Jobs complete in any order, and the template must live until the _last_ one finishes. Which job owns it? None of them is special. Borrowing does not fit either: `&Template` needs some owner that outlives every job, and lifetimes force you to invent one. What you actually want is for ownership itself to be shared, with the value freed when the final sharer is done. That is a runtime question, so it needs a runtime mechanism: a counter.

## Rc: ownership by counting

```rust
use std::rc::Rc;

struct Template { html: String }

let tpl = Rc::new(Template { html: String::from("<h1>Welcome</h1>") });
let job_a = Rc::clone(&tpl);
let job_b = Rc::clone(&tpl);
assert_eq!(Rc::strong_count(&tpl), 3);

drop(job_a);
assert_eq!(Rc::strong_count(&tpl), 2);
```

`Rc<T>` allocates once: a heap block holding a strong count, a weak count, and the value. `Rc::clone` copies the pointer and increments the count; nothing about the `html` string is copied. This is the cheap-clone family from the clone-judgment lesson, and the `Rc::clone(&tpl)` spelling over `tpl.clone()` is convention precisely to signal "count bump, not deep copy" at the call site. Each drop decrements; whichever owner drops the count to zero frees the value.

## Shared ownership is read-only sharing

`Rc<T>` implements `Deref` but not `DerefMut`: it only ever hands out `&T`. Aliasing XOR mutation, from the exclusive references lesson, still governs. Many owners means many possible readers at once, so no owner may mutate. When you genuinely need mutation behind an `Rc`, the interior mutability lesson supplies the tool.

The other boundary: `Rc` is single-threaded, and the compiler enforces it (`Rc` is not `Send`). The count is a plain integer; two threads incrementing it simultaneously could lose an update, and a lost increment means a premature free, a use-after-free. Rather than pay for atomic operations everywhere, Rust splits the type in two: `Rc` for one thread, `Arc` (next lesson) when the count itself must be thread-safe.

## Cycles leak, and Weak breaks them

Rust guarantees no dangling pointers and no double frees. It does not guarantee no leaks. Point two `Rc`s at each other and the counts can never reach zero:

```rust
use std::cell::RefCell;
use std::rc::Rc;

struct Node { next: RefCell<Option<Rc<Node>>> }

let a = Rc::new(Node { next: RefCell::new(None) });
let b = Rc::new(Node { next: RefCell::new(Some(Rc::clone(&a))) });
*a.next.borrow_mut() = Some(Rc::clone(&b));   // a -> b -> a
```

(`RefCell` is next lesson's tool; here it is only the mechanism that lets us wire the loop after construction.) Drop both bindings and each node still holds the other's count at 1. The memory is unreachable and never freed. Safe Rust, real leak.

The fix is `Weak<T>`: a non-owning reference that does not keep the value alive. `Rc::downgrade` creates one; `weak.upgrade()` returns `Option<Rc<T>>`, `None` if the value is already gone. The convention in tree shapes: parents own children through `Rc`, children point back through `Weak`, so the cycle never closes. One level down: the weak count keeps the _allocation header_ alive after the value is dropped, which is exactly what lets `upgrade` check safely instead of dangling.

## Predict, then verify

```rust
let a = Rc::new(String::from("shared"));
let b = Rc::clone(&a);
drop(a);
println!("{b}");
```

Does this compile, and does it print?

Answer: yes and yes. `b` is not a reference into `a`; it is an owner in its own right. `drop(a)` surrenders one of two claims, taking the count from 2 to 1, and the string is freed only when `b` drops at scope end. That is the whole point of the type: no single binding's lifetime decides the value's lifetime, the count does.
