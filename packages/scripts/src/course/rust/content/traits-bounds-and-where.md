The last lesson left a gap: `Postmark` and `FakeClient` both implement `EmailClient`, but no function accepts either. Try the obvious generic:

```rust
fn send_confirmation<C>(client: &C, email: &str) -> Result<(), SendError> {
    client.send(email, "Confirm your subscription", "The link is inside")
}
```

```
error[E0599]: no method named `send` found for reference `&C` in the current scope
  |
  = help: items from traits can only be used if the type parameter
          is bounded by the trait
help: the following trait defines an item `send`, perhaps you need to
      restrict type parameter `C` with it:
  |
1 | fn send_confirmation<C: EmailClient>(client: &C, email: &str) ...
```

Inside a generic function, `C` is opaque. You may move it, borrow it, drop it, and nothing else, because the function must work for _every_ possible `C`. To call a method, you name the capability, and the help text spells out the syntax:

```rust
fn send_confirmation<C: EmailClient>(client: &C, email: &str) -> Result<(), SendError> {
    client.send(email, "Confirm your subscription", "The link is inside")
}

send_confirmation(&FakeClient, "ada@example.com")?;   // C = FakeClient
send_confirmation(&postmark, "ada@example.com")?;     // C = Postmark
```

The bound `C: EmailClient` is a contract checked in both directions. The body may use exactly the trait's methods, nothing more. The caller must supply a type that opted in, nothing less. Both sides are verified independently: the definition once, each call site once. C++ templates check only at instantiation, which is why their errors erupt from deep inside library code; Rust puts the whole negotiation in the signature.

## More than one promise

`+` stacks bounds, and `where` moves them out of the angle brackets:

```rust
use std::fmt::Debug;

fn send_and_log<C>(client: &C, email: &str) -> Result<(), SendError>
where
    C: EmailClient + Debug,
{
    println!("delivering via {client:?}");
    client.send(email, "Confirm your subscription", "The link is inside")
}
```

Inline bounds and `where` clauses mean exactly the same thing. `where` earns its keep when bounds multiply or get long; the signature stays readable, the contract moves below it.

## The comparison classic

Bounds explain a famous beginner wall:

```rust
fn largest<T>(list: &[T]) -> &T {
    let mut best = &list[0];
    for item in list {
        if item > best { best = item; }
    }
    best
}
```

```
error[E0369]: binary operation `>` cannot be applied to type `&T`
help: consider restricting type parameter `T`
  |
1 | fn largest<T: std::cmp::PartialOrd>(list: &[T]) -> &T {
  |             ++++++++++++++++++++++
```

Rejected at the definition, before a single caller exists. `>` is sugar for `PartialOrd::gt`, a trait method like any other, and no bound promised it. Operators being trait calls is a theme the standard-traits lesson returns to.

## Bounds on impls, and one famous freebie

Bounds attach to impl blocks too, which is how the standard library hands out capabilities wholesale:

```rust
// in std, approximately:
impl<T: Display> ToString for T {
    fn to_string(&self) -> String { /* format self via Display */ }
}
```

One impl covering every displayable type ever written, which is why `42.to_string()` just works. This is called a blanket impl; the conversions lesson leans on the same trick.

## Predict, then verify

```rust
use std::fmt::Debug;

fn describe<T: Debug>(value: &T) {
    println!("{value:?}");
    println!("{value}");
}
```

The bound grants `Debug`. Does this compile?

Answer: no. The second line fails with `` error[E0277]: `T` doesn't implement `std::fmt::Display` ``, because `{}` formatting belongs to the `Display` trait and the capability list for `T` is exactly its bounds. Even though every type you plan to pass implements both, the function must hold for all `T: Debug`, and some `T: Debug` types have no `Display`. Add `+ Display` to the bound and it compiles. Generic code never gets to use a method it did not ask for; that is what makes the signature a complete contract.
