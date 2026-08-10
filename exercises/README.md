# Exercises

The hands-on half of the course. Lessons teach; these make you write Rust and answer to the
compiler.

One crate per course section, named for its section slug. Each crate ships stubbed functions and a
test suite that is **red on purpose**. The suite is the specification: when it passes, you are done.

## Working an exercise

```bash
cd exercises
cargo test -p ownership-and-moves          # see what is red
cargo test -p ownership-and-moves one_owner   # one exercise at a time
```

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

## Adding a section

1. `mkdir exercises/<section-slug>` with `Cargo.toml`, `src/lib.rs`, `solutions/lib.rs`, `tests/`.
2. Add the slug to `members` in `exercises/Cargo.toml`.
3. Stub every function with `todo!()` and a doc comment naming its lesson.
4. Write the tests first: they define done, and they should read like the lesson's claims.
5. `./verify.sh <section-slug>` must print `ok`.
