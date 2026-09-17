import type { SectionSeed } from "../../types"

export const sdNewsFeed: SectionSeed = {
  slug: "sd-news-feed",
  title: "Design a news feed system",
  description:
    "Fanout on write against fanout on read, why celebrities break the first one, and the hybrid every real feed ends up with.",
  badgeIcon: "📰",
  badgeTitle: "News feed",
  units: [
    {
      slug: "publishing-and-reading",
      title: "Publishing and reading",
      description: "Two flows that share a data model and almost nothing else.",
      lessons: [
        {
          slug: "sd-nf-two-flows",
          title: "Two flows, and why ids not objects",
          summary:
            "The publish path, the read path, and the estimate that settles the feed cache's contents before anyone argues about it.",
          contentFile: "sd-nf-two-flows.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does the feed cache store post ids rather than whole posts?",
              options: [
                "Ids are faster to sort",
                "Storing objects duplicates every post once per recipient, so a post reaching 5,000 friends is stored 5,000 times",
                "Posts cannot be serialized into a cache",
                "It allows the feed to be recomputed on demand",
              ],
              answer: 1,
              explanation:
                "Ids mean one copy of the post and 5,000 eight-byte references. The cost is that reading a feed is many batched lookups rather than one, which is the right trade because the deduplication is what makes the memory fit.",
            },
            {
              kind: "mcq",
              prompt: "Why cap the feed cache at a few hundred entries per user?",
              options: [
                "Beyond that the cache cannot maintain order",
                "Almost nobody scrolls past a few hundred, so the miss rate stays low and the memory is bounded",
                "Older entries become inconsistent with the database",
                "The API paginates at that size",
              ],
              answer: 1,
              explanation:
                "You do not cache the data, you cache the part anyone looks at, which is the working-set reasoning from the estimation section. Requests past the window fall back to generating that part on demand.",
            },
            {
              kind: "predict",
              prompt:
                "10 million DAU, 2 posts each, 500 friends on average. How many feed entries are written per day?",
              options: [
                "20 million",
                "500 million",
                "10 billion, about 115,000 writes per second sustained",
                "100 billion",
              ],
              answer: 2,
              explanation:
                '20 million posts times 500 friends. The write path, not the read path, is where this system strains, which is the opposite of what "read-heavy social network" suggests. It also forces tiny entries: 8 bytes per id is 80 GB a day, while denormalized posts would be 10 TB for the same information.',
            },
          ],
        },
        {
          slug: "sd-nf-fanout",
          title: "Fanout on write, on read, and both",
          summary:
            "Two models with opposite failure modes, why the celebrity breaks one and the ordinary reader breaks the other, and where the threshold really belongs.",
          contentFile: "sd-nf-fanout.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Where does each fanout model break?",
              options: [
                "Both break on high-fanout authors",
                "Write breaks on the high-fanout author; read breaks on the ordinary reader, who pays the worst case on every load",
                "Write breaks on inactive users; read breaks on media-heavy posts",
                "Read breaks on high-fanout authors; write breaks on inactive users",
              ],
              answer: 1,
              explanation:
                "The two costs land on different users, which is exactly why the hybrid works: push the ordinary authors, pull the few with enormous followings, and merge at read time.",
            },
            {
              kind: "mcq",
              prompt: "Why is fanout done asynchronously through a queue?",
              options: [
                "The graph database cannot be queried synchronously",
                "So the poster's request returns once the post is persisted, rather than waiting on thousands of feed writes",
                "To guarantee ordering across friends' feeds",
                "Because the feed cache only accepts batched writes",
              ],
              answer: 1,
              explanation:
                "Nobody notices a post reaching a friend's feed 200 ms late, and everyone notices posting taking 3 seconds. The publish is fast and the delivery is eventual.",
            },
            {
              kind: "predict",
              prompt:
                "The celebrity threshold is 1 million followers. An account with 900,000 followers posts every few minutes during a live event and the system degrades. What was wrong?",
              options: [
                "The threshold was too high and should be 500,000",
                "Follower count is static, but the load is posting rate times follower count, so the decision should be dynamic",
                "The queue should have been bypassed for that account",
                "Nothing: the degradation is expected during live events",
              ],
              answer: 1,
              explanation:
                "900,000 followers posting twice a day is fine; the same account posting twenty times an hour is not. Measure recent fanout cost per author and switch to pull on a budget. Note the queue did its job: the system degraded into a delay rather than failing.",
            },
          ],
        },
      ],
    },
    {
      slug: "serving-the-feed",
      title: "Serving the feed",
      description: "Five cache tiers, and the one that does not work.",
      lessons: [
        {
          slug: "sd-nf-caching",
          title: "Five cache tiers",
          summary:
            "Why one cache cannot serve feed, content, graph, actions and counters, and what to do about the tier that has no sharing.",
          contentFile: "sd-nf-caching.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is the most useful consequence of splitting the cache into tiers?",
              options: [
                "Each tier can use a different eviction policy",
                "You can degrade unevenly: serve stale counters and still render the feed",
                "Tiers can be sharded on different keys",
                "It reduces total memory usage",
              ],
              answer: 1,
              explanation:
                "Missing a counter means a post without a like count, which you can render. Missing the post means rendering nothing. One cache gives you one failure mode for everything.",
            },
            {
              kind: "mcq",
              prompt: "Why are counters the hardest tier despite being the smallest?",
              options: [
                "They require transactions",
                "They are read-heavy and write-heavy on the same key, which is what caches are worst at",
                "They cannot be expired",
                "They must be consistent across data centers",
              ],
              answer: 1,
              explanation:
                "Every write invalidates an entry thousands of people are about to read. The answers all give up exactness: update in place rather than invalidating, and batch increments. Nobody notices 40,102 instead of 40,109, and everyone notices a slow page.",
            },
            {
              kind: "predict",
              prompt:
                "The action cache (did this user like this post) is the largest tier and has the worst hit rate. What fixes it?",
              options: [
                "More memory, since the tier is undersized",
                "A longer TTL, since actions rarely change",
                "Stop caching per pair and batch-fetch the reader's actions for the current page in one query",
                "Shard it by post id rather than user id",
              ],
              answer: 2,
              explanation:
                "Its key is users times posts seen, and each entry is read by exactly one person, so it earns its memory once while every other tier is shared. More memory cannot fix data that is not shared. When a cache has no sharing, batching the underlying query usually beats caching it.",
            },
          ],
        },
      ],
    },
  ],
}
