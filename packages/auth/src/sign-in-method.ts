// How a session authenticated, recorded on session.sign_in_method when the row is created.
//
// Better Auth has no equivalent of an OIDC `amr` claim, and the question a gate has to answer is
// about THIS session rather than about the account behind it. Once an SSO identity is linked it is
// permanent, so asking the account would let a later magic-link login wear an SSO exemption that
// belongs only to a session the identity provider actually authenticated. Carbon hit exactly this
// and split it into two functions with a warning comment; we avoid it by never having the second
// function. The only place the answer exists is the endpoint that minted the session, so it is read
// there and stored.
//
// Null is the answer whenever the path is missing or unrecognized, and every reader must treat null
// as "not exempt". That is the direction this fails in, deliberately: a session that cannot be
// classified is challenged, never trusted.
//
// Kept free of imports so it can be exercised directly from tests/ without building the package.

// The endpoint context a session create hook is handed. Partial by construction upstream, and
// absent entirely for a session minted outside an endpoint, which is why every field is optional
// and the whole thing is nullable.
export type SignInContext =
  | {
      params?: Record<string, string | undefined> | undefined
      path?: string | undefined
    }
  | null
  | undefined

// Paths that mint a session and name their own method. The social callback is not here because its
// method is the provider in the route parameter rather than anything in the path.
const METHOD_BY_PATH: Record<string, string> = {
  // An admin acting as someone else, which is not that person signing in. Named rather than left
  // null so the column reads honestly, and distinct from every real method so no future exemption
  // can match it by accident.
  "/admin/impersonate-user": "impersonation",
  "/magic-link/verify": "magic-link",
  "/passkey/verify-authentication": "passkey",
  // Not served here, since there is no emailAndPassword config. Mapped so a fork that turns it on
  // is covered without having to find this file first.
  "/sign-in/email": "email",
}

// When SSO lands, its session-minting paths join the map above as "sso", and that string is what
// the challenge gate reads to skip a session the identity provider already applied MFA to. It is
// left out until the plugin exists rather than shipped as an untested branch.

// The provider id lives in the route parameter, so github and google land as themselves and a fork
// adding a third provider is recorded correctly without touching this file.
const SOCIAL_CALLBACK_PATH = "/callback/:id"

export function resolveSignInMethod(ctx: SignInContext): string | null {
  const path = ctx?.path
  if (!path) return null
  if (path === SOCIAL_CALLBACK_PATH) {
    const provider = ctx.params?.id?.trim()
    return provider || null
  }
  // hasOwn, not a bare lookup: "constructor" would otherwise resolve through the prototype chain
  // and hand back a function where a method name belongs. Same reasoning as consoleRole in
  // @/access.
  return Object.hasOwn(METHOD_BY_PATH, path) ? (METHOD_BY_PATH[path] ?? null) : null
}
