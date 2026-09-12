import { NextUp } from "@/components/focus/next-up"
import { PageHeader } from "@/components/shell/page-header"
import { PageShell } from "@/components/shell/page-shell"

export default function Page() {
  return (
    <PageShell size="sm">
      <PageHeader
        title="Focus"
        description="One lesson at a time, in steps, on a clock. Same course, less to hold at once."
      />
      <NextUp />
    </PageShell>
  )
}
