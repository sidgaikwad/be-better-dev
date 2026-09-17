In RabbitMQ, an acked message is gone; the queue exists to become empty. Kafka deletes nothing when you read. A topic is an append-only log on disk: records are written once, expire on a retention clock or size cap, and "consuming" just moves your cursor along the file. Everything distinctive about Kafka falls out of that one storage decision.

## Partitions, keys, and ordering

A topic is split into **partitions**; each partition is its own ordered log, and a record's **offset** is its position in that log. Order is guaranteed within a partition and nowhere else. Producers pick the partition by hashing the record's **key**, so "all events about subscriber X, in order" costs one decision: key by subscriber email. No key means round-robin and no ordering at all. Partition count, chosen at topic creation, is also the parallelism ceiling for any one consumer group.

## Consumer groups, offsets, commits

Consumers join a group (`group.id`); the broker assigns each partition to exactly one consumer in the group. Each group tracks one committed offset per partition, so two groups on one topic are two independent cursors: delivery workers consume today's records while an analytics job replays last month's, no copies made. RabbitMQ can fan out too, but only forward from publish time into per-queue copies; Kafka lets a consumer that did not exist yet read history.

A **commit** writes "group G is done through offset N on partition P" back into Kafka. It is a watermark, not a per-message receipt: committing N asserts everything at and before N is handled. Commit after processing and you get at-least-once (a crash rewinds to the last commit and replays the gap). Commit before, or let `enable.auto.commit` do it on a timer, and there are windows where the cursor and the truth disagree. For a delivery worker: manual commit, after the idempotent send.

## rdkafka in practice

rdkafka wraps librdkafka, the C client most language ecosystems share, so your build gains a C dependency and inherits fifteen years of protocol hardening.

```rust
use rdkafka::config::ClientConfig;
use rdkafka::producer::{FutureProducer, FutureRecord};
use rdkafka::util::Timeout;

let producer: FutureProducer = ClientConfig::new()
    .set("bootstrap.servers", "localhost:9092")
    .create()?;

producer.send(
    FutureRecord::to("issue-delivery")
        .key(&job.subscriber_email)              // ordering key picks the partition
        .payload(&serde_json::to_vec(&job)?),
    Timeout::After(Duration::from_secs(5)),
).await.map_err(|(err, _msg)| err)?;
```

```rust
use rdkafka::consumer::{CommitMode, Consumer, StreamConsumer};
use rdkafka::message::Message;

let consumer: StreamConsumer = ClientConfig::new()
    .set("group.id", "delivery-workers")
    .set("bootstrap.servers", "localhost:9092")
    .set("enable.auto.commit", "false")
    .create()?;
consumer.subscribe(&["issue-delivery"])?;

loop {
    let msg = consumer.recv().await?;
    handle(msg.payload().unwrap_or_default()).await?;
    consumer.commit_message(&msg, CommitMode::Async)?; // watermark: done through here
}
```

## One level deeper: the watermark has a price

Per-message acks let RabbitMQ finish message 7 while 3 is still retrying. A watermark cannot say that: committing 7 claims 3 is done too, so one slow or failing record holds back the committed position for its whole partition. "Retry just this message later" has no native spelling: no per-message nack, no built-in dead-letter queue. Kafka shops build retry topics and DLQ topics by hand. That is the honest trade: the log buys replay, fan-out to many groups, and throughput (sequential writes, batching); it sells back per-message dispositions. A work queue with per-job retries wants a broker; a stream of facts read by many consumers wants a log. Newsletter delivery is the first shape, which is why the migration lesson uses RabbitMQ. And since Kafka 4.0 there is no ZooKeeper to run (KRaft handles consensus), but it is still a cluster with partitions to plan: real operational weight to justify.

## Predict, then verify

The issue-delivery topic has 6 partitions. You scale the worker deployment to 8 replicas, all in group `delivery-workers`. How much work do the extra replicas do, and what would the same scale-out do against one RabbitMQ queue?

Answer: 6 replicas get one partition each and 2 sit idle; group parallelism is capped by partition count. Against one RabbitMQ queue, all 8 consumers receive work immediately: broker queues divide messages, Kafka divides partitions. You can add partitions later, but keys then rehash to different partitions, breaking per-key order across the boundary, which is why Kafka capacity planning starts with partition count and RabbitMQ capacity planning starts with consumer count.
