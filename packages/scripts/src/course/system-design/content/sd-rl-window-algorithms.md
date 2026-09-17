The three remaining algorithms all count requests in a time window. They differ in how honest that window is, and the progression from the first to the third is a small lesson in trading accuracy for memory.

## Fixed window counter

Cut the timeline into fixed windows, say one minute each, and keep a counter per window. Every request increments it. Over the threshold, refuse, until the next window starts and the counter resets.

It is the cheapest thing that works: one integer per client, and in Redis it is two commands, `INCR` and `EXPIRE`.

It has one serious flaw, and it is worth being able to draw. Suppose the limit is 5 per minute, and windows reset on the round minute:

- Between 2:00:00 and 2:01:00, a client sends 5 requests, all near 2:00:59.
- Between 2:01:00 and 2:02:00, it sends 5 more, all near 2:01:01.

Both windows are within their limit. But in the rolling minute from 2:00:30 to 2:01:30, ten requests went through, which is twice the limit. The boundary is a free reset, and a client that knows where it is gets double the quota whenever it wants.

## Sliding window log

Fix that by dropping windows entirely and keeping timestamps. Store one per request, typically in a Redis sorted set. On each new request, discard timestamps older than the window, add the new one, and compare the size of the log to the limit.

This is exactly correct. For any rolling window, the count is right, with no boundary to exploit.

The cost is memory, and it is worse than it first appears: rejected requests still have their timestamps stored. A client hammering you at 100 times the limit generates 100 times the log entries, so the algorithm spends the most memory on precisely the client you least want to spend anything on.

## Sliding window counter

The hybrid, and the one used in practice. Keep a counter per fixed window as before, but when evaluating a request, weight the previous window's count by how much of it the rolling window still overlaps.

Limit is 7 per minute. The previous minute had 5 requests, the current minute has 3 so far, and the request arrives 30% into the current minute, so the rolling window overlaps 70% of the previous one:

```text
estimate = 3 + (5 × 0.70) = 6.5
```

Round down to 6, which is under 7, so the request is allowed. One more and the limit is reached.

This smooths the boundary spike without storing any timestamps: two counters per client. It is an approximation, because it assumes the previous window's requests were spread evenly through it, which they were not.

How much does that assumption cost? Cloudflare measured it across 400 million requests: 0.003% were wrongly allowed or wrongly rejected. Three in a hundred thousand.

## Choosing

Sliding window counter is the right default for a shared limiter at scale: near-perfect accuracy, two integers per client, no exploitable boundary. Fixed window is fine when the boundary spike genuinely does not matter, and its simplicity is real. Reach for sliding window log only when the limit must be exactly right, for example a security control where one extra login attempt matters, and accept paying memory to the abusers.

## Predict, then verify

A client is limited to 100 requests per minute by a fixed window counter. What is the maximum number it can send in any 60-second period, and what does it need to know to achieve it?

Answer: 200, and it only needs to know when the window boundary falls. Send 100 in the last instant of one window and 100 in the first instant of the next, and a 60-second period straddling the boundary contains 200. Discovering the boundary is trivial from the outside, because it is usually the round minute, and even when it is not, a client can find it by watching when its quota resets. So the real limit enforced by a fixed window counter is twice the configured one, and the right way to state this in an interview is exactly that: "this limits to 2x the nominal rate in the worst case, which is fine if the limit is about long-run cost and not fine if it is about protecting a downstream service from a spike."
