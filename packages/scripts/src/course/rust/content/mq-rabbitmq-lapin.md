The first surprise in AMQP: you cannot publish to a queue. Producers publish to an **exchange** with a **routing key**; the exchange copies the message to every queue whose **binding** matches; consumers take from queues. Producer and consumer never name each other, which is the point: routing is broker-side configuration, not code. A **direct** exchange matches the routing key exactly, a **fanout** exchange copies to all bound queues, and a **topic** exchange pattern-matches (`delivery.*`). The default exchange (named `""`) has every queue bound under its own name, which is why simple work queues look like publishing "to a queue" after all.

lapin is the long-standing Rust AMQP client: async, runtime-agnostic, comfortable under tokio.

```rust
use lapin::{options::*, types::FieldTable, BasicProperties, Connection, ConnectionProperties};

let conn = Connection::connect(&amqp_url, ConnectionProperties::default()).await?;
let ch = conn.create_channel().await?;
ch.confirm_select(ConfirmSelectOptions::default()).await?; // enable publisher confirms
ch.queue_declare(
    "issue_delivery",
    QueueDeclareOptions { durable: true, ..Default::default() },
    FieldTable::default(),
).await?;

ch.basic_publish(
    "",                // default exchange
    "issue_delivery",  // routing key = queue name
    BasicPublishOptions::default(),
    &serde_json::to_vec(&job)?,
    BasicProperties::default().with_delivery_mode(2), // persist to disk
).await?   // publish sent
.await?;   // confirm received: the broker has it
```

Surviving a broker restart takes all three flags: durable queue, `delivery_mode(2)` on each message, and the confirm that tells you the broker accepted it. Each is separate, and forgetting any one quietly weakens the story.

## Acks, and prefetch as backpressure

```rust
use futures_util::StreamExt;

ch.basic_qos(10, BasicQosOptions::default()).await?; // at most 10 unacked here
let mut consumer = ch.basic_consume(
    "issue_delivery", "worker-1",
    BasicConsumeOptions::default(), FieldTable::default(),
).await?;

while let Some(delivery) = consumer.next().await {   // Consumer is a Stream
    let delivery = delivery?;
    match handle(&delivery.data).await {
        Ok(()) => delivery.ack(BasicAckOptions::default()).await?,
        Err(_) => delivery.nack(BasicNackOptions { requeue: true, ..Default::default() }).await?,
    }
}
```

RabbitMQ pushes messages at consumers, and `basic_qos` is what keeps the push honest: with prefetch 10, the broker stops sending once 10 deliveries are unacked, and each ack opens one slot. Recognize the shape: this is Part 2's bounded channel negotiated over TCP, capacity equal to the prefetch count, the ack playing the role of the receive that makes room. Skip `basic_qos` and prefetch is unlimited: subscribe one worker to a 50,000-deep queue and the broker firehoses the whole backlog into your process, chapter 9's memory profile rebuilt with extra infrastructure. When a channel or connection dies, its unacked deliveries return to the queue flagged `redelivered`: at-least-once, exactly as the last lesson specified.

## Poison messages and dead letters

`requeue: true` has a failure mode. A message that can never succeed (a malformed payload from an old producer version) goes back near the head of the queue, is redelivered, fails, and repeats: a hot loop that starves real work. The exit is a **dead-letter exchange**: declare the work queue with the `x-dead-letter-exchange` argument, and nack permanent failures with `requeue: false`; the broker republishes them to that exchange, where a parked queue holds them for a human. Retry budgets layer on top: check `delivery.redelivered` or the `x-death` header's count and dead-letter after N attempts instead of the first.

## One level deeper

The `Channel` in the code is not a TCP connection. AMQP multiplexes many lightweight channels over one socket, and everything (publishes, consumes, acks) is scoped to a channel. That scoping is what makes redelivery precise: unacked deliveries belong to a channel, so when your process dies and the socket resets, the broker requeues exactly what that channel held. It is also why an ack carries a small integer delivery tag: it counts deliveries on this channel, not messages in the queue.

## Predict, then verify

A worker with prefetch 10 holds 10 unacked deliveries and panics. One of the 10 had finished its send; the ack never went out. What does the broker do, and what lands in subscribers' inboxes?

Answer: the connection resets, so the broker requeues all 10 unacked deliveries, flagged redelivered; anything acked earlier is gone for good. Another worker picks up the 10, and for the one whose email already left, only the chapter 11 idempotency record stands between the subscriber and a duplicate: that worker finds the record, acks, and sends nothing. The broker delivered at least once; the consumer's half of the contract turned "at least" into one inbox copy.
