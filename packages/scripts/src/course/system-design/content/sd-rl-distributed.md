On one server a rate limiter is a counter in memory. The moment there are two servers, it is a distributed systems problem, and two specific things break.

## Where the counter lives

Not in a database: every request would pay a disk-backed read and write, and the limiter is supposed to be invisible in the latency budget.

In memory, in a shared store. Redis is the usual choice because it is fast and has exactly the two operations the naive algorithm needs:

- `INCR` increments a counter.
- `EXPIRE` sets a timeout so the counter deletes itself when the window ends.

That expiry matters more than it looks. Without it you accumulate one key per client per window forever, and the limiter's memory becomes a leak.

## Race condition

The naive implementation is three steps:

1. Read the counter from Redis.
2. Check whether `counter + 1` exceeds the limit.
3. If not, write `counter + 1` back.

Read, check, write, with a network round trip between each. Two concurrent requests both read 3, both conclude 4 is fine, and both write 4. The counter should be 5. Two requests were allowed where one should have been.

This is not rare. It happens exactly when the system is busiest, because the window between read and write is where the race lives, and at high concurrency that window is occupied constantly. A limiter that leaks under load is failing at precisely the moment it is needed.

**Locks are the obvious fix and the wrong one.** A lock per client per request means every request pays lock acquisition, contention and the risk of a holder dying while holding it. You have made the limiter the slowest thing in the request path.

Two better options:

- **A Lua script.** Redis runs it atomically on the server, so read, check and write become one operation with no window between them. This is the standard answer.
- **Sorted sets.** For the sliding window log, adding a timestamp and counting the set can be done with commands that do not require reading the value out first.

The principle underneath both: do not read a value, decide, and write it back. Send the decision to where the data is.

## Synchronization

The second problem. With several rate limiter instances, the web tier is stateless, so client 1's requests can hit limiter A on one request and limiter B on the next. If each limiter keeps its own counters, neither has the full picture, and a client spread across N limiters gets roughly N times its quota.

**Sticky sessions** would pin each client to one limiter. Do not. It reintroduces everything the stateless web tier lesson removed: uneven load, servers that cannot be added usefully, and state lost when one dies.

**A centralized store** is the answer. Every limiter reads and writes the same Redis, so there is one counter per client regardless of which instance handles the request. The limiters become stateless and the store holds the state, which is the same shape as moving sessions out of the web tier.

That store is now in the path of every request, so it needs the same treatment as any other critical dependency: replication, and a decision about what happens when it is unreachable.

## Predict, then verify

You run limiters in three regions against a Redis in each, synchronized between regions with eventual consistency. A client's limit is 100 per minute. What is the worst case they can actually send?

Answer: close to 300 in that minute. Cross-region replication takes tens to hundreds of milliseconds, so for that window each region's Redis believes it has the whole picture and allows up to 100 before the others' counts arrive. A client spraying requests at all three regions at once gets roughly the limit times the region count. This is the accepted cost of the design, and the right way to present it is as a deliberate trade: strict global accuracy would mean every request making a cross-region round trip, adding 150 ms to every call to enforce a limit that exists to protect you. The usual resolution is to set per-region limits at the global limit divided by the region count and accept some unfairness, or to reserve strict global counting for the few rules where an overrun is expensive, like spending on a paid API, and let the rest be approximate.
