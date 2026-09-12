import { Suspense } from "react"

import { FocusSession } from "@/components/focus/focus-session"
import { PageShell } from "@/components/shell/page-shell"
import { Skeleton } from "@/components/ui/skeleton"

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    // A narrower column than the lesson page on purpose: a shorter line is
    // easier to track back to the start of, which is half of what makes a wall
    // of text hard to read.
    <PageShell size="sm">
      {/* FocusSession reads ?start=1 to arm the timer, so it needs a boundary. */}
      <Suspense fallback={<Skeleton className="h-96" />}>
        <FocusSession slug={slug} />
      </Suspense>
    </PageShell>
  )
}
