import { NotesList } from "@/components/learn/notes-list"
import { PageHeader } from "@/components/shell/page-header"
import { PageShell } from "@/components/shell/page-shell"

export default function Page() {
  return (
    <PageShell>
      <PageHeader
        title="Notes"
        description="Every sticky note you have written, grouped by lesson."
      />
      <NotesList />
    </PageShell>
  )
}
