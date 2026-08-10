The book sets up a CI pipeline before writing a single line of application code, and states the reason plainly: you want automated checks running on every commit, on every branch, keeping `main` healthy, because a team cannot rely on one person's total understanding of the system.

A production-grade Rust CI pipeline runs five checks. Each exists for a distinct failure mode.

## The five checks

**Tests.**

```bash
cargo test
```

Builds and runs every unit test, integration test, and documentation test. Doc tests are worth pausing on: code examples inside `///` comments are compiled and executed, so your documentation cannot silently rot.

**Linting.**

```bash
cargo clippy -- -D warnings
```

Clippy knows hundreds of patterns that compile fine but are slower, harder to read, or subtly wrong. `-D warnings` promotes every warning to an error, because a warning that cannot fail the build is a warning everyone learns to ignore.

**Formatting.**

```bash
cargo fmt -- --check
```

`--check` fails if any file differs from canonical formatting, without touching it. Formatting disputes get settled by a machine once, not by reviewers forever.

**Security vulnerabilities.**

```bash
cargo audit
```

Checks your full dependency tree against the RustSec advisory database. Your code can be perfect while a dependency three levels down carries a known CVE; this is the check that tells you.

**Code coverage.** The book uses `cargo tarpaulin` (today `cargo llvm-cov` is the common choice). The number is not a quality gate to worship; the trend is what carries information. A new feature landing with zero new covered lines means the tests did not come with it.

## Why this belongs at day one

Retrofitting checks onto an existing codebase means arguing with hundreds of accumulated warnings. Turning them on when the project is empty means the count never leaves zero. The cost asymmetry is enormous, and it is the same reasoning you will meet again with database migrations and telemetry: infrastructure is cheapest before you need it.

## Predict, then verify

`cargo check` passed locally, so you push. Can `cargo clippy` still fail in CI?

Answer: yes, easily. Clippy runs its own additional analysis passes on top of a normal compile; a program can be completely valid Rust and still trip a lint, such as `.clone()` on a value you could have moved (`clippy::redundant_clone`). Passing the compiler means the program is well-formed; passing clippy means it also avoids a catalogue of known mistakes. The two tools answer different questions.
