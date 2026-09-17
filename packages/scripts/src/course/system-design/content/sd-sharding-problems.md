Sharding works, and then three specific problems arrive. They arrive in every sharded system, they are not a sign of a bad design, and an interviewer asking about sharding is usually asking about these.

## Resharding

A shard fills up, or one fills faster than the others, and you need more shards. The previous lesson showed why modulo makes this brutal: changing `% 4` to `% 8` relocates about three quarters of your rows.

Three approaches, in increasing order of how much you should prefer them:

- **Rehash and migrate.** Move the 75%. Correct, slow, and requires running both mappings against live traffic for the duration.
- **Consistent hashing.** Place shards on a hash ring so adding one moves only the keys between it and its neighbor, roughly `1/n` of the data. This is Part 2's subject, and it is the standard answer.
- **Never reshard.** Start with far more logical shards than physical machines, say 1024 logical shards mapped onto 4 servers. Growing means moving 256 logical shards to a fifth server, which is a mapping change and a data copy, but the hash function never changes and no key is ever recomputed. This is what most production systems actually do, and it costs nothing to set up on day one.

## The celebrity problem

Also called the hotspot key problem. Sharding distributes rows evenly, and it says nothing about distributing _traffic_ evenly, because traffic is not uniform across rows.

Put Katy Perry, Justin Bieber and Lady Gaga on the same shard and that shard serves a disproportionate share of all reads on the platform. Every other shard is bored. You cannot fix this by adding shards, because the problem is a single key, and a single key lives on a single shard by construction.

The fixes all amount to breaking the assumption that one key means one place:

- Give the hottest keys their own shard, or their own several.
- Cache them hard. A celebrity's profile is the most cacheable object you own: read constantly, written rarely, exactly the rule from the caching section.
- Replicate the hot shard for reads, so the read load spreads even though the key does not.

Note what this implies about capacity planning. Average load per shard is not the number that matters. The busiest shard is, and the ratio between them can be a hundred to one.

## Joins and denormalization

Once data is spread across machines, joins across shards are the application's problem rather than the database's. The standard answer is to denormalize: duplicate the fields you would have joined to, so the query stays on one shard.

Storing the author's display name on every post means rendering a feed needs no join, and it also means a name change has to update every post that user ever wrote. You have traded a read cost you pay constantly for a write cost you pay rarely, which is the right trade for a read-heavy system and the wrong one for a write-heavy one.

Denormalization is a consistency decision, not a performance trick. There are now two copies of the name, they will disagree for some window, and you have to decide how long that window may be and what repairs it.

## Predict, then verify

You shard a social graph by `user_id`. A feature ships letting users see who viewed their profile. Viewer and viewee are different users on different shards. What breaks, and what would you change?

Answer: every write now touches two shards, because a view is a fact about both users and they live in different places. That is a distributed transaction if you want it atomic, and a source of divergence if you do not. The fix is not to change the sharding key, which would break every other query; it is to stop treating one event as one row. Write the view twice, once into each user's shard, as two independent single-shard writes: viewer gets "I viewed X", viewee gets "Y viewed me". Each query then reads from one shard. You have duplicated the data and accepted that the two writes can fail independently, which is repaired by retry rather than by a transaction. Spreading a write across shards rather than spanning one across them is the general move, and it is the same reasoning behind fanout in the news feed section.
