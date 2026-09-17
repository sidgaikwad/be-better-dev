import type { SectionSeed } from "../../types"

export const sdAutocomplete: SectionSeed = {
  slug: "sd-autocomplete",
  title: "Design search autocomplete",
  description:
    "A trie with the top k cached at every node, how the data gathering pipeline rebuilds it, and why the browser cache carries most of the load.",
  badgeIcon: "🔎",
  badgeTitle: "Autocomplete",
  units: [
    {
      slug: "the-structure",
      title: "The structure",
      description: "Why a database query cannot do this, and what replaces it.",
      lessons: [
        {
          slug: "sd-ac-estimate",
          title: "One request per keystroke",
          summary:
            "24,000 requests per second for a typing aid, a 100 ms budget measured from a keypress, and why an index does not rescue the SQL version.",
          contentFile: "sd-ac-estimate.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is the request rate so high relative to the number of searches?",
              options: [
                "Each suggestion is fetched separately",
                "A request fires per keystroke, so a six-character word is six requests",
                "Requests are retried until a match is found",
                "Every prefix is fetched from several shards",
              ],
              answer: 1,
              explanation:
                "100 million searches a day at about 20 characters each is 2 billion requests, or 24,000 per second, 48,000 at peak. That number is the design brief: nothing per request but a lookup.",
            },
            {
              kind: "mcq",
              prompt: "What is notable about the ratio of read rate to data size here?",
              options: [
                "Both are large, so the system needs sharding from day one",
                "Enormous read rate against negligible data (0.4 GB a day), which points at holding everything in memory",
                "Both are small, so a single database suffices",
                "Reads are low but data is large, so disk layout matters most",
              ],
              answer: 1,
              explanation:
                "The asymmetry is what makes the trie design affordable. Spending memory is easy when the dataset is small; spending time is not when the budget is 100 ms at 48,000 QPS.",
            },
            {
              kind: "predict",
              prompt: "Would a B-tree index on the query column make the SQL version viable?",
              options: [
                "Yes, prefix matching is exactly what B-trees do well",
                "No: it fixes finding the matches but not sorting them by frequency, and single-character prefixes match a huge share of the table",
                "No, because B-trees cannot do prefix matches at all",
                "Yes, with a composite index on query and frequency",
              ],
              answer: 1,
              explanation:
                "The index is ordered by query text, not frequency, so the database reads every matching row and sorts. The prefix is a range rather than an equality, so a composite index cannot then be ordered usefully by frequency within it. The work has to move to build time.",
            },
          ],
        },
        {
          slug: "sd-ac-trie",
          title: "A trie with cached top-k",
          summary:
            "Why the naive traversal is worst on the most common request, the two optimizations, and why the fast structure is one you never write to.",
          contentFile: "sd-ac-trie.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is the naive trie traversal worst for short prefixes?",
              options: [
                "Short prefixes require more tree levels",
                "The subtree under a one-character prefix is most of the trie, and that is the most common request",
                "Short prefixes have more collisions",
                "Sorting is unstable for small result sets",
              ],
              answer: 1,
              explanation:
                "Step 2 collects every descendant and step 3 sorts them, so cost grows with how many queries share the prefix. The cheapest requests to answer are the rarest ones.",
            },
            {
              kind: "mcq",
              prompt:
                "Once every node caches its own top k, what is the tree structure still needed for?",
              options: [
                "Nothing at serve time: lookups become a hash get on the prefix",
                "Walking to the node on every request",
                "Ranking the cached entries",
                "Deduplicating queries that share a prefix",
              ],
              answer: 0,
              explanation:
                "That is why a key-value store is a viable persistence option: map each prefix to its cached list and the trie flattens entirely. The tree is needed for building, not for serving.",
            },
            {
              kind: "predict",
              prompt:
                "A query becomes popular enough to enter the top five for a prefix. How many nodes change?",
              options: [
                "One, the node for that query",
                "Every node along its prefix path, up to the root",
                "Only the prefix node whose list changed",
                "All nodes in the subtree below it",
              ],
              answer: 1,
              explanation:
                "A single frequency change propagates from the terminal node to the root. Done per search event, the root's top five would be contended by every update in the system, which is precisely why the trie is rebuilt in batch rather than mutated live.",
            },
          ],
        },
      ],
    },
    {
      slug: "building-and-serving",
      title: "Building and serving",
      description: "The offline pipeline, and getting 48,000 requests per second answered.",
      lessons: [
        {
          slug: "sd-ac-data-gathering",
          title: "The gathering pipeline",
          summary:
            "Logs to aggregates to a rebuilt trie, why sampling is safe here specifically, and the two-speed fix for trending queries.",
          contentFile: "sd-ac-data-gathering.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is sampling 1 in N search events safe for this system?",
              options: [
                "Because the logs are append-only",
                "The output is a ranking of popular queries, and popularity is exactly what survives sampling",
                "Because sampled events are replayed later",
                "Because the trie is rebuilt weekly",
              ],
              answer: 1,
              explanation:
                "A query searched a million times keeps its rank in a 1-in-N sample. What you lose is the tail, which was never reaching anyone's top five. Sampling is unsafe when you need exact counts or care about rare events, and this system needs neither.",
            },
            {
              kind: "mcq",
              prompt: "What changes between a weekly rebuild and a real-time one?",
              options: [
                "The pipeline's components, which are different for each",
                "Only the aggregation window; the pipeline is the same",
                "The trie structure, which must support in-place updates",
                "The sharding scheme",
              ],
              answer: 1,
              explanation:
                "Weekly suits ordinary search, where suggestions barely move. Real time suits products whose value is currency. Verify which you are building, because a real-time trie for a product that does not need one buys complexity and an update problem for nothing.",
            },
            {
              kind: "predict",
              prompt:
                "The trie rebuilds weekly. A major news event Monday makes millions search a new term. What is the fix?",
              options: [
                "Rebuild the whole trie hourly",
                "A small trending trie rebuilt every few minutes, merged with the main one at query time",
                "Bypass the trie for unmatched prefixes",
                "Lower the sampling rate so new queries are captured",
              ],
              answer: 1,
              explanation:
                "Rebuilding everything faster mostly recomputes what did not change. Look up the prefix in both tries and merge the lists. Same two-speed structure as the news feed hybrid: one mechanism for the slow bulk, another for the fast small set, combined at read time.",
            },
          ],
        },
        {
          slug: "sd-ac-scaling",
          title: "Sharding, and the browser",
          summary:
            "Weighted prefix shards from measured distribution, why the browser cache is the biggest win, and a failure mode you can afford.",
          contentFile: "sd-ac-scaling.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why shard the trie by first character weighted rather than evenly?",
              options: [
                "Even sharding cannot route requests",
                "Queries are not uniform across the alphabet, so `s` and `t` carry far more than `x` and `z`",
                "Weighted shards allow replication",
                "It keeps related prefixes together",
              ],
              answer: 1,
              explanation:
                "Build the shard map from measured query distribution, which the gathering pipeline already produces. Same move as weighting virtual nodes by server capacity in consistent hashing.",
            },
            {
              kind: "mcq",
              prompt: "Why does `Cache-Control: private` matter on autocomplete responses?",
              options: [
                "It prevents the browser from caching personalized results",
                "It allows the user's own browser to cache while forbidding shared proxies, since suggestions can be personalized",
                "It shortens the max-age automatically",
                "It signals that the response is compressed",
              ],
              answer: 1,
              explanation:
                "With a one-hour max-age, repeat typing sends no requests at all, and prefixes overlap heavily across a user's searches. The cheapest request is the one that never leaves the browser.",
            },
            {
              kind: "predict",
              prompt:
                "Six months after building a weighted shard map, one shard is at 90% memory and the rest at 40%. What is the fix?",
              options: [
                "Add memory to the hot shard",
                "Recompute the map from recent aggregates, and rebalance during the scheduled rebuild",
                "Switch to consistent hashing on the full query string",
                "Split the hot shard by second character permanently",
              ],
              answer: 1,
              explanation:
                "The distribution moved, as it always does. Because the trie is rebuilt on a schedule anyway, the rebuild is the natural moment to reassign prefixes at no extra cost. A structure that reconstructs itself regularly gets rebalancing for free.",
            },
          ],
        },
      ],
    },
  ],
}
