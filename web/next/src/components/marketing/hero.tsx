import { RiArrowDownLine, RiSparkling2Line } from "@remixicon/react"

import { Access } from "@/components/common/access"
import { Aurora } from "@/components/marketing/aurora"
import { BookCss } from "@/components/marketing/book-css"
import { Eyebrow } from "@/components/marketing/eyebrow"
import { Button } from "@/components/ui/button"
import { courseStats } from "@/lib/marketing"

// Hero calls to action are the one place on the site that wants a button bigger
// than the app's `lg`. Declared once here rather than pasted onto each button.
const cta = "h-11 w-auto px-6 text-base"

const stats = [
  { label: "lessons, across two courses", value: courseStats.lessons.toLocaleString("en-US") },
  {
    label: "quiz questions on a review clock",
    value: courseStats.quizQuestions.toLocaleString("en-US"),
  },
  { label: "lesson on screen at a time", value: "1" },
]

export function Hero() {
  return (
    // pt-14 clears the fixed navbar here rather than on a wrapper, so the
    // aurora runs to the very top of the page and behind the translucent bar.
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-14 pb-24"
      id="hero"
    >
      <Aurora />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 md:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
        <div className="flex max-w-xl flex-col items-start">
          <Eyebrow icon={RiSparkling2Line}>Built for ADHD brains and tired eyes</Eyebrow>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-balance sm:text-6xl">
            Learn to code on the days{" "}
            <span className="from-brand via-brand-glow to-audio bg-gradient-to-r bg-clip-text text-transparent">
              reading is hard
            </span>
            .
          </h1>
          <p className="text-muted-foreground mt-6 text-lg text-pretty">
            A full Rust and system design curriculum for anyone who stalls on page one. Every lesson
            is cut into steps with a clock on them, and read aloud by your own device. Spaced review
            and anchored notes do the remembering.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Access className={cta} label="Start learning" size="lg" variant="default" />
            <Button className={cta} render={<a href="#what-you-get" />} size="lg" variant="outline">
              See what is inside
              <RiArrowDownLine aria-hidden="true" />
            </Button>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            No card. Sign in with an email link or a passkey.
          </p>

          {/* column-reverse in each group so the value reads first while the
              markup keeps the dt-before-dd order a description list requires. */}
          <dl className="border-border/70 mt-12 grid w-full grid-cols-3 gap-4 border-t pt-8">
            {stats.map((stat) => (
              <div className="flex flex-col-reverse" key={stat.label}>
                <dt className="text-muted-foreground mt-1 text-sm text-pretty">{stat.label}</dt>
                <dd className="text-2xl font-semibold tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <BookCss className="justify-self-center lg:justify-self-end" />
      </div>
    </section>
  )
}
