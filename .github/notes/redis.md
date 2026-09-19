# Redis: what it would actually fix here

Status: not started, no Redis in the repo today. Raised 2026-09-19 while speccing passkeys
(`.github/notes/passkeys.md`), which prompted "shouldn't we just use Redis for this?".

Short version: not for passkeys. For the rate limiters, which are currently in-memory on
serverless and therefore close to decorative.

---

## Next action

Decide whether the rate limiter is worth fixing before more unauthenticated endpoints ship.
If yes, the work is Upstash + `RedisStore` + `secondaryStorage`, about 2 hours (Part 4).
If no, write down that it is known and deliberate, because right now it reads as an oversight.

---

## The finding

There are **two** rate limiters in this app. Both store counters in process memory.

|             | Where                                      | Scope                             | Limits                            | Storage                                         |
| ----------- | ------------------------------------------ | --------------------------------- | --------------------------------- | ----------------------------------------------- |
| Hono        | `api/hono/src/middlewares/rate-limiter.ts` | every route (`app.use("*", ...)`) | `HONO_RATE_LIMIT`, default 60/min | `MemoryStore` (default, no `store` passed)      |
| Better Auth | its own middleware                         | `/api/auth/*` only                | 100 per 10s                       | `"memory"` (default when no `secondaryStorage`) |

Verified in source:

- `rateLimiter({ limit, windowMs, keyGenerator, handler })` at
  `api/hono/src/middlewares/rate-limiter.ts:31` passes no `store`. `hono-rate-limiter` falls back to
  `MemoryStore`.
- Better Auth `create-context.mjs:174`:
  `storage: options.rateLimit?.storage || (options.secondaryStorage ? "secondary-storage" : "memory")`.
  We pass no `secondaryStorage` in `packages/auth/src/index.ts`, so: memory.
- Better Auth `create-context.mjs:171`: `enabled: options.rateLimit?.enabled ?? isProduction`.
  So the auth limiter is **off in dev and on in production**, which is the worst combination for
  noticing a problem: you cannot reproduce it locally.

## Why in-memory is a problem here specifically

The API deploys to Vercel (`api/hono/vercel.json`, `framework: hono`, output `vercel-bundle`).
Serverless means N instances, each with its own `Map`, each discarded on cold start. So
`HONO_RATE_LIMIT=60` really means "60 per instance per window, reset whenever Vercel feels like it".
An attacker does not need to do anything clever; ordinary concurrency spreads them across instances.

This gets sharper with passkeys. `POST /api/auth/passkey/verify-authentication` is unauthenticated
and does signature verification plus a database lookup per call. It is exactly the shape of endpoint
the limiter exists to protect.

Note the self-hosted path (`Dockerfile`, `docker-compose.yml`) is less bad but not fixed: memory is
per container, so one replica is correct and two are not.

## A second, separate bug in the same file (FIXED 2026-09-19)

`generateRateLimitKey` falls back to:

```ts
return `ip:${findIp(c.req.raw) || randomUUIDv7()}`
```

When `findIp` returned nothing, every request got a **fresh random key**, i.e. its own bucket, i.e.
no limit at all. A fail-open default.

Now fails closed onto a shared `ip:unknown` bucket, with a one-time `console.warn` so the condition
is visible rather than silent. The warning matters because the two failure modes look identical from
outside: see the unresolved `x-forwarded-for` question below.

**This is an upstream bug, not a fork bug.** `nrjdalal/zerostarter` ships the identical function.
Worth sending upstream.

**Unverified and worth checking before touching it:** on the public-suffix path
(`web/next/src/lib/config.ts`) the browser calls the _web_ origin and Next's `/api/:path*` rewrite
proxies to the API. If that proxy does not forward the client IP, the API sees Vercel's own address
for everybody, and the failure flips from "no limit" to "every user shares one 60/min bucket". Both
are wrong, in opposite directions. Read the real `x-forwarded-for` on a deployed request (the
`/headers` route is dev-only, so add a temporary log or check Vercel's request logs) before
choosing a fix.

---

## What Redis fixes, and what it costs

**Free once `secondaryStorage` exists** (no extra config):

1. Better Auth's limiter flips to `"secondary-storage"` automatically, per the default above.
2. Passkey challenges move out of Postgres into Redis (`createVerificationValue` /
   `consumeVerificationValue` route through it unless `verification.storeInDatabase` is set).
3. Session lookups get a cache in front of Postgres.

**One small piece of work:**

4. The Hono limiter needs its store passed explicitly. `hono-rate-limiter@0.5.3` already exports
   `RedisStore` from the main package, so there is nothing new to install for it and no
   `@hono-rate-limiter/redis` (whose peer range stops at `^0.2.1` and would not match us anyway).

## What Redis does NOT fix

Be honest about this, because "add Redis for caching" is the kind of thing that sounds free and is
not.

- **General read caching.** The heavy routes (`learn/map`, `leaderboard`) are per-user queries
  against Neon. There is no shared hot read to cache, and no measurement saying they are slow.
- **Session reads.** The 300s cookie cache in `packages/auth/src/index.ts` already absorbs most of
  this without a network hop. Redis would add a round trip to a path that currently has none.
- **Passkey challenges.** Two extra Postgres round trips per sign-in. Not a bottleneck.

So the case for Redis is the rate limiter and correctness under multiple instances. It is not
latency. If the rate limiter does not worry you, there is no strong reason to add Redis yet.

---

## Implementation sketch, if we go

About 2 hours.

### 1. Provision (20 min)

Upstash, via the Vercel marketplace so the env vars land in the project automatically.
Upstash REST rather than TCP Redis: serverless functions and TCP connection pools go badly together,
and `RedisStore`'s `RedisClient` type is `{ scriptLoad, evalsha, decr, del }`, which is the
`@upstash/redis` shape already.

`packages/env`: add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, **both optional**, so a
fork or a local stack with no Redis still boots. Every consumer below branches on their presence.

### 2. Hono limiter (30 min)

`api/hono/src/middlewares/rate-limiter.ts`: pass `store: new RedisStore({ client })` when the env
vars exist, keep `MemoryStore` when they do not. Fix the `randomUUIDv7()` fallback in the same pass.

### 3. Better Auth secondaryStorage (30 min)

`packages/auth/src/index.ts`: add `secondaryStorage` when the env vars exist. Interface is
`{ get, set, delete }` plus optional `increment` and `getAndDelete`. Implement `getAndDelete`,
because the verification-consume path warns and falls back to a non-atomic read-then-delete without
it, and an atomic consume is the whole point of a one-time challenge.

### 4. Verify (40 min)

The failure mode is invisible in dev (auth limiter off locally, one instance anyway), so verify on a
preview deploy, not on localhost. Hammer one endpoint past the limit from a single client and
confirm 429 holds across repeated cold starts rather than resetting.

---

## Decisions

1. **Now or after passkeys?** After. Passkeys work on Postgres and follow Redis for free later, so
   this is not on the critical path. But the moment `verify-authentication` is public, the limiter
   matters more than it does today.
2. **Upstash or self-hosted Redis?** Upstash on the Vercel path. Self-hosted only matters if the
   Docker deployment becomes the primary one.
3. **Optional or required env?** Optional. The repo is a starter template; it must boot with no
   Redis.
4. ~~**Fix the `randomUUIDv7()` fallback separately?**~~ Done 2026-09-19, independent of Redis.

## Why upstream has no Redis

Checked, not assumed: cloned `nrjdalal/zerostarter` and grepped. No Redis, no Upstash, no cache
layer. The single hit is the author's own resume page listing "Redis (Upstash)" as a skill, so the
omission is a choice by someone who knows the tool, not an oversight.

The reasons visible in the template itself:

1. **One required service.** Upstream `.env.example` has exactly one mandatory external dependency,
   `POSTGRES_URL`. OAuth blank hides the button, PostHog blank disables analytics. Redis would make
   the required list two, against a "clone and run" pitch.
2. **Its own bar excludes it.** The README says "Every item below is wired and working out of the
   box, not just a dependency in `package.json`". An optional Redis that is usually absent fails
   that test, and a dual memory/Redis path in every consumer is exactly the complexity this note
   describes.
3. **Nothing in the stock template needs it.** No queues, no pub/sub, no cache layer, no
   cross-instance coordination. The one feature that does need it is the rate limiter, which is the
   one they got wrong.
4. **Postgres plus the session cookie cache covers the rest.** The 300s cookie cache removes the hot
   session read, Neon serves everything else.

**Correction to an earlier draft of this note:** upstream does not pretend the limiter works.
`web/next/content/docs/manage/rate-limiting.mdx:55` carries a warning callout saying the store is
in-process, that limits are "per-process, not shared across replicas", and that on serverless you
should "back the limiter with a shared store (for example Redis)". The same page documents the
API-key tier as a stub. So this is a known, documented limitation left to the fork, not an oversight.

That changes the framing but not the exposure: be-better-dev _is_ the fork, it _is_ on serverless,
and it has not done the thing the docs say to do. The gap is ours to close, not upstream's.

## What I did not verify

Only source was read (this fork, and upstream `nrjdalal/zerostarter` across all 18 branches).
No production traffic, no deployed request logs, no load test. The claim
"the rate limiter is close to decorative" follows from the code plus the serverless deployment
model, and has not been demonstrated against the running API. Confirm the `x-forwarded-for`
question above before acting on the key-generation half of this.
