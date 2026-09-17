import type { SectionSeed } from "../../types"

export const sdUrlShortener: SectionSeed = {
  slug: "sd-url-shortener",
  title: "Design a URL shortener",
  description:
    "Hash versus base62 of a counter, the redirect status code that decides whether you see traffic at all, and the storage arithmetic.",
  badgeIcon: "🔗",
  badgeTitle: "Shortener",
  units: [
    {
      slug: "the-shape",
      title: "The shape of the problem",
      description: "Two endpoints, four numbers, and one status code that decides a lot.",
      lessons: [
        {
          slug: "sd-url-estimate-and-api",
          title: "Estimating it, and the two endpoints",
          summary:
            "1,160 writes and 11,600 reads per second, 365 billion records, and why the retention period is really the code length.",
          contentFile: "sd-url-estimate-and-api.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "100 million URLs a day for 10 years. How many records, and what does that number decide?",
              options: [
                "36.5 billion, which decides the storage tier",
                "365 billion, which decides the length of the short code",
                "365 billion, which decides the cache size",
                "3.65 trillion, which decides the sharding key",
              ],
              answer: 1,
              explanation:
                "The code has to address every record, so the record count sets the number of base-62 characters. Retention period and code length turn out to be the same decision.",
            },
            {
              kind: "mcq",
              prompt: "Why is the redirect endpoint not a normal API call?",
              options: [
                "It uses GET rather than POST",
                "It is what a browser does on a click, so the response is an HTTP redirect rather than JSON",
                "It bypasses the load balancer",
                "It returns no body at all",
              ],
              answer: 1,
              explanation:
                "That single fact drives the next decision, because which redirect status you return determines whether the click reaches your servers at all.",
            },
            {
              kind: "predict",
              prompt: "The service must run 100 years instead of 10. What actually changes?",
              options: [
                "The architecture, since 3.65 trillion records needs a different data tier",
                "One more character in the short code, and a sharding parameter",
                "Nothing, since seven characters already cover it",
                "The redirect strategy, since links must live longer",
              ],
              answer: 1,
              explanation:
                "Seven characters give 3.5 trillion, just short of 3.65 trillion, so eight are needed. Storage grows tenfold, which is a parameter rather than a design. Worth volunteering: nobody should fix a code length for a century, and old seven-character codes stay valid while new ones get eight.",
            },
          ],
        },
        {
          slug: "sd-url-redirect-code",
          title: "301 or 302",
          summary:
            "Whether repeat clicks reach you at all, why analytics is usually the product, and why a cached 301 cannot be revoked.",
          contentFile: "sd-url-redirect-code.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does a 301 redirect cost you?",
              options: [
                "Extra latency on the first click",
                "Click analytics, and the ability to change or revoke the link",
                "Compatibility with older browsers",
                "The ability to use a cache tier",
              ],
              answer: 1,
              explanation:
                "The browser caches it and stops asking, which is the saving and the cost in one. For a shortener, analytics is usually the business, and a link you cannot revoke is a liability.",
            },
            {
              kind: "mcq",
              prompt: "Why does a 302 with a long `Cache-Control` max-age behave badly?",
              options: [
                "Browsers reject it as malformed",
                "Intermediaries cache it, so it acts like a 301 and analytics quietly develops holes",
                "It doubles the request count",
                "It prevents the browser from following the redirect",
              ],
              answer: 1,
              explanation:
                "Send `no-store` if you want every click, or a short max-age if you want the load reduction and can count approximately. What is not defensible is leaving it to the framework default and being surprised.",
            },
            {
              kind: "predict",
              prompt:
                "You launched with 301. Legal asks you to take down a phishing link, so you delete the row. Is it disabled?",
              options: [
                "Yes, since the database no longer has the mapping",
                "No, not for anyone who already clicked it: you cannot invalidate a cache you do not control",
                "Yes, after the browser cache expires in 24 hours",
                "No, but serving a 410 to those clients fixes it",
              ],
              answer: 1,
              explanation:
                "Deleting stops new visitors and does nothing for the people most likely to click again. The redirect code is a safety decision as much as a performance one, which is why anything accepting user-submitted destinations should default to 302.",
            },
          ],
        },
      ],
    },
    {
      slug: "generating-the-code",
      title: "Generating the code",
      description: "Two ways to make a short string, and both paths end to end.",
      lessons: [
        {
          slug: "sd-url-hash-vs-base62",
          title: "Hash, or base 62",
          summary:
            "Why seven characters, why truncating a hash puts a database read on the write path, and why the id generator is not automatic here.",
          contentFile: "sd-url-hash-vs-base62.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is seven the right number of base-62 characters?",
              options: [
                "62^7 is 3.5 trillion, roughly ten times the 365 billion needed",
                "62^7 is 365 billion exactly",
                "Seven characters is the shortest a browser will accept",
                "It matches the length of an MD5 prefix",
              ],
              answer: 0,
              explanation:
                "62^6 is 56.8 billion, too small. Say the headroom out loud: a design with 1.05 times what it needs is one bad assumption from running out.",
            },
            {
              kind: "mcq",
              prompt: "What does the hash-and-truncate approach put on the write path?",
              options: [
                "A second hash computation",
                "A database read against a 365-billion-row table before every insert",
                "A distributed lock",
                "A cache invalidation",
              ],
              answer: 1,
              explanation:
                "Truncating reintroduces collisions the full hash did not have, so every candidate must be checked and retried. A Bloom filter reduces the reads without changing the shape, which is guess and check.",
            },
            {
              kind: "predict",
              prompt:
                "You use base 62 on snowflake ids. A snowflake id is up to about 9.2 x 10^18. How long are the codes?",
              options: [
                "Seven characters, as estimated",
                "About 11 characters, because a snowflake id is enormous from the very first one",
                "Variable, between 1 and 7",
                "About 9 characters, after the sign bit is dropped",
              ],
              answer: 1,
              explanation:
                "62^10 is 8.4 x 10^17, too small, so 11 are needed. Snowflake optimized for time-sortability and this problem optimizes for short ids, which pull opposite ways. Use a recent epoch and fewer sequence bits, or a per-machine counter whose first id really is small.",
            },
          ],
        },
        {
          slug: "sd-url-full-flow",
          title: "Both paths, end to end",
          summary:
            "The three-column table, the write path with no collision check, the cached read path, and what a viral link actually does.",
          contentFile: "sd-url-full-flow.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why store `short_url` rather than recomputing it from the id?",
              options: [
                "Base 62 decoding is too slow",
                "The lookup becomes an index hit, and the code keeps working if the encoding ever changes",
                "The id is not stable across shards",
                "It allows the id column to be dropped",
              ],
              answer: 1,
              explanation:
                "The read path looks up by code, so the code needs an index. Storing it also decouples the published URL from the encoding scheme.",
            },
            {
              kind: "mcq",
              prompt: "At 11,600 reads per second, what makes the database load ordinary?",
              options: [
                "Sharding alone",
                "A high cache hit rate: at 95% the database sees 580 per second, at 99% it sees 116",
                "Read replicas, since reads dominate",
                "The 301 redirect removing repeat clicks",
              ],
              answer: 1,
              explanation:
                "Link popularity is heavily skewed, which is the ideal shape for a cache. It is also the risk: a database sized for 116 reads per second does not survive the cache going cold.",
            },
            {
              kind: "predict",
              prompt:
                "One link goes viral: 50,000 requests per second for a single code. What happens to the database?",
              options: [
                "It is overwhelmed, since all traffic lands on one shard",
                "Almost nothing: one hot read-only key is the best possible case for a cache",
                "The cache evicts it as an outlier",
                "Read replicas absorb it after a rebalance",
              ],
              answer: 1,
              explanation:
                "It is read constantly, never written, and occupies one entry, so no eviction policy discards it. Contrast the celebrity problem in sharding: the same skew is a disaster for a sharded write and a gift to a cache, and which you get depends on whether the hot thing is written or only read.",
            },
          ],
        },
      ],
    },
  ],
}
