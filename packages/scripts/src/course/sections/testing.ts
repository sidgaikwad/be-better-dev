import type { SectionSeed } from "../types"

// Part 1, section: Testing. Draws on Zero to Production chapter 3 (first
// integration test, lib/bin split), 6.13 (property-based testing), and 7.3
// (test-suite architecture).

export const testingSection: SectionSeed = {
  slug: "testing",
  title: "Testing",
  description: "Unit, integration, doc tests, and property-based testing.",
  badgeIcon: "🧪",
  badgeTitle: "Testing",
  units: [
    {
      slug: "where-tests-live",
      title: "Where tests live",
      description: "cargo test's three harnesses: embedded modules, tests/, and doc examples.",
      lessons: [
        {
          slug: "test-unit-tests",
          title: "Unit tests: the module next door",
          summary: "#[cfg(test)], assert macros that diagnose, should_panic, and private access.",
          contentFile: "test-unit-tests.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does `#[cfg(test)]` on the embedded tests module actually do?",
              options: [
                "Tells cargo test where to find the tests",
                "Compiles the module only in test builds, so release binaries carry no test code",
                "Runs the module's tests in isolation from other modules",
                "Grants the module access to private items",
              ],
              answer: 1,
              explanation:
                "cfg is conditional compilation. Test discovery is #[test]'s job, and private access comes from being a child module, not from the attribute.",
            },
            {
              kind: "predict",
              prompt:
                "A test inside `mod tests` calls a private function of the enclosing module via `use super::*`. Does it compile?",
              options: [
                "No, tests always compile as a separate crate",
                "Yes, a child module can see its ancestors' private items",
                "Only if the function is marked pub(crate)",
                "Only if the module drops #[cfg(test)]",
              ],
              answer: 1,
              explanation:
                "Privacy follows the module tree, and the embedded tests module is a child of the module it tests. That is the whole mechanism behind unit-testing private code, and why tests/ files, which are separate crates, cannot do the same.",
            },
            {
              kind: "mcq",
              prompt:
                "`assert!(parse(s).is_ok())` fails. What does the default failure output tell you about the `Err` value inside?",
              options: [
                "Nothing, it prints only the stringified expression",
                "It pretty-prints the Err value",
                "It prints left and right values",
                "It prints a backtrace that includes the value",
              ],
              answer: 0,
              explanation:
                "assert! shows just the expression text. assert_eq! prints both sides, and claims::assert_ok! prints the unexpected Err. Pick the macro whose failure message you will want to read.",
            },
          ],
        },
        {
          slug: "test-integration-tests",
          title: "Integration tests and the lib/bin split",
          summary: "Black-box tests in tests/, and why main.rs must shrink.",
          contentFile: "test-integration-tests.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which items can a file in `tests/` reach?",
              options: [
                "Everything, including private functions",
                "The library crate's pub items, the same as an external dependency",
                "pub and pub(crate) items",
                "Anything defined in main.rs",
              ],
              answer: 1,
              explanation:
                "Each tests/ file compiles as its own crate linked against your library, so ordinary crate privacy applies. Even pub(crate) is out of reach, because the test crate is not your crate.",
            },
            {
              kind: "predict",
              prompt:
                "The package has only src/main.rs. tests/health_check.rs starts with `use zero2prod::run;`. What happens?",
              options: [
                "It compiles; cargo links the binary automatically",
                "E0432 unresolved import: a binary target cannot be imported as a crate",
                "It compiles but panics at runtime",
                "It works as long as run is pub",
              ],
              answer: 1,
              explanation:
                "Only library crates can be linked as dependencies. This failure is what motivates the lib/bin split: logic moves to src/lib.rs and main.rs shrinks to a thin entrypoint.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does the book reject testing endpoints by calling handler functions directly?",
              options: [
                "Handler calls are slower than HTTP requests",
                "A handler-level test cannot detect a broken route path or method, which are part of the API contract",
                "Handlers are private by default",
                "cargo test cannot run async handlers",
              ],
              answer: 1,
              explanation:
                "The contract is what users depend on: path, method, status, body. Black-box tests exercise the system the same way a user does, so contract regressions cannot slip past.",
            },
          ],
        },
        {
          slug: "test-doc-tests",
          title: "Doc tests: examples that cannot rot",
          summary: "Code in /// comments compiles and runs under cargo test.",
          contentFile: "test-doc-tests.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why can a doc example not call one of your crate's private functions?",
              options: [
                "rustdoc strips private items from documentation",
                "Each doc example compiles as a separate crate against your public API, like an external user",
                "Doc tests run in a sandbox with no access to your crate",
                "It can, as long as the example uses super::",
              ],
              answer: 1,
              explanation:
                "Doc tests get exactly the access a dependency gets. That constraint is the feature: every example is written from the user's point of view.",
            },
            {
              kind: "predict",
              prompt:
                "You rename a pub function and update every caller, but forget its `///` example. cargo check passes. What does cargo test do?",
              options: [
                "Passes; examples are not compiled",
                "The doc test fails to compile, which fails the suite and CI",
                "Emits a warning but stays green",
                "Fails only when the docs are published",
              ],
              answer: 1,
              explanation:
                "Doc examples are extracted and compiled by the doc-test harness, which cargo check never invokes. A stale example is a red build, not a silent lie: that is the rot-proofing.",
            },
            {
              kind: "mcq",
              prompt: "What does the ` ```no_run ` attribute on a doc example do?",
              options: [
                "Skips the example entirely",
                "Compiles the example but does not execute it",
                "Runs the example but hides its output",
                "Marks the block as plain text",
              ],
              answer: 1,
              explanation:
                "no_run keeps the compile-time guarantee for examples that would block or need a live server, like starting the newsletter's HTTP server. ignore skips compilation too, which lets the example rot.",
            },
          ],
        },
      ],
    },
    {
      slug: "generated-inputs",
      title: "Generated inputs",
      description: "Properties over hand-picked examples: fake, quickcheck, and shrinking.",
      lessons: [
        {
          slug: "test-property-based",
          title: "Property-based testing",
          summary: "Generated inputs, shrinking, and the fake + quickcheck email fixture.",
          contentFile: "test-property-based.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "A property-based test passes 100 generated inputs. What has it established?",
              options: [
                "The parser is proven correct",
                "Higher confidence across a wide sampled input range, but not correctness",
                "The property holds for every possible input",
                "The generator only produces valid data",
              ],
              answer: 1,
              explanation:
                "Property testing samples; it does not exhaustively explore the input space. The book is explicit that it increases confidence without constituting a proof.",
            },
            {
              kind: "predict",
              prompt:
                "quickcheck finds a failing `Vec<u32>` with 40 elements. What does it report?",
              options: [
                "The original 40-element vector",
                "The smallest failing input it can shrink to",
                "All 100 generated inputs",
                "Only the random seed",
              ],
              answer: 1,
              explanation:
                "On failure quickcheck repeatedly simplifies the input until the property stops failing, then reports the minimal counterexample, turning a noisy repro into a debuggable one.",
            },
            {
              kind: "mcq",
              prompt:
                "Why wrap the generated email in a `ValidEmailFixture` newtype instead of taking `String`?",
              options: [
                "String cannot be passed to test functions",
                "The fixture's Arbitrary impl encodes the 'valid email' precondition, and the orphan rule forbids re-implementing the foreign trait for String",
                "Newtypes make tests run faster",
                "quickcheck requires every argument to derive Serialize",
              ],
              answer: 1,
              explanation:
                "Arbitrary for String produces arbitrary garbage, which the validator rightly rejects. A newtype with its own Arbitrary states the precondition in the type itself.",
            },
          ],
        },
      ],
    },
    {
      slug: "suites-at-scale",
      title: "Suites at scale",
      description: "Structure, shared startup, and speed once the suite is real.",
      lessons: [
        {
          slug: "test-suite-architecture",
          title: "A test suite that scales",
          summary: "One test crate, shared helpers, and startup logic tests can trust.",
          contentFile: "test-suite-architecture.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "tests/ contains health_check.rs and subscriptions.rs. After `cargo build --tests`, how many integration-test executables are in target/debug/deps?",
              options: [
                "One combined test binary",
                "Two, one per top-level test file",
                "None until cargo test runs",
                "One per #[test] function",
              ],
              answer: 1,
              explanation:
                "Every top-level file under tests/ is its own crate and links into its own executable. That is why the book consolidates into a single tests/api/main.rs tree: one binary, one link step.",
            },
            {
              kind: "mcq",
              prompt:
                "Why did the tests/helpers/mod.rs approach produce `function is never used` warnings?",
              options: [
                "The helpers were actually dead code",
                "Each test crate compiles its own copy of helpers and warns about any helper that binary does not call",
                "mod.rs files are deprecated",
                "The helpers lacked #[cfg(test)]",
              ],
              answer: 1,
              explanation:
                "helpers is bundled as a submodule of every test executable, not compiled once and shared. As the suite grows, no single test file uses every helper, so the warnings accumulate.",
            },
            {
              kind: "mcq",
              prompt:
                "What is the argument for extracting `Application::build` and calling it from both main and spawn_app?",
              options: [
                "It makes the test suite compile faster",
                "Otherwise the startup logic that boots production is never tested, and the two paths drift apart silently",
                "tokio requires a single entrypoint",
                "It lets tests skip configuration entirely",
              ],
              answer: 1,
              explanation:
                "When spawn_app re-implements startup, tests exercise a parallel universe that can diverge from production. Sharing the construction path makes the tests' reassurance apply to the code that ships.",
            },
          ],
        },
        {
          slug: "test-async-wiremock",
          title: "Async tests and mocking HTTP",
          summary: "#[tokio::test] and wiremock, previewing Part 3's harness.",
          contentFile: "test-async-wiremock.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does `#[tokio::test]` do?",
              options: [
                "Marks a test to be skipped unless tokio is installed",
                "Starts a fresh tokio runtime per test and lets the body be async, standing in for both tokio::main and #[test]",
                "Runs the test on the production runtime",
                "Automatically retries flaky async tests",
              ],
              answer: 1,
              explanation:
                "It is the testing equivalent of tokio::main. Each test gets its own runtime, and runtime shutdown drops spawned tasks, which is why background servers do not leak between tests.",
            },
            {
              kind: "predict",
              prompt:
                "A wiremock Mock has `.expect(1)`, but the buggy code never sends the request. No assert in the test body fails. Outcome?",
              options: [
                "The test passes; nothing asserted",
                "The test fails when mock_server is dropped, which verifies expectations and panics",
                "The test hangs waiting for a request",
                "cargo test reports it as ignored",
              ],
              answer: 1,
              explanation:
                "Verification lives in MockServer's Drop implementation. Deterministic destruction, from the ownership unit, means the check runs exactly when the server leaves scope, so a missing request cannot slip through.",
            },
            {
              kind: "mcq",
              prompt:
                "What does testing against a wiremock server exercise that an in-process stub of EmailClient would not?",
              options: [
                "The real Postmark authentication tokens",
                "The full HTTP round-trip over loopback: reqwest config, URL joining, headers, serialization, status parsing",
                "The production database",
                "Nothing; the two are equivalent",
              ],
              answer: 1,
              explanation:
                "wiremock only simulates the remote party; the request genuinely crosses the TCP stack. An in-process stub bypasses the client code where bugs like a broken base_url join actually live.",
            },
          ],
        },
      ],
    },
  ],
}
