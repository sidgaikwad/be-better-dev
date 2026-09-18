import { isLocal } from "@packages/env"
import { env } from "@packages/env/api-hono"

import { onVercel } from "@/lib/runtime"

// One source of truth for the route mount (agents.ts) and the /providers advertisement (auth.ts).
// The route mints a signed session for an admin user with no credentials, so NODE_ENV is too weak
// a guard on its own: a deployment carrying NODE_ENV=local turns it on, and only the Origin header
// stands in the way, which any client sets freely. Vercel marks every deployment with VERCEL=1, so
// refusing there keeps the route unreachable on a deploy however NODE_ENV ends up set.
export const agentSignInEnabled = (): boolean =>
  !onVercel && isLocal(env.NODE_ENV) && env.AGENT_SIGNIN_ENABLED
