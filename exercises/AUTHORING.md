# Writing an exercise crate

Read this fully before writing one. `ownership-and-moves/` and `borrowing-and-lifetimes/` are the
reference implementations; open them alongside this file.

## Files

```
exercises/<section-slug>/
  Cargo.toml          package name = section slug
  src/lib.rs          stubs the learner fills in
  solutions/lib.rs    reference answer, never part of a normal build
  tests/<lesson>.rs   one file per lesson, named for the lesson slug
```

`Cargo.toml` is exactly this, plus any dependency the section genuinely needs:

```toml
[package]
name = "<section-slug>"
version = "0.1.0"
edition.workspace = true
publish.workspace = true
```

## The rules that make a crate correct

1. **Stubs must fail.** Every stub is `todo!("hint")`, or a type/struct left deliberately
   incomplete. If the shipped stubs pass a test, that test asserts nothing and the crate is wrong.
2. **The solution must pass.** `solutions/lib.rs` is a drop-in replacement for `src/lib.rs`: same
   public items, same signatures, working bodies. It is never referenced by `src/` or `tests/`.
3. **`tests/` imports only the public API**, via `use <crate_name_with_underscores>::*;`.
4. **One test file per lesson**, named for the lesson slug with hyphens turned into underscores.
   This matters: a type-level exercise makes its own file fail to compile, and per-lesson files let
   the learner work every other exercise with `--test <lesson>` meanwhile.
5. **Verify before you finish.** `./verify.sh <section-slug>` must print `ok`. It is the only
   signal that counts. Run it, read failures, fix them.

## Writing exercises worth doing

- 4 to 8 exercises per crate, tracking the section's lessons. Not every lesson needs one; a lesson
  about tooling or judgment may have nothing to assert.
- Each stub carries a doc comment: which lesson it belongs to, what to build, and a nudge toward
  the idea rather than the syntax. Never paste the answer into the hint.
- Prefer exercises where the **type system or the compiler** is the teacher: a missing derive, a
  borrow that must be restructured, a signature that must be narrowed. Those are the ones a quiz
  cannot test.
- Where a lesson's point is a program the compiler _rejects_, ship it commented out under
  `// COMPILE ERROR:` with the real error text quoted above it, and have the learner write the
  version that compiles.
- Tests should read like the lesson's claims, with assertion messages that teach:
  `assert_eq!(v.capacity(), 1000, "growing by doubling would leave slack here")`.
- Solutions carry comments explaining the judgment calls, not a narration of the code.

## Style

Same rules as the lessons (see `packages/scripts/src/course/AUTHORING.md`): plain documentation
voice, **no em-dashes**, no filler. Code must compile as shown unless it is explicitly a
`COMPILE ERROR:` sample.

## Dependencies

Most crates need none. Add one only when the section is about it (`tokio` for the async sections).
Pin it in the crate's own `[dependencies]`; there is no shared catalog here.
