import { passkey as passkeyPlugin } from "@better-auth/passkey"
import { sso as ssoPlugin } from "@better-auth/sso"
import { site } from "@packages/config/site"
import {
  account,
  db,
  invitation,
  member,
  organization,
  passkey,
  session,
  team,
  ssoProvider,
  teamMember,
  twoFactor,
  user,
  verification,
} from "@packages/db"
import { env } from "@packages/env/auth"
// Type-only, and re-exported at the bottom. The passkey plugin leaks these into the inferred type of
// `auth`, which tsgo then cannot name from a bundled dts: TS2883, "not portable". Naming them here
// gives the emitted .d.mts a reference it can resolve.
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/server"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import {
  admin as adminPlugin,
  openAPI as openAPIPlugin,
  organization as organizationPlugin,
  twoFactor as twoFactorPlugin,
} from "better-auth/plugins"
import { userAc } from "better-auth/plugins/admin/access"

import { ACCESS_ROLE, CONSOLE_ROLES, roleAtLeast } from "@/access"
import { grantConsoleAccessOnSignIn } from "@/allowlist"
import { cookieConfig, localhostHost, type ParsedHost } from "@/lib/utils"
import { resolveSignInMethod } from "@/sign-in-method"
import { twoFactorGate } from "@/two-factor-gate"

// The app host's tldts breakdown, inlined at build by @packages/scripts/src/generate-env.ts (see tsdown.config.ts define), so no Public Suffix List ships at runtime. A runtime .localhost host (portless dev, injected after the build) overrides it so web and api share the cookie.
declare const __DERIVED_TLDTS__: ParsedHost
const { cookieDomain, cookiePrefix, isPrivate } = cookieConfig(
  localhostHost(env.HONO_APP_URL) ?? __DERIVED_TLDTS__,
)

// On a public hosting suffix (isPrivate) web and api are sibling sites that cannot share a cookie, so the browser only ever talks to the web, which proxies /api to us and Better Auth builds OAuth callbacks and cookies for the web origin. Everything stays first-party to the web: no cross-site cookie, no handoff.
const apiOrigin = new URL(env.HONO_APP_URL).origin
const nonApiOrigins = [
  ...new Set(
    env.HONO_TRUSTED_ORIGINS.map((o) => {
      try {
        return new URL(o).origin
      } catch {
        return ""
      }
    }).filter((o) => o && o !== apiOrigin),
  ),
]
// The origin the browser actually loads. baseURL only needs it on a public suffix (below), but
// passkeys bind to the page's own origin in every environment, so it is resolved unconditionally.
const resolvedWebOrigin = env.HONO_WEB_URL ? new URL(env.HONO_WEB_URL).origin : nonApiOrigins[0]

const webOrigin = isPrivate ? resolvedWebOrigin : undefined

// WebAuthn binds a passkey to the relying-party id: a bare hostname that must equal the page's host
// or be a registrable suffix of it. It is derived from the web origin, never the api's, because the
// plugin would otherwise default it to baseURL's hostname, which IS the api outside a public suffix
// and fails every ceremony. A public hosting suffix (*.vercel.app) cannot be shortened, so the full
// host is the only valid value there; BETTER_AUTH_RP_ID overrides for sibling custom subdomains.
const rpID = env.BETTER_AUTH_RP_ID ?? new URL(resolvedWebOrigin ?? env.HONO_APP_URL).hostname

// HONO_WEB_URL names the web origin explicitly. Without it, a public-suffix host infers the first non-api HONO_TRUSTED_ORIGINS entry: with none distinct from the api, baseURL falls back to the api and cross-origin OAuth cannot complete; with several, it pins to whichever is listed first. Warn either way and point at HONO_WEB_URL.
if (isPrivate && !env.HONO_WEB_URL && nonApiOrigins.length === 0) {
  console.warn(
    `[auth] HONO_APP_URL is a public-suffix host but no HONO_TRUSTED_ORIGINS entry differs from it, so baseURL falls back to the api and sign-in cannot complete (cross-origin OAuth will fail). Set HONO_WEB_URL to your web origin, or use a custom domain.`,
  )
} else if (isPrivate && !env.HONO_WEB_URL && nonApiOrigins.length > 1) {
  console.warn(
    `[auth] inferred the web origin as the first non-api HONO_TRUSTED_ORIGINS entry (${webOrigin}), but ${nonApiOrigins.length} distinct non-api origins are trusted. Set HONO_WEB_URL to pin it explicitly.`,
  )
}

export type SocialProvider = "github" | "google"
export type AuthProvider = SocialProvider | "magic-link" | "passkey"

// A provider is enabled only when both of its OAuth credentials are set; a fork can ship with any subset (or none, relying on magic link).
export const enabledSocialProviders: SocialProvider[] = [
  ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET ? (["github"] as const) : []),
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? (["google"] as const) : []),
]

// Better Auth has one trustedOrigins and the SSO plugin has no list of its own, so an identity
// provider's discovery document can only be fetched if its origin is in that one list. Merged here
// rather than by widening HONO_TRUSTED_ORIGINS, because that variable is still handed to the
// passkey plugin as its expected origins, and a passkey ceremony must not start accepting an
// origin just because someone registered an IdP there.
const ssoOrigins = env.BETTER_AUTH_SSO_ORIGINS ?? []

export const auth = betterAuth({
  baseURL: webOrigin ?? env.HONO_APP_URL,
  trustedOrigins: [...new Set([...env.HONO_TRUSTED_ORIGINS, ...ssoOrigins])],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      account,
      invitation,
      member,
      organization,
      passkey,
      session,
      ssoProvider,
      team,
      teamMember,
      twoFactor,
      user,
      verification,
    },
  }),
  onAPIError: {
    throw: true,
  },
  session: {
    additionalFields: {
      // Written by the create hook below and by nothing else. `input: false` is what makes that
      // true rather than merely intended: without it a request body could name its own sign-in
      // method, and the column exists precisely to be trusted by a gate.
      signInMethod: {
        type: "string",
        required: false,
        input: false,
      },
    },
    cookieCache: {
      enabled: true,
      maxAge: 300,
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session, ctx) => {
          await grantConsoleAccessOnSignIn(session)
          const signInMethod = resolveSignInMethod(ctx)
          // undefined rather than an empty merge, so an unclassifiable session leaves the column
          // null. Null is the non-exempt answer and the one a gate has to fail towards; see
          // @/sign-in-method.
          return signInMethod ? { data: { signInMethod } } : undefined
        },
      },
    },
  },
  plugins: [
    openAPIPlugin(),
    organizationPlugin({
      teams: { enabled: true },
    }),
    // The plugin validates adminRoles against its own role table, so the ladder's rungs are declared here as well as ranked in @/access.
    // Every rung holds no statements, which is deliberate and load-bearing. The plugin mounts its own endpoints at /api/auth/admin/*, and its middleware authorizes on these statements alone: it has no notion of rank, of who the actor is relative to the target, or of the last owner. Hand an admin the stock adminAc and one request to /api/auth/admin/set-role makes them an owner, bans an owner, or resets an owner's password, and every rule in @/access becomes a comment. Verified: it did exactly that before this was narrowed.
    // So the console's own routes own all of it, guarded by refuseRoleChange and refuseBan, and the plugin keeps only what nothing else provides: the role, banned, banReason and banExpires columns, and the session check that refuses a banned user. A fork that wants the plugin's endpoints should widen one statement at a time and accept that the ladder does not constrain them.
    adminPlugin({
      // Derived, not restated: the rungs the plugin treats as admin are the rungs the ladder admits to Access, and every rung is declared so the plugin's own validation passes.
      adminRoles: CONSOLE_ROLES.filter((role) => roleAtLeast(role, ACCESS_ROLE)),
      roles: Object.fromEntries(CONSOLE_ROLES.map((role) => [role, userAc])),
    }),
    passkeyPlugin({
      rpID,
      rpName: site.name,
      // Pinning the expected origins is what makes verification mean anything: left unset the plugin
      // falls back to the request's own Origin header, which is to say it trusts whatever it is told.
      origin: env.HONO_TRUSTED_ORIGINS,
      authenticatorSelection: {
        // Discoverable, so the browser can offer a passkey before any email is typed.
        residentKey: "required",
        // "preferred", not "required": a device with no biometric or PIN can still enrol rather than
        // being locked out of the feature entirely.
        userVerification: "preferred",
      },
    }),
    // READ THIS BEFORE BELIEVING 2FA IS ON: registering this plugin does not gate any sign-in
    // here. Its own sign-in hook matches exactly three paths, `/sign-in/email`,
    // `/sign-in/username` and `/sign-in/phone-number`, and this app serves none of them: there is
    // no emailAndPassword config, no username plugin, no phone-number plugin. Everyone arrives
    // through a social callback or a passkey. So what lands here is the enrolment half, the
    // endpoints and the storage; the challenge is a hook we write ourselves, and until it exists
    // a user can enrol an authenticator and never once be asked for a code. See
    // .github/notes/sso-and-2fa.md, "The gap that decides everything".
    twoFactorPlugin({
      // What the authenticator app shows above the account, so it has to be the product name
      // rather than a hostname: someone with three TOTP entries reads this to tell them apart.
      issuer: site.name,
      // Load-bearing, not a convenience. Enable and disable demand the user's password by
      // default, and nobody in this database has one: sign-in is GitHub, Google or a passkey, and
      // there is no credential account to check against. Without this every call to
      // /two-factor/enable returns INVALID_PASSWORD, for every user, forever. The plugin still
      // asks for a password when a credential account does exist, so a fork that turns on
      // emailAndPassword keeps that check.
      allowPasswordless: true,
      // otpOptions is deliberately absent. It needs a `sendOTP` and this repo has no mailer, so
      // there is nothing to send with. The plugin handles the absence properly rather than
      // half-working: /two-factor/send-otp refuses with OTP_NOT_CONFIGURED, and the
      // twoFactorMethods list a challenge returns only names "otp" when sendOTP is configured, so
      // the UI is never offered a method it cannot complete. TOTP and backup codes are the two
      // factors here. Backup codes are stored encrypted by the plugin's own default; the TOTP
      // secret is not, because 1.6.25 encrypts it only under totpOptions.storeSecret.
      //
      // accountLockout is left at its default of on, 10 consecutive failures, 900s. It is
      // account-scoped where the Redis rate limiter is request-scoped, so the two answer
      // different questions and both are wanted.
    }),
    // Enterprise sign-in: an email domain is routed to its own identity provider.
    //
    // OIDC only. samlConfig is never written, because SAML means samlify, and samlify has had
    // three advisories, two of them authentication-bypass class, in one XML signature library.
    // OIDC already covers Okta, Entra ID, Google Workspace, Auth0, Keycloak and JumpCloud. The
    // dependency arrives either way (it is a hard dependency of the package), so this is about what
    // is reachable, not what is installed.
    ssoPlugin({
      // No account is ever created by an identity provider. This is the tightest of the plugin's
      // postures and it is chosen deliberately: an IdP asserts an email, and the plugin's own
      // domain check (validateEmailDomain) only gates whether that assertion may LINK to an
      // existing account, not whether the sign-in proceeds. Without this flag a provider
      // registered for acme.example could mint an account for someone@gmail.com. With it, SSO can
      // sign in people who already have accounts and can do nothing else.
      // The cost is real: an organisation rolling out SSO finds its people must have signed in
      // once another way first. Revisit when there is an invite flow to hang this on, which is
      // what carbon has and this app does not.
      disableImplicitSignUp: true,
      // A provider routes nothing until its domain is proven by DNS, so a registered-but-unverified
      // claim is inert. Also what makes domainVerified, and therefore the plugin's own linking
      // check, mean anything.
      domainVerification: { enabled: true },
      // The organization plugin is registered but has almost no UI, so there is no organization for
      // a provider to provision into. Turning this on before that exists would write memberships
      // nothing can read.
      organizationProvisioning: { disabled: true },
      // Small on purpose. Registration is a console action, not self-serve, so this is a backstop
      // against a loop rather than a product limit.
      providersLimit: 10,
    }),
    // The challenge the plugin above does not apply here, because its matcher never sees a social
    // callback or a passkey sign-in. Registered after it, though the two match disjoint paths by
    // construction. See @/two-factor-gate for what it costs.
    twoFactorGate(`${resolvedWebOrigin ?? env.HONO_APP_URL}/two-factor`),
  ],
  socialProviders: {
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? { github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET } }
      : {}),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
      : {}),
  },
  advanced: {
    // The environment name-prefix isolates cookie names across envs; it applies independent of the cookie-mode switch below (a private-suffix env would still want it).
    ...(cookiePrefix && { cookiePrefix }),
    // Cross-subdomain (custom domains, portless localhost) shares one Domain cookie. A public hosting suffix (isPrivate) and a bare host both stay host-only with SameSite=Lax: on a public suffix the client routes same-origin through the web proxy so the cookie is first-party to the web, and a bare host has no shareable parent to widen to.
    ...(!isPrivate && cookieDomain
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: cookieDomain,
          },
        }
      : {}),
  },
})

// Magic-link sign-in shows in the UI only when its server plugin is registered; add `magicLink({ sendMagicLink })` to the plugins above (and implement the sender) to enable it.
export const magicLinkEnabled = (auth.options.plugins ?? []).some(
  (p) => (p.id as string) === "magic-link",
)

// The unified list of enabled sign-in providers the UI reads: social providers plus magic link when its server plugin is registered.
export const passkeyEnabled = (auth.options.plugins ?? []).some(
  (p) => (p.id as string) === "passkey",
)

// Deliberately not `twoFactorEnabled`, which is the per-user column the plugin owns on `user` and
// means something entirely different: whether THIS person has enrolled. This one is about the
// deployment, and reads true wherever the endpoints are mounted. Two names one letter apart, both
// booleans, would be read wrong exactly once and that once would be a gate.
// Whether enterprise sign-in is mounted at all, for the UI to ask before offering it.
export const ssoAvailable = (auth.options.plugins ?? []).some((p) => (p.id as string) === "sso")

export const twoFactorAvailable = (auth.options.plugins ?? []).some(
  (p) => (p.id as string) === "two-factor",
)

export const enabledProviders: AuthProvider[] = [
  ...enabledSocialProviders,
  ...(magicLinkEnabled ? (["magic-link"] as const) : []),
  ...(passkeyEnabled ? (["passkey"] as const) : []),
]

export { resolveSignInMethod, type SignInContext } from "@/sign-in-method"
export { TWO_FACTOR_GATED_PATHS } from "@/two-factor-gate"

export type Session = typeof auth.$Infer.Session

// See the import above: these exist to make the emitted dts nameable, not because anything here
// uses them directly.
export type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
}
