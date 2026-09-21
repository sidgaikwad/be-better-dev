import { beforeEach, describe, expect, test } from "bun:test"

import { TWO_FACTOR_GATED_PATHS, twoFactorGate } from "../packages/auth/src/two-factor-gate"

// See session-sign-in-method.test.ts for why better-auth is imported by path.
const { betterAuth } = await import("../packages/auth/node_modules/better-auth/dist/index.mjs")
type AuthOptions = Parameters<typeof betterAuth>[0]

const { memoryAdapter } =
  (await import("../packages/auth/node_modules/better-auth/dist/adapters/memory-adapter/index.mjs")) as unknown as {
    memoryAdapter: (db: Record<string, unknown[]>) => AuthOptions["database"]
  }

const CHALLENGE_URL = "https://web.test/two-factor"
const EMAIL = "gated@example.test"
const PASSWORD = "correct-horse-battery"

// The gate cannot be driven through a social callback or a passkey ceremony from an in-memory
// instance, so the same handler is pointed at /sign-in/email, which this harness can reach. The
// two-factor plugin is deliberately absent: it owns that path upstream, and the point here is to
// exercise our handler rather than watch theirs run first.
let store: Record<string, unknown[]>
let auth: ReturnType<typeof betterAuth>

const users = () => store.user as Array<Record<string, unknown>>
const sessions = () => store.session as Array<Record<string, unknown>>
const verifications = () => store.verification as Array<Record<string, unknown>>

const signIn = () =>
  auth.api
    .signInEmail({ body: { email: EMAIL, password: PASSWORD }, asResponse: true })
    .catch((error: unknown) => error as { status?: number; headers?: Headers })

beforeEach(async () => {
  store = { account: [], session: [], user: [], verification: [] }
  auth = betterAuth({
    baseURL: "http://localhost:3000",
    secret: "test-secret-that-is-long-enough-to-be-accepted",
    database: memoryAdapter(store),
    emailAndPassword: { enabled: true },
    user: {
      additionalFields: {
        twoFactorEnabled: { type: "boolean", required: false, defaultValue: false, input: false },
      },
    },
    plugins: [twoFactorGate(CHALLENGE_URL, ["/sign-in/email"])],
  })
  await auth.api.signUpEmail({ body: { email: EMAIL, name: "Gated", password: PASSWORD } })
})

describe("twoFactorGate", () => {
  test("covers the two paths the plugin's own matcher never sees", () => {
    expect(TWO_FACTOR_GATED_PATHS).toEqual(["/callback/:id", "/passkey/verify-authentication"])
  })

  test("leaves a sign-in alone when the user has not enrolled", async () => {
    const before = sessions().length
    await signIn()
    expect(sessions().length).toBe(before + 1)
  })

  test("destroys the session a gated sign-in just created", async () => {
    users()[0]!.twoFactorEnabled = true
    store.session = []
    await signIn()
    expect(sessions()).toHaveLength(0)
  })

  test("leaves a pending challenge and an attempt counter behind", async () => {
    users()[0]!.twoFactorEnabled = true
    store.verification = []
    await signIn()
    const identifiers = verifications().map((row) => row.identifier as string)
    const challenge = identifiers.find(
      (id) => id.startsWith("2fa-") && !id.startsWith("2fa-attempts-"),
    )
    expect(challenge).toBeDefined()
    // The counter the plugin's own verify endpoints consume. Starts spent-nothing, not absent: an
    // absent row reads as an invalid cookie and the challenge would be unusable.
    expect(identifiers).toContain(`2fa-attempts-${challenge}`)
    const userId = users()[0]!.id
    expect(verifications().find((row) => row.identifier === challenge)?.value).toBe(userId)
  })

  test("sends a browser sign-in to the challenge page", async () => {
    users()[0]!.twoFactorEnabled = true
    const result = await signIn()
    const location = result?.headers?.get("location")
    expect(location).toBe(CHALLENGE_URL)
  })
})
