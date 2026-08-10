Chapter 7.3 opens with a confession. The book has been test-driving every feature, and its whole integration suite has landed in one file, `tests/health_check.rs`: the health check test, three subscription tests, plus `spawn_app`, database setup, and tracing initialization. Why there? Because it was convenient, the helpers were already in that file. Every test suite starts as an empty file and decays one convenient shortcut at a time, which is why the book stops mid-project to state its principle: test code is still code. It needs modularity, structure, and maintenance, or coverage quietly sinks as writing the next test gets more annoying than skipping it.

## One test file, one crate

The integration lesson mentioned that each top-level file under `tests/` compiles as its own crate. Chapter 7.3 makes you feel the consequences. Run `cargo build --tests` and look in `target/debug/deps`: one executable per test file. This has two costs. First, sharing helpers gets awkward. The obvious move, a `tests/helpers/mod.rs` declared with `mod helpers;` in each file, works but rots: each test binary compiles its own copy of `helpers`, and any function unused by that particular binary triggers `function is never used` warnings as the suite grows. Second, compile time: executables build in parallel, but linking is sequential, and a flat directory of twenty test files means twenty link steps on every `cargo test`.

The book's answer is one test binary with submodules:

```
tests/
  api/
    main.rs        // mod helpers; mod health_check; mod subscriptions;
    helpers.rs
    health_check.rs
    subscriptions.rs
```

Only `api/main.rs` is a top-level entry, so cargo builds one crate, structured exactly like a binary crate from the modules you already know. Discoverability was the stated goal: given an endpoint, find its tests; given a test, find the helpers. You also get real encapsulation, since `helpers` can keep `configure_database` and the tracing setup private and expose only `spawn_app` and `TestApp`. Bundling into one executable cut one measured suite's time noticeably (the book cites a 1.9x speedup; benchmark your own before committing), with one new failure mode: hundreds of tests in one process can exhaust the OS file descriptor limit, `Too many open files`, fixable with `ulimit -n 10000`.

## Startup logic tests can trust

The sharper problem is what `spawn_app` had become: a near-copy of `main`, building configuration, the connection pool, the email client. Duplicated startup logic means the code that boots production is never tested, and the two paths drift apart silently, tests reassuring you about an application that no longer exists. The fix is extraction: an `Application::build(configuration)` constructor in the library that both `main` and `spawn_app` call. Tests randomize what must be isolated per test, a fresh logical database name, port 0, then hand the config to the same startup path production uses. `Application` records the OS-assigned port so tests can find the server, and `run_until_stopped` is the only piece `main` keeps to itself.

The last refactor is an API client. Every subscription test was hand-building the same `reqwest` POST. Pull it onto the shared test type:

```rust
impl TestApp {
    pub async fn post_subscriptions(&self, body: String) -> reqwest::Response {
        reqwest::Client::new()
            .post(format!("{}/subscriptions", &self.address))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(body)
            .send()
            .await
            .expect("Failed to execute request.")
    }
}
```

When the API changes, one method changes, not tens of tests. And the driving reason to care about all of this is speed: the book's 7.3.2 diagnosis is that teams stop writing tests because of friction, and nothing produces friction like a slow, tangled suite. Fast suites keep the inner loop from "The inner development loop" honest.

## Predict, then verify

A teammate adds `tests/newsletters.rs` next to the `tests/api/` directory and copies `mod helpers;` into it. What happens on `cargo test`?

Answer: cargo now builds a second test crate for `newsletters.rs`, so the suite is back to multiple executables, and `mod helpers;` fails to compile because that crate has no `helpers.rs` beside it; module paths resolve within each test crate. The correct move is a `mod newsletters;` line in `tests/api/main.rs` and a `tests/api/newsletters.rs` file, which joins the existing binary and sees `crate::helpers` like every other module.
