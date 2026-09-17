The ring tells you where a key belongs. Operationally you also need the inverse: when a server joins or leaves, exactly which keys have to move? Answering that precisely is what makes the migration a bounded job rather than a full rebuild.

## Finding the range

**Adding a server.** The new server takes its position on the ring. The keys it now owns are the ones that previously walked clockwise past that point to reach the next server. So the affected range starts at the new server's position and runs anticlockwise to the previous server.

Concretely, with server 4 landing between server 3 and server 0: keys in the arc from server 3 to server 4 move from server 0 to server 4. Nothing else changes.

**Removing a server.** The keys it owned are the ones in its arc, which is from the previous server anticlockwise. Those keys now continue clockwise to the next server.

Removing server 1 between server 0 and server 2: keys in the arc from server 0 to server 1 move to server 2.

The rule in one sentence: walk anticlockwise from the changed node until you hit another node, and the arc you crossed is the affected range. With virtual nodes you do this once per virtual node, so a server joining means a few hundred small ranges rather than one large one.

## Why this matters operationally

Knowing the range means you can move the data before changing the mapping. Copy the affected keys to their new owner, verify, then flip the ring. Clients that read during the copy still get correct answers from the old owner, because the ring has not changed yet.

The alternative, changing the mapping and letting the data migrate lazily, is fine for a cache, where a miss is recoverable, and dangerous for a store, where a miss looks like a deletion. That distinction is the same one the rehashing lesson ended on.

## Where this is used

Consistent hashing is not an interview exercise, it is infrastructure:

- **Amazon Dynamo** partitions data with it, and DynamoDB inherits the design.
- **Apache Cassandra** partitions across the cluster with it.
- **Discord** uses it to route users to chat servers.
- **Akamai** uses it in its CDN to decide which edge server caches what.
- **Maglev**, Google's network load balancer, uses a variant for connection routing.

The recurring shape: any time you have a changing set of servers and a stable notion of which one owns a given key, this is the mechanism.

## One thing it does not do

It is often said to solve the hotspot problem. Be careful with that claim.

Consistent hashing distributes keys evenly, and it helps when the imbalance comes from having too few partitions. It does nothing when a single key is hot, because a key still has exactly one position on the ring and therefore exactly one owner. Katy Perry's row lives on one server no matter how many virtual nodes you configure.

So it mitigates hotspots caused by uneven partitioning, not hotspots caused by uneven popularity. The latter needs the answers from the sharding lesson: dedicated shards for hot keys, caching, or read replicas of the hot partition.

## Predict, then verify

You run 100 servers with 200 virtual nodes each and add one. Roughly what fraction of keys moves, and how many servers send data?

Answer: about 1% of keys move, which is `1/101` of the total, and they arrive from roughly 200 different servers rather than one. The new server brings 200 virtual nodes, each landing in a random spot and taking an arc from whichever server owned that spot, and with 100 servers already present those 200 arcs are drawn from nearly all of them. That is the operationally interesting part, and it cuts both ways. Each existing server gives up about 1% of its data, so no single machine is saturated by the migration, which is what makes scaling up a routine operation rather than an incident. But the migration is 200 small transfers coordinated across the cluster rather than one large one, so the tooling has to handle many concurrent range moves, and "which ranges are currently in flight" becomes state someone has to track.
