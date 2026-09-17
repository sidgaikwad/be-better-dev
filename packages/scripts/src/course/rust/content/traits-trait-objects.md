The last lesson ended with rustc refusing to let `impl EmailClient` cover a runtime decision, and suggesting the fix itself. Here it is compiling:

```rust
fn make_client(use_fake: bool, token: String) -> Box<dyn EmailClient> {
    if use_fake {
        Box::new(FakeClient)
    } else {
        Box::new(Postmark { token })
    }
}
```

`dyn EmailClient` is a trait object: some type implementing `EmailClient`, which one to be determined at runtime.

## Why the Box is not optional

`Postmark` is 24 bytes; `FakeClient` is zero. A local variable of type `dyn EmailClient` would have no single knowable size, and stack slots need sizes at compile time. So `dyn Trait` is an unsized type, like `str` and `[T]` from the slices lesson, and it lives the same way those do: behind a pointer. `Box<dyn EmailClient>`, `&dyn EmailClient`, and `Arc<dyn EmailClient>` (smart pointers, next section) all work; bare `dyn EmailClient` does not.

## The memory shape

A `&str` was a pointer plus a length. A trait-object pointer is a pointer plus a vtable:

```
stack                            heap                  static memory
client: Box<dyn EmailClient>
{ data ────────────────────────▶ Postmark { token }
  vtable ─────────────────────────────────────────────▶ vtable(Postmark, EmailClient):
} 16 bytes total                                        [ drop | size | align | send | send_to_all ]
```

The vtable is built at compile time, one per concrete-type-and-trait pair, and holds a function pointer per method (defaults included) plus the type's destructor, size, and alignment. Its exact layout is a compiler implementation detail, not something code may rely on.

A call `client.send(...)` becomes: load the vtable pointer, load the `send` slot, call through that function pointer. Dynamic dispatch.

## What it costs, and what it buys

The cost: two dependent loads and an indirect call per invocation, and, the part that usually matters more, the optimizer cannot see the callee, so no inlining and none of the optimizations inlining unlocks. Small, but real in hot loops.

The purchase:

- Runtime choice, as in `make_client`.
- Heterogeneous collections. `Vec<Box<dyn EmailClient>>` holds a `Postmark` and three fakes together; `Vec<T>` with a generic `T` holds exactly one concrete type.
- One compiled copy. `fn confirm(client: &dyn EmailClient, email: &str)` is a single non-generic function no matter how many client types exist. When monomorphization's code-size and compile-time bill (last lesson) comes due, `dyn` is the standard cure.

## Dyn compatibility

Not every trait can be a trait object. A generic method has no single vtable slot to fill (which instantiation would go in it?), and a method returning `Self` by value has no known size once the type is erased. Traits that avoid these are _dyn compatible_ (older documentation says "object safe"); violate the rules and `error[E0038]` names the offending method precisely.

## Choosing

Default to generics: full speed, and most code never needs the flexibility. Reach for `dyn` when the concrete type is runtime data, when different types must share a collection, or when binary size and compile time need cutting. In the newsletter service, holding `Box<dyn EmailClient>` in the application state lets tests inject `FakeClient` without a generic parameter rippling through the signature of every function that touches state.

## Predict, then verify

```rust
use std::mem::size_of;

println!("{}", size_of::<&Postmark>());
println!("{}", size_of::<&dyn EmailClient>());
println!("{}", size_of::<Box<dyn EmailClient>>());
```

On a 64-bit machine, which three numbers print?

Answer: 8, 16, 16. `&Postmark` is a thin pointer: the concrete type is known, the compiler already knows where its `send` lives, no vtable needs to travel. Erase the type behind `dyn` and every pointer to it grows a second word for the vtable, `Box` included. That 16-byte fat pointer is the entire runtime footprint of "I do not know which client this is"; the pointed-to value itself never changes shape.
