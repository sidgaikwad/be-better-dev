import type { SectionSeed } from "../../types"

export const sdRateLimiter: SectionSeed = {
  slug: "sd-rate-limiter",
  title: "Design a rate limiter",
  description:
    "Token bucket and its four rivals, where the counter lives, and what a distributed limiter does about race conditions and synchronization.",
  badgeIcon: "🚦",
  badgeTitle: "Rate limiter",
  units: [
    {
      slug: "the-algorithms",
      title: "The algorithms",
      description: "Five ways to count, and what each one trades away.",
      lessons: [
        {
          slug: "sd-rl-why-and-where",
          title: "Why limit, and where",
          summary:
            "The three reasons to rate limit, the case for the gateway over your own code, and what a well-refused request looks like.",
          contentFile: "sd-rl-why-and-where.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is a client-side rate limiter never the enforcement point?",
              options: [
                "Clients cannot measure time accurately",
                "Client requests can be forged, and you often do not control the client",
                "It would require shipping the rules to every client",
                "Browsers block the required APIs",
              ],
              answer: 1,
              explanation:
                "Client-side limiting is a courtesy that keeps well-behaved clients from tripping the real limiter. Enforcement has to happen somewhere the client cannot modify.",
            },
            {
              kind: "mcq",
              prompt: "Which reason for rate limiting is most often forgotten in an interview?",
              options: [
                "Preventing denial of service",
                "Reducing load on servers",
                "Capping spend on paid third-party APIs",
                "Keeping bots out",
              ],
              answer: 2,
              explanation:
                "If an endpoint calls a paid credit check or payment API, every unthrottled request is money. The limiter is a spending cap, and that framing is often the one that wins the argument for building it.",
            },
            {
              kind: "predict",
              prompt: "The limiter's Redis becomes unreachable. Should the API keep serving?",
              options: [
                "Yes, always fail open: a protective component must not take down what it protects",
                "No, always fail closed: unenforced limits are unacceptable",
                "It depends on the rule, and the direction should be chosen per rule",
                "Yes, and the requests should be queued for later limiting",
              ],
              answer: 2,
              explanation:
                "Most rules should fail open, since a Redis blip becoming a total outage is worse than a window of unenforced limits. But a spending cap or a login-attempt control should fail closed, because an overrun costs more than a refusal. Pick per rule and say so.",
            },
          ],
        },
        {
          slug: "sd-rl-token-bucket",
          title: "Token bucket and leaking bucket",
          summary:
            "The two bucket algorithms, why bucket size is really a burst allowance, and when a perfectly smooth outflow is worth a queue.",
          contentFile: "sd-rl-token-bucket.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does the bucket size parameter actually control?",
              options: [
                "The long-run request rate",
                "How large a burst is permitted before the refill rate takes over",
                "How many clients the limiter can track",
                "The window over which requests are counted",
              ],
              answer: 1,
              explanation:
                "The refill rate bounds the long-run average; the bucket size is saved-up quota. Reason about it as how long a client may exceed the limit, which is a more useful framing than abstract capacity.",
            },
            {
              kind: "mcq",
              prompt: "Why is token bucket a better default than leaking bucket for a public API?",
              options: [
                "It uses less memory",
                "Its burst allowance matches how real clients behave: a page fires eight requests, then the user reads",
                "It requires only one parameter",
                "It cannot be exploited at window boundaries",
              ],
              answer: 1,
              explanation:
                "An algorithm that refuses those eight requests is technically enforcing an average and practically breaking your product. Leaking bucket is for when something downstream genuinely cannot absorb a burst.",
            },
            {
              kind: "predict",
              prompt:
                "A bucket holds 100 tokens and refills at 10 per second. A client pauses for a minute, then sends 30 per second. How long before it is throttled?",
              options: [
                "Immediately, since 30 exceeds 10",
                "About 5 seconds, then it is capped at 10 per second",
                "About 60 seconds, since a minute of idling earned 600 tokens",
                "Never, since the pause banked enough quota",
              ],
              answer: 1,
              explanation:
                "Overflow is discarded, so the idle minute refills to 100, not 600. Spending 30 and earning 10 drains 20 per second, so 100 tokens last 5 seconds. That window is exactly what the bucket size buys.",
            },
          ],
        },
        {
          slug: "sd-rl-window-algorithms",
          title: "Counting in windows",
          summary:
            "Fixed window and its free boundary reset, the sliding window log that is exact and expensive, and the hybrid that costs 0.003% accuracy.",
          contentFile: "sd-rl-window-algorithms.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A fixed window counter limits a client to 100 per minute. What is the most it can send in any 60-second period?",
              options: ["100", "150", "200", "Unbounded"],
              answer: 2,
              explanation:
                "100 at the end of one window and 100 at the start of the next puts 200 into a straddling minute. The boundary is a free reset and is trivial to find from outside, so a fixed window really enforces twice its nominal rate in the worst case.",
            },
            {
              kind: "mcq",
              prompt: "What is the specific memory problem with a sliding window log?",
              options: [
                "It stores a counter per window rather than per client",
                "Rejected requests still store their timestamps, so an abuser costs the most memory",
                "Sorted sets cannot expire entries",
                "It stores the full request body",
              ],
              answer: 1,
              explanation:
                "A client hammering at 100 times the limit generates 100 times the log entries, so the algorithm spends most memory on exactly the client you least want to spend anything on.",
            },
            {
              kind: "mcq",
              prompt:
                "The sliding window counter assumes the previous window's requests were evenly distributed. What did Cloudflare measure that assumption to cost?",
              options: [
                "About 3% of requests wrongly handled",
                "About 0.3% of requests wrongly handled",
                "About 0.003% of requests wrongly handled",
                "It could not be measured",
              ],
              answer: 2,
              explanation:
                "Three in a hundred thousand across 400 million requests. That is why the hybrid is the right default: near-perfect accuracy for two integers per client and no exploitable boundary.",
            },
          ],
        },
      ],
    },
    {
      slug: "at-scale",
      title: "At scale",
      description: "What breaks when there is more than one limiter, and how to run the thing.",
      lessons: [
        {
          slug: "sd-rl-distributed",
          title: "Races and synchronization",
          summary:
            "Why read-check-write leaks under load, why locks are the wrong fix, and why sticky sessions are not the answer to shared counters.",
          contentFile: "sd-rl-distributed.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Two concurrent requests both read a counter of 3, both check that 4 is under the limit, and both write 4. When does this happen most?",
              options: [
                "Randomly, at any traffic level",
                "At low traffic, when requests are spread out",
                "Exactly when the system is busiest, because the read-to-write window is occupied constantly",
                "Only when Redis is failing over",
              ],
              answer: 2,
              explanation:
                "The race lives in the window between read and write, and high concurrency keeps that window occupied. A limiter that leaks under load fails precisely when it is needed.",
            },
            {
              kind: "mcq",
              prompt: "Why is a lock the wrong fix for that race?",
              options: [
                "Redis does not support locks",
                "Every request pays acquisition and contention, making the limiter the slowest thing in the path",
                "Locks do not work across regions",
                "The lock would have to be held for the whole request",
              ],
              answer: 1,
              explanation:
                "A Lua script is the standard answer instead: Redis runs it atomically so read, check and write are one operation. The principle is to send the decision to where the data is rather than reading a value out and writing it back.",
            },
            {
              kind: "mcq",
              prompt: "Why not use sticky sessions so each client always reaches the same limiter?",
              options: [
                "Limiters cannot be addressed individually",
                "It reintroduces uneven load, servers that cannot be added usefully, and state lost on failure",
                "It would require the client to know the limiter's address",
                "Sticky sessions are incompatible with Redis",
              ],
              answer: 1,
              explanation:
                "It undoes everything the stateless web tier bought. A centralized store is the answer: the limiters become stateless and Redis holds the state, the same shape as moving sessions out of the web tier.",
            },
          ],
        },
        {
          slug: "sd-rl-operating",
          title: "Rules, refusals and monitoring",
          summary:
            "Descriptors rather than hardcoded dimensions, queueing writes but refusing reads, and why a limiter fails silently in both directions.",
          contentFile: "sd-rl-operating.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why express rules as key-value descriptors rather than a hardcoded per-user limit?",
              options: [
                "Descriptors are faster to evaluate",
                "One limiter can then enforce per-user, per-IP, per-endpoint and per-tier rules with no new code",
                "They compress better in the cache",
                "They are required by the HTTP 429 specification",
              ],
              answer: 1,
              explanation:
                "Rules also live on disk and are pulled into a cache, so a change propagates in seconds without a deploy. That matters because the usual moment to change a limit is during an incident.",
            },
            {
              kind: "mcq",
              prompt: "When should a refused request be queued rather than dropped?",
              options: [
                "Always, since dropping loses work",
                "Never, since queueing hides the limit from the client",
                "For writes representing intent you do not want to lose; refuse reads, since the client has moved on",
                "Only when the queue is empty",
              ],
              answer: 2,
              explanation:
                "Throttled orders thrown away cost revenue, while queued orders cost latency, and latency is the better failure. A queued read is pointless.",
            },
            {
              kind: "predict",
              prompt:
                "Logins are limited to 5 per minute per account. An attacker tries 3 passwords against each of a million usernames. Does the limiter stop them?",
              options: [
                "Yes, three attempts trips the per-account rule",
                "No: no single account misbehaves, so a per-account limiter is structurally blind to it",
                "Yes, once the global request rate exceeds the threshold",
                "No, but the 429 headers reveal the attack",
              ],
              answer: 1,
              explanation:
                'Credential stuffing needs a second rule on a different descriptor, such as failed logins per IP or globally, since the aggregate failure rate is the only anomalous thing. A limiter only sees the dimension you keyed it on, so the question is always "the limit per what".',
            },
          ],
        },
      ],
    },
  ],
}
