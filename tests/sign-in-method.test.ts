import { describe, expect, test } from "bun:test"

import { resolveSignInMethod } from "../packages/auth/src/sign-in-method"

// The column this feeds is read by the eventual challenge gate, so the cases that matter most are
// the ones that must NOT produce a method: an unclassifiable session has to be challenged.
describe("resolveSignInMethod", () => {
  test("names the provider from a social callback's route parameter", () => {
    expect(resolveSignInMethod({ params: { id: "github" }, path: "/callback/:id" })).toBe("github")
    expect(resolveSignInMethod({ params: { id: "google" }, path: "/callback/:id" })).toBe("google")
  })

  test("records a provider it has never heard of rather than dropping it", () => {
    expect(resolveSignInMethod({ params: { id: "gitlab" }, path: "/callback/:id" })).toBe("gitlab")
  })

  test("names the methods that live in the path", () => {
    expect(resolveSignInMethod({ path: "/passkey/verify-authentication" })).toBe("passkey")
    expect(resolveSignInMethod({ path: "/magic-link/verify" })).toBe("magic-link")
    expect(resolveSignInMethod({ path: "/sign-in/email" })).toBe("email")
  })

  test("names an SSO callback, in both shapes the plugin registers", () => {
    expect(resolveSignInMethod({ path: "/sso/callback" })).toBe("sso")
    expect(
      resolveSignInMethod({
        params: { providerId: "acme-oidc" },
        path: "/sso/callback/:providerId",
      }),
    ).toBe("sso")
  })

  // SAML is not enabled, so its ACS path is unmapped on purpose: a session it minted records as
  // null and gets challenged, rather than silently wearing an exemption nothing has tested.
  test("does not name a SAML callback while SAML is off", () => {
    expect(resolveSignInMethod({ path: "/sso/saml2/sp/acs/:providerId" })).toBeNull()
  })

  test("marks an impersonation as itself, never as the target's sign-in", () => {
    expect(resolveSignInMethod({ path: "/admin/impersonate-user" })).toBe("impersonation")
  })

  test("returns null when there is no context at all", () => {
    expect(resolveSignInMethod(null)).toBeNull()
    expect(resolveSignInMethod(undefined)).toBeNull()
    expect(resolveSignInMethod({})).toBeNull()
  })

  test("returns null for a path it does not recognize", () => {
    expect(resolveSignInMethod({ path: "/sign-in/social" })).toBeNull()
    expect(resolveSignInMethod({ path: "/get-session" })).toBeNull()
  })

  test("returns null for a social callback with no provider", () => {
    expect(resolveSignInMethod({ path: "/callback/:id" })).toBeNull()
    expect(resolveSignInMethod({ params: {}, path: "/callback/:id" })).toBeNull()
    expect(resolveSignInMethod({ params: { id: "   " }, path: "/callback/:id" })).toBeNull()
  })

  // A bare object lookup would answer "constructor" with a function, and whatever a caller then did
  // with it, it would not be null.
  test("does not resolve a path through the prototype chain", () => {
    expect(resolveSignInMethod({ path: "constructor" })).toBeNull()
    expect(resolveSignInMethod({ path: "__proto__" })).toBeNull()
    expect(resolveSignInMethod({ path: "toString" })).toBeNull()
  })
})
