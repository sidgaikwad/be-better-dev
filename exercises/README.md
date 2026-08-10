# Exercises

The hands-on half of the course. Lessons teach; these make you write Rust and answer to the
compiler.

One crate per course section, named for its section slug. Each crate ships stubbed functions and a
test suite that is **red on purpose**. The suite is the specification: when it passes, you are done.

## Working an exercise

```bash
cd exercises
cargo test -p ownership-and-moves                     # the whole section
cargo test -p ownership-and-moves --test drop_cleanup # one lesson at a time
```

Tests are split one file per lesson, named for the lesson slug, and that split earns its keep:
some exercises are type-level, so until you solve them their test file does not _compile_. A
sibling that fails to compile does not stop you targeting the others with `--test`, so you are
never blocked on one exercise to work the rest.

Open `src/lib.rs`, find the `todo!()`, and make the tests pass. Each stub carries a doc comment
naming the lesson it belongs to, so you can go back and reread.

Some exercises do not want code at all. They ship code that does **not compile**, commented out
with the real compiler error above it, and ask you to explain or fix it. Those are marked
`// COMPILE ERROR:` and are the closest thing here to the predict-then-verify drills in the lessons.

Keep this open while you work:

```bash
cargo watch -x test    # or: bacon test
```

## Checking your work

The reference solution for every exercise lives in `<crate>/solutions/lib.rs`. Read it _after_ you
have something passing, not before: comparing a working answer against a better one teaches more
than copying.

`./verify.sh` proves the exercise set is honest. For each crate it asserts the stubs fail (a green
stub means a test asserts nothing) and the reference solution passes (a red solution means the
suite is wrong). Run it after editing any exercise:

```bash
./verify.sh                       # every crate
./verify.sh ownership-and-moves   # just one
```

## The crates

Eighteen crates, 242 stubs, 400 tests. One per course section in Parts 1 and 2.

| Part | Crate                     | Covers                                                          |
| ---- | ------------------------- | --------------------------------------------------------------- |
| 1    | `ownership-and-moves`     | moves, Copy, Drop order, receivers, clone judgment              |
| 1    | `borrowing-and-lifetimes` | shared vs exclusive, NLL, E0106, annotations, slices            |
| 1    | `structs-enums-matching`  | receivers, sum types, Option, Result, exhaustiveness            |
| 1    | `traits-and-generics`     | default methods, bounds, trait objects, From, newtypes          |
| 1    | `collections-layouts`     | Vec ordering, UTF-8, entry API, borrowed lookups, BTreeMap      |
| 1    | `smart-pointers`          | Box, Deref, Rc counts, Weak cycles, Arc, RefCell                |
| 1    | `iterators-closures`      | Fn traits, a hand-written Iterator, adapters, collect to Result |
| 1    | `error-handling`          | error enums, source chains, From at boundaries, status mapping  |
| 1    | `modules-api-design`      | module tree, facades, visibility, newtypes, builders            |
| 1    | `testing`                 | unit and doc tests, should_panic, fixtures, fakes, properties   |
| 1    | `macros`                  | macro_rules, repetition, hygiene, when not to write one         |
| 1    | `unsafe-and-ffi`          | raw pointers, sound wrappers, safety invariants, extern "C"     |
| 2    | `threads-send-sync`       | spawn/join, Arc<Mutex>, channels, scoped threads, atomics       |
| 2    | `async-from-scratch`      | Future by hand, poll counts, Waker, a block_on executor         |
| 2    | `tokio`                   | tasks, Send bounds, spawn_blocking, channels, timeouts          |
| 2    | `pinning`                 | self-referential moves, Box::pin, Unpin, polling through Pin    |
| 2    | `streams-cancellation`    | Stream, select, timeout, drop-cancellation, cancel safety       |
| 2    | `concurrency-patterns`    | worker pools, backpressure, actors, graceful shutdown           |

Parts 3 and 4 have no crates here. Their work is building the newsletter service, writing
Dockerfiles, and deploying, which a unit-test crate is the wrong container for. The
`toolchain-and-cargo` section has none either: it teaches running commands and reading build
output, so there is nothing to assert.

## Adding a section

1. `mkdir exercises/<section-slug>` with `Cargo.toml`, `src/lib.rs`, `solutions/lib.rs`, `tests/`.
2. Add the slug to `members` in `exercises/Cargo.toml`.
3. Stub every function with `todo!()` and a doc comment naming its lesson.
4. Write the tests first: they define done, and they should read like the lesson's claims.
5. `./verify.sh <section-slug>` must print `ok`.
