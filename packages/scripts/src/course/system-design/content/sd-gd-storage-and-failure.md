Revision history plus replication plus 500 PB allocated is a storage bill that grows faster than the user base. Three techniques keep it bounded, and none of them is a compression trick.

## Deduplicate blocks

Blocks are identified by content hash, so two blocks with the same hash are the same block and need storing once.

The gain is larger than it sounds because of what people actually store. A team where fifteen people have the same PDF is one stored copy. A file a user duplicated into two folders is one copy. A version history where an edit changed one block out of twenty-five shares the other twenty-four with the previous version, so revision history costs the delta rather than the file.

That last one is the important case: without block dedup, keeping ten versions of a 100 MB file costs 1 GB, and with it, it costs 100 MB plus the changed blocks.

## Bound the version history

Keeping every version forever is unaffordable for files that change often, and a document someone saves every thirty seconds produces a thousand versions in a morning.

Two policies:

- **Cap the count.** Keep the last N versions; the oldest falls off.
- **Weight recent versions.** Keep every recent version, thin older ones out to daily, then weekly. What someone needs is usually "what it looked like this morning" or "before last month's rewrite", not every intermediate save.

The right N is an empirical question, and saying so is better than naming a number. It depends on how your users actually edit, which is a thing you would measure.

## Move cold data to cold storage

Most of 500 PB has not been touched in years. Cold storage such as S3 Glacier is far cheaper per byte, in exchange for retrieval measured in minutes and a fee per retrieval.

That trade is right for data nobody is asking for, and it is the same long-tail reasoning as YouTube's CDN: match the storage tier to the access rate, and accept worse latency exactly where nobody is waiting.

## Failure handling

The interviewer will ask, and each component has a different answer:

- **Load balancer.** A secondary monitors it by heartbeat and takes over. This is the load balancer being itself a single point of failure, from Part 1, with the standard answer.
- **Block server.** Stateless with respect to any individual job, so another server picks up pending work. Uploads are resumable by block, so an in-flight transfer resumes rather than restarting.
- **Cloud storage.** Replicated across regions, so a regional failure means fetching from another.
- **API server.** Stateless, so the load balancer routes around it. This is the stateless web tier paying off: the failure needs no handling beyond removing it from the pool.
- **Metadata database.** Replicated, with a follower promoted on failure, and the promotion caveat from the replication lesson applies: acknowledged writes in the lag window can be lost, which for file metadata means a file that was uploaded appearing not to exist.

Notice how many of these answers are "it is stateless, so nothing special". That is the payoff for the stateless web tier decision, and it is worth pointing out rather than reciting each case as if it were independent.

## Predict, then verify

A user uploads a 5 GB file. Blocks are uploaded, then the metadata write fails before the file row is committed. What is the state, and who cleans it up?

Answer: 5 GB of blocks sit in cloud storage that nothing references, and nothing will ever reference them, because the metadata is the only record of which blocks compose which file. The blocks are not corrupt and not harmful; they are simply unreachable and being paid for forever. This is an orphaned-blob leak, and it is the standard failure of any design that writes a blob and a pointer as two operations, which is every design in this course that separates blobs from metadata. You cannot make the two atomic, since they are different systems, so the answer is a garbage collector: record blocks with an upload timestamp, and periodically delete blocks that are older than some threshold and referenced by no metadata row. The threshold has to exceed the longest plausible upload, or you will collect blocks from an upload still in progress. Worth raising unprompted, because it costs nothing to say and it is the difference between a design that works and one that quietly accumulates cost.
