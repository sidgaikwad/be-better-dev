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

// True when SidebarShell owns the page chrome. Such a page already has the brand, nav, and user menu in its sidebar, so the fixed marketing Navbar must not render on top of it. Public content routes (/docs, /blog) keep the Navbar and offset around it instead.
export function isAppShellPath(pathname: string | null): boolean {
  if (!pathname) return false
  const segment = pathname.split("/")[1]
  return !!segment && appShellSegments.includes(segment)
}
