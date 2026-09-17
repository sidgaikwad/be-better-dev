Double charging a customer is the worst thing a payment system can do. Guaranteeing it happens exactly once looks intractable until you split it in two.

## The decomposition

An operation executes exactly once if it executes **at least once** and **at most once**.

Those are independent problems with independent mechanisms. Retries give at-least-once. Idempotency gives at-most-once. Together they give exactly-once, and neither alone does.

This is the same decomposition as the message queue section, and it is worth recognizing rather than rederiving: the machinery is identical, the stakes differ.

## At least once: retry

A network error or timeout means you do not know whether the payment happened, so you try again.

Strategies, in rough order of usefulness:

- **Immediate retry.** Right for a failure you know is instantaneous, wrong for anything else.
- **Fixed interval.** Simple, and synchronizes retries across clients.
- **Incremental.** Growing waits.
- **Exponential backoff.** Double the wait each time: 1s, 2s, 4s. The default for anything that might be down for a while.
- **Cancel.** For a permanent failure, since retrying an invalid card never succeeds.

Use exponential backoff with jitter when the cause might persist. An aggressive retry policy against a struggling PSP adds load to something already failing, which is the notification section's argument, and here it also risks tripping the PSP's own rate limits.

When you return a retryable error, send a `Retry-After` header so clients do not each invent their own schedule.

## At most once: idempotency

Two ways a double payment arises:

1. The customer clicks pay twice on the hosted page.
2. The PSP processed the payment successfully and the response was lost, so your system retries something that already happened.

The second is the dangerous one, because from your side a lost response and a failed payment are identical.

The fix is an **idempotency key**: a unique value generated before the attempt and sent with every retry. The PSP records it, and a second request carrying the same key returns the result of the first rather than charging again.

Generated before, which is the detail that matters. A key generated per attempt makes each retry a distinct request and defeats the whole mechanism. It is the same construction as the hotel reservation's `reservation_id`: the identity of the operation exists before the operation is attempted.

On your side, the same key is the primary key or a unique constraint on the payment order, so a duplicate insert fails at the database rather than in application logic that can be wrong.

## Failure routing

Not all failures are equal, so they route differently:

1. Is the failure retryable? Transient network and timeout errors are; an invalid card or a declined transaction is not.
2. Retryable failures go to a **retry queue** and are attempted again with backoff.
3. Non-retryable failures are recorded and surfaced to the customer.
4. A message that exhausts its retries goes to a **dead letter queue** for investigation.

The dead letter queue is not optional here. A payment that failed repeatedly for unknown reasons is money that did not move for a customer who expected it to, so it needs a person, and a queue nobody monitors is a queue of unresolved customer problems.

## Predict, then verify

You send an idempotency key with each payment. The PSP times out, you retry with the same key, and it times out again. After ten minutes you still have no response. Was the customer charged?

Answer: you do not know, and the design has to make that knowable rather than guess. The timeouts tell you nothing about what happened on the PSP's side, since the request may have succeeded and the response lost, twice. Retrying more does not resolve it: the idempotency key guarantees you will not charge twice, so retrying is safe, and it may keep timing out. What resolves it is asking a different question, which is the part people miss. Every PSP provides a lookup by idempotency key or reference, so the correct move after repeated timeouts is to stop retrying the charge and start polling the status endpoint until it reports succeeded or failed definitively. That converts an unknown into a known using a call that is safe to repeat. The general principle: when a write's outcome is unknown, the resolution is a read, and any integration that can write but not query its own result is one you cannot build a reliable system on. That is worth asking about when evaluating a payment provider.
