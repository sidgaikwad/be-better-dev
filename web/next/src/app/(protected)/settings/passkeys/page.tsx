import type { Metadata } from "next"

import { Passkeys } from "@/components/settings/passkeys"
import { PageHeader } from "@/components/shell/page-header"
import { PageShell } from "@/components/shell/page-shell"

export const metadata: Metadata = {
  title: "Passkeys",
}

export default function Page() {
  return (
    <PageShell>
      <PageHeader
        title="Passkeys"
        description="Sign in with Touch ID, Windows Hello or a security key instead of a link in your inbox."
      />
      <Passkeys />
    </PageShell>
  )
}
