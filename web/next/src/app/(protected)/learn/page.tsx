import { CourseMap } from "@/components/learn/course-map"
import { PageHeader } from "@/components/shell/page-header"
import { PageShell } from "@/components/shell/page-shell"

export default function Page() {
  return (
    <PageShell size="lg">
      <PageHeader
        title="Course map"
        description="Work down the course. Lessons unlock in order, and the sidebar switches shelves."
      />
      <CourseMap />
    </PageShell>
  )
}
