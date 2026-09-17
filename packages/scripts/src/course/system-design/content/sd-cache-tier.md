Every page load runs the same handful of queries. The user's profile, the site navigation, the top ten items. Nothing about them changed since the last request, and the database computes them again anyway, thousands of times a second. A cache is the layer that remembers the answer.

## Where it goes

The cache is its own tier, on its own servers, between the web tier and the database. Not inside the web servers, for the same reason session data does not live there: with four web servers you would get four caches, each with a quarter of the hit rate and its own idea of the truth.

The read path becomes:

1. A request arrives at a web server.
2. The web server asks the cache for the key.
3. On a hit, it returns the value and is done. The database is never touched.
4. On a miss, it queries the database, writes the result into the cache, and returns it.

That fourth step is the important one, and the pattern has a name: read-through. The cache fills itself as a side effect of being missed, so you never write code that populates it up front.

## What a hit rate is worth

Put numbers on it, because the value of a cache is entirely a function of its hit rate and the shape of the improvement is not linear.

Say the database serves a query in 10 ms and the cache in 0.5 ms. At a 90% hit rate the average read is `0.9 × 0.5 + 0.1 × 10`, which is 1.45 ms. Seven times faster. Now push the hit rate to 99%: `0.99 × 0.5 + 0.01 × 10`, which is 0.6 ms. Another factor of two, from nine percentage points.

The database sees the same leverage from the other side. At a 90% hit rate it handles one request in ten, so 10,000 reads per second arrive as 1,000. At 99% it handles 100. The last few percent of hit rate is where a cache stops being an optimization and starts being the thing holding the database up.

Which is exactly why a cache is dangerous. A system tuned to a 99% hit rate has a database provisioned for 100 queries per second. Restart the cache and every request misses at once, and 10,000 queries per second arrive at a database sized for 100. The cache did not just speed things up, it silently became load-bearing, and the failure mode is the database falling over at the moment the cache is least able to help. This is why a cache tier is deployed as several servers across more than one data center rather than one box: not for throughput, but so the whole thing cannot go cold at the same instant.

## What belongs in it

Cache data that is read often and written rarely. That is the whole rule, and both halves matter. Read often, or the entry is evicted before anyone benefits. Written rarely, or you spend more effort invalidating than you save on reads.

What does not belong in it is anything you cannot afford to lose. Cache servers hold data in volatile memory, so a restart empties them. That is a normal event, not a disaster, as long as nothing was only there. The moment something is written to the cache and not to a durable store, you have built a database with no disk.

## Predict, then verify

Your cache hit rate is 95% and the database is comfortable. A colleague proposes caching a second, rarely-read set of objects to "get more out of the cache". Memory is fixed. What happens?

Answer: the hit rate falls and the database gets busier. Memory is fixed, so the new objects evict existing ones, and under LRU the ones evicted are the least recently used, which in a healthy cache are the tail of the hot set. You have traded entries that were being hit for entries that are, by their own description, rarely read. If the new objects are 20% of the cache and serve 1% of reads, the hit rate drops toward 76%, and database load roughly quintuples from 5% of traffic to 24%. A cache is not storage you are failing to fully utilize; it is a fixed budget you spend on the hottest keys, and adding cold keys is spending it worse.
