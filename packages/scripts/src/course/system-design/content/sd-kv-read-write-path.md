The architecture is deliberately flat. Every node runs the same code and has the same responsibilities, there is no leader, and any node can act as coordinator for a request, proxying to the replicas that own the key. No special node means no single point of failure, and adding or removing machines is automatic.

What remains is what one node does with a write and a read. This follows Cassandra's design.

## The write path

1. The write is appended to a **commit log** on disk.
2. It is written into an in-memory structure, the **memtable**.
3. The client is acknowledged.
4. When the memtable exceeds a threshold, it is flushed to disk as an **SSTable**, a sorted list of key-value pairs, and a fresh memtable starts.

The commit log is the durability guarantee and the reason step 3 can happen before step 4. A crash loses the memtable but not the log, so on restart the node replays the log and recovers.

The reason this is fast is the access pattern. The commit log is an append, which is a sequential write, and the memtable is memory. Neither involves a disk seek. From the latency numbers: a seek is 10 ms, a sequential write is orders of magnitude cheaper. The store never updates data in place, it only ever appends, which is why this family is called log-structured.

The cost is deferred. SSTables accumulate, a key can appear in several of them with different versions, and a background compaction process merges them and discards superseded values. Compaction is the tax for cheap writes, and it competes with live traffic for disk.

## The read path

Check the memtable first. A hit returns immediately, since recently written data is the most likely to be read.

A miss means going to the SSTables, and there may be dozens. Reading each one to discover the key is absent is exactly the disk seek storm the write path avoided.

A **Bloom filter** per SSTable solves this. It is a compact probabilistic structure that answers "is this key in this SSTable?" with two possible answers: definitely not, or probably yes. It never says no about a key that is present.

So the read is:

1. Check the memtable. Found, return.
2. Ask each SSTable's Bloom filter.
3. Read only the SSTables whose filter says the key might be there.
4. Merge what comes back, newest version winning, and return.

With dozens of SSTables and a key in one, the filters eliminate nearly all of them for a few hundred bytes of memory each. The false positive rate is tunable against size: a few bits per key gives around 1%, so roughly one in a hundred lookups reads an SSTable unnecessarily, which is a good trade against reading all of them.

## What the whole design bought

Writes never seek and never read before writing, so write throughput is high and predictable. Reads cost more than in a B-tree store, because a key may live in several places, and the Bloom filters plus compaction are what keep that cost bounded. A store that expects far more writes than a relational database would make that trade deliberately.

## Predict, then verify

Your key-value store's write latency is stable but read latency has been climbing for weeks, with no change in traffic or data size. What is the likely cause?

Answer: compaction has fallen behind, so SSTables are accumulating and every read consults more of them. Data size being flat is the clue that makes this diagnosis rather than a guess: if the logical data is not growing but reads are slowing, the extra work is coming from the same data being spread across more files, which is exactly what happens when flushes outpace merges. Each read now checks more Bloom filters, and at a 1% false positive rate per filter, 100 SSTables mean roughly one unnecessary disk read per lookup on average, plus merging more versions. The fix is to give compaction more resources or a strategy better matched to the workload, and the general lesson is that a log-structured store's read latency is a function of file count, so file count is the metric to alert on rather than a symptom to discover later.
