You have been calling macros since your first line of Rust. `println!` is not a function, and the difference shows the moment you get a call wrong:

```rust
fn main() {
    println!("confirmed {} of {} subscribers", 42);
}
```

```
error: 2 positional arguments in format string, but there is 1 argument
```

The program never ran. Something read the format string during compilation, counted the placeholders, compared them with the arguments, and rejected the build. That something is a macro, and this lesson is about why no function could hold its job.

## Three walls a function hits

Imagine writing `fn println(fmt: &str, ...)` yourself.

Wall one: arity. Rust functions take a fixed number of parameters; there is no `...`. Yet `println!` happily takes one argument or nine.

Wall two: types. The arguments are mixed: a `&str` here, a `u64` and a `bool` there. A single signature has to say what it accepts. You could funnel everything through `&[&dyn Display]`, but that buys runtime dispatch and callers building slices by hand, and it still leaves wall three standing.

Wall three: the literal. A function receives its format string as a runtime value. The best it could do with a bad one is panic while the program runs, in production, on the error path you never exercised. `println!` reads the literal's tokens while the program is being compiled, where "reject the build" is still an available answer.

So `println!` is a different kind of thing. It runs at compile time, takes the source code at the call site as input, and produces new source code as output. Functions transform values while the program runs; macros transform code while the program builds.

## The bang marks the seam

Every `name!(...)` is an expansion site, and the delimiter is convention rather than meaning: `vec![...]` could be written `vec!(...)`. Inside the delimiters, grammar may deviate from Rust, which is how `vec![0u8; 1024]` gets a semicolon where no expression allows one. The macros you already use each earn the bang with a power functions lack:

- `vec!`, `format!`: any number of arguments.
- `assert!`: a failing `assert!(input.len() <= 256)` panics with that condition's source text in the message. A function receives `false`; it cannot recover what the caller wrote.
- `dbg!`: prints file, line, and the expression itself alongside the value.
- `panic!`, `todo!`: format-string checking again.

Expansion bottoms out in ordinary code. The real expansion of that `vec!` call:

```rust
let buffer = vec![0u8; 1024];
// becomes
let buffer = ::alloc::vec::from_elem(0u8, 1024);
```

A plain function call. No magic survives expansion; a macro is a compile-time front door onto normal Rust.

## Where expansion sits in the pipeline

The compiler tokenizes source, parses it, then expands macros repeatedly until none remain. Only afterward do name resolution, type checking, and borrow checking run, on the expanded code. Two consequences are worth keeping.

First, macros never see types or values, only tokens. `println!` does not know `42` is an `i32`; it knows it received the token `42`. The check that arguments implement `Display` lives in the code it generates, which the type checker visits later.

Second, every rule you have learned applies unchanged to generated code: it is type-checked and borrow-checked exactly like code you typed. There is no escape hatch, only indirection, and that indirection is why macro-heavy code can produce startling error messages. A later lesson in this section, on `cargo expand`, is the flashlight for those.

You have also met this machinery wearing another coat: the derives lesson in structs-and-impl showed `#[derive(Debug, Clone)]` writing whole trait impls for you. Same idea, attribute form; the procedural macros lesson takes it apart.

## Predict, then verify

```rust
fn main() {
    println!("welcome, {}", "Ada", "Lovelace");
}
```

One placeholder, two arguments. Does this build, and if not, what does the compiler say?

Answer: it fails with `error: argument never used`, the span pointing at `"Lovelace"`. C's `printf` evaluates the extra argument and silently ignores it; JavaScript's `console.log` prints it. Rust treats the disagreement between what the literal promises and what the call supplies as a bug in one of them, and it can only afford that opinion because a macro examined both before the program existed.
