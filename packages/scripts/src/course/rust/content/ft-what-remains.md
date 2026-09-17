The chapter's last box is a confession: "Well, we almost made it." The book means the missing expiry mechanism for idempotency keys, but the code carries a few more IOUs, each flagged in the text or a footnote. This lesson is the inventory, because these footnotes are precisely the work production systems are made of.

First, the credit column. `POST /admin/newsletters` is idempotent under sequential and concurrent retries. Publishing is transactional: the issue row, its delivery tasks, and the idempotency stub commit or vanish together. Delivery is asynchronous, survives crashes because the queue is durable, and survives worker contention because of `SKIP LOCKED`. Every failure mode from the first lesson now has an answer, except the ones below, and knowing which ones is the point.

## The ledger

**Delivery retries.** `try_execute_task` deletes the task even when Postmark returns an error: logged, skipped, gone. For that subscriber the issue silently became at-most-once; a thirty-minute Postmark outage drops every task attempted during it. The book's sketch: add `n_retries` and `execute_after` columns to `issue_delivery_queue`, reschedule failures instead of deleting them, and space attempts with exponential backoff plus jitter rather than the worker loop's flat one-second sleep. A footnote adds the necessary refinement: distinguish transient failures (a 500, a timeout) from fatal ones (an invalid stored address that no amount of waiting will fix).

**Idempotency expiry.** Rows in `idempotency` live forever. That is unbounded growth, and it also means a key accidentally reused months later replays a stale response instead of publishing anything. `created_at` was put in the schema for exactly this moment; the fix is a sweeper, a periodic `DELETE FROM idempotency WHERE created_at < now() - interval '...'`. The book assigns it as an exercise "using what we learned on background workers", because an expiry job is just another worker loop.

**Observability of the queue.** The author is told the issue "will go out shortly" and given no way to watch it happen; a footnote suggests a per-issue progress page as an exercise. Operations needs the same numbers under different labels: queue depth, task age, failure rate. The worker already records `newsletter_issue_id` and `subscriber_email` on its tracing spans; what is missing is anything that aggregates spans into "issue 12 is 80 percent delivered".

**Fairness.** Concurrent requests bearing the same idempotency key all park on one row lock, each holding a connection while it waits. The mitigation, named in a footnote back when waiting was chosen over 409s: fair-usage limits, before someone turns your deduplication into a connection-exhaustion attack.

## The shape you keep

Strip the newsletter specifics and chapter 11 built a general machine: a producer records durable intent inside a transaction; consumers process it with at-least-once semantics; idempotency turns at-least-once into effectively-exactly-once processing. That triangle, in the vocabulary of the first lesson, is the core of every job queue and every event-driven system you will meet. Part 4 picks the design up twice: its queue section swaps the hand-rolled table for a dedicated job queue with retries, backoff, and dead-letter handling built in, and its event-driven section grows the same idea into services that communicate through durable events. When you get there, little will be new but the crate names.

The book itself signs off here. The project began as an empty skeleton and ends as a functional, tested, reasonably secure minimum viable product, and the project was never the goal: it was an excuse to learn what production-ready Rust feels like. The epilogue's opening question, whether Rust can be a productive language for API development, is one you can now answer from evidence rather than argument.

## Predict, then verify

Postmark goes down for thirty minutes. With the shipped worker code, what happens to every task the workers attempt during the outage, and which delivery guarantee is lost?

Answer: each send fails, the failure is logged with a "Skipping." message, and the task row is deleted anyway, so those subscribers never receive the issue. Delivery for them degraded from at-least-once to at-most-once, silently. With `n_retries` and `execute_after` in place, the same tasks would be rescheduled past the outage and at-least-once would hold, which is why retry bookkeeping sits at the top of the ledger.
