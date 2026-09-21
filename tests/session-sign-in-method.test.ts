import { beforeAll, describe, expect, test } from "bun:test"

import { resolveSignInMethod } from "../packages/auth/src/sign-in-method"

// Imported by path rather than by name because the repo root has no better-auth dependency, and
// adding one would be a manifest edit for a test: this repo splits its zod version on those, which
// breaks the fumadocs types and the auth dts build. The package that does depend on it is one
// directory away, so its copy is used directly.
const { betterAuth } = await import("../packages/auth/node_modules/better-auth/dist/index.mjs")
const { memoryAdapter } =
  await import("../packages/auth/node_modules/better-auth/dist/adapters/memory-adapter/index.mjs")

// What this file is for: resolveSignInMethod is a pure function and tested as one next door, but it
// only does anything if Better Auth hands a session create hook an endpoint context carrying the
// path. Nothing in the types promises that, since AuthEndpointContext is Partial. So the mechanism
// is exercised end to end against an in-memory instance wired exactly like packages/auth: same
// hook, same additionalFields, same resolver. Email sign-in stands in for the social callback
// because it is the one session-minting endpoint reachable without an external identity provider.

// The memory adapter refuses a model it was not handed a table for, so every model the flow
// touches is declared up front.
const store: Record<string, unknown[]> = { account: [], session: [], user: [], verification: [] }
let auth: ReturnType<typeof betterAuth>

const sessions = () => store.session as Array<Record<string, unknown>>

beforeAll(async () => {
  auth = betterAuth({
    baseURL: "http://localhost:3000",
    secret: "test-secret-that-is-long-enough-to-be-accepted",
    database: memoryAdapter(store),
    emailAndPassword: { enabled: true },
    session: {
      additionalFields: {
        signInMethod: { type: "string", required: false, input: false },
      },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (_session: unknown, ctx: unknown) => {
            const signInMethod = resolveSignInMethod(ctx as never)
            return signInMethod ? { data: { signInMethod } } : undefined
          },
        },
      },
    },
  })

  await auth.api.signUpEmail({
    body: { email: "someone@example.test", name: "Someone", password: "correct-horse-battery" },
  })
})

describe("session.signInMethod", () => {
  test("the hook receives the endpoint path and writes the column", async () => {
    await auth.api.signInEmail({
      body: { email: "someone@example.test", password: "correct-horse-battery" },
    })
    const latest = sessions().at(-1)
    expect(latest?.signInMethod).toBe("email")
  })

  test("a path the resolver does not know leaves it null", async () => {
    // Sign-up mints a session through /sign-up/email, which is deliberately not in the map: it is
    // not a sign-in method, and an unclassified session must stay unclassified.
    const first = sessions().at(0)
    expect(first?.signInMethod ?? null).toBeNull()
  })

  test("a request cannot name its own sign-in method", async () => {
    // input: false is the whole reason a gate may trust this column. Without it, anyone able to
    // sign in could hand themselves whatever method a future exemption keys on.
    await auth.api.signInEmail({
      body: {
        email: "someone@example.test",
        password: "correct-horse-battery",
        signInMethod: "sso",
      } as never,
    })
    const latest = sessions().at(-1)
    expect(latest?.signInMethod).toBe("email")
    expect(latest?.signInMethod).not.toBe("sso")
  })
})
