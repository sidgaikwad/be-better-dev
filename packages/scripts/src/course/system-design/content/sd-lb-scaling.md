One Redis instance serves 5 million daily users. At 500 million, the leaderboard is 65 GB and 250,000 operations per second, and sorted sets stop fitting on one machine.

## Fixed partitions

Split by score range. With scores from 1 to 1000 and ten shards, each holds a hundred points of range: `[1,100]`, `[101,200]`, and so on.

**Top 10** comes from the highest-range shard, and only from it, which is as cheap as before.

**A user's rank** is their local rank within their shard, plus the total player count of every shard above. Those counts are `O(1)` per shard, so the query is one rank lookup plus a handful of counts.

Two costs, and both are real.

**Uneven distribution.** Scores are not uniform: far more players score 50 than 950, so equal ranges give wildly unequal shards. Ranges must be tuned from the measured distribution, and retuned as it drifts, which is the weighted-partition problem from the autocomplete section.

**Users move between shards.** A player crossing from 100 to 101 must be removed from one shard and added to another, so an update is sometimes two writes to two machines with no transaction between them. You also need to know their current score to find their shard, which means either a MySQL read on the write path or a secondary cache mapping user to score.

## Hash partitions

Redis Cluster spreads keys across nodes by hash slot: 16,384 slots, with a key's slot computed as `CRC16(key) % 16384`, and nodes owning slot ranges.

Adding or removing a node moves slots rather than rehashing every key, which is the same property consistent hashing provided in Part 2, achieved with a fixed slot count instead of a ring.

Distribution is even by construction, and users never migrate because a key's slot never changes.

What it costs is the thing the leaderboard needs most. A sorted set lives entirely in one slot, so hash partitioning does not split one leaderboard: it distributes many keys across nodes. To shard one leaderboard you must split it into several sorted sets yourself and merge at read time, and merging means fetching the top 10 from every shard and combining, plus summing counts across all of them for a rank.

## Choosing

Fixed partitions if you need one enormous leaderboard sharded by score, because the top-10 query stays cheap and rank stays computable. Hash partitions if you have many independent leaderboards, per region, per game mode, per month, since each fits on one node and the cluster spreads them.

Most real products are the second case, which is worth saying: the question assumes one global leaderboard, and dividing it by region or tier makes the whole sharding problem disappear while usually being a better product.

## The NoSQL alternative

A store like DynamoDB or Cassandra can hold the leaderboard with a partition key per period and a sort key on score, giving ordered scans for the top N.

What it does not give cheaply is rank for an arbitrary player, because that is still a count of everyone above. You would maintain it approximately, or bucket scores and count buckets. The comparison is worth naming: sorted sets are chosen specifically because rank is `O(log n)` there and expensive nearly everywhere else.

## Predict, then verify

You use fixed partitions by score range. Late in the month, most active players have clustered into the top two shards while the bottom eight are nearly idle. What do you do?

Answer: nothing immediately, because the month is about to end and a new leaderboard starts with a fresh distribution, which is the quiet advantage of monthly tournaments over an all-time leaderboard. The clustering is not a bug but the natural shape of a scoring season: everyone starts at zero and drifts upward, so a range partition chosen for the end-of-month distribution is wrong at the start and one chosen for the start is wrong at the end. That is the real weakness of fixed partitions here, and the fix is to choose ranges by percentile rather than by score, rebalancing on a schedule from the actual distribution, which the system can measure because it has every score. The deeper answer is that the monthly reset is doing a lot of work in this design: it bounds the data, gives a natural moment to repartition, and makes the structure disposable, and any leaderboard without such a reset is a harder problem than the one asked.
