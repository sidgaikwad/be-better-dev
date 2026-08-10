import { ReviewSession } from "@/components/learn/review-session"
import { PageHeader } from "@/components/shell/page-header"
import { PageShell } from "@/components/shell/page-shell"

export default function Page() {
  return (
    <PageShell>
      <PageHeader
        title="Review"
        description="Spaced recall of quiz items from lessons you have completed."
      />
      <ReviewSession />
    </PageShell>
  )
}
