import { features } from "@packages/config/site"
import { redirect } from "next/navigation"

import { Audience } from "@/components/marketing/audience"
import { CallToAction } from "@/components/marketing/call-to-action"
import { Faq } from "@/components/marketing/faq"
import { Features } from "@/components/marketing/features"
import { Hero } from "@/components/marketing/hero"
import { Listen } from "@/components/marketing/listen"
import { Steps } from "@/components/marketing/steps"

export default function Home() {
  if (features.waitlist) redirect("/waitlist")

  return (
    <main>
      <Hero />
      <Audience />
      <Features />
      <Listen />
      <Steps />
      <Faq />
      <CallToAction />
    </main>
  )
}
