In TypeScript, testing starts with decisions: Jest or Vitest, a config file, a transform pipeline. In Rust the harness ships with the toolchain. From "cargo, the front door" you already know `cargo test` is a built-in subcommand, and "CI from day one" runs it on every push. Here is what it actually runs.

```rust
pub fn parse_subscriber_name(s: &str) -> Result<String, String> {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return Err("subscriber name cannot be empty".into());
    }
    Ok(trimmed.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn trims_surrounding_whitespace() {
        assert_eq!(parse_subscriber_name("  Ursula  ").unwrap(), "Ursula");
    }

    #[test]
    fn rejects_whitespace_only_names() {
        assert!(parse_subscriber_name("   ").is_err());
    }
}
```

Three attributes carry the whole system. `#[cfg(test)]` is conditional compilation: the module exists only when building tests, so your release binary carries zero test code. `#[test]` registers a function with the harness; a test fails by panicking and passes by returning. And because `mod tests` is a child module, `use super::*` gives it access to everything in the parent, private items included. Privacy in Rust follows the module tree, and children can see their ancestors' internals.

## Failure messages you can diagnose from

`assert!` panics with the stringified expression: `assertion failed: parse_subscriber_name("   ").is_err()`. That tells you nothing about the value that broke it. `assert_eq!` and `assert_ne!` print both sides:

```
assertion `left == right` failed
  left: "Ursula "
 right: "Ursula"
```

All the assert macros accept format arguments after the condition, and the book uses them hard in its subscription tests: `assert_eq!(400, status, "The API did not return a 400 when the payload was {}.", description)`. A failing test is read many more times than it is written; make the message carry the diagnosis. For `Result`-heavy code the book reaches for `claim::assert_ok!` and `claim::assert_err!`, which print the unexpected variant for you. `claim` is unmaintained today; the drop-in fork is `claims`.

Two more tools round out the harness. Since "Result: failure as a value", you know `?` needs a `Result`-returning function: a `#[test]` fn may return `Result<(), E>`, so `?` works inside tests too. And `#[should_panic(expected = "cannot be empty")]` inverts a test: it passes only if the code panics, and `expected` pins a substring of the panic message so you fail on the wrong panic.

## Private access, and when it is a smell

The book calls modules with a tiny public surface over heavy private machinery iceberg projects: two public functions, tens of private routines. Embedded test modules exist for exactly that shape, because exercising every edge case through the narrow public API may be impractical. But reach for private access reluctantly. If a behavior can only be observed by calling private functions, no user of your API can observe it either, so either it does not matter or your public surface is missing something. Tests welded to private helpers also ossify them: refactor the internals and the tests break with no user-visible behavior change.

One level down: `cargo test` compiles each target into its own test binary with the libtest harness linked in, then runs your `#[test]` functions on a pool of threads, in parallel by default (`--test-threads=1` serializes). A panic unwinds, the harness catches it on that thread and marks the test failed, and stdout is captured unless you pass `--nocapture`. Parallelism is why tests that share state, a file path, a port, a database, flake; keep unit tests on values, not shared resources.

## Predict, then verify

A test is marked `#[should_panic(expected = "out of range")]`, but the code inside panics with `index out of bounds: the len is 3 but the index is 7`. Does the test pass?

Answer: it fails. `expected` is a substring match against the actual panic message, and `"out of range"` does not occur in it. The harness reports `panic did not contain expected string`. This is the point of `expected`: without it, any panic at all satisfies `#[should_panic]`, including an unrelated bug that panics earlier for the wrong reason.
