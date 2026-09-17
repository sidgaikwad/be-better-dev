The algorithm is the part people prepare. The part that decides whether a rate limiter is any good in production is everything around it: how rules are expressed, what happens to a refused request, and how you find out the limits are wrong.

## Rules as configuration

Limits change often and for business reasons, so they belong in configuration rather than in code. Lyft's open-source limiter expresses them like this:

```yaml
domain: auth
descriptors:
  - key: auth_type
    value: login
    rate_limit:
      unit: minute
      requests_per_unit: 5
```

Five login attempts per minute. Another rule in another domain might allow five marketing messages per day.

The shape worth copying is the descriptor: a key and value that identify what is being limited, rather than a hardcoded notion of "per user". That is what lets one limiter enforce per-user, per-IP, per-endpoint and per-plan-tier rules without new code for each.

Rules live on disk and are pulled into a cache by a worker, so the limiter reads them from memory on the request path rather than from a file. A rule change propagates in seconds without a deploy, which matters because the usual time to change a limit is during an incident.

## Refusing well

A throttled request returns 429 with `X-Ratelimit-Limit`, `X-Ratelimit-Remaining` and `X-Ratelimit-Retry-After`.

Dropping is not the only option. For some workloads, enqueue the refused request and process it later. If orders are being throttled because the system is overloaded, throwing them away costs revenue while queueing them costs latency, and latency is the better failure. For a read, queueing is pointless: the client has moved on.

The rule of thumb: refuse reads, queue writes that represent intent you do not want to lose.

## Hard and soft

A hard limit is never exceeded. A soft limit may be exceeded briefly.

Most limits should be soft, because most exist to bound cost and load over time rather than to enforce an exact number, and a soft limit absorbs the bursts that real clients produce. Hard limits belong where exceeding is genuinely unacceptable: spending caps and security controls.

## Other layers

Everything here is application-level, HTTP, layer 7. Rate limiting also exists lower down: `iptables` can limit by IP address at layer 3, and it is much cheaper per packet because it never reaches your application.

Layer 3 cannot see who the user is or which endpoint they called, so the two are complementary. Volumetric floods are cheapest to drop at the network layer; per-user and per-endpoint fairness has to be done where that information exists.

## Monitoring

The limiter needs its own metrics, because a rate limiter is a component that fails silently in both directions.

Too strict and you are dropping legitimate traffic, which shows up as 429s to well-behaved clients and, eventually, as support tickets rather than as an alert. Too loose and it does nothing, which shows up as an outage it was supposed to prevent.

Track the 429 rate per rule, which clients are hitting limits, and whether the same clients hit them repeatedly. A flash sale that trips limits for thousands of real customers is a sign the algorithm is wrong for that traffic shape rather than that the customers are misbehaving, and the fix is usually to move to token bucket so a burst is permitted.

## Predict, then verify

You limit login attempts to 5 per minute per account. An attacker with a list of a million usernames tries 3 passwords against each. Does the limiter stop them?

Answer: no, and the reason is that the limit is keyed on the wrong thing. Three attempts per account is under the five-per-minute rule, so every request is allowed, and the attacker is not attacking one account but a million of them in parallel. This is credential stuffing, and a per-account limiter is structurally blind to it because no individual account misbehaves. Catching it needs a second rule on a different descriptor: failed logins per IP, per subnet, or globally across all accounts, since the one thing that is anomalous is the aggregate failure rate. This is the general lesson about rate limiting, and the reason the descriptor model earns its complexity: a limiter only sees the dimension you keyed it on, so the question is never "what is the limit" but "what is the limit per what", and a serious system runs several rules on several dimensions at once.
