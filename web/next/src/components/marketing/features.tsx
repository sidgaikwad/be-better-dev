import {
  RiBookOpenLine,
  RiDashboardLine,
  RiFocus3Line,
  RiHeadphoneLine,
  RiRefreshLine,
  RiStickyNoteLine,
  RiTrophyLine,
  type RemixiconComponentType,
} from "@remixicon/react"

import { Eyebrow } from "@/components/marketing/eyebrow"
import { Section } from "@/components/marketing/section"
import { cn } from "@/lib/utils"

// The accent is written out per surface rather than built from a token name,
// because Tailwind only ships classes it can see in the source: a `bg-${hue}/10`
// template would compile to nothing. Listen surfaces take --audio, streak and
// standing surfaces take --spark, everything else is the product's own --brand.
const surfaces: {
  accent: string
  body: string
  icon: RemixiconComponentType
  title: string
}[] = [
  {
    accent: "text-brand bg-brand/10",
    body: "One lesson, cut into steps, with a clock on each. A visible count, one thing on screen, and a finish line close enough to aim at.",
    icon: RiFocus3Line,
    title: "Focus mode",
  },
  {
    accent: "text-brand bg-brand/10",
    body: "The whole course as a map. Lessons unlock in order so the next move is never a decision, and the sidebar switches between shelves.",
    icon: RiBookOpenLine,
    title: "Learn mode",
  },
  {
    accent: "text-audio bg-audio/10",
    body: "Every lesson read aloud by your own device, rolling into the next unlocked one on its own. Code blocks are announced, not spelled out.",
    icon: RiHeadphoneLine,
    title: "Audiobook",
  },
  {
    accent: "text-brand bg-brand/10",
    body: "Spaced recall of quiz items from lessons you have already passed, so the thing you understood in March is still there in June.",
    icon: RiRefreshLine,
    title: "Review",
  },
  {
    accent: "text-brand bg-brand/10",
    body: "Sticky notes that stay pinned to the exact sentence that earned them, in the lesson and again on one page with everything you have written.",
    icon: RiStickyNoteLine,
    title: "Notes, in session and global",
  },
  {
    accent: "text-spark bg-spark/10",
    body: "Weekly XP standings, for the days when the reason to open it has to come from somewhere other than you.",
    icon: RiTrophyLine,
    title: "Leaderboard",
  },
]

export function Features() {
  return (
    <Section id="what-you-get" labelledBy="what-you-get-heading">
      <div className="max-w-2xl">
        <Eyebrow>Six ways in</Eyebrow>
        <h2
          className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl"
          id="what-you-get-heading"
        >
          The same course, in whichever shape you can hold today.
        </h2>
        <p className="text-muted-foreground mt-4 text-lg text-pretty">
          Not six products. One curriculum with six doors into it, and you can change door in the
          middle of a lesson without losing your place.
        </p>
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {surfaces.map((surface) => (
          <li
            className="border-border/70 bg-card/60 hover:border-border hover:bg-card rounded-2xl border p-6 backdrop-blur-sm transition-colors"
            key={surface.title}
          >
            <span
              className={cn("flex size-10 items-center justify-center rounded-xl", surface.accent)}
            >
              <surface.icon aria-hidden="true" className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold">{surface.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm text-pretty">{surface.body}</p>
          </li>
        ))}
      </ul>

      <div className="border-border/70 bg-card/60 mt-4 flex flex-col gap-4 rounded-2xl border p-6 backdrop-blur-sm sm:flex-row sm:items-center">
        <span className="text-brand bg-brand/10 flex size-10 shrink-0 items-center justify-center rounded-xl">
          <RiDashboardLine aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h3 className="font-semibold">And one dashboard over all of it</h3>
          <p className="text-muted-foreground mt-1 text-sm text-pretty">
            Streak, XP, badges, and where you left off, so the first question on opening the app is
            already answered.
          </p>
        </div>
      </div>
    </Section>
  )
}
