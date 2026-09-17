`AUTO_INCREMENT` on a primary key gives you unique, numeric, time-ordered ids for free. It is the right answer until the moment your data lives on more than one database, and then it fails completely, because each database counts independently and both will happily hand out id 1001.

Before reaching for something exotic, know what you actually need. A useful set of requirements:

- Unique
- Numeric only
- Fits in 64 bits
- Ordered by time
- At least 10,000 per second

Each of those eliminates a different candidate, which is why asking for them is the first move.

## Multi-master replication

Keep `AUTO_INCREMENT`, but make each of k database servers step by k with a different offset. With two servers, one produces 1, 3, 5 and the other 2, 4, 6.

It works, and it does not survive contact with a growing system:

- Adding or removing a server changes k, so every server's step has to change at once without producing a collision.
- Ids do not increase with time across servers. Server 1 might be at 1,000,001 while server 2 is at 57, so a larger id does not mean a later record, which breaks the ordering requirement.
- Coordinating offsets across data centers is fragile.

## UUID

A 128-bit value generated independently on every machine with no coordination at all. Collisions are effectively impossible: generating a billion per second for a century gives a 50% chance of one duplicate.

Wonderful properties. Each web server generates its own, so the generator scales exactly as the web tier does and there is nothing to synchronize or fail.

It fails three of the requirements, though:

- 128 bits, not 64.
- Not time-ordered. Version 4 is random, so consecutive ids are scattered.
- Not numeric, in its usual hex-with-dashes form.

That second point is not a formality. An index on a random 128-bit key writes to a random page of the B-tree every insert, so the working set is the whole index rather than its tail. Random ids turn a sequential insert workload into a random one, which is the difference between an append and a seek.

## Ticket server

One database whose only job is `AUTO_INCREMENT`. Ask it for a number, get a number. Flickr built this.

Numeric, ordered, trivial to implement, and genuinely correct for small and medium systems.

The problem is stated the moment you draw it: one server, and every write in your system depends on it. It is a single point of failure, and it is in the path of every insert. Running several ticket servers reintroduces exactly the coordination problem you were avoiding.

## What is left

None of the four satisfies the requirements. Multi-master breaks ordering, UUID breaks size and ordering, ticket server breaks availability.

The insight that resolves it: stop treating the id as one number and treat it as several fields packed into 64 bits. If part of it is a timestamp, ordering is free. If part of it identifies the machine, uniqueness needs no coordination. That is Twitter's snowflake, and it is the next lesson.

## Predict, then verify

A colleague argues UUIDs are fine because 64 bits versus 128 is "just storage, and storage is cheap". What are they missing?

Answer: the cost is index performance, not disk. A 128-bit key doubles the size of every index entry, so a B-tree holds half as many keys per page and grows a level deeper, which adds a disk access to lookups against an index that no longer fits in memory. Worse is the randomness. Sequential ids append to the rightmost page, so the hot part of the index is a handful of pages that stay cached. Random UUIDs scatter inserts across the entire index, so every insert is a write to a cold page and the working set is the whole structure. At scale this shows up as write throughput falling as the table grows, which looks like a mysterious degradation rather than a consequence of the key. Storage is indeed cheap; the sequentiality you gave up is not, and it is why UUID v7, which puts a timestamp in the high bits, exists.
