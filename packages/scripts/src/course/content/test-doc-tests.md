Every programmer has met the README whose example no longer compiles. The code moved on, the prose did not, and now the documentation actively misleads. "CI from day one" already let the secret slip: in Rust, code examples inside `///` comments are compiled and executed by `cargo test`. Documentation that lies fails the build.

````rust
/// Check if a number is even.
///
/// ```
/// use zero2prod::is_even;
///
/// assert!(is_even(2));
/// assert!(!is_even(1));
/// ```
pub fn is_even(x: u64) -> bool {
    x % 2 == 0
}
````

Run `cargo test` and a third harness appears after your unit and integration tests:

```
   Doc-tests zero2prod

running 1 test
test src/lib.rs - is_even (line 3) ... ok
```

Each example is extracted by rustdoc, wrapped in a `fn main` if you did not write one, and compiled as its own tiny crate that links against your library. That last part matters: like the `tests/` directory from the integration lesson, a doc test has exactly the access an external user has. It must `use zero2prod::is_even` and can touch only your public API. Writing one forces you to experience your own interface from the outside, which is why doc examples so often expose awkward APIs before any user does.

## Controlling what runs

Real examples need seams, and rustdoc provides them:

- Lines starting with `# ` are compiled and executed but hidden from the rendered docs. Your published example shows three clean lines while the test behind it does full setup.
- ` ```no_run ` compiles the example without executing it: right for snippets that start servers or hit the network, where compiling is the guarantee you want.
- ` ```should_panic ` expects the example to panic, and ` ```ignore ` skips it entirely (a last resort: ignored examples rot like READMEs).
- ` ```text ` marks a block as not code at all, so error-message listings do not get executed.

So a doc example for `run()`, which listens forever, is still testable:

````rust
/// Start the newsletter delivery server.
///
/// ```no_run
/// # use zero2prod::run;
/// let server = run("127.0.0.1:0").expect("failed to bind");
/// ```
pub fn run(address: &str) -> Result<Server, std::io::Error> {
    // ...
}
````

## The production angle

Doc tests are the reason `docs.rs` pages for good crates feel trustworthy: every example you read there passed the author's CI. They also explain a subtle payoff of the lib/bin split from the integration lesson: `cargo test` runs doc tests for library targets only. A project that is all `main.rs` has documentation nobody executes; move the logic into a library and every example becomes a test.

One cost is honest to name: each example historically compiled as a separate crate, and hundreds of them made `cargo test` noticeably slower, one small compile and link at a time. The 2024 edition changes this: rustdoc now merges doc tests into a single binary where possible, cutting the overhead dramatically. The mental model stays the same, one example, one isolated compilation unit; the mechanics got cheaper.

## Predict, then verify

You rename `is_even` to `is_divisible_by_two`, update every caller in `src/` and `tests/`, and forget the `///` example. `cargo check` is clean. What does `cargo test` do, and what does CI do with it?

Answer: the doc test fails to compile, because `use zero2prod::is_even` no longer resolves, and a doc test that fails to compile is a failed test. `cargo check` never saw it: doc examples are extracted and built only by the doc-test harness. Since "CI from day one" runs `cargo test` on every push, the stale example fails the pipeline before it reaches a reader. That is the design: documentation drift is converted from a silent decay into a red build.
