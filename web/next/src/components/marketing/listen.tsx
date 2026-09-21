import {
  RiCheckLine,
  RiCodeSSlashLine,
  RiPlayFill,
  RiSkipBackFill,
  RiSkipForwardFill,
} from "@remixicon/react"

import { Aurora } from "@/components/marketing/aurora"
import { Eyebrow } from "@/components/marketing/eyebrow"
import { Section } from "@/components/marketing/section"
import { courseStats } from "@/lib/marketing"
import { cn } from "@/lib/utils"

// The player, as a figure. A real screenshot would be a screenshot of a page
// nobody can reach without a session, and a video would be a download; this is
// the same information in markup that follows the theme and costs nothing.
//
// Decorative all the way down: aria-hidden on the wrapper, and the transport is
// spans rather than buttons, because a control that looks operable and does
// nothing is worse than a picture of one. Everything it claims is in
// lib/speech.ts: sentence-sized segments, code announced rather than read.

const BARS = [1, 1.8, 2.6, 1.4, 2.2, 3, 1.6, 2.4, 1.2]

const queue: { kind: "code" | "done" | "playing" | "queued"; text: string }[] = [
  { kind: "done", text: "A value in Rust has exactly one owner." },
  { kind: "playing", text: "Moving a value ends the old binding, and the compiler knows." },
  { kind: "code", text: "Code block, 12 lines" },
  { kind: "queued", text: "Borrowing lets you look without taking." },
  { kind: "queued", text: "A shared borrow and a mutable one cannot overlap." },
]

function PlayerFigure() {
  return (
    <div
      aria-hidden="true"
      className="border-border/70 bg-card/80 w-full max-w-md rounded-2xl border p-5 shadow-xl backdrop-blur-sm"
    >
      <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
        Now playing
      </p>
      <p className="mt-1 font-semibold">Ownership, moves, and borrows</p>

      <ul className="mt-5 flex flex-col gap-1.5">
        {queue.map((item) => (
          <li
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
              item.kind === "playing" && "bg-audio/10 text-foreground",
              item.kind === "done" && "text-muted-foreground",
              item.kind === "queued" && "text-muted-foreground/70",
              item.kind === "code" && "text-muted-foreground",
            )}
            key={item.text}
          >
            {item.kind === "done" && <RiCheckLine className="text-audio size-4 shrink-0" />}
            {item.kind === "playing" && (
              <span className="flex h-4 w-4 shrink-0 items-end justify-center gap-px">
                {BARS.slice(0, 3).map((bar, index) => (
                  <span
                    className="figure-bar bar-animate w-px"
                    key={index}
                    style={{ "--bar": bar / 4 } as React.CSSProperties}
                  />
                ))}
              </span>
            )}
            {item.kind === "code" && <RiCodeSSlashLine className="size-4 shrink-0" />}
            {item.kind === "queued" && <span className="size-4 shrink-0" />}
            <span className="truncate">{item.text}</span>
          </li>
        ))}
      </ul>

      <div className="border-border/70 mt-5 flex items-center gap-3 border-t pt-4">
        <span className="text-muted-foreground flex items-center gap-2">
          <RiSkipBackFill className="size-4" />
          <span className="bg-audio/15 text-audio flex size-8 items-center justify-center rounded-full">
            <RiPlayFill className="size-4" />
          </span>
          <RiSkipForwardFill className="size-4" />
        </span>
        <span className="bg-muted h-1 flex-1 overflow-hidden rounded-full">
          <span className="bg-audio block h-full w-1/3 rounded-full" />
        </span>
        <span className="text-muted-foreground font-mono text-xs">1.25x</span>
      </div>
    </div>
  )
}

const claims = [
  "Code blocks and tables are announced, not spelled out: a Rust snippet read character by character is unlistenable, so you look at the screen for those and listen to the rest.",
  "Prose is cut to sentence length, because browser voices truncate a long utterance and because short segments give the player somewhere to seek to.",
  "Playback rolls into the next unlocked lesson on its own, so a walk or a commute gets through a section rather than a page.",
]

export function Listen() {
  return (
    <Section
      background={<Aurora className="opacity-50" />}
      className="overflow-hidden"
      id="listen"
      labelledBy="listen-heading"
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-xl">
          <Eyebrow>Read to you</Eyebrow>
          <h2
            className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl"
            id="listen-heading"
          >
            An audiobook of the whole course, with nothing to download.
          </h2>
          <p className="text-muted-foreground mt-4 text-lg text-pretty">
            No hosted narration, no per-minute bill, no waiting for a file. The voice is the one
            already on your device, so every one of the {courseStats.lessons} lessons can be
            listened to from the moment you sign in.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {claims.map((claim) => (
              <li className="text-muted-foreground flex gap-3 text-sm text-pretty" key={claim}>
                <RiCheckLine aria-hidden="true" className="text-audio mt-0.5 size-4 shrink-0" />
                {claim}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center lg:justify-end">
          <PlayerFigure />
        </div>
      </div>
    </Section>
  )
}
