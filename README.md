# Be-better-dev

Courses you study like a game: spaced review, streaks, XP and badges. Two are on the shelf, 390
lessons between them, and the switcher on the course map moves between them. Progress is per
lesson, so neither one blocks the other.

Built on top of [ZeroStarter](https://zerostarter.dev).

## Rust: Zero to Production

45 sections, 256 lessons. From first principles (what a move copies, what an allocation costs)
through concurrency and async, then a production email newsletter service following
[Zero to Production in Rust](https://www.zero2prod.com/), and fifteen ecosystem sections from
Docker to performance engineering.

| Part                     | Sections | Lessons | Covers                                                              |
| ------------------------ | -------- | ------- | ------------------------------------------------------------------- |
| 1. The language          | 13       | 78      | ownership, borrowing, lifetimes, traits, collections, unsafe        |
| 2. Concurrency and async | 6        | 35      | threads, Send/Sync, futures from scratch, tokio, pinning, patterns  |
| 3. Zero to production    | 11       | 60      | the book chapter by chapter, then an axum port                      |
| 4. Rust in the wild      | 15       | 83      | Docker, Kubernetes, queues, gRPC, wasm, AI, observability, and more |

## System Design: Interview to Production

30 sections, 134 lessons, following Alex Xu's _System Design Interview_ volumes 1 and 2. From how a
system grows past one server, through the building blocks almost every design reuses, to thirty
systems designed end to end.

| Part                         | Sections | Lessons | Covers                                                                               |
| ---------------------------- | -------- | ------- | ------------------------------------------------------------------------------------ |
| 1. Foundations               | 5        | 26      | scaling out, caching and CDNs, sharding, estimation, the interview framework         |
| 2. Building blocks           | 4        | 19      | rate limiter, consistent hashing, key-value store, unique ID generator               |
| 3. Systems on the whiteboard | 8        | 34      | URL shortener, crawler, notifications, news feed, chat, autocomplete, YouTube, Drive |
| 4. Scale in the wild         | 13       | 55      | geospatial, message queues, metrics, stream aggregation, storage, payments, exchange |

Every lesson works its arithmetic on the page, names a tradeoff and takes a side, and closes with a
design drill rather than a coding exercise.

Every lesson closes with a predict-then-verify exercise and carries three quiz items. Answering
them wrong is the point: misses re-enter the spaced-review queue sooner than hits.

## Rust exercises

Reading about the borrow checker and arguing with it are different skills, so the Rust lessons have
a hands-on half in `exercises/`: a Cargo workspace with one crate per section, stubbed functions,
and a test suite that is red on purpose. The suite is the specification. The system design course
has no crate; its hands-on half is the design drill that closes each lesson.

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
