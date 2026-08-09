import { RiArrowRightLine } from "@remixicon/react"
import Link from "next/link"

import { LearnDashboard } from "@/components/dashboard/learn-dashboard"
import { PageHeader } from "@/components/shell/page-header"
import { PageShell } from "@/components/shell/page-shell"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <PageShell>
      <PageHeader
        title="Dashboard"
        description="Streak, XP, badges, and where you left off."
        actions={
          <Button render={<Link href="/learn" />}>
            Continue learning
            <RiArrowRightLine />
          </Button>
        }
      />
      <LearnDashboard />
    </PageShell>
  )
}
