import { Leaderboard } from "@/components/learn/leaderboard"
import { PageHeader } from "@/components/shell/page-header"
import { PageShell } from "@/components/shell/page-shell"

export default function Page() {
  return (
    <PageShell>
      <PageHeader title="Leaderboard" description="Weekly XP standings." />
      <Leaderboard />
    </PageShell>
  )
}
