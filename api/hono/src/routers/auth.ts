import type { Session } from "@packages/auth"
import { auth, enabledProviders } from "@packages/auth"
import { Hono } from "hono"

import { agentSignInEnabled } from "@/lib/agent-signin"
import { consoleAdminMiddleware } from "@/middlewares/console"

// Registering an identity provider hands it every future sign-in for a domain, so it is the most
// consequential write in this API. The plugin guards these three with sessionMiddleware alone,
// which is to say ANY signed-in user can register a provider for ANY domain. That is the same
// shape of problem the admin plugin had, and it is refused the same way: the ladder decides, here,
// before the request ever reaches auth.handler.
//
// Deliberately not a prefix match on /sso. The sign-in paths (/sign-in/sso, the callbacks, the
// metadata) must stay reachable by anonymous browsers, and a guard that swallowed them would break
// sign-in rather than fail closed. Each managing path is named instead, so a new one added upstream
// arrives UNGUARDED and visible rather than silently covered: check this list on every
// @better-auth/sso upgrade.
const SSO_ADMIN_PATHS = ["/sso/register", "/sso/update-provider", "/sso/delete-provider"]

// Typed with Session only so the console guard below can set it. Every other route here is
// anonymous and sets nothing.
export const authRouter = new Hono<{ Variables: Session }>()
  .get("/get-session", (c) => auth.handler(c.req.raw))
  .get("/providers", (c) =>
    c.json({
      data: {
        providers: [...enabledProviders, ...(agentSignInEnabled() ? ["agent" as const] : [])],
      },
    }),
  )
  .use("/sso/*", async (c, next) => {
    // The router mounts under a prefix, so match on the tail rather than the full path.
    const path = new URL(c.req.url).pathname
    if (!SSO_ADMIN_PATHS.some((admin) => path.endsWith(admin))) return next()
    return consoleAdminMiddleware(c, next)
  })
  .on(["GET", "POST"], "/*", (c) => auth.handler(c.req.raw))
