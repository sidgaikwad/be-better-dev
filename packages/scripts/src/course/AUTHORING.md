# Course authoring guide

How course content is written and wired. Read this fully before writing a section.

## Layout

- `types.ts` defines the seed shapes (`SectionSeed`, `UnitSeed`, `LessonSeed`, `QuizSeed`).
- `content/<lesson-slug>.md` holds each lesson's markdown body.
- `sections/<section-slug>.ts` exports one `SectionSeed` for sections authored as modules.
- `part-*.ts` assembles sections into parts; `index.ts` assembles parts into the course.
- `bun run db:seed` (repo root) upserts everything and deletes rows that left the seed. It throws on duplicate lesson slugs and out-of-range quiz answers. Content tables only; progress is never touched.

Lesson slugs are permanent public URLs (`/learn/<slug>`) and progress rows point at them. Never rename a shipped slug.

## Section module shape

```ts
import type { SectionSeed } from "../types"

export const traitsAndGenerics: SectionSeed = {
  slug: "traits-and-generics", // must match the slug already on the map
  title: "Traits and generics",
  description: "One sentence, plain.",
  badgeIcon: "🎭",
  badgeTitle: "Traits",
  units: [
    {
      slug: "defining-behavior", // unique within the section
      title: "Defining behavior",
      description: "One line.",
      lessons: [
        {
          slug: "traits-what-they-are", // globally unique; use the section's prefix
          title: "Traits: capability as a contract",
          summary: "One line shown on the map and lesson header.",
          contentFile: "traits-what-they-are.md", // same name as slug + .md
          quiz: [
            {
              kind: "mcq", // or "predict"
              prompt: "Plain question; inline `code` allowed.",
              options: ["A", "B", "C", "D"], // 3-4 options; inline `code` allowed
              answer: 1, // index into options, zero-based
              explanation: "1-2 sentences: why the right answer is right; inline `code` allowed.",
            },
          ],
        },
      ],
    },
  ],
}
```

## Section size and structure

- 2-3 units, 4-6 lessons total (Part 4 ecosystem sections lean toward 5-6).
- Each lesson: 450-750 words of markdown, one meaningful idea, this arc:
  1. a concrete hook (a problem, a signature, a failing program)
  2. the core explanation with short runnable code blocks (` ```rust `, ` ```bash `, ` ```toml `)
  3. one level deeper: what happens in memory, in the OS, or in production
  4. a closing `## Predict, then verify` exercise: pose a question, then give the answer in a paragraph starting with `Answer:`
- Each lesson: exactly 3 quiz items, at least one `kind: "predict"`. Quiz items test the lesson's actual claims, not trivia. Explanations teach, never just restate the letter.
- Cross-reference earlier lessons by name where it helps ("from the allocation lesson...").
- Where natural, ground examples in the course's running project, the email newsletter service from Zero to Production (subscribers, confirmation emails, delivery workers).

## Writing style

- Documentation voice: plain, precise, human. The Rust std docs and the book are the bar.
- NEVER use em-dashes (U+2014). Use commas, colons, periods, or regular hyphens.
- No AI-flavored filler: no "delve", "seamless", "supercharge", "unlock the power", "master the art", "comprehensive", "in today's fast-paced world". No exclamation points doing enthusiasm's job.
- Concrete before abstract. Show the failing program before naming the rule.
- Code must be correct, current Rust that compiles as shown (or is explicitly marked as rejected, with the real compiler error text where it teaches).
- An inline compiler error usually contains backticks of its own. Wrap it in a doubled span so they stay literal, with a space inside each pair: `` `?` couldn't convert the error to `SubscribeError` ``. Writing it with single backticks silently breaks the span, which renders stray backticks and leaks them into the read-aloud audio. A multi-line error goes in a ` ```text ` block instead.
- Assume the reader programs (TypeScript background) but is new to systems concepts: explain memory, OS, and concurrency patiently; never explain what a function or loop is.
- Facts about crates and tools must be current; when an API moved since the book (actix-web idioms, retired tools), teach the book's version and note what changed.

## Hard rules for section authors

- Write ONLY your section's files: `sections/<section-slug>.ts` plus its `content/*.md` files.
- Do not edit `part-*.ts`, `index.ts`, `types.ts`, other sections, or anything outside `packages/scripts/src/course/`.
- Do not run db commands, dev servers, or git.
- Prefix every lesson slug with your section's assigned prefix so slugs stay globally unique.
- `xp` may be omitted (defaults to 20); use 25 only for unusually heavy lessons.

## Exercises

Sections with hands-on work carry a crate in `exercises/<section-slug>/`, named for the section
slug. Lessons and exercises are separate: nothing in the seed points at a crate, and a section is
free to have lessons without exercises.

- Stub each function with `todo!("hint")` and a doc comment naming the lesson it belongs to.
- Write the tests first. They are the specification, and they should assert the lesson's claims.
- Exercises that teach a rejected program ship it commented out under `// COMPILE ERROR:`, with the
  real compiler error quoted above it.
- Every crate needs `solutions/lib.rs`, a working reference with comments explaining the judgment
  calls, not just the code.
- `exercises/verify.sh <slug>` must print `ok`: it proves the stubs fail the suite and the solution
  passes it. Add the slug to `members` in `exercises/Cargo.toml`.
