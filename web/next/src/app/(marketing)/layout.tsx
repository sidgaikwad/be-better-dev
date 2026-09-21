import { SiteFooter } from "@/components/marketing/site-footer"

import "@/app/(marketing)/marketing.css"

// The marketing shell: the page owns its own <main>, this owns the footer beside
// it. No top padding here on purpose, so a hero can run its background up behind
// the fixed translucent navbar and clear it with its own pt-14.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
