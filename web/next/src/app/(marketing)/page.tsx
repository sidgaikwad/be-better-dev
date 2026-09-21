import { features } from "@packages/config/site"
import { redirect } from "next/navigation"

import { Features } from "@/components/marketing/features"
import { Hero } from "@/components/marketing/hero"

export default function Home() {
  if (features.waitlist) redirect("/waitlist")

  return (
    <main>
      <Hero />
      <Features />
    </main>
  )
}
