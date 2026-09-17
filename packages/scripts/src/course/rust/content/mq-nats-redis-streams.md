Between "a Postgres table" and "a Kafka cluster" there is a lot of room. Two systems fill it from opposite ends: NATS, a single small binary built around messages that stop mattering in seconds, and Redis Streams, a log living inside the Redis you have been running since the sessions chapter.

## Core NATS: at-most-once, on purpose

Core NATS is pub/sub over hierarchical subjects (`delivery.progress.42`) with wildcard subscriptions (`delivery.>`). There is no storage: the server forwards each message to the subscribers connected right now and forgets it. Nobody listening: the message is gone. A subscriber too slow to keep up gets disconnected rather than allowed to drag the server. That is at-most-once as a design, not a defect, and for the right data it is correct: live progress ticks, presence, cache invalidation, and internal request-reply, which NATS has built in. The official Rust client is async-nats:

```rust
use futures_util::StreamExt;

let client = async_nats::connect("nats://localhost:4222").await?;
let mut sub = client.subscribe("delivery.progress.>").await?;
client.publish("delivery.progress.42", "18500/50000".into()).await?;
if let Some(msg) = sub.next().await {
    println!("{}", String::from_utf8_lossy(&msg.payload));
}
```

**JetStream** is the persistence layer you can enable on the same binary: streams capture subjects to disk, consumers ack, unacked messages redeliver after a timeout. At-least-once, replay, retention policies: a real queue with a one-binary operational footprint, which is why it shows up at the edge and in IoT. The mental model: core NATS is the network; JetStream is a log recorded off the network.

## Redis Streams: the log you already run

`XADD` appends an entry (field-value pairs, with an id like `1754500000000-0`, milliseconds plus sequence) to a stream key. Consumer groups turn it into a work queue:

```bash
XADD issue_delivery '*' issue_id 42 email a@example.com
XGROUP CREATE issue_delivery workers 0
XREADGROUP GROUP workers worker-1 COUNT 10 BLOCK 5000 STREAMS issue_delivery '>'
XACK issue_delivery workers 1754500000000-0
```

`XREADGROUP` hands each entry to exactly one consumer in the group and records it in the group's **pending entries list** (PEL): delivered, not yet acked. `XACK` clears it. The hybrid is worth noticing: log-shaped storage like Kafka, per-message acks like RabbitMQ. From Rust, the `redis` crate exposes all of this as typed commands over the connection you already pool.

The caveats are just as concrete. Entries live in Redis memory, so you trim (`XADD ... MAXLEN ~ 100000`) or grow forever. Durability is whatever your Redis persistence is configured to (AOF fsync policy, RDB snapshots). And a stream is one key on one shard: there is no partitioning story beyond running several streams yourself.

## One level deeper: dead consumers are your problem

RabbitMQ requeues a dead consumer's messages the moment its connection drops. Redis has no connection-scoped ownership: if worker-1 dies holding 4 pending entries, they sit in the PEL charged to worker-1 indefinitely. Recovery is explicit: some worker must run `XAUTOCLAIM issue_delivery workers worker-2 60000 0` to take over entries idle longer than 60 seconds. Forget that loop and every crash strands messages, invisibly, until someone asks why subscriber 18,501 never got issue 42. The redelivery machinery brokers give you for free is, here, twenty lines you must remember to write.

## When each wins

- **Core NATS**: the message's value expires faster than you could retry it, or you want cheap service-to-service request-reply.
- **JetStream**: at-least-once with the smallest operational footprint in this section.
- **Redis Streams**: modest volume, Redis already in the stack, no new service to run.
- **Neither**: multi-team replayable history (Kafka) or routing topologies with retry budgets and dead letters (RabbitMQ).

## Predict, then verify

A live delivery-progress dashboard subscribes over core NATS and disconnects for 30 seconds during a deploy. Separately, delivery jobs flow through a Redis Stream, and worker-1 reads 10 entries, acks 6, and dies. What does each system do with the affected messages?

Answer: NATS drops the 30 seconds of progress ticks entirely, and it does not matter: the next tick supersedes them, which is exactly why at-most-once was the right purchase. Redis keeps the 4 unacked entries in the stream and in the PEL under worker-1's name, and redelivers them to nobody, ever, until another worker claims them past an idle threshold with `XAUTOCLAIM`. Both systems "lost a consumer"; the correct behavior is opposite in each, because the data's value over time is opposite.
