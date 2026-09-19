import { findIp } from "@arcjet/ip"
import { env } from "@packages/env/api-hono"
import { hash } from "bun"
import type { Context } from "hono"
import { rateLimiter } from "hono-rate-limiter"

import { jsonError } from "@/lib/error"

// findIp returns "" when it cannot attribute the request to a client address. The previous fallback
// minted a fresh key per request, which handed every unattributable request a bucket of its own: a
// limiter that never limits. Share one bucket instead, so the failure is restrictive rather than
// silent, and warn once so a deployment whose proxy strips the client address is visible in the logs
// rather than quietly throttling everyone together.
let warnedMissingClientIp = false

function clientIpKey(c: Context): string {
  const ip = findIp(c.req.raw)
  if (ip) return `ip:${ip}`

  if (!warnedMissingClientIp) {
    warnedMissingClientIp = true
    console.warn(
      "[rate-limit] no client address on the request, so unattributable traffic shares one bucket. In production this means whatever sits in front of the API is not forwarding a client address.",
    )
  }
  return "ip:unknown"
}

function generateRateLimitKey(
  c: Context,
  getUserId?: (c: Context) => string | undefined,
  getApiKey?: (c: Context) => string | undefined,
): string {
  const userId = getUserId?.(c)
  if (userId) return `userid:${userId}`

  const apiKey = getApiKey?.(c)
  if (apiKey) return `apikey:${hash(apiKey).toString(16)}`

  return clientIpKey(c)
}

interface RateLimiterConfig {
  limit?: number
  windowMs?: number
  getUserId?: (c: Context) => string | undefined
  getApiKey?: (c: Context) => string | undefined
}

export function createRateLimiter(config: RateLimiterConfig = {}) {
  const { limit = 60, windowMs = 60000, getUserId, getApiKey } = config

  return rateLimiter({
    limit,
    windowMs,
    keyGenerator: (c) => generateRateLimitKey(c, getUserId, getApiKey),
    handler: (c) => jsonError(c, 429, "TOO_MANY_REQUESTS", "Too Many Requests"),
  })
}

export const rateLimiterMiddleware = createRateLimiter({
  limit: env.HONO_RATE_LIMIT,
  windowMs: env.HONO_RATE_LIMIT_WINDOW_MS,
})
