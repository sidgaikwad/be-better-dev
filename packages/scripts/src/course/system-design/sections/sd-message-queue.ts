import type { SectionSeed } from "../../types"

export const sdMessageQueue: SectionSeed = {
  slug: "sd-message-queue",
  title: "Design a distributed message queue",
  description:
    "An append-only log on disk, partitions and consumer groups, and the delivery semantics you can actually promise.",
  badgeIcon: "📬",
  badgeTitle: "Queue",
  units: [
    {
      slug: "the-log",
      title: "The log",
      description: "Splitting a topic, dividing it among consumers, and where the bytes live.",
      lessons: [
        {
          slug: "sd-mq-topics-partitions",
          title: "Topics, partitions and offsets",
          summary:
            "Why retention and replay make this an event streaming platform, what ordering actually guarantees, and why partitions are hard to add later.",
          contentFile: "sd-mq-topics-partitions.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does partitioning guarantee about message order?",
              options: [
                "Order is preserved across the whole topic",
                "Order is preserved within a partition and not across partitions",
                "Order is preserved per producer",
                "Order is preserved as long as keys are unique",
              ],
              answer: 1,
              explanation:
                "Four partitions means four independent orderings and no global one, because they are on different machines and nothing sequences them together. This is the property candidates most often overstate.",
            },
            {
              kind: "mcq",
              prompt: "What does a message key do?",
              options: [
                "It deduplicates messages with the same key",
                "It routes all messages with that key to one partition, so they are ordered relative to each other",
                "It identifies the consumer group that should receive it",
                "It determines the retention period",
              ],
              answer: 1,
              explanation:
                "Key by user id and one user's events are strictly ordered while different users run in parallel. It is the sharding-key decision again, with the same rules: a key that clumps makes a hot partition.",
            },
            {
              kind: "predict",
              prompt:
                "A requirement asks for strict global ordering across a topic. What do you do?",
              options: [
                "Use one partition and accept single-machine throughput",
                "Use a single consumer across many partitions",
                "Challenge the requirement: what usually matters is ordering per entity, which keys give you for free",
                "Order by timestamp on the consumer side",
              ],
              answer: 2,
              explanation:
                "One partition is the honest answer and costs the entire scalability story. True global ordering is rare, a matching engine being the standard case, and those systems accept single-threaded throughput deliberately. Ask what must be ordered relative to what.",
            },
          ],
        },
        {
          slug: "sd-mq-consumer-groups",
          title: "Consumer groups",
          summary:
            "Point-to-point and publish-subscribe from one mechanism, why partition count caps parallelism, and how slow work becomes indistinguishable from death.",
          contentFile: "sd-mq-consumer-groups.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "How does one mechanism give both messaging models?",
              options: [
                "Topics can be marked as queue or as topic",
                "All consumers in one group is point-to-point; each consumer in its own group is publish-subscribe",
                "Brokers switch modes per subscription",
                "Consumers declare their model when subscribing",
              ],
              answer: 1,
              explanation:
                "Between groups, each has its own offsets so all see everything. Within a group, partitions are divided so each message is handled once. The elegant answer is that the two models are the same thing.",
            },
            {
              kind: "mcq",
              prompt: "A topic has 4 partitions and a group has 6 consumers. What happens?",
              options: [
                "Each partition is shared between consumers",
                "Two consumers sit idle, because a partition is consumed by at most one consumer in a group",
                "The topic is repartitioned automatically",
                "Throughput increases by 50%",
              ],
              answer: 1,
              explanation:
                "That constraint is what preserves per-partition ordering. It also means partition count is the ceiling on a group's parallelism, which is the real reason to over-provision partitions.",
            },
            {
              kind: "predict",
              prompt:
                "A slow but healthy consumer misses its heartbeat and is removed from the group. What follows?",
              options: [
                "Its partitions are reassigned, it produces duplicates and a rejected commit, then rejoins and triggers another rebalance",
                "Its messages are lost",
                "The coordinator waits for it to finish before reassigning",
                "It is permanently excluded until restarted",
              ],
              answer: 0,
              explanation:
                "Chronic slowness produces rebalance storms, where the group spends more time rebalancing than consuming. Heartbeat from a separate thread, set the timeout from the tail of processing time, and cap the fetch size. A liveness signal must be decoupled from the work.",
            },
          ],
        },
        {
          slug: "sd-mq-wal-storage",
          title: "An append-only log on disk",
          summary:
            "Why not a database, why segments make retention affordable, why sequential disk is fast, and what one lagging consumer does to everyone.",
          contentFile: "sd-mq-wal-storage.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is a database the wrong store for this?",
              options: [
                "Databases cannot handle kilobyte messages",
                "It is built for arbitrary access the workload never uses, and no database is good at write-heavy and read-heavy simultaneously at scale",
                "Databases cannot be partitioned",
                "Retention cannot be expressed in SQL",
              ],
              answer: 1,
              explanation:
                "The pattern is append-only, never updated, overwhelmingly sequential. An append-only log matches it exactly, which is the same reasoning as the key-value store's write path.",
            },
            {
              kind: "mcq",
              prompt: "What do segments make cheap?",
              options: [
                "Random access by offset",
                "Truncation: expiring old data is deleting a file rather than a long-running delete against live traffic",
                "Replication between brokers",
                "Compaction of duplicate keys",
              ],
              answer: 1,
              explanation:
                "One active segment receives appends; closed segments serve reads and are deleted whole past the retention window. That is less a file-layout detail than the reason two-week retention is affordable.",
            },
            {
              kind: "predict",
              prompt:
                "One consumer falls two days behind while the rest are current. What is the effect on the others?",
              options: [
                "None: it reads its own offsets independently",
                "They slow down too, because pulling old segments through page cache evicts the recent data everyone else was served from",
                "They are blocked until it catches up",
                "Their offsets are reset by the rebalance",
              ],
              answer: 1,
              explanation:
                "One lagging consumer turns a memory-speed system into a disk-speed one for everybody. This is why lag is monitored per consumer group, and why real-time and catch-up consumers are often served from different replicas.",
            },
          ],
        },
      ],
    },
    {
      slug: "guarantees",
      title: "Guarantees",
      description:
        "Who sets the pace, how many copies count, and how many times a message arrives.",
      lessons: [
        {
          slug: "sd-mq-push-pull-batching",
          title: "Pull, and batch",
          summary:
            "Why the consumer should set the pace, what long polling fixes, and the batch size where high throughput and low latency actually conflict.",
          contentFile: "sd-mq-push-pull-batching.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why do most message queues choose pull over push?",
              options: [
                "Pull has lower latency",
                "The broker cannot know what a consumer can absorb, and a system where the slow party sets the pace degrades gracefully",
                "Push cannot support multiple consumer groups",
                "Pull requires fewer connections",
              ],
              answer: 1,
              explanation:
                "Pull also enables batching: a consumer asks for everything after its offset up to a size limit. Under push the broker sends one at a time and a backed-up consumer just accumulates a buffer.",
            },
            {
              kind: "mcq",
              prompt: "What problem does long polling solve for a pull-based consumer?",
              options: [
                "Out-of-order delivery",
                "An idle consumer spinning on empty responses, by holding the request until something arrives",
                "Rebalancing delays",
                "Offset commit failures",
              ],
              answer: 1,
              explanation:
                "One held connection instead of a poll loop. It is the same mechanism the Google Drive notification service used, applied to a different problem.",
            },
            {
              kind: "predict",
              prompt:
                "A producer batches up to 100 ms or 64 KB. Traffic drops to one small message per second. What is the latency?",
              options: [
                "Near zero, since the buffer is empty",
                "About 100 ms per message, because the size trigger never fires and every message waits out the timer",
                "About 1 second, matching the arrival rate",
                "Unchanged, since batching only applies under load",
              ],
              answer: 1,
              explanation:
                "A size-or-time batch behaves worst at low volume, which is why a system that looks fast under load can look sluggish in a quiet test environment. Make the timer adaptive so batching costs nothing when there is nothing to batch.",
            },
          ],
        },
        {
          slug: "sd-mq-replication",
          title: "Replication and in-sync replicas",
          summary:
            "The committed offset as the definition that makes the guarantee real, three ack settings per producer, and why `ack=all` can quietly mean one machine.",
          contentFile: "sd-mq-replication.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why are only committed messages visible to consumers?",
              options: [
                "Uncommitted messages have no offset yet",
                "So a consumer never sees a message that could still be lost: committed means every ISR member holds it",
                "To preserve ordering across partitions",
                "Because followers cannot serve reads",
              ],
              answer: 1,
              explanation:
                "That definition is what makes the durability guarantee real rather than nominal. The committed offset is the position up to which every in-sync replica has the data.",
            },
            {
              kind: "mcq",
              prompt: "Why do consumers read from the leader rather than from followers?",
              options: [
                "Followers may be stale",
                "Design simplicity, and the connection count is bounded by groups rather than consumers since one consumer per group reads a partition",
                "Followers do not store the full log",
                "The routing layer only knows leaders",
              ],
              answer: 1,
              explanation:
                "A hot topic is scaled by adding partitions, which adds leaders on other brokers. The exception is geography: a cross-region consumer may read the nearest in-sync replica to avoid paying a round trip per fetch.",
            },
            {
              kind: "predict",
              prompt:
                "Two of three replicas fall behind, leaving the leader alone in the ISR. A producer uses `ack=all`. What does the guarantee mean now?",
              options: [
                "Unchanged: all replicas must still acknowledge",
                "It means acknowledging on one machine, so losing the leader loses acknowledged writes",
                "Writes are rejected automatically",
                "The lagging replicas are still counted for durability",
              ],
              answer: 1,
              explanation:
                "`ack=all` means all in-sync replicas, so its strength depends on how many are currently in sync. Production clusters set a minimum ISR count and refuse writes below it: refusing a write beats accepting one under a guarantee that has quietly stopped holding.",
            },
          ],
        },
        {
          slug: "sd-mq-delivery-semantics",
          title: "At most, at least, exactly",
          summary:
            "Three guarantees that come down to the order of two operations, and why exactly-once is really at-least-once with atomic deduplication.",
          contentFile: "sd-mq-delivery-semantics.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What single choice decides a consumer's delivery semantics?",
              options: [
                "The ack setting",
                "Whether it commits the offset before or after processing",
                "The partition assignment strategy",
                "The heartbeat interval",
              ],
              answer: 1,
              explanation:
                "Commit then process is at most once; process then commit is at least once; both atomically is exactly once. Two lines of code in different orders, and the promise changes.",
            },
            {
              kind: "mcq",
              prompt: "Why is exactly-once not really a delivery guarantee?",
              options: [
                "Because brokers cannot deduplicate",
                "The network can always deliver twice, so it is at-least-once plus deduplication made atomic with the processing",
                "Because offsets are not transactional",
                "Because producers cannot detect duplicates",
              ],
              answer: 1,
              explanation:
                "That is straightforward when the side effect writes to the same system holding offsets, and hard when it calls an external service. When the downstream can be made idempotent, at-least-once plus idempotency is cheaper and gets the same outcome.",
            },
            {
              kind: "predict",
              prompt:
                "A consumer inserts an order, then crashes before committing its offset, and reprocesses on restart. What prevents a duplicate order?",
              options: [
                "The broker deduplicates by message id",
                "A stable message id used as the order's unique key, so the second insert fails harmlessly",
                "Committing the offset before processing",
                "Setting `ack=all` on the producer",
              ],
              answer: 1,
              explanation:
                "The queue's job ended when it delivered twice, which is what at-least-once promised. Idempotency in the consumer turns an at-least-once queue into an effectively-exactly-once pipeline with no coordination, which is why it is the standard answer.",
            },
          ],
        },
      ],
    },
  ],
}
