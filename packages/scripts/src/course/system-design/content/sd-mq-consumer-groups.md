A queue has to serve two opposite models. Point-to-point, where each message is handled once by one worker. Publish-subscribe, where every interested party sees every message. Consumer groups give both from one mechanism.

## The mechanism

A **consumer group** is a set of consumers working together on a topic. Each group keeps its own offsets per partition.

Two groups, one topic:

- Group 1 subscribes to topic A.
- Group 2 subscribes to topics A and B.
- Both groups receive every message in topic A, independently.

Between groups that is publish-subscribe: each group has its own position in the log, so a billing group and an accounting group both see everything, and neither affects the other.

Within a group it is point-to-point: partitions are divided among the group's consumers, so each message is handled by exactly one of them.

## One consumer per partition

Parallelism inside a group raises a problem. If two consumers read partition 1, the partition's ordering is lost, because two processes are consuming interleaved.

The constraint that fixes it: **a partition is consumed by at most one consumer in a group**. Ordering survives, since each partition has exactly one reader at a time.

The consequence is direct and worth stating: consumers beyond the partition count sit idle. A topic with 4 partitions and 6 consumers in a group has 2 consumers doing nothing, and they do not help throughput at all.

So partition count is the ceiling on a group's parallelism. This is why over-provisioning partitions matters: it is not storage capacity, it is how many consumers can ever work in parallel, and raising it later is the disruptive operation from the previous lesson.

## Getting both models

Put every consumer in one group and each message is handled once: point-to-point.

Put each consumer in its own group and every consumer sees every message: publish-subscribe.

One mechanism, two models, chosen by group membership. Worth pointing out explicitly, because the question usually asks for both and the elegant answer is that they are the same thing.

## Rebalancing

Membership changes when a consumer joins, leaves, crashes, or partitions are adjusted, and partitions have to be reassigned. That is **rebalancing**, run by a **coordinator**, one of the brokers, chosen by hashing the group name so every consumer in a group finds the same one.

The coordinator receives heartbeats and manages offsets. When the group changes, it reassigns partitions by round-robin, range, or another strategy.

Rebalancing is disruptive: consumption pauses while partitions are reassigned, and a consumer that had partition 3 may resume on partition 7 with different in-flight state. Anything a consumer accumulated in memory for its old partitions is now wrong.

## Predict, then verify

A consumer is slow, misses its heartbeat, and is removed from the group. It was not actually dead. What happens?

Answer: a rebalance moves its partitions to other consumers, the slow consumer finishes its work and tries to commit an offset for a partition it no longer owns, and that commit is rejected or, worse, accepted and overwrites the new owner's position. Meanwhile the messages it was processing are being processed again by the new owner, so you have duplicates. Then the slow consumer rejoins, triggering a second rebalance, and if the slowness is chronic the group spends more time rebalancing than consuming, which is a well-known failure mode with a name: rebalance storms. The causes are usually that the heartbeat interval is tuned tighter than the real processing time, or that a single message occasionally takes far longer than the rest. The fixes are to send heartbeats from a separate thread so they continue during processing, to set the timeout from the observed tail of processing time rather than the average, and to cap how much a consumer fetches at once so it cannot disappear for a long stretch. The general point is that a liveness signal has to be decoupled from the work, or slow work becomes indistinguishable from death.
