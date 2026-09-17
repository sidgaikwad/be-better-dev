Every message queue conversation eventually produces the sentence "we need exactly-once delivery". Here is the two-line program that shows why no broker can sell it:

```rust
send_confirmation_email(&job).await?;   // the side effect happens here
delivery.ack().await?;                  // the broker learns about it here
```

A worker can die between those lines. The email left; the ack did not. The broker now knows only that a delivery is outstanding to a dead consumer, and it cannot distinguish "crashed before the send" from "crashed after": from where the broker sits, the two histories look identical. Whatever it does next is a guess, and the two possible guesses are the two guarantees that actually exist.

## The two honest options

**At-most-once**: ack before processing, or use a broker that never waits for acks. If the worker dies mid-send, the message is already forgotten and nothing is redelivered. Work can vanish; work is never duplicated. Right for data whose next update supersedes this one: metrics ticks, presence, live progress updates.

**At-least-once**: process, then ack. If the worker dies anywhere before the ack, the broker redelivers. Work is never lost; work can be duplicated, including the case above where the effect completed and only the ack was lost. This is the default for anything that matters, and it is a contract with teeth: redelivery is not an edge case, it is the mechanism. A consumer that misbehaves on duplicates is a bug waiting for its first network blip.

**Exactly-once delivery** would require the side effect and the ack to commit atomically across two systems that share no transaction: your email provider and the broker. No protocol does that for arbitrary effects. When Kafka advertises "exactly-once semantics", the claim is real but scoped: transactions covering consume-and-produce where both ends are Kafka topics. The moment the effect escapes the broker (an SMTP call, an HTTP POST, a row in your Postgres), you are back to at-least-once.

## The honest half, which you already built

Exactly-once outcomes are achievable: at-least-once delivery plus an idempotent consumer. Chapter 11 built precisely this. Before sending, the worker consults a durable record of what has already been done, keyed on something stable (issue id plus subscriber email); a redelivered message finds the record and acks without sending. Deliveries per message: one or more. Emails per subscriber: one. The guarantee does not live in the broker. It lives in your consumer, and every broker in this section assumes you hold up that half.

## Ordering, and its fine print

Brokers advertise FIFO, and it holds right up until you use the features that make a queue worth running:

- **Multiple consumers**: workers take messages 1 and 2 concurrently; 2 can finish first.
- **Retries**: message 1 fails and is redelivered; it now runs after 2, 3, and 4.
- **Partitions**: order holds within a partition, never across them.

The workable stances are per-key ordering (route everything about one subscriber through one partition or queue, so order holds where it matters) or reordering-tolerant consumers (each message carries enough state to apply in any order). Global FIFO plus parallelism plus retries is not on the menu anywhere, at any price.

## One level deeper

The ack itself is just a message on a TCP connection, so every guarantee above is built from timeouts and bookkeeping. Broker-side, redelivery triggers when a connection dies or an ack deadline passes, and that machinery is exactly as ambiguous as the crash window: the broker redelivers because it lacks information, not because it knows the work failed. Read a broker's guarantee documentation with that lens and the marketing evaporates on its own.

## Predict, then verify

A worker receives a message, sends the email, and its connection to the broker drops before the ack goes out. What does the broker do, what does the next worker see, and where exactly is the duplicate email prevented?

Answer: the broker sees a consumer die holding an unacked delivery and requeues it; a second worker receives it flagged as redelivered, with no way to know the send already happened. The duplicate is prevented in exactly one place: the consumer's idempotency check finds the record the first worker wrote and acks without sending. The broker did its half (nothing lost); the consumer did the other half (nothing done twice). That division of labor is the whole theory of reliable messaging.
