`send_confirmation` from the last lesson is called with `&Postmark` in main and `&FakeClient` in tests. One function in the source. How many in the compiled program?

Two. The compiler monomorphizes: for every concrete type a generic is used with, it stamps a full specialized copy, as if you had written it by hand:

```rust
// source
fn send_confirmation<C: EmailClient>(client: &C, email: &str) -> Result<(), SendError> {
    client.send(email, "Confirm your subscription", "The link is inside")
}

// what the compiled program effectively contains
fn send_confirmation_postmark(client: &Postmark, email: &str) -> Result<(), SendError> {
    client.send(/* Postmark::send, called directly */ email, "Confirm your subscription", "The link is inside")
}
fn send_confirmation_fake(client: &FakeClient, email: &str) -> Result<(), SendError> {
    client.send(/* FakeClient::send, called directly */ email, "Confirm your subscription", "The link is inside")
}
```

The generic function itself never becomes machine code. It is a recipe.

## Static dispatch, and why it is fast

In each stamped copy the callee is a known, named function: static dispatch. Known callees can be inlined, and after inlining the optimizer works on straight-line, fully concrete code; the trait, the generic, often the function boundary itself all dissolve. This is the honest meaning of "zero-cost abstraction": not that it costs nothing, but that it costs nothing _extra_ compared to the per-type code you would have written by hand.

## The bill arrives elsewhere

Every instantiation is compiled and optimized separately, so you pay twice:

- Compile time. Each copy goes through the backend. `cargo llvm-lines` ranks which generics expand into the most compiled code; in real services, serialization and iterator adapters usually top the chart.
- Binary size. The copies ship. Heavily generic code bloats the executable and, in hot paths, competes for instruction cache.

This trade, fast calls for fat binaries and slow builds, is exactly what the next lesson's mechanism inverts.

## impl Trait in argument position

```rust
fn send_confirmation(client: &impl EmailClient, email: &str) -> Result<(), SendError>
```

Same function, alternative spelling. `impl EmailClient` as an argument type declares an anonymous type parameter with that bound, monomorphized identically. Choose by readability; the named `<C: EmailClient>` form is required when a caller needs the turbofish (`send_confirmation::<Postmark>`) or two arguments must share one type.

## impl Trait in return position

Some types cannot be written down. Every closure has its own unnameable type (`Fn` is the trait closures implement; the iterators and closures section digs in):

```rust
fn confirmation_email(name: String) -> impl Fn() -> String {
    move || format!("Hi {name}, confirm your subscription")
}
```

The caller learns only "some concrete type implementing `Fn() -> String`". The compiler still knows the real type, so calls into it are static, no allocation involved. But it is _one_ type, chosen at compile time:

```rust
fn make_client(use_fake: bool, token: String) -> impl EmailClient {
    if use_fake {
        FakeClient
    } else {
        Postmark { token }
    }
}
```

```
error[E0308]: `if` and `else` have incompatible types
  |
  |         Postmark { token }
  |         ^^^^^^^^^^^^^^^^^^ expected `FakeClient`, found `Postmark`
  |
  = help: you could change the return type to be a boxed trait object
```

`use_fake` is runtime data; `impl Trait` demands a compile-time answer. The compiler names the escape hatch itself: a boxed trait object. Next lesson.

## Predict, then verify

```rust
fn double<T: std::ops::Add<Output = T> + Copy>(x: T) -> T {
    x + x
}

fn main() {
    double(2_i8);
    double(7_i8);
    double(2.5_f32);
}
```

How many monomorphized copies of `double` does this program contain?

Answer: two, `double::<i8>` and `double::<f32>`. Copies are stamped per concrete type, not per call site; the two `i8` calls share one. (The `Copy` bound is quietly load-bearing, as in the copy-versus-move lesson: `x + x` uses `x` twice.) And after inlining, likely zero separate functions survive; each call collapses to a single add instruction. Monomorphization's copies are what the optimizer is handed, not necessarily what ships.
