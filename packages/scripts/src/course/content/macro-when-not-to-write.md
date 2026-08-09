Four lessons of macro powers deserve an honest closing question: should you write one? For an application developer the answer is almost always no, and the discipline has an order. Function first, generics second, macro last.

## Function first

The test suite needs subscribers. The macro itch:

```rust
let sub = subscriber!("ada@example.com", "Ada");
```

The correct tool:

```rust
fn test_subscriber(email: &str, name: &str) -> Subscriber {
    Subscriber { email: email.into(), name: name.into(), confirmed: false }
}
```

Fixed arity, known types, ordinary values: a function does everything the macro would, and it has a signature. That signature is not decoration. It is documentation, a type-checked contract, a completion source for the IDE, and a boundary you can unit test, all traded away by the macro version to save four characters at the call site.

## Generics second

"The same logic for several types" does not need a macro either; that is what the traits and generics section was for:

```rust
fn largest<T: PartialOrd>(items: &[T]) -> Option<&T> {
    items.iter().reduce(|a, b| if b > a { b } else { a })
}
```

One checked definition, every ordered type, still one signature.

## Macro last: the legitimate residue

Reach for a macro only when the requirement is structurally out of reach for the first two:

- Variable arity: `format!`, `vec!`, the `context!` from the macro_rules lesson.
- A literal checked at compile time: format strings, `sqlx::query!`'s SQL.
- Source text as data: `assert!` panics with the condition's source, `dbg!` prints the expression itself. A function receives `false` or `4`; it can never recover what the caller wrote.
- One impl per shape: serde cannot be a generic, because no generic can enumerate your struct's fields. The standard library implements traits for tuples arity by arity with internal macros for the same reason.
- Rewriting an item: `#[tokio::main]`.

A workable test: write the call site you wish existed. If a function or a generic can provide that exact call site, stop; you were about to pay macro prices for function goods.

## The prices

Worth naming, because earlier lessons only hinted at them.

A macro body is unchecked until used. A transcriber merely has to be valid tokens; type errors wait at call sites, possibly in another crate, possibly months later.

Errors leak implementation. The same mistake against a function and a macro:

```rust
fn add_one(x: i32) -> i32 { x + 1 }
macro_rules! add_one_m { ($x:expr) => { $x + 1 }; }

let name = String::from("Ada");
add_one(name);    // error[E0308]: mismatched types: expected `i32`, found `String`
add_one_m!(name); // error[E0369]: cannot add `{integer}` to `String`, plus a macro note
```

The function states its contract at the call site; the macro exposes its insides and makes the caller debug them.

Tooling dims inside macros: completion, go-to-definition, and refactors all work hardest there, and every human reader must expand the code in their head. Compile time is paid per invocation, as the cargo expand lesson itemized. And `macro_rules!` is textually scoped, usable only below its definition unless re-exported, a small trap functions never set.

One more, from people who maintain macros in production: a macro's interesting failures are compile-time failures, so its test suite is compile-fail tests (see the `trybuild` crate) asserting exact error text against a moving compiler, forever. A function's tests are just tests.

## Predict, then verify

```rust
macro_rules! broken {
    () => { 1 + "one" };
}

fn main() {
    println!("fine");
}
```

The transcriber contains an obvious type error. Does this program compile?

Answer: yes. It prints `fine`, with at most an `unused_macros` warning. Definition only requires valid tokens; type checking happens per expansion, and nothing ever expands `broken!`, so the bug ships silently until the first caller finds it. The equivalent function would fail to compile today. That deferral is the sharpest summary of this lesson: a macro moves errors from where code is written to where it is used, so make sure what you gain at the call site is worth it.
