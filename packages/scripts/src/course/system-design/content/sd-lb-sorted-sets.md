Show the top ten players, and show any player their own rank. The first is easy in any store. The second is the one that breaks naive designs, because rank is not a property of a row.

## Scope

- A point per match won
- Every player included
- A new leaderboard each month
- Top 10, plus a specific user's rank, plus the four above and below them
- 5 million daily active users, 25 million monthly
- 10 matches per player per day
- Equal scores share a rank
- Real time, not batched

## The estimate

```text
DAU                = 5 million
score updates      = 5 million × 10 = 50 million per day
average QPS        = 50 million / 10^5 = ~500
peak QPS           = ~2,500
```

2,500 writes per second at peak. Modest, and the volume is not the problem.

## Why rank is hard

Getting a user's score is a lookup. Getting their rank means knowing how many players have a higher score, which is a count over the whole population:

```sql
SELECT COUNT(*) + 1 FROM leaderboard WHERE score > (
  SELECT score FROM leaderboard WHERE user_id = :id
);
```

With an index on score this is a range count, which the database does by walking the index, so it is `O(n)` in the number of players above them. For a player near the bottom of 25 million, that is millions of index entries per query.

And it cannot be cached usefully, because it changes whenever anyone above them scores, which at 2,500 updates per second is constantly.

That is the shape of the problem: reads are cheap for the top and expensive for everyone else, and the expensive case is the common one, since most players are not in the top ten.

## Sorted sets

Redis sorted sets solve exactly this. A sorted set holds unique members each with a score, kept ordered by score.

The mapping is direct:

```text
ZADD leaderboard_feb_2025 1 user_id       # increment on a win
ZREVRANGE leaderboard_feb_2025 0 9        # top 10
ZREVRANK leaderboard_feb_2025 user_id     # a user's rank
```

Internally it is two structures: a hash table mapping member to score, and a **skip list** mapping score to member. The hash table gives `O(1)` score lookup; the skip list gives ordered traversal and rank.

A skip list is a sorted linked list with layers of indexes above it, each skipping more nodes, so a search descends through levels rather than walking every element. That makes insertion, deletion, search and rank `O(log n)` instead of `O(n)`.

`O(log n)` over 25 million is about 25 steps. That is the entire reason this data structure exists in the chapter.

## Sizing

```text
user id      = 24 bytes
score        = 2 bytes
per entry    = 26 bytes
25 million   = 650 MB
```

Double it for skip list and hash table overhead and it is well inside one Redis server, at a peak of 2,500 operations per second that Redis handles without difficulty.

So the answer at this scale is one Redis instance, and saying that plainly is better than designing a cluster nobody needs.

## Predict, then verify

Redis is in memory. What happens when the node restarts, and what is the recovery?

Answer: the leaderboard is gone, and Redis persistence is not the answer you want to rely on. Redis can persist to disk, and restarting a large instance from a snapshot is slow, so a failure means an outage of minutes rather than seconds even when persistence is on. The real recovery comes from somewhere else: a MySQL `point` table recording user id, score and timestamp for every win, which exists anyway for match history and for anti-cheat review. The leaderboard sorted set is a derived view over that table, so it can be rebuilt by replaying the month's points, and losing it is a rebuild rather than data loss. That framing is the important one and it recurs throughout this course: the fast structure is a materialized view and the durable record is elsewhere, exactly as the autocomplete trie was rebuilt from logs. For availability rather than durability, run a read replica and promote it on failure, which turns minutes into seconds.
