import type { SectionSeed } from "../../types"

export const sdLeaderboard: SectionSeed = {
  slug: "sd-leaderboard",
  title: "Design a real-time gaming leaderboard",
  description:
    "Sorted sets, the rank query that is hard at scale, sharding a global ranking, and what a cloud provider would sell you instead.",
  badgeIcon: "🏆",
  badgeTitle: "Leaderboard",
  units: [
    {
      slug: "ranking",
      title: "Ranking",
      description: "Why one of the two queries is easy and the other is not.",
      lessons: [
        {
          slug: "sd-lb-sorted-sets",
          title: "Why rank is the hard query",
          summary:
            "Rank as a count over everyone above, the skip list that makes it logarithmic, and why the fast structure is a view over a durable table.",
          contentFile: "sd-lb-sorted-sets.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is a user's rank expensive in a relational database?",
              options: [
                "Scores cannot be indexed",
                "Rank is a count of everyone above them, so it walks the index, and it cannot be cached because it changes whenever anyone above scores",
                "The query requires a full table scan of the user table",
                "Ties make the count ambiguous",
              ],
              answer: 1,
              explanation:
                "Reads are cheap for the top and expensive for everyone else, and the expensive case is the common one since most players are not in the top ten.",
            },
            {
              kind: "mcq",
              prompt:
                "What two structures make up a Redis sorted set, and what does each give you?",
              options: [
                "A B-tree for ordering and a bloom filter for membership",
                "A hash table for O(1) score lookup and a skip list for ordered traversal and rank in O(log n)",
                "Two hash tables, one keyed by score and one by member",
                "A sorted array and a binary search index",
              ],
              answer: 1,
              explanation:
                "A skip list is a sorted linked list with layers of indexes above it, so a search descends levels rather than walking elements. Over 25 million players that is about 25 steps, which is the entire reason the structure appears here.",
            },
            {
              kind: "predict",
              prompt: "The Redis node restarts and the leaderboard is gone. What is the recovery?",
              options: [
                "Redis persistence, restoring from the last snapshot",
                "Rebuild the sorted set by replaying the MySQL point table, which exists anyway for match history",
                "Restore from a nightly backup and accept the gap",
                "Ask clients to resubmit their scores",
              ],
              answer: 1,
              explanation:
                "Restarting a large Redis instance from disk is slow, so persistence means minutes of outage. The sorted set is a materialized view over a durable table, exactly as the autocomplete trie was rebuilt from logs. A read replica promoted on failure turns minutes into seconds.",
            },
          ],
        },
        {
          slug: "sd-lb-scaling",
          title: "Sharding a ranking",
          summary:
            "Fixed partitions by score against Redis Cluster's hash slots, why a sorted set lives in one slot, and what the monthly reset is quietly doing.",
          contentFile: "sd-lb-scaling.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "With fixed partitions by score range, how is a user's rank computed?",
              options: [
                "By querying every shard and merging the results",
                "Their local rank in their shard, plus the O(1) player counts of every shard above",
                "By maintaining a global rank column updated on each write",
                "By scanning the highest shard until the user is found",
              ],
              answer: 1,
              explanation:
                "One rank lookup plus a handful of counts. Top 10 is even cheaper, coming from the highest-range shard alone.",
            },
            {
              kind: "mcq",
              prompt: "Why does Redis Cluster's hash partitioning not shard a single leaderboard?",
              options: [
                "It uses consistent hashing, which cannot order keys",
                "A sorted set lives entirely in one hash slot, so the cluster distributes many keys rather than splitting one",
                "Hash slots cannot hold sorted sets",
                "CRC16 collisions would corrupt the ordering",
              ],
              answer: 1,
              explanation:
                "To shard one leaderboard you split it into several sorted sets yourself and merge at read time. Hash partitioning suits many independent leaderboards, per region or mode, which most real products actually have.",
            },
            {
              kind: "predict",
              prompt:
                "Late in the month, players have clustered into the top two of ten score-range shards. What is the real fix?",
              options: [
                "Add shards at the top of the range",
                "Partition by percentile rather than by score, rebalancing from the measured distribution, since everyone drifts upward over a season",
                "Switch to hash partitioning",
                "Reset scores weekly instead of monthly",
              ],
              answer: 1,
              explanation:
                "Ranges chosen for the end-of-month distribution are wrong at the start and vice versa. The monthly reset is doing a lot of work here: it bounds the data, gives a natural repartitioning moment, and makes the structure disposable.",
            },
          ],
        },
      ],
    },
    {
      slug: "serving-and-integrity",
      title: "Serving and integrity",
      description: "Turning ranks into a screen, and making the numbers believable.",
      lessons: [
        {
          slug: "sd-lb-serving",
          title: "Neighbours, ties and names",
          summary:
            "The four-above-and-below query for free, why sorted set rank is not competition rank, and a caching policy that differs by query rather than by endpoint.",
          contentFile: "sd-lb-serving.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does ZREVRANK not give the rank the requirements asked for?",
              options: [
                "It returns a zero-based index rather than a position",
                "Equal scores must share a rank, but it returns distinct positions, so three players on 90 points get 5th, 6th and 7th",
                "It cannot be computed for players outside the top 10",
                "It is O(n) rather than O(log n)",
              ],
              answer: 1,
              explanation:
                "Counting members with a strictly higher score gives competition rank in one extra O(log n) operation. To break ties instead, fold the tiebreaker into the score itself as one packed number.",
            },
            {
              kind: "mcq",
              prompt: "Why does the sorted set store only ids rather than names and avatars?",
              options: [
                "Redis cannot store strings of that length",
                "So the ranking structure stays small; display data is joined at read time and the top players' profiles are cached",
                "Because profiles change more often than scores",
                "To keep the skip list balanced",
              ],
              answer: 1,
              explanation:
                "The hydration step from the news feed section. Batch the ten profile lookups into one query, and cache the top players' profiles since they are read on nearly every leaderboard view.",
            },
            {
              kind: "predict",
              prompt:
                "Is caching the leaderboard response for 10 seconds safe under a real-time requirement?",
              options: [
                "Yes for both the top 10 and a user's own rank",
                "Yes for the top 10, which is stable, but never for a user's own rank right after their match",
                "No: the real-time requirement forbids any caching",
                "Yes, provided the cache is invalidated on every score update",
              ],
              answer: 1,
              explanation:
                "The caching policy differs by query rather than by endpoint, which is worth stating because one handler usually serves both. Same asymmetry as replication lag: a user tolerates staleness about everyone else and notices it instantly about themselves.",
            },
          ],
        },
        {
          slug: "sd-lb-integrity",
          title: "Scores you can believe",
          summary:
            "Why the update path is not a public API, idempotency on match id, statistical detection for what validation misses, and correcting a derived aggregate.",
          contentFile: "sd-lb-integrity.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is the score-update path not a public API?",
              options: [
                "Public APIs cannot be rate limited effectively",
                "A score the client asserts can be asserted by anyone without playing, so it must derive from something the server witnessed",
                "It would expose the leaderboard schema",
                "Clients cannot authenticate to the leaderboard service",
              ],
              answer: 1,
              explanation:
                "No obfuscation helps, because the client runs on hardware the attacker controls. This changes the architecture rather than adding a check: the update is an internal call from the match service.",
            },
            {
              kind: "mcq",
              prompt: "What is the most common cause of inflated scores, before any cheating?",
              options: [
                "Clock skew between match servers",
                "A match result delivered twice by a retry or duplicate queue event, counted twice",
                "Race conditions between concurrent updates",
                "Rounding in the score calculation",
              ],
              answer: 1,
              explanation:
                "Make the update idempotent on match id, by recording which matches were counted or keying the increment on user and match. Without it the inflation is your own retry logic rather than an attacker.",
            },
            {
              kind: "predict",
              prompt:
                "A player's 800 points include 300 from collusion. Should you set their score to 500?",
              options: [
                "Yes: it is one operation and produces the correct total",
                "No: delete the specific point rows and rebuild, or a later rebuild silently restores the inflated score",
                "Yes, and delete the point rows afterwards",
                "No: ban the account instead and leave the score",
              ],
              answer: 1,
              explanation:
                "A direct adjustment leaves the fraudulent rows in the record and cannot be reversed if the detection was wrong. A derived aggregate is corrected only by correcting its source and rederiving, the same principle as ad click reconciliation.",
            },
          ],
        },
      ],
    },
  ],
}
