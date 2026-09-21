import {
  RiEyeLine,
  RiFocus3Line,
  RiMapPinLine,
  type RemixiconComponentType,
} from "@remixicon/react"

import { Aurora } from "@/components/marketing/aurora"
import { Eyebrow } from "@/components/marketing/eyebrow"
import { Section } from "@/components/marketing/section"
import { cn } from "@/lib/utils"

// Written as three problems, not three conditions. Nobody arrives thinking "I am
// the dyslexia persona"; they arrive having bounced off a wall of text at
// eleven at night. Each card names the wall, then names the surface that is
// there for it, so the claim is checkable rather than a promise.
const audiences: {
  accent: string
  answer: string
  body: string
  icon: RemixiconComponentType
  title: string
}[] = [
  {
    accent: "text-brand bg-brand/10",
    answer: "Focus mode, and a lesson that ends",
    body: "You open the lesson, read two paragraphs, and the rest of the page is already in your peripheral vision telling you how much is left. Focus mode cuts the lesson into steps and shows you one, with a count and a clock, so there is a finish line close enough to aim at.",
    icon: RiFocus3Line,
    title: "If your attention slides off the page",
  },
  {
    accent: "text-audio bg-audio/10",
    answer: "The audiobook, on any lesson",
    body: "Reading is the expensive part, not the thinking. Every lesson can be read aloud by your own device, rolling into the next unlocked one on its own. Code blocks and tables are announced rather than spelled out, because a Rust snippet read character by character is unlistenable.",
    icon: RiEyeLine,
    title: "If reading is the part that costs you",
  },
  {
    accent: "text-spark bg-spark/10",
    answer: "Review, notes, and the course map",
    body: "Two weeks off and the thread is gone. Spaced review brings back quiz items from lessons you already passed, your notes stay pinned to the sentence that earned them, and the map always shows the one lesson that is next.",
    icon: RiMapPinLine,
    title: "If you keep losing the thread",
  },
]

export function Audience() {
  return (
    <Section
      background={<Aurora className="opacity-50" />}
      className="overflow-hidden"
      id="who-its-for"
      labelledBy="who-its-for-heading"
    >
      <div className="max-w-2xl">
        <Eyebrow>Why this exists</Eyebrow>
        <h2
          className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl"
          id="who-its-for-heading"
        >
          Most courses assume you can sit down and read. This one does not.
        </h2>
        <p className="text-muted-foreground mt-4 text-lg text-pretty">
          The material is not the hard part. Getting through a wall of it, on a Tuesday, after work,
          is. Everything here is built around that.
        </p>
      </div>

      <ul className="mt-12 grid gap-4 lg:grid-cols-3">
        {audiences.map((audience) => (
          <li
            className="border-border/70 bg-card/60 flex flex-col rounded-2xl border p-6 backdrop-blur-sm"
            key={audience.title}
          >
            <span
              className={cn("flex size-10 items-center justify-center rounded-xl", audience.accent)}
            >
              <audience.icon aria-hidden="true" className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold text-pretty">{audience.title}</h3>
            <p className="text-muted-foreground mt-2 flex-1 text-sm text-pretty">{audience.body}</p>
            <p className="border-border/70 mt-4 border-t pt-4 text-sm font-medium">
              {audience.answer}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
