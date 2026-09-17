Take last lesson's shared template and hand it to a worker thread:

```rust
use std::rc::Rc;
use std::thread;

let tpl = Rc::new(String::from("<h1>Welcome</h1>"));
let handle = thread::spawn(move || {
    println!("{tpl}");
});
```

```
error[E0277]: `Rc<String>` cannot be sent between threads safely
  = note: the trait `Send` is not implemented for `Rc<String>`
```

The compiler is protecting the count. Two threads executing `count += 1` at the same moment can each read 2 and both write 3, losing an increment; the value then frees while an owner still holds it. `Rc` refuses to cross the thread boundary at compile time so that this can never happen at runtime.

## Arc: the same idea, atomically

`Arc<T>` is atomically reference counted: same API, same single allocation with two counts and the value, but the counts are atomic integers. An atomic increment is a single CPU instruction that hardware guarantees no other core can interleave with. Swap `Rc` for `Arc` in the program above and it compiles and runs.

## What the atomic costs

If atomics were free, `Rc` would not exist. Uncontended, an atomic increment costs a few nanoseconds, slightly more than a plain add because the core must own the cache line exclusively. Contended is where it bites: every clone and drop of the same `Arc` touches the same count, on the same cache line, so eight cores hammering it spend their time shipping that line between caches instead of working. Clone an `Arc<Config>` once per request and nobody will ever measure it; clone per message in a hot loop across many cores and it shows up in profiles.

One sentence of honesty about ordering, for later: increments use relaxed atomic ordering, but the final decrement synchronizes (release/acquire) so the thread that frees the value is guaranteed to see everything every other owner wrote first.

## Sharing, yes; mutating, no

Like `Rc`, `Arc<T>` hands out only `&T`:

```rust
let counts = std::sync::Arc::new(Vec::new());
counts.push(1);
// error[E0596]: cannot borrow data in an `Arc` as mutable
```

Aliasing XOR mutation does not bend for threads. When threads must share _and_ mutate, the idiom is `Arc<Mutex<T>>`: `Arc` makes ownership shared, `Mutex` makes access exclusive, one thread at a time, with the `MutexGuard` releasing on drop exactly as the drop lesson promised. Part 2 builds this properly and measures it; for now, learn to read the shape when you meet it in other people's code.

## The cheap-clone family, in production

The clone-judgment lesson ended with the family whose `Clone` is a pointer copy plus a count bump: `Rc<T>`, `Arc<T>`, `bytes::Bytes`. `Arc` is the member you will meet daily. In the newsletter service, the application state (database pool, email client, base URL) is shared with every worker: actix-web's `web::Data<T>` is precisely an `Arc<T>` under the hood, and each handler invocation clones it. An atomic bump per request, never a copied connection pool. When someone says "just clone the Arc", this is what they are approving: the cheap kind.

## Predict, then verify

```rust
use std::sync::Arc;
use std::thread;

let data = Arc::new(vec![1, 2, 3]);
let mut handles = Vec::new();
for _ in 0..4 {
    let d = Arc::clone(&data);
    handles.push(thread::spawn(move || d.len()));
}
for h in handles { h.join().unwrap(); }
println!("{}", Arc::strong_count(&data));
```

What number prints?

Answer: 1. The count peaked at 5, one owner in `main` plus one moved into each thread. Each thread's `Arc` dropped when its closure returned, an atomic decrement each time, and `join` guarantees all four have finished before the print. Only `main`'s claim remains, and the vector will be freed when it drops. The count is not bookkeeping about references in scope, it is live tracking of owners across threads, settled at runtime.
