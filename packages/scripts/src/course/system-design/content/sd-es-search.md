Email search looks like web search and behaves oppositely. Understanding the inversion is what makes the design choices obvious.

## How it differs from web search

|          | Web search                          | Email search                                |
| -------- | ----------------------------------- | ------------------------------------------- |
| Scope    | The whole internet                  | One user's mailbox                          |
| Sorting  | By relevance                        | By attributes: date, unread, has attachment |
| Accuracy | Indexing lags, and that is accepted | Must be near real-time and exact            |

The accuracy row is the demanding one. If someone searches for an email they received thirty seconds ago and it is missing, the product is broken. Nobody expects Google to have indexed a page published thirty seconds ago.

And the write-to-read ratio is inverted. Every sent, received and deleted message requires reindexing, while a search runs only when someone presses the button. Web search indexes rarely relative to how often it is queried; email search indexes constantly and is queried occasionally.

So the index must be cheap to update and is allowed to be relatively expensive to query, which is the reverse of what search infrastructure is usually optimized for.

## Two approaches

**Elasticsearch alongside the mail store.** Mail events go onto Kafka, consumers update the index, and search queries hit Elasticsearch, partitioned by `user_id` so a user's documents live on one node.

This works, it is what most teams would build, and it has one structural problem: two stores holding the same facts, updated independently, so they can disagree. A consumer that falls behind means search misses recent mail, and a consumer that fails means it misses it permanently. The index has to be rebuildable from the mail store, which means the mail store is the source of truth and the index is a derived view that can be discarded and recomputed.

**Search native to the mail store.** One system, so there is nothing to keep in sync and the freshness requirement is satisfied by construction. This is what the large providers build, and it is a large part of why they build their own storage rather than assembling one.

For an interview, propose Elasticsearch and name the consistency problem and how you would detect it. Proposing a custom store with integrated search is only credible if you can say what it would take to build.

## Indexing is the load

Worth doing the arithmetic. A billion users receiving 40 emails a day is 40 billion index writes a day, roughly 460,000 per second, plus writes for reads, deletes and flag changes.

That is several times the send rate, and it says the indexing pipeline is the largest write workload in the system, larger than the mail store itself. Sizing search from the query rate, which is what people instinctively do, would under-provision it by orders of magnitude.

## Conversation threading

Grouping messages into a conversation is not free. The mail protocols provide `In-Reply-To` and `References` headers, which are a chain when clients set them correctly and often are not, so real threading also falls back to matching normalized subjects and participants.

The design consequence is where the thread id is computed: at write time, stored on the message, so reading a thread is a query on one column within one partition. Computing it at read time would mean scanning a mailbox to reconstruct chains on every open.

Same move as everywhere else in this course: precompute at write, because the read is the frequent operation.

## Predict, then verify

Search runs on Elasticsearch fed by Kafka consumers. A consumer falls behind by an hour during a traffic spike. What does the user see, and is anything lost?

Answer: they see a mailbox that contains an email and a search that cannot find it, which reads as data loss even though nothing is lost. The mail store has the message, so the listing is correct and complete; only the derived index is stale, and it will catch up. The damage is trust rather than data, which is why this failure is worse than its technical severity suggests: a user who searches for something they can see and gets nothing concludes the product is unreliable, and there is no error message explaining that the index is behind. Two responses, and both are worth stating. Monitor index lag as a user-facing metric, not an infrastructure one, and surface it: a banner saying recent mail may not appear in search is far better than silence. And for the common case of very recent mail, search the last day directly in the mail store partition and merge those results with the index, which is cheap because it is one partition scoped to one user, and it makes the freshness requirement independent of the indexing pipeline's health.
