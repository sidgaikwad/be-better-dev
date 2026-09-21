import type { Metadata } from "next"

import { TwoFactor } from "@/components/settings/two-factor"
import { PageHeader } from "@/components/shell/page-header"
import { PageShell } from "@/components/shell/page-shell"

export const metadata: Metadata = {
  title: "Two-factor authentication",
}

export default function Page() {
  return (
    <PageShell>
      <PageHeader
        title="Two-factor authentication"
        description="Ask for a six-digit code from your phone as well as your usual way of signing in."
      />
      <TwoFactor />
    </PageShell>
  )
}
