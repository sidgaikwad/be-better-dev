import { LessonPlayer } from "@/components/learn/lesson-player"
import { PageShell } from "@/components/shell/page-shell"

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <PageShell>
      <LessonPlayer slug={slug} />
    </PageShell>
  )
}
