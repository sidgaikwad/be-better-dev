A retry helper for the newsletter's delivery worker, and a closure that will not fit into it:

```rust
fn with_retry<F: Fn() -> bool>(op: F) -> bool {
    for _ in 0..3 {
        if op() {
            return true;
        }
    }
    false
}

let email = compose_digest();     // an owned Email
with_retry(|| send(email));       // send takes Email by value
```

```text
error[E0525]: expected a closure that implements the `Fn` trait,
              but this closure only implements `FnOnce`
note: closure is `FnOnce` because it moves the variable `email`
      out of its environment
```

The compiler just prevented a real bug: attempt one would move `email` into `send`, and attempt two would use a moved value. The vocabulary in that message is this lesson.

## Three traits, priced by capture

Closure types are anonymous, so functions accept them through traits, and there are exactly three, split by what calling does to the captured state:

- `FnOnce`: callable at least once; calling consumes the closure. Every closure implements it.
- `FnMut`: callable repeatedly, may mutate its captures. Implemented by every closure that does not move a capture out.
- `Fn`: callable repeatedly through shared access. Implemented when the body neither mutates nor moves captures.

Recall last lesson: a closure is a hidden struct. These are its call methods, taking `self`, `&mut self`, and `&self`, the same three receivers "Structs and impl blocks" called ownership contracts. They nest: every `Fn` is also `FnMut`, every `FnMut` also `FnOnce`. And the compiler infers the least restrictive answer available: each closure implements every trait its body honestly permits.

```rust
let mut count = 0;
let tick = || count += 1;              // FnMut and FnOnce, not Fn
let report = String::from("done");
let finish = || drop(report);          // FnOnce only: it gives its capture away
let cap = 30;
let recent = |days: u32| days < cap;   // Fn, FnMut, and FnOnce
```

## Which bound to write

As an API author, demand the least you need, so the most closures qualify:

- Called at most once: `FnOnce`. This is why `Option::map` from "Option: absence made visible" declares `F: FnOnce(T) -> U`, and why `found.map(|s| s.name)` was allowed to move the name out.
- Called repeatedly: `FnMut`, held in a `mut` binding.
- Called repeatedly through shared access, or from several places at once: `Fn`.

Our helper calls `op` up to three times, so `FnOnce` is out, but `Fn` was stricter than necessary:

```rust
fn with_retry<F: FnMut() -> bool>(mut op: F) -> bool {
    for _ in 0..3 {
        if op() {
            return true;
        }
    }
    false
}

with_retry(|| send(email.clone()));   // clones per attempt: the body only reads email
```

The new closure reads `email` to clone it, so it implements `Fn`, and every `Fn` closure satisfies an `FnMut` bound. Plain functions capture nothing and implement all three: `with_retry(healthcheck)` works for a `fn healthcheck() -> bool` as well.

## move does not pick the trait

Two independent knobs: `move` decides how variables get in; the trait reflects what the body does with them afterward.

```rust
let domain = String::from("mail.dev");
let is_ours = move |email: &str| email.ends_with(&domain);
```

`is_ours` owns `domain` but only reads it: still `Fn`, callable forever. That combination, own your state but promise shared-access calls, is what let `make_greeter` return `impl Fn` last lesson, and it is the standard shape for closures that outlive their birth scope.

## Predict, then verify

```rust
let mut sent = Vec::new();
let mut record = |email: &str| sent.push(email.to_string());
record("a@x.com");
record("b@y.com");
println!("{}", sent.len());
```

Which traits does `record` implement, and why are both `mut`s required?

Answer: it mutates `sent` and moves nothing out, so `FnMut` and `FnOnce` but not `Fn`, and the program prints 2. Calling an `FnMut` closure is a `&mut self` method call on the hidden struct, so the binding `record` needs `mut`; `sent` needs `mut` because the closure holds an exclusive borrow of it from definition to last call. The `println!` compiles only because that last call sits above it, ending the borrow, the same last-use reasoning as "What the borrow checker proves".
