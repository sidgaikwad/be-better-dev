Three storage abstractions exist, and object storage is the newest and the most deliberately compromised. Knowing which one a problem wants is a decision you have been making implicitly since Part 1.

## Block storage

Raw blocks presented to a server as a volume. A local SSD is block storage, and so is a volume attached over Fibre Channel or iSCSI, which behaves identically to the server.

The most flexible and the lowest level. A server can format a volume as a filesystem, or an application like a database can manage the blocks itself to extract every bit of performance.

Fastest, and attached to one server at a time.

## File storage

Built on block storage, adding files and directories and a hierarchy. Shared over NFS or SMB, so many servers can mount the same filesystem without managing blocks.

The general-purpose choice, and what most people mean by storage.

## Object storage

Objects in a flat namespace, reached through a REST API. No directories, no hierarchy, no partial writes.

It makes a deliberate trade: **sacrifice performance for durability, scale and cost**. It is aimed at relatively cold data, archives and backups and media, and it is slow compared to the other two. S3, Google Cloud Storage and Azure Blob Storage are all this shape.

## Why the trade is the right one

That sentence is the whole design and worth unpacking, because the performance sacrifice buys three things that block and file storage cannot offer together.

**Flat namespace removes coordination.** No directory tree means no locking a parent to create a child, no rename touching many entries, no path resolution walking levels. Every object is independent, so the system scales by adding machines with nothing to coordinate.

**Immutability removes consistency problems.** You replace an object, you never modify part of one. No partial writes means no write conflicts and no locking, so replication is copying bytes that will never change.

**A REST API removes the client kernel.** No filesystem driver, no mount, no operating system involvement, so any client anywhere can use it over HTTP.

Every earlier section that reached for object storage did so because of these: YouTube's transcoded videos, Drive's blocks, the crawler's pages, the routing tiles. All immutable, all large, all needing no hierarchy.

## Scope

- Bucket create, delete, list
- Object upload, download, delete
- Versioning
- Listing objects in a bucket by prefix
- 100 PB of data
- Six nines of durability

Six nines means about 31 milliseconds of data loss exposure a year, which is the requirement shaping the whole second half of the design.

## Predict, then verify

Why can object storage not be used as a database's storage layer, when it is cheaper and more durable than block storage?

Answer: because a database updates data in place and object storage cannot. A database writes a page, changes a few bytes in it, and writes it again, thousands of times a second, and object storage has no concept of modifying part of an object: you replace the whole thing. Replacing a 16 KB page means a full round trip over HTTP to rewrite it, which is milliseconds instead of microseconds, so a workload doing thousands of small updates per second becomes impossible by several orders of magnitude. The eventual consistency of some object stores compounds it, since a database needs to read back exactly what it wrote. This is why the three kinds coexist rather than the cheapest one winning: block storage exists for workloads that mutate small pieces frequently, and no amount of durability makes object storage suitable for them. The modern hybrid, worth mentioning, is a database that writes immutable segment files to object storage and keeps a small mutable layer on fast local disk, which is the log-structured design from Part 2 arranged so that the immutable part lives where immutability is cheap.
