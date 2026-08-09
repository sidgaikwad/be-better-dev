Both of these lines compile, and neither should surprise you by now, but it is worth asking why they work at all:

```rust
fn greet(name: &str) { println!("hello, {name}") }

let name = Box::new(String::from("Alice"));
println!("{}", name.len());   // a String method, called through a Box
greet(&name);                 // &Box<String> accepted where &str is expected
```

`Box` is a library type, yet it behaves like a built-in reference. No cast, no `.get()`, no unwrapping ceremony. Two traits produce that illusion, and every smart pointer in this section is built from the same two.

## Deref: act like the thing you point at

```rust
pub trait Deref {
    type Target: ?Sized;
    fn deref(&self) -> &Self::Target;
}
```

Implementing `Deref` tells the compiler "when someone treats me like a `&Target`, call this". Two mechanisms then kick in, both familiar from the shared references lesson:

- **Auto-deref on method calls.** `name.len()` becomes `(*name).len()`; the compiler inserts as many derefs as it takes to find the method.
- **Deref coercion at call sites.** `&Box<String>` coerces to `&String`, which coerces to `&str`. The chain is transitive, so `greet(&name)` type-checks through two hops.

There is no magic reserved for std. You can build the illusion yourself:

```rust
use std::ops::Deref;

struct MyBox<T>(T);

impl<T> Deref for MyBox<T> {
    type Target = T;
    fn deref(&self) -> &T { &self.0 }
}

let b = MyBox(String::from("hi"));
assert_eq!(b.len(), 2);       // auto-deref through your impl
```

`DerefMut` is the mutable twin, enabling `&mut Target` access. Which pointers implement it is a design statement: `Box` does, and the next lessons show that `Rc` and `Arc` deliberately do not.

## Drop: release on the way out

The other half you already know from the drop lesson: `Drop` runs at scope end, deterministically, in reverse declaration order. For smart pointers it is the release valve. `Box::drop` frees the heap allocation. `Rc::drop` decrements a count and frees at zero. `MutexGuard::drop` unlocks.

Put together, this is the definition worth keeping: **a smart pointer is a struct that implements `Deref` so it can stand in for the value, and `Drop` so it can release a resource when it dies.** The guards you will meet in the `RefCell` lesson and in Part 2's `Mutex` are exactly this pattern with "resource" meaning "a borrow" or "a lock".

## One level down, two honest notes

Coercion is resolved entirely at compile time. Each hop inserts a call to `deref`, which inlines to pointer arithmetic; the runtime cost of `&Box<String>` becoming `&str` is zero instructions beyond what a hand-written conversion would emit. (`Box` itself is slightly compiler-blessed, for instance you can move out of `*b`, but its public interface is just these two traits.)

The design warning: implement `Deref` only for types that genuinely _are_ pointers to their target. Using it to make a struct "inherit" methods from a field compiles, and then method resolution starts finding things you did not intend, invisibly. It is the classic misuse, and clippy will not always save you.

## Predict, then verify

`Drop` plus binding rules produce one famous trap:

```rust
struct Guard;
impl Drop for Guard {
    fn drop(&mut self) { println!("released"); }
}

fn main() {
    let _g = Guard;      // version A
    // let _ = Guard;    // version B
    println!("working");
}
```

What does each version print, in what order?

Answer: version A prints `working` then `released`: `_g` is a real binding, so the guard lives to scope end. Version B prints `released` then `working`: the pattern `_` binds nothing, so the value is dropped immediately, mid-statement. This matters in production the moment the guard is a lock: `let _ = mutex.lock().unwrap();` acquires the mutex and releases it on the same line, protecting nothing, while `let _guard = ...` holds it to scope end. Same two traits, opposite behavior, one underscore apart.
