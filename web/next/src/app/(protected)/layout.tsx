import { reachesConsole } from "@packages/auth/access"
import { redirect } from "next/navigation"

import { DashboardFooter, DashboardNav } from "@/components/dashboard/sidebar"
import { ActiveCourseProvider } from "@/components/learn/active-course"
import { CourseSwitcher } from "@/components/learn/course-switcher"
import { SidebarShell } from "@/components/shell/sidebar-shell"
import { auth } from "@/lib/auth"

export default async function Layout({ children }: { children: React.ReactNode }) {
  // Past the cookie cache, like the console's own gate. The Console cross-link is drawn from this, and the browser holds a session snapshot for the cache window, so a cached read leaves someone you just promoted unable to see the console they now have: the link is how they would find it, and /console already lets them in. Costs a session lookup on the API side of a round trip that happens anyway.
  const session = await auth.api.getSession({ disableCookieCache: true })

  if (!session?.user) redirect("/")

  return (
    <ActiveCourseProvider>
      <SidebarShell
        header={<CourseSwitcher />}
        nav={<DashboardNav />}
        footer={
          <DashboardFooter user={session.user} canAccessConsole={reachesConsole(session.user)} />
        }
      >
        {children}
      </SidebarShell>
    </ActiveCourseProvider>
  )
}
