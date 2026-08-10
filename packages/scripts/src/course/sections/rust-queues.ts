import type { SectionSeed } from "../types"

export const rustQueues: SectionSeed = {
  slug: "rust-queues",
  title: "Rust with message queues",
  description:
    "Delivery guarantees; RabbitMQ (lapin), Kafka (rdkafka), NATS, Redis Streams; re-queue the delivery worker.",
  badgeIcon: "📬",
  badgeTitle: "Queues × Rust",
  units: [
    {
      slug: "the-case-for-queues",
      title: "The case for a queue",
      description: "Why the buffer exists, and what delivery guarantees actually say.",
      lessons: [
        {
          slug: "mq-why-queues",
          title: "Why queues exist",
          summary: "Chapter 9's naive loop, generalized: a buffer that outlives the request.",
          contentFile: "mq-why-queues.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Chapter 9's in-handler delivery loop timed out, lost progress on crash, and double-sent on retry. What single decision do all three failures trace to?",
              options: [
                "actix-web cannot stream long responses",
                "The work's lifetime was tied to the HTTP request's lifetime",
                "The email provider's API was too slow",
                "Postgres could not hold 50,000 subscriber rows",
              ],
              answer: 1,
              explanation:
                "Minutes of work lived inside a request that can die at any moment, so every request failure became a work failure. A queue's entire job is to break that coupling: accept in milliseconds, deliver on the worker's schedule.",
            },
            {
              kind: "predict",
              prompt:
                "Workers drain 100 jobs/s. Arrivals run at 120 jobs/s for one hour, then drop to 20 jobs/s. What does queue depth do?",
              options: [
                "Grows forever: the system never recovers",
                "Climbs to about 72,000 during the hour, then drains back toward zero",
                "Stays flat: the queue absorbs the difference invisibly",
                "The broker rejects the excess 20 jobs/s",
              ],
              answer: 1,
              explanation:
                "Depth integrates arrivals minus drain: +20/s for 3,600 s queues 72,000 jobs, and the later -80/s deficit drains them in about 15 minutes. The queue turned an hour of overload into delay rather than loss.",
            },
            {
              kind: "mcq",
              prompt: "Which problem can a queue not solve?",
              options: [
                "A consumer that is permanently slower than its producers",
                "Work lost when the web process crashes mid-task",
                "A signup burst overwhelming the email provider",
                "Retrying failed sends without failing user requests",
              ],
              answer: 0,
              explanation:
                "A queue stores overload; it does not serve it. If average arrival exceeds average drain, depth grows without bound, and the fix is capacity or reduced intake, not a bigger buffer.",
            },
          ],
        },
        {
          slug: "mq-delivery-guarantees",
          title: "Delivery guarantees, without the marketing",
          summary:
            "At-most-once, at-least-once, and the idempotent consumer that makes 'exactly once' honest.",
          contentFile: "mq-delivery-guarantees.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "A worker acks each message before processing it. Which guarantee is that, and what is the failure mode?",
              options: [
                "At-least-once; duplicates when the broker redelivers",
                "At-most-once; work is silently lost when the worker dies mid-processing",
                "Exactly-once, as long as the broker persists messages",
                "At-most-once; duplicates when the ack is lost",
              ],
              answer: 1,
              explanation:
                "Acking first tells the broker to forget the message while the work is still in flight, so a crash loses it with no redelivery. That trade is only right when the next message supersedes the lost one.",
            },
            {
              kind: "mcq",
              prompt:
                "Where can 'each subscriber gets this issue exactly once' actually be enforced?",
              options: [
                "In the broker, by enabling publisher confirms",
                "In Kafka, by using transactions end to end",
                "In the consumer, with a durable idempotency record checked before the send",
                "In the ack protocol, by acking exactly once per message",
              ],
              answer: 2,
              explanation:
                "The email API shares no transaction with any broker, so deduplication must happen at the effect: record what was done, keyed on issue plus subscriber, and skip redeliveries. Confirms and Kafka transactions protect broker-side state only.",
            },
            {
              kind: "predict",
              prompt:
                "Messages 1 to 5 sit in a queue. Two workers consume with at-least-once semantics, and message 2 fails once and is retried. Which delivery order is guaranteed?",
              options: [
                "Strict FIFO: 1, 2, 3, 4, 5",
                "FIFO as long as prefetch is set to 1",
                "None: concurrent consumers and retries both reorder; only per-key routing restores order where it matters",
                "All orders except one: message 2 must complete last",
              ],
              answer: 2,
              explanation:
                "Two consumers already interleave completions, and the retried message runs after newer ones. Broker FIFO only holds for one consumer's stream of first-try successes, which is why designs order per key or tolerate reordering.",
            },
          ],
        },
      ],
    },
    {
      slug: "rabbitmq-and-kafka",
      title: "Two heavyweights",
      description: "A broker that routes and forgets; a log that keeps and replays.",
      lessons: [
        {
          slug: "mq-rabbitmq-lapin",
          title: "RabbitMQ with lapin",
          summary:
            "Exchanges and bindings, acks, prefetch as networked backpressure, dead letters.",
          contentFile: "mq-rabbitmq-lapin.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In AMQP, what decides which queues receive a published message?",
              options: [
                "The queue name passed to basic_publish",
                "The exchange plus the routing key, matched against queue bindings",
                "The consumer tags currently subscribed",
                "The broker load-balances to the emptiest queue",
              ],
              answer: 1,
              explanation:
                "Producers only ever name an exchange and a routing key; bindings do the rest. Publishing 'to a queue' is the default exchange's trick: every queue is bound to it under its own name.",
            },
            {
              kind: "predict",
              prompt:
                "A worker subscribes to a 50,000-message queue without ever calling basic_qos. What happens?",
              options: [
                "The broker trickles messages one at a time, waiting for each ack",
                "The broker pushes the entire backlog at the worker as fast as TCP allows, ballooning its memory",
                "basic_consume returns an error: prefetch is mandatory",
                "Half the messages are dropped as expired",
              ],
              answer: 1,
              explanation:
                "Unset prefetch means unlimited, and RabbitMQ pushes: flow control is opt-in via basic_qos. Prefetch is the bounded channel from Part 2 negotiated over the network, and skipping it rebuilds chapter 9's memory profile.",
            },
            {
              kind: "mcq",
              prompt:
                "A malformed message fails on every attempt, and the worker nacks it with `requeue: true`. What is the outcome, and the standard fix?",
              options: [
                "The broker discards it after three attempts by default",
                "It redelivers in a hot loop that starves real work; give the queue a dead-letter exchange and nack permanent failures with requeue: false",
                "It moves to the back of the queue, so the damage is negligible",
                "The channel closes, forcing the worker to reconnect",
              ],
              answer: 1,
              explanation:
                "RabbitMQ has no built-in retry cap, and requeued messages return near the head of the queue, so a poison message loops forever. Dead-lettering gives permanent failures somewhere terminal to go while real work continues.",
            },
          ],
        },
        {
          slug: "mq-kafka-rdkafka",
          title: "Kafka with rdkafka",
          summary:
            "A log you read at your own pace: partitions, consumer groups, and what a commit means.",
          contentFile: "mq-kafka-rdkafka.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does committing offset 41 on a partition assert?",
              options: [
                "Record 41 was received by the consumer",
                "Every record at and before offset 41 is processed; the group's cursor moves past them",
                "Record 41 is deleted from the log",
                "Other consumer groups can no longer read record 41",
              ],
              answer: 1,
              explanation:
                "A commit is a per-group watermark stored in Kafka, not a per-message receipt, and it never deletes data or affects other groups. Only retention deletes records.",
            },
            {
              kind: "predict",
              prompt:
                "A worker processes offsets 100 to 104, crashes before committing, and restarts (last commit was 99). What happens?",
              options: [
                "Offsets 100 to 104 are skipped: the broker saw them delivered",
                "It resumes at 100 and reprocesses all five: at-least-once, absorbed by the idempotent consumer",
                "It resumes at 105: Kafka tracks delivery per record",
                "The partition is reassigned to a different consumer group",
              ],
              answer: 1,
              explanation:
                "Position rewinds to the committed watermark, so the gap between work done and work committed is exactly the duplicate window. That window is why the idempotency record is a requirement, not an optimization.",
            },
            {
              kind: "mcq",
              prompt: "Which workload argues for Kafka over a broker queue like RabbitMQ?",
              options: [
                "Background jobs needing per-message retries and dead-lettering",
                "An event stream that several teams consume independently, including replaying history",
                "The smallest possible operational footprint",
                "A queue processing a few hundred jobs per day",
              ],
              answer: 1,
              explanation:
                "Independent cursors over retained history is the log's native trick; per-message dispositions are the broker's. Choose by the workload's shape, and note a commit watermark cannot express 'retry just this one'.",
            },
          ],
        },
      ],
    },
    {
      slug: "lighter-brokers-and-migration",
      title: "Lighter brokers, and the migration",
      description: "NATS and Redis Streams, then the newsletter queue leaves Postgres.",
      lessons: [
        {
          slug: "mq-nats-redis-streams",
          title: "NATS and Redis Streams",
          summary:
            "Fire-and-forget subjects, JetStream, and a log inside the Redis you already run.",
          contentFile: "mq-nats-redis-streams.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "A message is published to a core NATS subject with no subscriber connected. What happens to it?",
              options: [
                "It is stored until a subscriber arrives",
                "It is gone: core NATS forwards to current subscribers and keeps nothing",
                "The publish call returns an error",
                "It is redelivered when the next subscriber connects",
              ],
              answer: 1,
              explanation:
                "Core NATS is a forwarding fabric, not storage, which is what makes it fast and small. Persistence, acks, and replay are exactly what JetStream adds on top of the same binary.",
            },
            {
              kind: "predict",
              prompt:
                "A worker reads 10 entries from a Redis Stream via XREADGROUP, acks 6, and is killed. Where are the other 4?",
              options: [
                "Requeued automatically when the connection drops, like RabbitMQ",
                "Lost: Redis deletes entries on delivery",
                "Still in the stream, tracked in the group's pending list under the dead worker, until another worker claims them with XAUTOCLAIM",
                "Redelivered to the whole group on the next XREADGROUP call",
              ],
              answer: 2,
              explanation:
                "Redis has no connection-scoped ownership, so crashed consumers strand their pending entries until a claim loop reclaims them past an idle threshold. The redelivery brokers do for free is code you must write here.",
            },
            {
              kind: "mcq",
              prompt:
                "You need at-least-once background jobs at a few thousand per day, and you already operate Redis for sessions. Strongest first candidate?",
              options: [
                "A Kafka cluster",
                "Redis Streams with a consumer group",
                "Core NATS pub/sub",
                "A second Postgres instance",
              ],
              answer: 1,
              explanation:
                "At that volume the dominant cost is operational, and Streams adds a queue to a system you already run. Core NATS fails the at-least-once requirement outright, and Kafka's weight buys nothing here.",
            },
          ],
        },
        {
          slug: "mq-migrate-delivery",
          title: "Project: the delivery queue moves out",
          summary:
            "issue_delivery_queue to RabbitMQ: what improves, what breaks, when the table wins.",
          xp: 25,
          contentFile: "mq-migrate-delivery.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does the chapter 11 Postgres queue provide that RabbitMQ cannot?",
              options: [
                "Higher delivery throughput",
                "Enqueueing jobs in the same transaction as the business write",
                "Automatic retries with backoff",
                "Per-message acknowledgements",
              ],
              answer: 1,
              explanation:
                "The broker shares no transaction with your database, so issue-plus-jobs atomicity is gone the moment enqueue means publish. Recovering it takes the outbox pattern, which quietly reintroduces a Postgres table in front of the broker.",
            },
            {
              kind: "predict",
              prompt:
                "An outbox relay publishes a job to RabbitMQ, then crashes before deleting the outbox row. What happens on restart, and is it a bug?",
              options: [
                "The job is lost: the broker saw it only once",
                "The relay publishes the row again; the duplicate is absorbed by the idempotent consumer, exactly as designed",
                "RabbitMQ deduplicates by message id, so nothing happens",
                "The outbox table prevents the second publish",
              ],
              answer: 1,
              explanation:
                "Every hop in the pipeline is at-least-once, publishing included, and deduplication lives at the effect. It is the delivery-guarantees theorem applied to the producer side: not a bug, the design's load-bearing assumption.",
            },
            {
              kind: "mcq",
              prompt: "Which observation is the strongest signal to migrate off Postgres-as-queue?",
              options: [
                "A design review calls SKIP LOCKED a hack",
                "Measured contention: queue churn degrading request latency, or other services needing to consume without sharing the database",
                "The team wants experience running Kafka",
                "The weekly issue takes four minutes to deliver",
              ],
              answer: 1,
              explanation:
                "Migrate on measurement or structure: the queue harming the OLTP workload, or consumers that must not share your database. Delivery duration is set by worker count and provider limits, and aesthetics are not load.",
            },
          ],
        },
      ],
    },
  ],
}
