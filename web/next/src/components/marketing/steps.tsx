import { RiCheckLine } from "@remixicon/react"

import { Eyebrow } from "@/components/marketing/eyebrow"
import { Section } from "@/components/marketing/section"

// Each step gets a figure rather than an icon. An icon names the step again in
// a smaller font; a figure shows the shape of it, which is the thing worth
// saying about a course you cannot see until you sign in. All four are CSS and
// SVG, so they cost nothing and follow the theme.

// The lesson, cut into boards, with the one you are on lifted off the stack.
function StackFigure() {
  return (
    <div aria-hidden="true" className="figure-scene flex h-28 items-center justify-center">
      <div className="figure-stack size-20">
        <div className="figure-card figure-card-1" />
        <div className="figure-card figure-card-2" />
        <div className="figure-card figure-card-3" />
        <div className="figure-card figure-card-active figure-card-4" />
      </div>
    </div>
  )
}

// A meter, not a waveform: the heights are authored so it keeps its shape when
// motion is off, where a random walk would freeze somewhere meaningless.
const BARS = [1.2, 2.1, 3.4, 2.6, 4, 3, 1.8, 2.8, 3.6, 2.2, 1.4]

function ListenFigure() {
  return (
    <div aria-hidden="true" className="flex h-28 items-end justify-center gap-1">
      {BARS.map((bar, index) => (
        <span
          className="figure-bar bar-animate"
          key={index}
          style={{ "--bar": bar } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// Three options and the one that was right. Three is the real number: every
// lesson ends on three questions.
function QuizFigure() {
  return (
    <div aria-hidden="true" className="flex h-28 flex-col justify-center gap-2 px-2">
      <div className="border-border/70 bg-background/40 h-7 rounded-lg border" />
      <div className="border-brand/40 bg-brand/10 text-brand flex h-7 items-center gap-2 rounded-lg border px-2">
        <RiCheckLine className="size-4" />
        <span className="figure-line w-16" />
      </div>
      <div className="border-border/70 bg-background/40 h-7 rounded-lg border" />
    </div>
  )
}

// The forgetting curve, and the reviews that catch it. Drawn rather than
// charted: it is an idea here, not data, and Recharts would be a lie about
// precision.
function ReviewFigure() {
  return (
    <svg
      aria-hidden="true"
      className="h-28 w-full"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 160 72"
    >
      <path
        className="stroke-border"
        d="M4 10 C 26 58, 42 64, 60 66"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        className="stroke-brand"
        d="M60 66 C 66 24, 68 18, 76 16 C 96 54, 108 60, 124 62"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        className="stroke-brand"
        d="M124 62 C 128 30, 130 22, 138 20 C 148 34, 152 40, 156 44"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle className="fill-brand" cx="76" cy="16" r="3.5" />
      <circle className="fill-brand" cx="138" cy="20" r="3.5" />
    </svg>
  )
}

const steps = [
  {
    body: "The map opens on the one lesson that is next. Nothing to choose, nothing to scroll past, no decision to make before the learning starts.",
    figure: StackFigure,
    title: "Pick up where you stopped",
  },
  {
    body: "Read it in focus mode, one step at a time on a clock, or hand it to the audiobook and listen. Same lesson either way, and you can switch halfway down.",
    figure: ListenFigure,
    title: "Read it, or be read to",
  },
  {
    body: "Three questions at the end, some asked before you have seen the answer. Getting one wrong is the point: it is what tells the app what to bring back.",
    figure: QuizFigure,
    title: "Answer three questions",
  },
  {
    body: "Then forget it, which you were going to do anyway. Review returns the items you are about to lose, spaced out, and your notes are still on the sentence you put them on.",
    figure: ReviewFigure,
    title: "Forget it, on schedule",
  },
]

export function Steps() {
  return (
    <Section id="how-it-works" labelledBy="how-it-works-heading">
      <div className="max-w-2xl">
        <Eyebrow>How a lesson goes</Eyebrow>
        <h2
          className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl"
          id="how-it-works-heading"
        >
          Four steps, and the app remembers the rest.
        </h2>
        <p className="text-muted-foreground mt-4 text-lg text-pretty">
          You bring twenty minutes. Everything about where you were, what you got wrong, and when
          you are due to see it again is someone else's job.
        </p>
      </div>

      <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li
            className="border-border/70 bg-card/60 flex flex-col rounded-2xl border p-6 backdrop-blur-sm"
            key={step.title}
          >
            <step.figure />
            <span className="text-muted-foreground mt-4 font-mono text-xs">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1 font-semibold text-pretty">{step.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm text-pretty">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
