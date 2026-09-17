Both integration tests pass. An author can POST an issue and confirmed subscribers receive it. Ship it? The chapter's answer is to first write out exactly why not, because a vague sense that the code is "not production ready" cannot be scheduled, while a named limitation can become a chapter. This is the payoff of the strategy from the user-story lesson: ship the thin slice, then say out loud what the slice does not include.

## Five debts, by name

**Security.** `POST /newsletters` is unprotected. Anyone who discovers the URL can broadcast anything to the entire mailing list, unchecked.

**You only get one shot.** The instant the request lands, content goes to everyone. No draft state, no review step, no undo. A typo in the subject line is a typo in every inbox.

**Performance.** Sends are sequential: from the naive-loop lesson, one email in flight at a time, each awaited to completion before the next starts. At 10 subscribers, unnoticeable. At a sizeable audience, the request's wall-clock time is the sum of every round-trip to Postmark: in the book's words, latency is going to be horrible.

**Fault tolerance.** If one dispatch fails, `?` bubbles the error and the caller gets a 500. Every subscriber after the failure point never receives the issue; the failed send is never retried; nothing durable records who got what. One flaky network call amputates the rest of the list.

**Retry safety.** Now take the caller's seat. The POST timed out, or returned 500. Retry it? Retrying re-delivers to everyone who already received the issue. The endpoint is not idempotent, so the standard remedy for a transient network failure, try again, is exactly what a consumer of this API must not do.

## Naming the semantics

Put precisely: the endpoint offers best-effort delivery. Not exactly-once, since a retry duplicates sends. Not at-least-once, since a mid-loop failure silently drops the tail of the list. Within one request each subscriber is attempted at most once, and no memory survives across requests. "Best effort" sounds harmless in a design document; spelled out as "some subscribers may get an issue zero times, and any retry mails most of the list twice", it reads like what it is.

The last three debts share one root: delivery is synchronous, request-scoped work. The entire run lives inside one HTTP request handler, so its duration scales with the audience (performance), its failure domain is one connection at one instant (fault tolerance), and its only retry interface is re-submitting the whole job (retry safety). Work shaped like this belongs in a background job: the endpoint should durably record that issue X is to be delivered, return quickly, and let a worker drain the backlog with retries, checkpoints, and idempotent sends. The naive version is not wrong to exist; it is wrong to stay.

## The catalog is a syllabus

The book triages: the one-shot publish and the sequential sends are annoying but livable for a while. Fault tolerance and retry safety are serious, with visible impact on the audience. Security is non-negotiable: the endpoint must be protected before this API is released at all.

That triage is the table of contents for what follows. Chapter 10 takes the security debt: authentication and authorization for `POST /newsletters`. Chapter 11 takes fault tolerance and retry safety together: idempotency keys make retries safe, and the delivery loop moves out of the request handler into a queue-backed background worker. The queue section in Part 4 rebuilds that worker with real concurrency, killing the performance debt. Each effort starts from working code plus one precisely named defect, which was the point of building the naive version first.

## Predict, then verify

The author POSTs an issue to 5,000 confirmed subscribers. Postmark hiccups on subscriber 2,317: `send_email` returns `Err`. What does each subscriber see, what does the author see, and what happens if the author clicks "publish" again?

Answer: subscribers 1 through 2,316 have the issue in their inbox, each send having completed before the next began. Subscribers 2,317 through 5,000 receive nothing: the `?` after `with_context` aborted the loop. The author sees a 500 with no indication of how far the loop got, because nothing recorded it. A second POST restarts from the top of the list: if it succeeds, 2,316 people now have the issue twice; if it fails partway again, the split moves somewhere new. That single incident is the fault-tolerance debt and the retry-safety debt in one frame, and chapter 11 exists because of it.
