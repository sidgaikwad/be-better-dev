New Rust developers pass through a predictable arc: fight the borrow checker, discover `.clone()` silences it, sprinkle clones everywhere, then read that cloning is "bad" and feel guilty about every one. Both extremes are miscalibrated. This lesson is about judgment.

## What clone actually costs

`.clone()` on a `String` or `Vec` is: one allocation, one memcpy of the contents. From the allocation lesson you know what that means physically. A 40-byte config string clones in nanoseconds. A million-element Vec in a hot loop is a different conversation.

The cost question is never "is there a clone" but "how big, how often". A clone of a small struct at startup is free by any measure that matters. The same clone per request at 50k requests per second is a real allocator load. Profile before moralising.

## When clone is correct engineering

- **Crossing an ownership boundary that genuinely needs its own copy.** Storing incoming data in two long-lived structures. Handing a value to another thread while keeping yours.
- **Configuration and startup code.** Runs once; clarity wins over microseconds, every time.
- **Breaking a borrow tangle while prototyping.** Clone now, leave a note, restructure when the design settles. Working code teaches you more than a day spent appeasing the checker on a design that will change tomorrow anyway.

## When clone is a smell

- **Cloning because the signature is wrong.** A function taking `String` but only reading it should take `&str`; callers clone to feed it for no reason. The fix is the signature, not the call sites.
- **Clone-per-iteration in hot paths.** Loops that clone to dodge a borrow usually restructure into borrowing the loop variable or moving the clone outside.
- **Cloning shared state to "share" it.** Two clones of a `Vec` are two independent Vecs that silently diverge. Actual sharing wants a reference, or `Arc` (a later lesson) for shared _ownership_.

The recurring theme: a clone that patches over a design problem leaves the problem. A clone that implements a real "I need my own copy" is just the program doing what it must, stated honestly.

## Cheap clones exist too

Some types implement `Clone` as a pointer copy plus a reference-count bump: `Arc<T>`, `Rc<T>`, and `bytes::Bytes` (the workhorse of async networking, which you will meet in the tokio section). Cloning an `Arc<Config>` costs an atomic increment, not a copy of the config, and _is_ the idiomatic way to share it. "Is clone expensive" always means "for this type".

## Predict, then verify

The compiler rejects this with a move error, and suggests cloning `config.name`:

```rust
struct Config { name: String }

fn start(c: Config) -> Server { /* stores c */ }

let config = Config { name: String::from("api") };
let server = start(config);
println!("starting {}", config.name);
```

Is the clone the right fix?

Answer: no, reordering is. Print first (or bind `let name = config.name.clone()` only if the name is truly needed after the handover; better, print before moving). The compiler's suggestions fix the _error_; only you can fix the _design_. It proposes the smallest change that compiles, which is not always the change the code wanted.
