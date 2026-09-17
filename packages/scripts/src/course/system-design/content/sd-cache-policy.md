A cache has finite memory and holds copies of data that keeps changing. Two policies follow from those two facts: when an entry expires, and what gets thrown out when the memory is full. They are different mechanisms, and confusing them is a common way to build a cache that behaves strangely.

## Expiry

An expiry policy attaches a time-to-live to each entry. When the TTL passes, the entry is gone and the next read is a miss.

Always set one. Without a TTL, entries live in memory until something evicts them, which for a rarely-read key might be never, and you end up serving a value from three weeks ago because nothing ever pushed it out.

Choosing the number is a two-sided squeeze:

- **Too short** and you reload from the database constantly. A 1-second TTL on a key read 5,000 times a second turns a 100% hit rate into 5,000 hits and one miss per second per key, which is fine, but on a key read twice a second it is a 50% hit rate and you have built an expensive way to query the database.
- **Too long** and the data goes stale. Stale is not an abstract cost: it is a user who changed their display name twenty minutes ago and still sees the old one.

The useful question is not "how fresh do I want this" but "how long can this be wrong before someone notices and cares". A navigation menu can be an hour stale. An account balance cannot be a second stale, which is a sign it should not be cached at all.

## Eviction

An eviction policy decides what to discard when the cache is full and something new arrives. This happens regardless of TTLs, and it is why an entry can vanish long before it expires.

- **LRU**, least recently used, throws out whatever has gone longest without a read. It is the default nearly everywhere because it approximates "keep the hot set" without knowing anything about your data.
- **LFU**, least frequently used, throws out whatever has been read fewest times. Better when popularity is stable, worse when it shifts, because an old entry with a large historical count outranks a new entry that is hot right now.
- **FIFO** throws out the oldest entry regardless of use. Rarely what you want, since it evicts your most popular key on schedule.

Use LRU unless you have a specific reason not to. Its failure mode, a burst of one-time reads sweeping the hot set out, is real but rarer than LFU's failure mode of clinging to yesterday's popular items.

## Headroom and the single point of failure

Run a cache close to full and evictions happen constantly, so the hit rate quietly degrades as ordinary growth pushes hot keys out. Overprovision memory by a margin, on the order of tens of percent, so there is slack for growth and for a burst of new keys.

And do not run one cache server. It is a single point of failure in the strict sense: a component whose failure stops the whole system. As the previous lesson showed, losing a warm cache means the full read load lands on a database sized for a fraction of it. Several servers, across more than one data center, so no single event empties all of them at once.

## Predict, then verify

You cache user profiles with a 30-minute TTL under LRU. Profile edits are rare. A user edits theirs and refreshes: sometimes the new name, sometimes the old one, seemingly at random. Why?

Answer: you have several cache servers, and which one you hit depends on how the key is routed. The write invalidated or refreshed the entry on one of them while the others still hold the old value, so a refresh landing on a different server sees stale data. The randomness is the giveaway: a TTL problem would be consistently stale for up to 30 minutes and then consistently fresh, while an eviction problem would trend one way as memory filled. Alternating on refresh means the copies disagree. The fix is not a shorter TTL, which only shrinks the window; it is to make invalidation reach every node that could hold the key, which usually means routing a key to exactly one server by consistent hashing so there is only ever one copy to invalidate.
