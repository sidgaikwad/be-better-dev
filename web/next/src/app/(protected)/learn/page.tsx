import { CourseMap } from "@/components/learn/course-map"
import { PageHeader } from "@/components/shell/page-header"
import { PageShell } from "@/components/shell/page-shell"

export default function Page() {
  return (
    <PageShell size="lg">
      <PageHeader
        title="Course map"
        description="Rust from first principles to production. Lessons unlock in order."
      />
      <CourseMap />
    </PageShell>
  )
}
