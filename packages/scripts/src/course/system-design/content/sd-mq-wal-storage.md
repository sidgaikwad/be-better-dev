Two weeks of retention means the queue is a storage system, so where the messages live decides its performance. The access pattern points at an answer most people reach for last.

## The pattern

- **Write-heavy and read-heavy.** Unusual: most systems are one or the other.
- **No updates or deletes.** Messages are appended and eventually truncated wholesale. Nothing is ever modified in place.
- **Overwhelmingly sequential.** Producers append at the tail; consumers read forward from their offset.

## Not a database

A relational table of messages, or a NoSQL collection of documents, would work and would be the wrong tool.

A database is built to make arbitrary access fast: indexes, query planning, transactions, random reads by key. This workload needs none of it and pays for all of it. Worse, no database is good at write-heavy and read-heavy simultaneously at this scale, so it becomes the bottleneck of the thing it is inside.

## A write-ahead log

Persist each partition as an append-only file. New messages go on the end with an increasing offset; the line number can serve as the offset.

This is the same structure as MySQL's redo log and ZooKeeper's WAL. It is also the key-value store's write path from Part 2, and the reason is identical: an append is a sequential write and never a seek.

Files cannot grow forever, so a partition is split into **segments**. One segment is active and receives appends; when it reaches a size limit it is closed and a new active segment starts. Inactive segments serve reads only, and old ones past the retention window are deleted whole.

```text
Topic-A/
  Partition-1/
    segment-1
    segment-2
    segment-3   <- active
  Partition-2/
    segment-1
    segment-2
```

Truncation becomes deleting a file. Compare deleting two-week-old rows from a database table, which is a long-running transaction against live traffic, and the segment design looks less like a file-layout detail and more like the reason retention is affordable.

## Disks are not slow

The design leans on spinning disks, which contradicts what everyone believes about them.

The belief is right about random access. A seek is around 10 ms, from the latency table, and a workload of random reads is limited by seeks.

Sequential access is a different machine. Modern drives in a RAID configuration comfortably sustain several hundred MB per second reading and writing sequentially, and they cost a fraction of the equivalent in memory or SSD. For a system storing two weeks of messages, that cost difference is the whole economics.

The operating system helps further: it aggressively caches disk data in free memory, so recently written messages, which are exactly what consumers are reading, are usually served from page cache without touching the disk at all. The log design gets that for free precisely because it uses ordinary files.

## The message format is a contract

The message layout is agreed between producer, broker and consumer, and the point is that the broker never rewrites it. A message arrives as bytes, is appended as those bytes, and is sent to consumers as those bytes.

If any party disagreed on the format, the broker would deserialize and re-serialize every message, and that copying at millions of messages per second would dominate everything else. The performance comes from the broker doing nothing to the payload.

## Predict, then verify

A consumer falls two days behind while others are current. What happens to read performance, for it and for everyone?

Answer: the lagging consumer gets dramatically slower, and it makes everyone else slower too. Current consumers read data written seconds ago, which is still in the OS page cache, so their reads never touch the disk. A consumer two days behind reads old segments that are not cached, so every read is real disk I/O, and it is at least sequential rather than random, so it proceeds at disk speed rather than seek speed. The damage to others is the cache: pulling gigabytes of old segments through page cache evicts the recent data everyone else was being served from, so current consumers start missing cache and hitting disk too. One lagging consumer converts a memory-speed system into a disk-speed one for everybody. This is why lag is monitored per consumer group rather than per topic, and why systems under this pressure separate the workloads, serving real-time consumers from one set of replicas and catch-up or batch consumers from another, so the cache each depends on is not being wrecked by the other.
