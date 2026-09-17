Leave newsletters for a moment. A payments API exposes `GET /balance`, `GET /payments`, and `POST /payments`. Your balance is 400 USD and you submit a transfer of 20. The API returns `200 OK`; your balance is 380 and the beneficiary has the money. Then you double-click Pay now, and the identical request fires again.

What should the second request do? The book pins down retry-safety with a definition built on observation: an endpoint is retry-safe, or idempotent, when the caller has no way to tell, through the API itself, whether a request was processed once or several times. For the payment: balance stays 380, `GET /payments` lists one transfer, the beneficiary receives nothing extra. A server log line saying "duplicate detected" changes none of this; callers cannot read your logs, so logs are not part of the domain model the definition ranges over. One consequence follows immediately: the retried request must receive a success response semantically equivalent to the first, because an error would let the caller observe the difference.

## Intent travels as a key

A harder question hides inside the word "duplicate". A user might legitimately pay the same landlord the same 900 USD twice, in January and in February: two operations, not a retry. A heuristic like "identical requests within five minutes are one operation" misclassifies in both directions, and both mistakes are expensive: a swallowed second payment, or a double charge from a slow retry. Only the caller knows their intent, so the API asks them to declare it: an idempotency key, a unique identifier the caller generates for each operation they mean to perform, usually sent as an `Idempotency-Key` header. (An IETF draft tried to standardize that header; the draft expired, but the convention is entrenched.) The server's rules become mechanical:

- same key, same request: one operation; the second arrival is a retry
- different keys, identical requests: two distinct operations
- same key, different request: process the first, reject the second

The book is upfront that it will not implement the third rule's likeness check. Deciding whether two requests are "the same" (which headers count? byte-for-byte bodies? semantic equality?) is a rabbit hole it declines.

`POST /admin/newsletters` is submitted by a browser form, and we do not control a browser's headers, so the key rides in the body: `GET /admin/newsletters` embeds `uuid::Uuid::new_v4()` in a hidden input, `FormData` gains an `idempotency_key` field, and a newtype validates it on the way in (non-empty, shorter than 50 characters), the same type-driven move used for `SubscriberEmail`.

## Two ways to be idempotent

**Stateful: save and replay.** Process the first request, then store the full HTTP response next to the idempotency key. When a retry arrives, skip the handler entirely and return the stored response. Postmark is never called a second time.

**Stateless: deterministic keys.** Store nothing. Every attempt runs the handler as normal, but each downstream Postmark call carries an idempotency key derived deterministically from the subscriber id plus a fingerprint of the issue content. A retry re-executes everything; the provider sees identical keys and deduplicates.

They are not equivalent, and the difference is time. Suppose someone confirms a subscription between the first attempt and its retry. The stateless approach re-fetches the current subscriber list, so the newcomer receives the issue. The stateful approach replays a frozen response and processes nothing. Elapsed time leaks into the stateless outcome; the book calls it the workflow-scale cousin of a non-repeatable read. For a newsletter, the discrepancy is benign.

The actual decision is made for us: Postmark exposes no idempotency mechanism, so a deterministic key has nowhere to go. Stateless is impossible, and save-and-replay wins by forfeit. It is also the trickier build, which the book counts as good news: storing responses drags in schema design, HTTP streaming, and cross-request races, the subjects of the next two lessons.

## Predict, then verify

Under save-and-replay, suppose the publish form reused yesterday's idempotency key (same logged-in author) for today's brand-new issue. What would the endpoint do?

Answer: find yesterday's saved response stored under that (user, key) pair and replay it: a 303 redirect and a success message, with no processing at all. Today's issue is silently never sent. With no likeness check, the key alone declares intent, which is exactly why the form mints a fresh random UUID on every GET, and why keys are scoped per user so one author's keys cannot collide with another's.
