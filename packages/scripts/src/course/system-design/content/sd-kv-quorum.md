Data sits on N replicas. A write does not have to reach all of them before you answer the client, and a read does not have to consult all of them. How many of each is the tuning knob that decides what kind of store you have.

## Three numbers

- **N**: how many replicas hold the data.
- **W**: how many must acknowledge a write before it is called successful.
- **R**: how many must respond to a read before it is answered.

A coordinator sits between the client and the replicas. It sends the write to all N and waits for W acknowledgments, then answers. The other replicas still receive the write; W is only how long the client waits.

That distinction matters. W = 1 does not mean one copy exists. All three replicas are being written. W = 1 means the coordinator answers as soon as any one of them confirms.

## The rule

```text
W + R > N  implies at least one node is in both sets
```

If the write reached W replicas and the read consults R replicas, and W + R is greater than N, then the two sets must overlap by at least one node. That node has the latest write, so the read sees it.

This is the whole of quorum consistency, and it is worth being able to derive rather than recall. With N = 3, W = 2 and R = 2: the write landed on some 2 of 3, the read asks some 2 of 3, and any two 2-element subsets of a 3-element set share a member.

Below the threshold, `W + R <= N`, the sets can miss each other and a read can return stale data.

## Configurations

| Setting             | Behavior                                                                  |
| ------------------- | ------------------------------------------------------------------------- |
| W = 1, R = N        | Fast writes, slow reads. Writes return on one ack; reads ask everyone.    |
| W = N, R = 1        | Fast reads, slow writes. Every replica confirms before the write returns. |
| W = 2, R = 2, N = 3 | Strong consistency, balanced latency. The standard choice.                |
| W = 1, R = 1, N = 3 | Fastest, eventually consistent. Reads may be stale.                       |

The latency cost is not the average replica but the slowest one in the quorum. Waiting for 2 of 3 means waiting for the second-fastest, so raising W or R means waiting further into the tail of your latency distribution. This is why W = N is expensive out of proportion to the number: it waits for the slowest replica every time, and at high percentiles one replica is always having a bad moment.

## Consistency models

- **Strong**: a read always returns the most recent write. Usually achieved by blocking until every replica agrees, which conflicts directly with availability.
- **Weak**: a read may not see the latest write.
- **Eventual**: a specific weak model. Given enough time with no new writes, all replicas converge.

Dynamo and Cassandra choose eventual consistency, and so does this design. Conflicting values are allowed into the system and reconciled at read time, which is what the versioning lesson is about.

## Predict, then verify

N = 3, W = 1, R = 3. Does `W + R > N` hold, and is this a good configuration?

Answer: it holds, since 1 + 3 = 4 > 3, so reads are consistent: the write landed on at least one node, the read consults all three, and it must see it. It is also a poor configuration, which is the point. Consistency is only one property. R = 3 means every read waits for the slowest of three replicas, so read latency tracks your worst node, and if any single replica is down, R = 3 cannot be satisfied and reads fail entirely. You have a store that is consistent and fragile, with availability worse than a single machine for reads. W = 2, R = 2 gives the same consistency guarantee while tolerating one node down on both paths, which is why it is the standard. The general lesson: `W + R > N` tells you whether reads are consistent and says nothing about whether the configuration is sensible, so check availability under one failure as a second, separate question.
