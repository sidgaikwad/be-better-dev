The data does not fit on one machine, and one copy is not enough. Partitioning solves the first, replication the second, and both run on the ring from the previous section.

## Partitioning

Place servers on a hash ring, hash keys onto the same ring, and each key belongs to the first server clockwise. That is consistent hashing, unchanged.

Two properties it gives a key-value store specifically:

**Automatic scaling.** Nodes can join and leave under load without recomputing where every key lives, because only the affected arcs move. A store that must be rebalanced by hand is a store that cannot autoscale.

**Heterogeneity.** The number of virtual nodes per server is a knob, so a server with twice the capacity gets twice the virtual nodes and owns twice the ring. Clusters accumulate hardware generations, and this is what stops the oldest machines from being the bottleneck.

## Replication

Data is replicated to N servers, where N is configuration rather than a constant. Hash the key to its position, then walk clockwise and take the first N servers.

With N = 3, key0 hashes between s0 and s1, so it lives on s1, s2 and s3.

Two corrections to that rule, and both matter in practice.

**Take unique physical servers.** With virtual nodes, walking clockwise can hit s1_4, then s1_9, then s2_1. The first three virtual nodes are only two machines, so your replication factor of 3 is really 2, and one machine failing loses two of your three copies. Skip virtual nodes belonging to a server already chosen.

**Spread across failure domains.** Machines in one data center fail together: one power event, one network event, one flood. Three replicas in one building is one replica against the failures that take out buildings. Place them in distinct data centers, connected by fast links.

That second point has a cost worth naming. Replicas in different data centers means every write that waits for more than one acknowledgment pays a cross-data-center round trip, tens of milliseconds instead of under one. Durability against a regional failure is bought with write latency, and that is the trade the quorum settings tune.

## What N is for

N is not a performance knob. It sets how many simultaneous failures you survive and how much storage you buy.

- N = 1: no redundancy.
- N = 2: survives one failure, and while that node is down you are at N = 1 with no margin.
- N = 3: survives one failure comfortably and two at once. Standard, and the default in Dynamo and Cassandra.

Above 3 the returns fall off quickly while storage cost rises linearly, so N = 3 with replicas in three failure domains is the answer unless something specific argues otherwise.

## Predict, then verify

N = 3, replicas chosen by walking clockwise. A node fails and its replicas move to the next node. Why does this make the next node's position on the ring uncomfortable?

Answer: because the successor now serves both roles at once. It was already the second replica for the failed node's keys, and now it is the primary for them as well, on top of everything it owned before. So its read and write load roughly doubles for that key range, its storage grows, and, worse, those keys are now down to two copies rather than three until the cluster re-replicates. The window where a key has only two copies is the dangerous one: a second failure in the same arc during that window loses data outright. This is why the re-replication is urgent rather than background work, and why hinted handoff, from the failures lesson, exists to get a third copy somewhere immediately rather than waiting for the failed node to return.
