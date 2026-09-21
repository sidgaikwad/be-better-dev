import { RiArrowDownLine } from "@remixicon/react"

import { Access } from "@/components/common/access"
import { BookHalo } from "@/components/marketing/book-halo"
import { Section } from "@/components/marketing/section"
import { Button } from "@/components/ui/button"

// The last band. The same halo as the hero, because the page should close on
// the thing it opened on, and no third option: sign in, or go back up and read
// what it does.
const cta = "h-11 w-auto px-6 text-base"

export function CallToAction() {
  return (
    <Section
      background={<BookHalo className="opacity-60" />}
      className="overflow-hidden"
      id="start"
      labelledBy="start-heading"
      innerClassName="flex flex-col items-center text-center"
    >
      <h2
        className="max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl"
        id="start-heading"
      >
        One lesson is twenty minutes. Start with one.
      </h2>
      <p className="text-muted-foreground mt-4 max-w-xl text-lg text-pretty">
        No card, no trial clock, nothing to install. Sign in with a link in your email or a passkey,
        and the first lesson is already unlocked.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Access className={cta} label="Start learning" size="lg" variant="default" />
        <Button className={cta} render={<a href="#who-its-for" />} size="lg" variant="outline">
          Read why it is built this way
          <RiArrowDownLine aria-hidden="true" />
        </Button>
      </div>
    </Section>
  )
}
