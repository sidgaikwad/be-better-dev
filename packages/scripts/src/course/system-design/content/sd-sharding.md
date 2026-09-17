Replication gave the data tier redundancy and read capacity. It did not make the data smaller. Every replica holds a complete copy, so when one machine can no longer hold the data or absorb the writes, adding replicas does nothing. Sharding is splitting the data itself across machines.

## The mechanism

A shard is a database holding a subset of the rows. Every shard runs the same schema; the data in each is disjoint.

You choose a sharding key, one or more columns that decide where a row lives, and a function that maps key to shard. The simplest is modulo:

```text
shard = hash(user_id) % 4
```

`user_id` 1001 hashes to something, mod 4 gives 1, and that user's rows live on shard 1. Every read and write for that user routes there. Four machines now hold a quarter of the data each, and handle roughly a quarter of the traffic each, including writes. That last part is what replication could not do.

## Choosing the key

The sharding key is the most consequential decision in the design, and it is close to irreversible once data exists.

**It must distribute evenly.** The point is to spread load, and a key that clumps defeats it. Sharding by country when 40% of your users are in one country gives you one shard with 40% of the load, which is the problem you were solving.

**It must be present in your queries.** This is the part people miss. If you shard by `user_id` but your most common query is by `email`, then that query has no idea which shard to visit and has to ask all of them, which is a scatter-gather: four queries instead of one, and it gets worse with every shard you add. Sharding does not just split your data, it privileges one access path and makes every other one expensive.

**It should keep related rows together.** If a user's posts, comments and settings all shard by `user_id`, a query for one user's data touches one shard. Shard posts by `post_id` instead and loading a profile becomes a scatter-gather.

## What you give up

Sharding costs you things that were free:

- **Cross-shard joins.** A join needs both sides in one place. Across shards, the database cannot do it, so your application does: query shard A, query shard B, join in memory. The usual answer is to denormalize, duplicating the fields you would have joined to so the query stays on one shard. That means accepting duplicated data and the job of keeping copies in step.
- **Transactions across shards.** Two shards are two databases, so a transaction spanning them is a distributed transaction, which is slow and complicated enough that most systems restructure to avoid needing one.
- **Anything global.** Auto-increment ids collide across shards, which is exactly the problem Part 2's unique ID generator solves. A count of all rows is now a query to every shard.

Shard late. Every one of these costs is permanent and touches your whole application, while the alternatives, a bigger machine, read replicas, a cache, aggressive archiving, are reversible and local. Shard when a single machine genuinely cannot hold the data or absorb the write rate, and not before.

## Predict, then verify

You shard users across 4 databases by `hash(user_id) % 4`. Growth means you need 8. What happens when you change the function to `% 8`?

Answer: roughly 75% of your rows are now on the wrong shard and have to move. A user whose id hashes to 13 was on shard 1 under mod 4 and belongs on shard 5 under mod 8. Only the rows where the two functions agree stay put, which is about a quarter of them. Until the migration completes, every read has to know whether a given row has moved yet, so you are running both mappings at once against live traffic. This is the single worst property of modulo sharding, and it is exactly what consistent hashing exists to fix: Part 2 shows how a hash ring reduces the rows that move from three quarters to roughly `1/n`.
