A partition on one broker is lost when that broker is lost. Replication copies it, and the interesting part is not that copies exist but how the system decides which copies count.

## Leader and followers

Each partition has a leader replica and follower replicas on other brokers. Producers write only to the leader; followers pull from it.

Producers reach the leader through a routing layer, which reads the replica distribution from metadata storage, caches it, and forwards each message to the right leader.

## In-sync replicas

A follower can fall behind. **In-sync replicas**, the ISR, are the ones keeping up, with "keeping up" defined by configuration: a lag threshold in messages or in time. The leader is always in its own ISR.

The leader tracks each follower's lag and maintains the list. A follower that drifts past the threshold is removed; when it catches up it is added back.

```text
leader     committed offset 13, has 14 and 15 uncommitted
replica-2  caught up          -> in ISR
replica-3  caught up          -> in ISR
replica-4  lagging            -> not in ISR
```

The **committed offset** is the position up to which every ISR member has the data, and only committed messages are visible to consumers. That is the definition that makes the guarantee real: a consumer never sees a message that could still be lost, because the message is not consumable until enough replicas hold it.

## The ack setting

The producer chooses how much durability to wait for.

**ack=all.** The producer is acknowledged once every ISR member has the message. Strongest durability, highest latency, and the latency is the slowest ISR member's.

**ack=1.** Acknowledged once the leader has persisted it. Faster, and if the leader dies immediately after acknowledging but before followers replicate, that message is lost. Right where occasional loss is acceptable and latency matters.

**ack=0.** Fire and forget, no acknowledgement, no retry. Lowest latency and real loss. Right for metrics and logs, where volume is huge and a missing data point changes nothing.

One setting, three positions on the durability-latency curve, chosen per producer rather than for the cluster. That per-producer choice is the useful part: a payment event and a debug log can share the same cluster with different guarantees.

## Consumers read the leader

Consumers read from the leader replica, not from followers, which looks like a bottleneck and is not:

- A partition is read by one consumer per group, so the connection count is bounded by groups rather than by consumers.
- A hot topic is scaled by adding partitions, which adds leaders on other brokers.
- It keeps the design simple: one source of truth per partition, no question of which replica is current.

The exception is geography. A consumer in another data center reading a leader pays a cross-region round trip on every fetch, and some systems allow reading from the nearest in-sync replica to avoid it.

## Predict, then verify

ISR is `{leader, replica-2}` and replica-3 has fallen behind. The producer uses `ack=all`. The leader dies. What happens, and what was `ack=all` worth?

Answer: replica-2 is promoted and no acknowledged message is lost, which is exactly what was bought. Every message the producer was told had committed was, by definition of the committed offset, present on every ISR member, and replica-2 was one, so it has all of them. Replica-3's lag is irrelevant because it was excluded from the ISR and therefore from the guarantee. The subtlety worth naming is that `ack=all` means all _in-sync_ replicas, not all replicas, so the strength of the guarantee depends entirely on how many replicas are currently in sync. If replicas 2 and 3 had both fallen behind, the ISR would be the leader alone, `ack=all` would mean acknowledging on one machine, and losing the leader would lose acknowledged writes while the setting still said "all". That is why production clusters set a minimum in-sync replica count and refuse writes when the ISR shrinks below it: refusing to accept a write is better than accepting one under a guarantee that has quietly stopped holding.
