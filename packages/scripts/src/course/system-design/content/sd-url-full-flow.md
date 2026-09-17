Both paths end to end, with the numbers from the estimate deciding what each one needs.

## Data model

A relational table, or a key-value store with the same shape:

```sql
CREATE TABLE url (
  id        BIGINT PRIMARY KEY,
  short_url VARCHAR(8) UNIQUE NOT NULL,
  long_url  TEXT NOT NULL
);
```

Three columns. The `id` is what base 62 converts; `short_url` is stored rather than recomputed so the lookup is an index hit rather than a decode, and so the same code keeps working if the encoding ever changes.

At 365 billion rows this is sharded, by `short_url` for reads and by `id` for writes, which are different keys. In practice you shard on the one the read path uses, because reads outnumber writes 10 to 1 and the write path can afford to consult a routing layer.

## Shortening

1. The long URL arrives.
2. Optionally check whether it already exists, if you want deduplication.
3. Get a unique id from the id generator.
4. Convert the id to base 62 to get the short code.
5. Insert `(id, short_url, long_url)`.
6. Return the short URL.

Worked: id `2009215674938` converts to `zn9edcu`, and the row is written.

Note what is absent: no collision check, no retry loop, no read before the write unless you chose deduplication. That is the base 62 decision paying off. At 1,160 writes per second this path is comfortable on a modest database.

## Redirecting

1. A user clicks `https://tinyurl.com/zn9edcu`.
2. The load balancer sends it to a web server.
3. The server checks the cache for `zn9edcu`. Hit: return the long URL.
4. Miss: read the database, populate the cache, return the long URL.
5. Not found in either: the code is invalid, return 404.
6. The server responds with a 301 or 302 redirect.

Read-through caching, exactly the pattern from Part 1, and this is where the read estimate is spent. 11,600 reads per second against the database would need serious sharding, so the question is what hit rate makes it ordinary.

Link popularity is heavily skewed: a small number of links carry most of the clicks, which is the ideal shape for a cache. At a 95% hit rate the database sees 580 reads per second, which is unremarkable. At 99% it sees 116.

That skew is also the risk, and it is the cold-cache scenario from the caching section: a database provisioned for 116 reads per second does not survive the cache emptying. Spread the cache tier across nodes and data centers so it cannot all go cold at once.

## What is not in the diagram

Worth raising in the last minutes:

- **Rate limiting.** Anyone can POST, so anyone can create a hundred million rows. Limit by IP and by account, which is Part 2's section applied directly.
- **Abuse.** The destinations are user-submitted, so some will be phishing or malware. This needs scanning and takedown, which is the argument the redirect lesson made for 302.
- **Analytics.** Usually the reason the product exists.
- **Custom aliases.** `tinyurl.com/my-link` bypasses the id generator entirely and needs its own uniqueness check, which is the collision problem coming back through a different door.

## Predict, then verify

Your cache hit rate is 95% and the database is comfortable. A single link goes viral: 50,000 requests per second for one code. What happens?

Answer: almost nothing, and understanding why is the point. One extremely popular key is the best possible case for a cache: it is read constantly, never written, and occupies one entry. It will be in cache after the first request and stay there, since no eviction policy discards the most-read key in the system. So 50,000 requests per second are served from memory and the database sees one read. The capacity question moves to the cache tier and the web tier, which need to handle 50,000 requests per second in aggregate, and that is a matter of adding stateless servers behind the load balancer. This is worth contrasting with the celebrity problem from the sharding lesson, which looks similar and behaves oppositely: a hot key is a disaster for a sharded database because the key lives on one shard, and a gift to a cache because the key lives in memory everywhere. Same skew, opposite consequence, and which one you get depends on whether the hot thing is being written or only read.
