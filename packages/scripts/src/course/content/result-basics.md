Option says "there might be nothing." Result says "this might not work, and here is why." It is Rust's entire error-handling story in one two-variant enum, and it replaces exceptions outright.

## Errors are return values

```rust
enum Result<T, E> { Ok(T), Err(E) }

fn parse_port(s: &str) -> Result<u16, std::num::ParseIntError> {
    s.trim().parse()
}
```

There is no invisible control flow. A function that can fail _says so in its return type_, and the caller holds both possibilities in hand. Compare exceptions: in TypeScript, `JSON.parse` throws, nothing in any signature warns you, and the catch lives wherever someone remembered to put one. In Rust the possibility of failure is part of the API, checked like any other type.

```rust
match parse_port("8080") {
    Ok(port) => println!("listening on {port}"),
    Err(e) => eprintln!("bad port: {e}"),
}
```

## `?`, the operator that makes it bearable

Explicitly matching every fallible call would bury the logic. The `?` operator propagates instead: unwrap the `Ok`, or return the `Err` to the caller right now.

```rust
use std::fs;

fn read_config(path: &str) -> Result<Config, ConfigError> {
    let text = fs::read_to_string(path)?;   // io::Error -> ConfigError via From
    let config = parse(&text)?;             // ParseError -> ConfigError via From
    Ok(config)
}
```

Two things to see clearly:

- The happy path reads top to bottom with no nesting; every `?` is a visible "this can fail here" marker. Failure handling is neither invisible (exceptions) nor deafening (Go's `if err != nil` on every third line).
- `?` calls `From::from` on the error on its way out. If `ConfigError` implements `From<io::Error>` and `From<ParseError>`, both kinds convert automatically at the `?`. This conversion hook is the mechanism the whole ecosystem's error design hangs off: chapter 8 of the book builds error types around it, with `thiserror` generating the `From` impls.

`?` only works inside functions returning `Result` (or `Option`), which is why `main` in real programs is often `fn main() -> Result<(), anyhow::Error>`.

## Choosing the error type, the short version

The full treatment is a chapter of its own (and section 9 of this part), but the working defaults are worth having now:

- **Libraries** define a concrete error enum, one variant per failure the caller might handle differently.
- **Applications** often carry `anyhow::Error`, an "any error plus context" type, in code where the only handler is a log line at the top.
- `unwrap`/`expect` remain what they were for Option: assertions that a case is impossible, not handling.

## Predict, then verify

```rust
fn double_port(s: &str) -> Result<u16, std::num::ParseIntError> {
    let port = s.parse::<u16>()?;
    Ok(port * 2)
}

println!("{:?}", double_port("40000"));
```

`40000` parses fine into a `u16` (max 65535). What does this print?

Answer: it panics in debug builds: `attempt to multiply with overflow`, because `40000 * 2` exceeds `u16`. The parse's failure path was handled by `?`; the _arithmetic_ failure was not a Result at all, it was a bug-class panic, exactly the panic-versus-Result boundary in action. In release builds it would silently wrap to 14464 unless overflow checks are enabled, which is its own lesson about debug assertions. Fallibility you model with Result; arithmetic you validate before it overflows, `checked_mul` returning an Option being the honest tool.
