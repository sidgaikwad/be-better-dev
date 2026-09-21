import { createAuthMiddleware } from "better-auth/api"
import { deleteSessionCookie } from "better-auth/cookies"
import { generateRandomString } from "better-auth/crypto"

// The challenge the two-factor plugin does not apply here.
//
// Its own sign-in hook matches /sign-in/email, /sign-in/username and /sign-in/phone-number, and
// this app serves none of them: everyone arrives through a social callback or a passkey. Left as
// shipped, a user could enrol an authenticator and never once be asked for a code, which is worse
// than no feature at all, because the setting would say it was on.
//
// So this is the same handler, widened. It is written against internal APIs that carry no
// compatibility promise, which is the price, and the upstream matcher is quoted below so the next
// upgrade has something to diff against. Upstream, v1.6.25,
// dist/plugins/two-factor/index.mjs:
//
//     matcher(context) {
//       return context.path === "/sign-in/email"
//         || context.path === "/sign-in/username"
//         || context.path === "/sign-in/phone-number";
//     }
//
// Trust-this-device is deliberately not replicated. Upstream honours a signed trust cookie here and
// skips the challenge for thirty days; doing that correctly means reproducing its HMAC and its
// rotation, and getting it subtly wrong means silently skipping challenges. The UI therefore never
// offers the option, so nothing sets the cookie and nothing has to read it. If someone wants it
// later it is its own piece of work, not a line in this file.

// Upstream's constant, from dist/plugins/two-factor/constant.mjs. Not exported, so it is repeated
// here: it MUST match, because the plugin's own verify endpoints read the cookie this sets, and a
// mismatch means every challenge fails with INVALID_TWO_FACTOR_COOKIE.
// The root check-types runs tsgo (the TypeScript 7 preview) where the package's own runs tsc, and
// tsgo does not resolve better-auth's "./api" subpath export: createAuthMiddleware degrades to any
// there, and an inferred callback parameter then trips TS7006. Naming the type costs nothing,
// since it is the same type under tsc, and keeps one file from needing two compilers to agree.
type AuthMiddlewareContext = Parameters<Parameters<typeof createAuthMiddleware>[0]>[0]

const TWO_FACTOR_COOKIE_NAME = "two_factor"

// Upstream's default, and the window a user has to finish the challenge.
const TWO_FACTOR_COOKIE_MAX_AGE_SECONDS = 600

// The paths that mint a session here and are not covered upstream. A social callback answers with a
// browser redirect and a passkey sign-in answers with JSON, which is the only reason the two are
// told apart below.
const SOCIAL_CALLBACK_PATH = "/callback/:id"
const PASSKEY_SIGN_IN_PATH = "/passkey/verify-authentication"

export const TWO_FACTOR_GATED_PATHS = [SOCIAL_CALLBACK_PATH, PASSKEY_SIGN_IN_PATH]

/**
 * The gate, shaped as a plugin because that is the only extension point that takes a matcher: the
 * top-level `hooks` option is a single middleware run on every request, and a matcher is exactly
 * what keeps this off every other path. It registers after the two-factor plugin, though the two
 * match disjoint paths by construction.
 *
 * `challengeUrl` is where a browser-shaped sign-in is sent, and must be a page on the web origin
 * rather than the api's: the cookie set below is the user's only claim to the pending challenge.
 */
export function twoFactorGate(
  challengeUrl: string,
  // Overridable for tests only, which cannot reach a social callback or a passkey ceremony from an
  // in-memory instance and so point the same handler at an endpoint they can reach. Production
  // passes nothing.
  paths: readonly string[] = TWO_FACTOR_GATED_PATHS,
) {
  return {
    id: "two-factor-gate",
    hooks: {
      after: [
        {
          matcher: (context: { path?: string }) =>
            Boolean(context.path && paths.includes(context.path)),
          handler: createAuthMiddleware(async (ctx: AuthMiddlewareContext) => {
            const data = ctx.context.newSession
            // Null whenever no session was minted: a failed sign-in, or a request that only linked an
            // account. Also null if some other hook already de-sessioned, which is why it is checked
            // rather than assumed.
            if (!data) return
            if (!data.user.twoFactorEnabled) return

            // The session the sign-in just created is destroyed, cookie and row both, because the user
            // has not finished authenticating. setNewSession(null) matters as much as the delete:
            // anything downstream reading newSession must not see a session that no longer exists.
            deleteSessionCookie(ctx, true)
            await ctx.context.internalAdapter.deleteSession(data.session.token)
            ctx.context.setNewSession(null)

            // What replaces it: a short-lived verification row naming the user, a second row holding the
            // attempt count, and a signed cookie carrying the identifier of both. The plugin's verify
            // endpoints consume exactly this shape, so the identifiers are upstream's, not ours.
            const maxAge = TWO_FACTOR_COOKIE_MAX_AGE_SECONDS
            const expiresAt = new Date(Date.now() + maxAge * 1000)
            const identifier = `2fa-${generateRandomString(20)}`
            await ctx.context.internalAdapter.createVerificationValue({
              value: data.user.id,
              identifier,
              expiresAt,
            })
            await ctx.context.internalAdapter.createVerificationValue({
              value: "0",
              identifier: `2fa-attempts-${identifier}`,
              expiresAt,
            })
            const cookie = ctx.context.createAuthCookie(TWO_FACTOR_COOKIE_NAME, { maxAge })
            await ctx.setSignedCookie(
              cookie.name,
              identifier,
              ctx.context.secret,
              cookie.attributes,
            )

            // A passkey sign-in is a fetch from our own client, which understands twoFactorRedirect and
            // routes to the challenge itself. Only totp is offered: there is no mailer for otp, and
            // backup codes are a fallback the challenge screen reveals rather than a method it lists.
            if (ctx.path === PASSKEY_SIGN_IN_PATH) {
              return ctx.json({ twoFactorRedirect: true, twoFactorMethods: ["totp"] })
            }

            // A social callback is a browser navigation, so the answer has to be a redirect or the user
            // lands on a JSON body. The original destination is not carried through: it lives in the
            // OAuth state, and the challenge screen sends everyone to the dashboard on success.
            throw ctx.redirect(challengeUrl)
          }),
        },
      ],
    },
  }
}
