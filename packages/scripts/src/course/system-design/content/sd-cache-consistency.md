The data store and the cache hold the same value in two places, and nothing keeps them in step. A write updates the database and a write updates the cache, and those are two separate operations that are not in one transaction. Every cache consistency problem comes from that one sentence.

## The window

Consider the ordinary sequence: update the row, then delete the cache entry so the next read refills it.

1. Writer updates the database row to `name = "Bo"`.
2. Writer deletes the cache key.
3. Next reader misses, queries the database, gets `"Bo"`, caches it.

Between steps 1 and 2 there is a window, usually sub-millisecond, where the database says `"Bo"` and the cache still says the old value. Readers in that window get stale data. That is usually acceptable and is not the interesting failure.

The interesting failure is when step 2 does not happen. The process crashes between the two, or the cache server is briefly unreachable, or the delete is fired and dropped. Now the database and the cache disagree, and nothing will ever notice, because a cache hit by definition never consults the database. The entry is wrong until its TTL expires.

This is the argument for always setting a TTL even on data you invalidate explicitly. The TTL is not the freshness mechanism, the invalidation is. The TTL is the backstop that bounds how long a missed invalidation can lie to you.

## Invalidate, do not update

There are two ways to keep the cache current on a write: delete the entry, or overwrite it with the new value. Delete it.

Writing the new value into the cache seems more efficient, since the next reader gets a hit instead of a miss. It introduces a race that deleting does not. Two concurrent writers, A setting `"Bo"` and B setting `"Cy"`, can have their database writes commit in one order and their cache writes land in the other, leaving the database saying `"Cy"` and the cache saying `"Bo"` permanently. Deleting has no such ordering problem: two deletes are the same as one, and whichever reader refills next reads the committed database value.

The cost of deleting is a cache miss you could have avoided. The cost of updating is permanent divergence at a rate proportional to your write concurrency. Take the miss.

## The stampede

A single popular key expires. A thousand requests arrive in the same millisecond, all miss, and all query the database for the same row. The database, sized for the cached workload, gets a thousand identical queries at once.

This is a cache stampede, and it is the failure that actually takes sites down, because it is triggered by ordinary expiry rather than by anything going wrong. Two standard defenses: let only the first miss go to the database and have the others wait on its result, or refresh a hot key slightly before it expires so it is never actually cold. Both amount to ensuring that one expiry causes one query.

Multiply the problem across regions and it gets harder rather than easier, which is what makes cross-region cache coherence a genuinely hard problem rather than a configuration setting.

## Predict, then verify

Two requests race on the same key: a reader that misses, and a writer. The reader queries the database and gets the old value. Before it writes that to the cache, the writer commits the new value and deletes the key. Then the reader's cache write lands. What is in the cache, and for how long?

Answer: the old value, and it stays there until the TTL expires. The reader's write arrived after the writer's delete, so it resurrected data the writer had just removed, and it wrote a value it read before the write committed. Nothing downstream can detect this: the database is correct, the cache is wrong, and every subsequent read is a hit that never checks. This is the concrete reason a TTL is mandatory rather than optional, and the reason serious systems do not simply cache what they read. The fixes are to hold a short lock per key so a reader's fill cannot cross a writer's delete, or to delete the key a second time a moment after the write, which evicts exactly the entries a race could have resurrected.
