The project compiles, and the test suite does not pass. `cargo test` prints a panic from inside the server:

```
thread 'actix-rt:worker:0' panicked at
' is not a valid subscriber name.', src/domain.rs:39:13
```

and the integration test fails, not with a clean assertion, but with a `reqwest` error whose source is `hyper::Error(IncompleteMessage)`. Bright side: empty names no longer get a `200`. Not-so-bright side: the API aborts request processing mid-flight and hangs up on the client. `SubscriberName::parse` panics on invalid input, and that was the wrong tool. (The test also gets renamed to what we now actually want: `subscribe_returns_a_400_when_fields_are_present_but_invalid`.)

## The line, drawn precisely

Panics are for _unrecoverable_ errors: failure modes that were not expected, or that nothing meaningful can be done about. The host ran out of memory. The disk is full. A state the code just proved impossible happened anyway, which means the program has a bug. Rust panics are not exceptions: the standard library has utilities to catch some of them, but that is explicitly not the recommended approach. The rule the book endorses, paraphrasing burntsushi: if your Rust application panics in response to user input, your application has a bug, whether in your code or a dependency's.

A stranger on the internet submitting a malformed name is not a bug in our program. It is the expected failure of an expected operation, several times a day. Expected failures are values: as in Part 1's "Result: failure as a value", fallibility belongs in the return type, where the caller is type-checked into dealing with it.

```rust
pub fn parse(s: String) -> Result<SubscriberName, String> {
    if is_empty_or_whitespace || is_too_long || contains_forbidden_characters {
        Err(format!("{} is not a valid subscriber name.", s))
    } else {
        Ok(Self(s))
    }
}
```

`String` as the error type is crude; the error-handling section (chapter 8) upgrades it. Changing only the signature first and running `cargo check` is instructive: the compiler emits exactly two mismatched-type errors, the body's `Self(s)` (fix: `Ok(Self(s))`) and the call site in `subscribe` that expected a `SubscriberName` and now holds a `Result`. Rust forces acknowledgment of the unhappy path; we cannot pretend it is not there. For the moment the handler bridges with `.expect("Name validation failed.")`, still a panic, until the request-path lesson returns a proper `400`.

## Assertion errors worth reading

With `parse` returning `Result`, the domain's unit tests want to assert on it, and `assert!(result.is_ok())` fails like this:

```
thread 'dummy_fail' panicked at 'assertion failed: result.is_ok()'
```

No payload, no clue. The book adds the `claim` crate as a dev-dependency for assertions that show what they saw:

```
panicked at 'assertion failed, expected Ok(..),
  got Err("The app crashed due to an IO error")'
```

`claim::assert_ok!` and `claim::assert_err!` format the value they rejected, which is why `SubscriberName` gains `#[derive(Debug)]`. One update since the book: `claim` is unmaintained and no longer builds on current toolchains; the maintained fork `claims` is the drop-in replacement. The unit tests then read as a spec: `"a".repeat(256)` parses, `"a".repeat(257)` errors, empty and whitespace-only error, each forbidden character errors, `"Ursula Le Guin"` parses. Swap the `panic!` for `Err(...)` and they all pass.

## What a panic actually does

Mechanically, a panic unwinds: it walks back down the stack frame by frame running every `Drop` (the drop lesson's cleanup fires on this path too), then the thread dies. actix-web is built to survive that: a panicking worker is assumed poisoned, thrown away, and replaced with a fresh one, so the process lives while the in-flight request dies. That is exactly the `IncompleteMessage` the client saw. Resilience machinery is for bugs. Routing expected failure through it means every malformed form recycles a worker and drops a connection: a functional collapse dressed up as fault tolerance.

## Predict, then verify

```rust
#[test]
fn dummy_fail() {
    let result: Result<&str, &str> = Err("The app crashed due to an IO error");
    claim::assert_ok!(result);
}
```

Before running it: what will the failure message contain that `assert!(result.is_ok())` would not?

Answer: both sides of the disappointment: what was expected (`Ok(..)`) and what actually arrived, payload included (`got Err("The app crashed due to an IO error")`). The plain assert only reports that a boolean was false. In a failing CI run, that difference is a diagnosis versus a shrug.
