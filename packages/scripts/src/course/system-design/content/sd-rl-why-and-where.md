A rate limiter caps how many requests a client may send in a period. Over the cap, requests are refused. Twitter allows 300 tweets per 3 hours. Google Docs allows 300 read requests per user per 60 seconds. The mechanism is simple; the interesting decisions are why you want one and where you put it.

## Three reasons

**Denial of service, deliberate or not.** A single client with a bad retry loop can generate the traffic of a hundred thousand normal ones. A rate limiter turns that into a bounded nuisance rather than an outage, and it does not need to distinguish malice from a bug, which is useful because you usually cannot.

**Cost.** This is the one candidates forget and the one finance notices. If your endpoint calls a paid third-party API, a credit check or a payment or a health record lookup, then every unthrottled request is money. A rate limiter is a spending cap.

**Load.** Excess traffic from bots and misbehaving clients crowds out real users. Limiting it lets you provision for demand rather than for abuse.

## Where it goes

**Not the client.** A client-side limiter can be forged by anyone who wants to, and you often do not control the client. Client-side limiting is a courtesy that keeps well-behaved clients from tripping the real limiter, and it is never the enforcement point.

**Server-side, in the application.** You control the algorithm completely and can use any data your application has. You also implement and operate it, in every service.

**Server-side, in a gateway.** An API gateway is a managed middleware that already does TLS termination, authentication and IP allowlisting, and usually offers rate limiting too. One place to configure, nothing to build.

The honest answer to which one is that it depends on what you already run:

- If you already have a gateway doing authentication, put the limiter there. Adding it is configuration.
- If you need an algorithm your gateway does not offer, or limits that depend on application state like a user's plan tier, implement it yourself.
- If you do not have the engineering time, buy it. Building a correct distributed rate limiter is more work than it looks, as the next lessons show.

Reach for the gateway by default. The limiter is infrastructure, not business logic, and the case for building one is a specific requirement rather than a preference.

## What the client sees

A throttled request gets HTTP 429, Too Many Requests. That is not optional politeness: a client that cannot distinguish "you are throttled" from "the server is broken" will retry hard and make things worse.

Send headers with it so a well-behaved client can self-regulate:

```text
X-Ratelimit-Limit: 100
X-Ratelimit-Remaining: 0
X-Ratelimit-Retry-After: 30
```

`Retry-After` is the one that matters. Without it, every throttled client retries on its own schedule, and they synchronize: all of them refused at once, all of them retrying at once, a second later. With it, and with jitter on the client side, the retries spread.

## Predict, then verify

You add a rate limiter as middleware in front of your API. The limiter's Redis goes down. What should happen to the API?

Answer: it should keep serving. The limiter is a protective component and it must not become a single point of failure for the thing it protects, so the correct behavior when it cannot reach its store is to fail open, allow the request, and shout loudly in your metrics. The reasoning is a comparison of harms: failing closed means a Redis blip is a total outage, while failing open means a window where limits are not enforced, and that window is survivable unless you are limiting something where an overrun is catastrophic. The exceptions are real and worth naming: a limiter that exists to cap spending on a paid API, or to enforce a security control like login attempts, should fail closed, because the damage from an overrun exceeds the damage from refusing. Pick the direction per rule, not once for the whole system, and say so.
