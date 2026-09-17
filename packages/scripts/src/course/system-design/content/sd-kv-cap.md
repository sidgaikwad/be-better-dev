The interface is two functions:

```text
put(key, value)
get(key)
```

That is the whole API. Everything hard about a key-value store comes from making those two work across many machines, and the first decision is one you cannot avoid or defer.

## The three properties

**Consistency**: every client sees the same data at the same time, whichever node it talks to.

**Availability**: every request gets a response, even when some nodes are down.

**Partition tolerance**: the system keeps working when nodes cannot talk to each other.

CAP says you can have two. The practical reading is narrower than the theoretical one, and the narrower reading is the one worth carrying.

## Why CA is not an option

Partitions are not a design choice. A switch fails, a cable is cut, a rack loses its uplink, and two halves of your cluster stop hearing each other. That will happen, and no amount of care prevents it.

So partition tolerance is mandatory, and the real question is what you do during a partition: refuse to serve, or serve possibly-stale data. CP or AP. A CA system is one that has decided partitions do not happen, and it exists only in single-node deployments.

## What the choice looks like

Three replicas, n1, n2, n3. A partition isolates n3.

**Choose CP.** To prevent divergence you must refuse writes that cannot reach every replica. n1 and n2 start returning errors. The system is consistent and, for those clients, down.

This is right where wrong data is worse than no data. A bank balance is the standard example: showing a stale balance, or accepting two withdrawals that each looked affordable, is worse than an error message.

**Choose AP.** n1 and n2 keep accepting reads and writes. Reads may be stale, because n3 has writes the others have not seen, and n3 has its own writes nobody else has. When the partition heals, the divergence has to be reconciled.

This is right where being up matters more than being exactly right. A shopping cart, a session, a social feed, a view counter. Amazon's Dynamo paper made this argument explicitly: a customer being unable to add to their cart costs more than a cart that briefly disagrees with itself.

## The store this section builds

An AP store, following Dynamo and Cassandra. High availability, tunable consistency, and reconciliation of conflicting writes rather than prevention of them.

The requirements that follow:

- Key-value pairs under 10 KB
- Enough capacity for big data
- High availability, responding during failures
- Automatic scaling as nodes join and leave
- Tunable consistency
- Low latency

"Tunable" is the important word and the subject of the quorum lesson. The CP/AP choice is not one switch for the whole system: it can be set per operation.

## Predict, then verify

Your team says "we need strong consistency and high availability, so we will use a CA system". What is wrong, and what do they probably mean?

Answer: CA is not a category you can deploy, because you do not get to decline partitions. Any multi-node system will one day have nodes that cannot reach each other, and at that moment it will either refuse requests or serve stale data. Choosing "CA" just means nobody has decided which, so the behavior will be whatever the implementation happens to do, discovered during an incident. What they probably mean is a CP system with enough redundancy that partitions are rare and short, which is entirely reasonable and is what a well-run single-region cluster gives you: strong consistency, and availability that is high because partitions are uncommon rather than because they are handled. The useful correction is to reframe the question as "during a partition, which do we give up?", because that question has an answer and "CA" does not.
