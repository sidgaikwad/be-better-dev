// Single source of truth for "this route wears the app shell": the top-level segments of app/(protected) and app/(console), whose layouts render SidebarShell.
// Add a segment here whenever you add a top-level route to either group, or the marketing Navbar will render fixed over the new page's sidebar and heading.
const appShellSegments = [
  "audiobook",
  "console",
  "dashboard",
  "focus",
  "leaderboard",
  "learn",
  "notes",
  "review",
  "settings",
]

// Public routes that deliberately carry no chrome at all. The two-factor challenge is mid-sign-in:
// there is no session yet, so the navbar's Login and Dashboard buttons would offer a way around the
// challenge or a link that cannot work. It is a separate list from the app-shell one because the
// reason differs, even though both end in the navbar rendering nothing.
const chromelessSegments = ["two-factor"]

// True when SidebarShell owns the page chrome. Such a page already has the brand, nav, and user menu in its sidebar, so the fixed marketing Navbar must not render on top of it. Public content routes (/docs, /blog) keep the Navbar and offset around it instead.
export function isAppShellPath(pathname: string | null): boolean {
  if (!pathname) return false
  const segment = pathname.split("/")[1]
  return !!segment && appShellSegments.includes(segment)
}

// True when the marketing Navbar must not render: either the app shell owns the chrome, or the page
// is deliberately chromeless.
export function hidesNavbar(pathname: string | null): boolean {
  if (!pathname) return false
  const segment = pathname.split("/")[1]
  return isAppShellPath(pathname) || (!!segment && chromelessSegments.includes(segment))
}
