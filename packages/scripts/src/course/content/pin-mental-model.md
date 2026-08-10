Every load-bearing fact about `Pin` has now passed through your hands. Here is the entire story, six sentences long:

1. An `async fn` compiles to a state machine holding every local that lives across an `.await` (the state-machine lesson, Async from scratch).
2. When one of those locals borrows another, the machine contains a pointer into itself.
3. A move is a byte copy that rewrites nothing (One owner per value), so moving a polled machine would leave that pointer aiming at the old address.
4. `Pin<&mut T>` is the fix: a pointer carrying a compile-time promise that the value behind it will never move again, kept by refusing to hand out a plain `&mut T`.
5. `Unpin` is the opt-out claimed automatically by nearly every type except async machines, which is why the contract usually costs nothing and asks nothing.
6. Runtimes, `.await`, and combinators produce and uphold pins; application code only occasionally consumes one.

When `Pin` feels slippery six months from now, reread those sentences. Everything else in this section was illustration.

## You are a consumer, not a producer

Sentence 6 is the difference between `Pin` being scary and being background noise. The producing side, the code that creates and threads pins, is written by runtime and library authors: `tokio::spawn` and `block_on` pin the root of every task tree, `.await` pins each child machine inside its parent, `select!` pins its by-value branches. You benefit from that layer in every async line you write and never see it.

The consuming side is your code, and its entire playbook is three lines:

- An error says `cannot be unpinned`: the future is being lent by reference. Pin it first: `pin!` inside a function, `Box::pin` if it must leave the scope.
- A struct must store a future: give it a stable home and a nameable type in one move, `Pin<Box<dyn Future<Output = T> + Send>>`.
- You are implementing `Future` or `Stream` by hand, or polling one manually in a test: you receive `Pin<&mut Self>`, and if your fields are all `Unpin`, `Pin::get_mut` makes the body ordinary code.

Notice what is absent: no step where you reason about pointer validity, no `unsafe`, no `PhantomPinned`.

## What Pin is not

Misreadings cause more trouble than the type does. `Pin` is not a runtime mechanism: no bytes change and nothing is locked in memory. It is not a property a value carries: values never know they are pinned; pointers promise on their behalf. It is not a hygiene practice: pinning futures preemptively buys nothing, because `.await` and the runtime already pin everything on the normal path.

And this section is not secretly incomplete: what it skipped is the API-author side on purpose. Structural pinning (deciding which of your fields are pinned when you are), the `pin-project` crate that makes those projections safe, and the `unsafe` contract of `Pin::new_unchecked` matter when you write combinator libraries. If you get there, the `std::pin` module docs cover it, and they will read as an expansion of the six sentences, not a new subject.

Why the contract earns its keep in production: a tokio task is one heap allocation; the wakers handed to the IO driver lead back into it; every poll resumes the machine exactly where the last one left it. None of that is sound if futures can change address mid-flight. `Pin` is the type-level form of the invariant the entire runtime stands on. State machines contain internal pointers, therefore the language pins them, therefore your server does not corrupt memory under load. You are on the receiving end of that trade.

## Predict, then verify

A teammate proposes: let's `Box::pin` every future we create, so we never hit pin errors again. Evaluate the trade.

Answer: it would compile and run correctly, and it buys almost nothing. Futures on the normal path are already pinned by `.await` and the runtime, so the blanket `Box::pin` adds a heap allocation per future and a layer of noise while preventing errors you would rarely hit anyway. `Box::pin` is a targeted tool for futures that are stored, made `dyn`, or borrowed across loop iterations. Reserve it for when the compiler or a struct field asks; the playbook above covers exactly when that happens.
