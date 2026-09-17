The derives lesson in structs-and-impl ended with `#[derive(Debug, Clone, PartialEq)]`: annotations that write trait impls for you. Those ship with the compiler, but the same door is open to every crate on crates.io, and the ecosystem lives in it. These are _procedural macros_: ordinary Rust code that the compiler runs at build time, taking your code as tokens and returning more tokens. An application developer reads their effects daily and writes one rarely, so this is the consumer's tour of the three kinds, using the four you will meet first.

## Custom derive: an impl from your struct's shape

```rust
#[derive(serde::Deserialize)]
pub struct FormData {
    email: String,
    name: String,
}
```

This is the subscribe endpoint's form type. At build time, serde's derive reads the struct definition and generates `impl<'de> Deserialize<'de> for FormData`: straight-line code that already knows both field names and their types. Rust has no runtime reflection, no walking objects asking for their keys, so the knowledge a TypeScript validator gathers at runtime is baked into generated code before the program exists.

```rust
#[derive(thiserror::Error, Debug)]
pub enum SubscribeError {
    #[error("invalid subscriber data: {0}")]
    Validation(String),
    #[error("database failure")]
    Database(#[from] sqlx::Error),
}
```

The result-basics lesson made errors ordinary values; thiserror generates the ceremony around them: a `Display` impl from the `#[error]` strings, a `std::error::Error` impl with `source()` wired up, and `From<sqlx::Error>` for the `#[from]` field. The `#[error]` and `#[from]` markers are _helper attributes_: inert labels that only the derive reads.

A derive only ever _adds_ code next to your item. The struct itself compiles unchanged, fields untouched.

## Attribute macros: the item, rewritten

An attribute macro receives the entire item beneath it and returns whatever should replace it.

```rust
#[tokio::main]
async fn main() {
    println!("hello from the runtime");
}
```

expands to, lightly cleaned up:

```rust
fn main() {
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .expect("failed to build runtime")
        .block_on(async {
            println!("hello from the runtime");
        })
}
```

Your `async fn main` is gone; a synchronous `main` that builds a runtime and blocks on your body stands in its place. That is the working distinction: derive appends, attribute replaces.

## Function-like: arbitrary tokens, arbitrary work

```rust
sqlx::query!(
    "INSERT INTO subscriptions (id, email, name, subscribed_at)
     VALUES ($1, $2, $3, $4)",
    id, form.email, form.name, now
)
```

Called like a `macro_rules!` macro, but behind it runs real code with real capabilities: at build time, `sqlx::query!` connects to the database named by `DATABASE_URL`, asks it to describe this query, and generates code typed to the answer: parameters checked, plus an anonymous output struct with one correctly typed field per selected column. Misspell a column and compilation fails. The SQL literal is doing what `println!`'s format string did in the first lesson, with a real schema standing where the placeholder counter stood.

## One level deeper: code that runs while you compile

A procedural macro lives in its own crate (marked `proc-macro = true`), is compiled for your build machine, and is loaded into the compiler as a dynamic library. During expansion it executes with full permissions: sqlx really does open a network connection from inside `cargo build`. That is what buys the checking above, and it bills you twice: in build time, which the next lesson measures, and in trust, since a build dependency runs code on your laptop and your CI before your program ever does.

## Predict, then verify

Delete the attribute and build:

```rust
async fn main() {
    // ...
}
```

What does the compiler say, and what does that reveal about what the attribute was doing?

Answer: the build fails with error E0752, "`main` function is not allowed to be `async`". The language has no async entry point at all. `#[tokio::main]` was not switching on a feature; it was rewriting your item into the ordinary `main` shown above. When a macro looks like magic, the magic is always generated code, and the next lesson is the machine for looking at it.
