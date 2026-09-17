Nothing in this system deletes data when you ask it to. Deletes mark, uploads fail halfway, corruption is discarded, and something has to reclaim the space afterwards.

## What becomes garbage

**Lazily deleted objects.** A delete sets a flag; the bytes stay. Immediate deletion would mean rewriting the file the object sits inside, which is expensive and contends with live reads.

**Orphaned data.** Abandoned multipart uploads and half-written objects, which the previous lesson established are routine.

**Corrupted data.** Copies that failed checksum verification, discarded but still occupying space.

## Compaction

Objects are packed into large files on disk, so deleting one leaves a hole rather than freeing anything. The collector rewrites files to remove the holes.

1. Read `/data/b`, copying live objects into a new file `/data/d`, skipping anything flagged deleted.
2. Update the object mapping table so each copied object's `file_name` and `start_offset` point at its new location. The id and size are unchanged.
3. Once every object is copied and the mapping updated, delete `/data/b`.

Step 2 must be transactional. A mapping updated for some objects and not others points readers at a file that is about to be deleted, and the failure is silent until someone reads one of those objects.

Packing small objects into large files is worth noticing as the reason compaction exists at all. A billion small objects as a billion files would exhaust filesystem inodes and make every operation a metadata lookup, so they are packed, and the price of packing is that deletion becomes compaction.

## Replicas too

Collection applies to every copy. With three replicas, all three must be collected, and with 8+4 erasure coding, all 12 chunks.

That is a source of drift: a collector that runs per node can leave copies in different states, so a read from one replica finds an object another has already collected. The mapping table, not the node, is the authority on what exists, which is why the transactional update in step 2 is the ordering that matters.

## Why lazy deletion is the right default

It looks like a shortcut and it is a deliberate choice.

**Deletes become fast and cheap.** Setting a flag is a metadata write rather than a rewrite of a multi-gigabyte file.

**It is safe under concurrency.** A read in flight when a delete arrives still finds the bytes, so there is no coordination between deletion and reads.

**It makes versioning possible.** The previous lesson's delete marker is exactly this: deletion is an append, and the old bytes remain until something else decides to reclaim them.

The cost is that deleted data persists for a window, which matters for regulatory deletion requests, where "deleted" must mean gone by a deadline. Systems that must guarantee that run collection on a schedule tight enough to satisfy it, and can report when an object's bytes were actually reclaimed rather than when it was marked.

## Predict, then verify

Compaction copies live objects from `/data/b` to `/data/d`, then updates the mapping, then deletes `/data/b`. It crashes after copying but before updating. What is the state?

Answer: both files exist, `/data/d` is a complete copy of the live objects and is referenced by nothing, and `/data/b` is still referenced and intact. Nothing is lost and nothing is corrupt: the system is exactly as it was plus a wasted file, which is the correct outcome and is a consequence of the ordering rather than luck. Copy first, then switch references, then delete the old, means every crash point leaves readers pointed at data that still exists. Reverse any two steps and there is a window where the mapping points at a file that is gone or at a file that is incomplete. The leftover `/data/d` is itself garbage, which the collector will find on a later pass because it is a file no mapping references, so the mechanism cleans up after its own failures. That is the property to aim for in any compaction or migration: make the reference switch the last durable step, so that failure costs space rather than correctness, and make the leftovers recognizable to the same process that produced them.
