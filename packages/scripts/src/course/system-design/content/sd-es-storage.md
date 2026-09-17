A billion mailboxes, petabytes a day, and no off-the-shelf database that fits. This is the rare design where the honest answer is that large providers build their own, and the useful thing is to say precisely what it would need.

## What the data is like

- **Headers are small and read constantly.** Every mailbox listing reads them.
- **Bodies range from small to large and are read once.** People read an email and never open it again.
- **Everything is scoped to one user.** A mailbox is private, and every operation, fetching, marking read, searching, is performed by its owner. Nothing crosses users.
- **Recency dominates.** 82% of read queries are for mail younger than 16 days.
- **Loss is unacceptable.** Not "rare", unacceptable.

That third point is the gift. Because nothing is shared, `user_id` partitions perfectly: one user's mail lives on one shard, every query hits one shard, and there are no cross-shard joins anywhere in the product. The sharding problem that made Part 1 difficult does not exist here.

## Why nothing fits

**Relational.** Attractive because indexes make search easy. Relational databases are tuned for small rows, and an email with HTML is routinely over 100 KB. Storing bodies as BLOBs works for storage and makes search over them useless, which removes the reason you wanted relational.

**Object storage.** Fine for raw message backup, and hopeless for marking read, threading or searching, all of which need queryable structure.

**NoSQL.** Bigtable runs Gmail, so it is proven and it is not open source. Cassandra is plausible and no large provider is known to use it for this.

## What it would need

Rather than picking wrongly, state the properties. In an interview this is the stronger answer, because it shows you know why the obvious choices fail.

- A single column holding single-digit megabytes, since bodies are large.
- Strong consistency, because a user must not see mail vanish and reappear.
- Designed to minimize disk I/O, since IOPS is the binding constraint at this scale.
- Highly available and fault tolerant.
- Easy incremental backup, which follows from loss being unacceptable.

That IOPS point is the one candidates miss. At a billion users, the constraint is not capacity or CPU, it is how many disk operations per second the fleet can perform, so the data layout is designed around reducing them rather than around query flexibility.

## The data model

```text
partition key: user_id
```

One user's mail on one shard. The stated limitation is that messages cannot be shared across users, which is not a requirement, so the model costs nothing.

Within the partition, order by time descending, because the 16-day figure says reads are overwhelmingly recent. That layout means a mailbox listing is a sequential read of the front of a partition rather than a scan.

## Tiering

Recency also drives storage tiers. Recent mail lives on fast storage and in cache, old mail moves to cheaper media, and the boundary comes from the 82% figure rather than from a guess.

This is the same move as the monitoring section's downsampling and YouTube's long tail, and here it is safer than either, because nothing is discarded: old mail is slower to retrieve and never less complete.

## Predict, then verify

Partitioning by `user_id` means one shard per user. What happens with a mailing list that 100,000 employees receive?

Answer: the message is written 100,000 times, once into each recipient's partition, which is fanout on write and the same arithmetic as the news feed. It is the right answer despite the duplication, because the alternative, storing one copy and having each mailbox reference it, breaks the property the whole design rests on: a read would have to fetch from another partition, so mailbox listings stop being single-shard and the clean model is gone for every user to save space on a few messages. The metadata duplication is also smaller than it looks, since the attachment is stored once in object storage and referenced 100,000 times, so what is duplicated is headers and body text rather than the 20 MB file. What does need attention is the write burst: 100,000 partition writes from one inbound message, arriving as one SMTP transaction, which should be queued and fanned out asynchronously rather than performed inline while the sending server waits.
