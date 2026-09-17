Mount a route module, then try to call it from elsewhere in the crate:

```rust
// src/routes/subscriptions.rs
async fn subscribe(form: web::Form<FormData>) -> HttpResponse {
    HttpResponse::Ok().finish()
}
```

```rust
// src/startup.rs
use crate::routes::subscriptions::subscribe;
// error[E0603]: function `subscribe` is private
```

Everything in Rust is private by default: visible to its own module and that module's descendants, invisible to everyone else. A new function is nobody's business until you say otherwise. That is the opposite emphasis from TypeScript, where any exported symbol can be imported by file path from anywhere and "internal" is a convention the compiler does not enforce.

## The visibility levels

`pub` does not mean "visible to the world". It means "as visible as the module that contains it". For an item to be reachable from outside the crate, every module on its path must also be public, or the item must be re-exported. Between private and `pub` sit the scoped forms:

```rust
pub fn subscribe() {}            // as public as its module
pub(crate) fn spawn_worker() {}  // anywhere in this crate, invisible outside it
pub(super) fn helper() {}        // parent module only
```

`pub(crate)` is the workhorse in application crates like the newsletter: shared across the crate without joining the library's public contract.

Two refinements. Struct fields carry their own visibility, so `pub struct SubscriberName(String);` exposes the type while hiding the field; the whole next unit is built on that lever. Public enums are the deliberate exception: `pub enum` makes every variant and its fields public, because variants exist to be matched on. And privacy flows downward only: a child module sees its ancestors' private items, which is why `#[cfg(test)] mod tests { use super::*; }` can test private functions, the unit-test pattern the book uses throughout.

## pub use: the facade

Chapter 6 of the book splits `domain.rs` into a directory, one type per file, and its `mod.rs` is four lines of API design:

```rust
// src/domain/mod.rs
mod new_subscriber;
mod subscriber_email;
mod subscriber_name;

pub use new_subscriber::NewSubscriber;
pub use subscriber_email::SubscriberEmail;
pub use subscriber_name::SubscriberName;
```

The submodules are private; the types are re-exported at the module's root. Callers write `use zero2prod::domain::SubscriberEmail;` and cannot see, or depend on, the file layout behind it. When the book performed this split, no other file in the project changed: the module's public API was identical before and after, because `pub use` had decoupled public paths from the internal tree. That is the facade pattern: grow whatever directory depth you need inside, publish a flat namespace outside. rustdoc cooperates and documents items where they are re-exported, not where they live.

## One level deeper

Enforced privacy is what makes the other guarantees compound. The dead-code lint works because the compiler can prove a private item unreachable, something it could never do if callers might deep-import it. Refactors stay local: renaming a `pub(crate)` function cannot break downstream crates, because the compiler guarantees none can see it. And your semver surface, which the documentation lesson returns to, is precisely the set of `pub` items reachable from the crate root. Every `pub` you withhold is a promise you did not make.

## Predict, then verify

With the `domain/mod.rs` above, an integration test writes:

```rust
use zero2prod::domain::subscriber_email::SubscriberEmail;
```

What does the compiler say?

Answer: `error[E0603]: module 'subscriber_email' is private`. The only working path is the facade, `zero2prod::domain::SubscriberEmail`. The refusal is the feature: since no outside code can name the submodule, you can rename `subscriber_email.rs`, merge it into another file, or split it further, and nothing beyond `mod.rs` will ever notice.
