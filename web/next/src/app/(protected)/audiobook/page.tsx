import { Audiobook } from "@/components/learn/audiobook"
import { PageHeader } from "@/components/shell/page-header"
import { PageShell } from "@/components/shell/page-shell"

export default function Page() {
  return (
    <PageShell size="lg">
      <PageHeader
        title="Audiobook"
        description="Listen to the course straight through. Playback rolls into the next unlocked lesson on its own."
      />
      <Audiobook />
    </PageShell>
  )
}
