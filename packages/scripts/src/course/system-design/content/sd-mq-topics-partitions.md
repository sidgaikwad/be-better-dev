Part 1 used a message queue as a black box that decouples producers from consumers. This section opens it, and the first decision inside is how a topic that outgrows one machine is split.

## Scope

- Text messages, kilobytes each
- Messages can be consumed repeatedly, or once
- Consumed in the order they were produced
- Retained two weeks, then truncated
- As many producers and consumers as possible
- At-least-once required, ideally all three semantics configurable
- High throughput for log aggregation, low latency for traditional queue uses

Three of those, repeated consumption, ordering and retention, are not what a traditional message queue does. RabbitMQ or ActiveMQ discards a message once delivered. Adding retention and replay makes this an event streaming platform, which is what Kafka and Pulsar are, and it is what makes the design harder. Naming that distinction early is worth doing, because it tells the interviewer which system you are building.

## Topics and partitions

Messages are grouped into topics. A topic too large for one machine is split into **partitions**, spread across servers called **brokers**.

Each partition is a FIFO queue. A message's position in it is its **offset**, a monotonically increasing number.

Ordering is the property to be precise about, and it is the one candidates overstate. Order is guaranteed **within a partition**, never across them. A topic with four partitions has four independent orderings and no global one, because the partitions are on different machines and nothing sequences them together.

## Choosing a partition

A message carries an optional **key**. Messages with the same key always go to the same partition; without a key, the message goes to a random one.

That is how you get ordering where it matters. Key by user id and every event for one user lands in one partition, so that user's events are strictly ordered, while different users are spread across partitions and processed in parallel.

The choice is the sharding-key decision again, with the same rules and the same consequences. A key that clumps produces a hot partition, and the entity you need ordering for is the entity you must key on.

## Scaling

Capacity comes from partition count, since partitions spread across brokers and each broker handles its own.

Partitions are also hard to add later, because adding one changes which partition a key maps to, so existing keys move and their ordering guarantee breaks across the boundary. This is the modulo resharding problem from Part 2, appearing where you might not expect it.

The practical answer is the same as the one there: over-provision. Allocate far more partitions than you currently need, since an unused partition is nearly free, and scale by adding consumers rather than partitions.

## Predict, then verify

You need strict global ordering of every message in a topic. How many partitions do you use, and what does that cost?

Answer: one, and it costs you the entire scalability story. Ordering holds within a partition, so global ordering means one partition, which means one broker holds all the data and one consumer reads it, so your throughput is a single machine's and adding hardware does nothing. That is the honest answer, and the more useful one is to challenge the requirement, because true global ordering is almost never what is needed. What people usually mean is ordering per entity: events for one account, one document, one device. That is per-key ordering, which partitioning gives you for free while remaining fully parallel across keys. Global ordering is a real requirement in a few places, a stock exchange's matching engine being the standard example, and those systems accept single-threaded throughput deliberately. So the move is to ask what must be ordered relative to what, and in nearly every case the answer narrows to something you can key on.
