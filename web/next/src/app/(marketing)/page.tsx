import { features } from "@packages/config/site"
import { redirect } from "next/navigation"

import { Audience } from "@/components/marketing/audience"
import { Features } from "@/components/marketing/features"
import { Hero } from "@/components/marketing/hero"
import { Steps } from "@/components/marketing/steps"

export default function Home() {
  if (features.waitlist) redirect("/waitlist")

  return (
    <main>
      <Hero />
      <Audience />
      <Features />
      <Steps />
    </main>
  )
}
