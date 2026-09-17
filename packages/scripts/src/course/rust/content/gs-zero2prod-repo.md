Chapter 1 of the book does two things before any application code exists: install the toolchain, and stand up a CI pipeline. You already did both in Part 1. "What rustup actually manages" and "cargo, the front door" covered the toolchain, "Crates, editions, workspaces" covered project anatomy, and "CI from day one" covered the five checks and why a warning must be able to fail the build. So this lesson re-teaches none of it. Instead you cut the repository that every remaining section of Part 3 grows, and look at why the book insists on this exact order.

## The repository

```bash
cargo new zero2prod
cd zero2prod
cargo run
```

It prints hello world, and `cargo new` has already initialised a git repository for you. The manifest is minimal:

```toml
[package]
name = "zero2prod"
version = "0.1.0"
edition = "2024"
```

One divergence from the printed page: the book shows `edition = "2021"` (2018 in early printings), while `cargo new` writes the newest edition, currently 2024. Per "Crates, editions, workspaces", an edition is a per-crate switch over surface syntax and defaults, and crates on different editions link freely, so nothing in this track depends on which one you carry. Keep what cargo generated.

## Checks on, from commit zero

Before the first endpoint, wire the checks from "CI from day one" to run on every commit of every branch:

```bash
cargo test
cargo clippy -- -D warnings
cargo fmt -- --check
cargo audit
```

plus coverage (the book uses tarpaulin; `cargo llvm-cov` is today's common pick). The book supplies ready-made pipeline definitions for GitHub Actions, CircleCI, GitLab CI, and Travis, on the argument that tweaking a working configuration beats writing one from scratch: every provider speaks its own configuration dialect, and debugging one is slow-feedback misery. What changed since publication: Travis has faded from open-source use, and GitHub Actions is the default choice now. Start from the book's Actions workflow.

## Why this order

Pipeline-before-code is not ritual. Three reasons, and the track keeps meeting all of them.

First, the retrofit asymmetry from "CI from day one". On an empty project every check passes trivially, and the warning count starts at zero and never gets a chance to climb. Turning on `-D warnings` at month six means arguing with the accumulated pile instead.

Second, the team framing from the cloud-native lesson. You will routinely modify code you neither wrote nor reviewed, so the health of `main` cannot live in anyone's head. Checks on every branch are the substitute for total understanding.

Third, the iteration contract from the user-stories lesson. Every iteration ends with a deploy to production. That promise only survives if the trunk is releasable at all times, and the pipeline is the gate that keeps it so.

There is a quieter benefit: attribution. With checks on from commit zero, any transition from green to red is pinned to one small diff. A pipeline added late starts life red, and a red pipeline points at everything, which is to say nowhere.

## What will strain it

The scaffold will not stay trivial. In the next section the project splits into a library crate plus a thin `main.rs`, because integration tests link against a library ("Crates, editions, workspaces" explained the mechanics), and those tests will soon expect a running Postgres, which the CI definition has to provide. The workflow file you copy today is a living document; watching it grow is part of the curriculum.

## Predict, then verify

Months from now, CI turns red one morning although nobody has pushed since yesterday's green run. Which of the five checks is the likely culprit, and how can it fail without a diff?

Answer: `cargo audit`. It compares your resolved dependency tree, pinned in Cargo.lock, against the RustSec advisory database, and that database moves without you: an advisory published overnight against a dependency you locked months ago fails today's run on yesterday's code. The other four checks are functions of your repository and toolchain alone. audit is also a function of the date, which is precisely its value: it is the check that watches the world.
