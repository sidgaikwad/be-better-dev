import { passkeyClient } from "@better-auth/passkey/client"
import { magicLinkClient, organizationClient, twoFactorClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import { config } from "@/lib/config"

export const authClient = createAuthClient({
  baseURL: `${config.api.url}/api/auth`,
  plugins: [
    magicLinkClient(),
    organizationClient({ teams: { enabled: true } }),
    passkeyClient(),
    // onTwoFactorRedirect fires when a sign-in answers with twoFactorRedirect instead of a session,
    // which here means a passkey sign-in by someone who has enrolled: the social callback is a
    // browser navigation and is redirected server-side instead. Both end on the same page.
    twoFactorClient({
      onTwoFactorRedirect: () => {
        window.location.href = "/two-factor"
      },
    }),
  ],
})
