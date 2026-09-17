Two kinds of data with nothing in common. User profiles, settings and friend lists behave like every other application's data. Chat history does not, and it is enormous: Messenger and WhatsApp together process around 60 billion messages a day.

## The access pattern

Four observations, and each one rules something out:

- **The volume is enormous** and grows forever, since history is kept.
- **Recent messages dominate.** Almost every read is of the last screen of a conversation.
- **Random access still happens.** Search, jumping to a mention, opening an old conversation. Rare, and it cannot be unsupported.
- **The read-to-write ratio is about 1:1** for one-on-one chat, which is unusual. Every message is written once and read roughly once, so there is no read-heavy skew to exploit with caching.

That last point is worth sitting with. Most systems in this course lean on a cache because reads outnumber writes by 10:1 or 100:1. Here they do not, so the storage layer has to be genuinely fast at both, and a cache in front of it helps much less than usual.

## Key-value, not relational

Profiles and settings go in a relational database, replicated and sharded as usual.

Messages go in a key-value store, and the reasons are specific:

- **Horizontal scaling** is straightforward, which matters for data that only grows.
- **Low latency** per access.
- **Relational indexes degrade on the long tail.** As the index grows past memory, random access becomes a disk seek, and this table is all tail: billions of rows, mostly never read again.

The precedent is strong: Facebook Messenger uses HBase, Discord uses Cassandra.

## The data model

For one-on-one chat, the message id is the primary key, and it decides order.

For group chat the primary key is `(channel_id, message_id)`, with `channel_id` as the partition key. That choice follows from the access pattern: every query in a group chat is scoped to a channel, so partitioning by channel puts a conversation's messages on one partition and makes reading it a single-partition scan.

## The message id decides order

Ordering is the requirement, and `created_at` cannot provide it. Two messages can carry the same timestamp, and clocks across servers disagree, which the unique ID section covered.

So message ids must be unique and time-sortable, and there are two ways to get them:

- **A global generator**, snowflake. Ids are unique and sortable across the whole system.
- **A local generator**, per channel. Ids are unique only within one conversation.

The local option is worth taking seriously rather than treating as a lesser version. Ordering only needs to hold within a conversation: nobody asks whether a message in one group came before a message in an unrelated one. A per-channel sequence gives you exactly the guarantee you need, is simpler to implement, and produces smaller ids.

## Predict, then verify

You choose per-channel sequence numbers. A user has 200 conversations and opens the app after a week away. How do they fetch what they missed?

Answer: 200 separate queries, one per channel, because a local sequence is meaningless across channels. With a global id the client stores one number, the highest id it has seen, and asks for everything above it in one query. With local ids there is no such number: id 500 in one channel and id 500 in another are unrelated, so the client must track 200 cursors and ask each channel separately. That is the real cost of local ids, and it is not about correctness, it is about the shape of the sync API. The usual resolution is to use local ids for ordering within a conversation and maintain a separate per-user inbox, ordered by a global id, that records which channels have new messages. The client reads one cursor against the inbox to find out what changed, then fetches only those channels. This is the same structure as the news feed's per-user feed, and it is why the next lesson's message sync queue exists rather than being an implementation detail.
