# Be-better-dev

A Rust course you study like a game: 45 sections, 256 lessons, spaced review, streaks, and badges.

The curriculum runs from first principles (what a move copies, what an allocation costs) through
concurrency and async, then builds a production email newsletter service following
[Zero to Production in Rust](https://www.zero2prod.com/), and finishes with fifteen ecosystem
sections from Docker to performance engineering.

Built on top of [ZeroStarter](https://zerostarter.dev).

## The curriculum

| Part                     | Sections | Lessons | Covers                                                              |
| ------------------------ | -------- | ------- | ------------------------------------------------------------------- |
| 1. The language          | 13       | 78      | ownership, borrowing, lifetimes, traits, collections, unsafe        |
| 2. Concurrency and async | 6        | 35      | threads, Send/Sync, futures from scratch, tokio, pinning, patterns  |
| 3. Zero to production    | 11       | 60      | the book chapter by chapter, then an axum port                      |
| 4. Rust in the wild      | 15       | 83      | Docker, Kubernetes, queues, gRPC, wasm, AI, observability, and more |

Every lesson closes with a predict-then-verify exercise and carries three quiz items. Answering
them wrong is the point: misses re-enter the spaced-review queue sooner than hits.

## Exercises

Reading about the borrow checker and arguing with it are different skills, so the lessons have a
hands-on half in `exercises/`: a Cargo workspace with one crate per section, stubbed functions, and
a test suite that is red on purpose. The suite is the specification.

```bash
cd exercises
cargo test -p ownership-and-moves
```

Eighteen crates cover every section of Parts 1 and 2: 242 stubs and 400 tests. `./verify.sh` proves
each set is honest, that the stubs fail and the reference solution passes.

See [exercises/README.md](exercises/README.md) for the workflow and how to add a section.

## How it works

Lessons unlock in order. Finishing one awards XP (with a bonus for a clean sweep), extends the
daily streak, fills a square on the activity heatmap, and can unlock a badge. Finishing every
lesson in a section earns that section's badge.

## Focus mode

`/focus` is the same course arranged for anyone who struggles with a long page and a long list:
ADHD, a bad week, or a train.

The start screen shows one lesson, the one that is actually next, and one button. Lessons unlock in
order, so choosing between 256 of them is a decision nobody needs to win before studying. Inside a
lesson, `/focus/<slug>` delivers it in four to nine steps of about a hundred words, one on screen at
a time, with a count that says how much is left and the quiz as the final step. A block of 5, 10,
15, or 25 minutes runs on a visible clock and ends in a short break that takes over the screen
rather than asking politely from a corner. Type is larger by default and the size is remembered.

It is a different door into the same room, not a second copy of the course: same lessons, same
quiz, same XP, same unlock order, and a link back to the full page on every screen.

## Listening

Every lesson has a read-aloud bar, and `/audiobook` plays the whole course straight through,
rolling into the next unlocked lesson on its own. Roughly fourteen hours end to end.

Speech comes from the browser's own engine (the Web Speech API), so there is no key to configure,
no per-character bill, and nothing leaves the machine. Speed and voice are yours to pick and are
remembered. Code samples and tables are announced rather than read out, because a Rust snippet
read symbol by symbol is unlistenable; those stay on screen. Listening earns no XP, since
completion means answering the quiz.

## Running it

```bash
bun install
bunx zerostarter init --db   # provisions local Postgres and applies migrations
bun run db:seed              # loads the curriculum into the content tables
bun run dev
```

`bun run dev` serves named `.localhost` URLs via portless (`bunx portless list` shows them).
`PORTLESS=0 bun run dev` uses fixed ports instead, taken from `.env` (`HONO_PORT` for the API,
`PORT` for the web app).

Sign in locally with **Login → Login (agents)**, which needs `AGENT_SIGNIN_ENABLED=true` in
`.env`; the route stays unmounted anywhere else.

## Writing course content

Sections live one module each in `packages/scripts/src/course/sections/`, with lesson bodies as
markdown in `course/content/`. `packages/scripts/src/course/AUTHORING.md` is the spec: structure,
length, quiz shape, and the writing rules. After editing, run `bun run db:seed`.

Content upserts by slug, so revising a lesson leaves progress intact. Lesson slugs are permanent
public URLs (`/learn/<slug>`); renaming one orphans the progress that points at it.

## Layout

```
api/hono/          learn router, gamification rules
web/next/          dashboard, course map, lesson player, focus mode, audiobook, review, leaderboard
packages/db/       Drizzle schema for content and progress
packages/scripts/  the curriculum and its seeder
exercises/         the Rust workspace you actually write code in
```

## Credits

The Part 3 track follows _Zero to Production in Rust_ by Luca Palmieri. The lessons are original
writing about the book's material, not a substitute for it. Buy the book.
