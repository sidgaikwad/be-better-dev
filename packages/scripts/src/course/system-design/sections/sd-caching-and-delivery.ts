import type { SectionSeed } from "../../types"

export const sdCachingAndDelivery: SectionSeed = {
  slug: "sd-caching-and-delivery",
  title: "Caching and delivery",
  description:
    "Where to put a cache, what it costs you in staleness, and how a CDN and a stateless web tier move work off the origin.",
  badgeIcon: "⚡",
  badgeTitle: "Cache",
  units: [
    {
      slug: "the-cache-tier",
      title: "The cache tier",
      description: "A second copy of the answer, and everything that follows from it being a copy.",
      lessons: [
        {
          slug: "sd-cache-tier",
          title: "A separate cache tier",
          summary:
            "Read-through caching, what a hit rate is actually worth, and how a cache quietly becomes load-bearing.",
          contentFile: "sd-cache-tier.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does the cache get its own tier instead of living in the web servers?",
              options: [
                "Cache servers need faster CPUs than web servers",
                "Four web servers would mean four caches, each with a fraction of the hit rate and its own idea of the truth",
                "The load balancer cannot route to a web server that also caches",
                "In-process caches cannot use LRU",
              ],
              answer: 1,
              explanation:
                "It is the same argument as session data. Anything one server knows and the others do not fragments the hit rate and creates copies that disagree, and invalidating one leaves the rest wrong.",
            },
            {
              kind: "predict",
              prompt:
                "A cache serves a 99% hit rate for 10,000 reads per second. The cache tier restarts cold. What does the database see?",
              options: [
                "Roughly 100 queries per second, as before",
                "Roughly 1,000 queries per second while the cache refills",
                "Roughly 10,000 queries per second, against a database provisioned for 100",
                "Nothing, because the web tier serves stale responses until the cache warms",
              ],
              answer: 2,
              explanation:
                "Every request misses at once. The database was sized for 1% of traffic and now receives all of it, so the cache turns out to have been load-bearing rather than an optimization. This is why a cache tier is several servers across more than one data center: so it cannot all go cold at the same instant.",
            },
            {
              kind: "mcq",
              prompt: "What is the rule for what belongs in a cache?",
              options: [
                "Anything expensive to compute",
                "Data read often and written rarely",
                "Anything that fits in the available memory",
                "Data that must never be lost",
              ],
              answer: 1,
              explanation:
                "Both halves matter. Read often, or the entry is evicted before it pays for itself. Written rarely, or invalidation costs more than the reads save. And nothing that cannot be lost, since a restart empties volatile memory.",
            },
          ],
        },
        {
          slug: "sd-cache-policy",
          title: "Expiry and eviction",
          summary:
            "Two different mechanisms that both remove entries: a TTL that bounds staleness, and an eviction policy that reclaims memory.",
          contentFile: "sd-cache-policy.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why set a TTL even on entries you invalidate explicitly on write?",
              options: [
                "Because TTLs are faster than explicit invalidation",
                "Because it bounds how long a missed invalidation can serve wrong data",
                "Because eviction will not run without one",
                "Because the cache rejects entries with no expiry",
              ],
              answer: 1,
              explanation:
                "Invalidation is the freshness mechanism; the TTL is the backstop. If the delete is dropped because a process crashed or the cache was briefly unreachable, nothing will ever notice, since a cache hit never consults the database.",
            },
            {
              kind: "mcq",
              prompt: "When does LFU behave worse than LRU?",
              options: [
                "When the cache is nearly empty",
                "When popularity shifts, since an old entry's historical count outranks a newly hot one",
                "When entries have TTLs",
                "When keys are evenly accessed",
              ],
              answer: 1,
              explanation:
                "LFU is better when popularity is stable and worse when it moves, because accumulated counts defend yesterday's winners. LRU's own failure is a burst of one-time reads sweeping the hot set out, which in practice is rarer.",
            },
            {
              kind: "predict",
              prompt:
                "A user edits their profile, then sees the new name on some refreshes and the old one on others, at random. TTL is 30 minutes. What does the randomness indicate?",
              options: [
                "The TTL is too long and will resolve in 30 minutes",
                "The cache is evicting under memory pressure",
                "Several cache servers hold copies and invalidation reached only one",
                "The database write has not committed",
              ],
              answer: 2,
              explanation:
                "A TTL problem is consistently stale and then consistently fresh, never alternating. Alternating on refresh means the copies disagree, so the answer is to route each key to exactly one server by consistent hashing, leaving only one copy to invalidate.",
            },
          ],
        },
        {
          slug: "sd-cache-consistency",
          title: "Keeping the cache and the store in sync",
          summary:
            "Two writes that are not one transaction: why you delete rather than update, and why an expiry stampede is what actually takes sites down.",
          contentFile: "sd-cache-consistency.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why delete a cache entry on write rather than overwrite it with the new value?",
              options: [
                "Deleting is faster than writing",
                "Two concurrent writers can commit to the database in one order and to the cache in the other, diverging permanently",
                "Overwriting resets the entry's TTL",
                "The cache API does not support updates",
              ],
              answer: 1,
              explanation:
                "Deletes commute: two are the same as one, and whichever reader refills next reads the committed value. Updating races, and the divergence is permanent. The price of deleting is one cache miss, which is the cheaper side of that trade.",
            },
            {
              kind: "predict",
              prompt:
                "One popular key expires and a thousand requests arrive in the same millisecond. What happens, and what triggered it?",
              options: [
                "The cache serves the expired value once more while it refills",
                "A thousand identical database queries at once, triggered by nothing going wrong",
                "The load balancer sheds the excess requests",
                "The requests queue behind the first miss automatically",
              ],
              answer: 1,
              explanation:
                "A cache stampede, and its danger is that the trigger is ordinary expiry rather than a fault. The defenses both reduce it to one query per expiry: let the first miss fetch while the others wait on its result, or refresh a hot key just before it expires.",
            },
            {
              kind: "mcq",
              prompt:
                "A reader misses, reads the old value, and writes it to the cache after a writer has committed a new value and deleted the key. What is the consequence?",
              options: [
                "The next read repairs it, since the database is correct",
                "The cache holds the old value until its TTL expires, and nothing can detect it",
                "The write is rejected because the key was deleted",
                "The reader's write is ordered after the delete, so it is discarded",
              ],
              answer: 1,
              explanation:
                "The reader resurrected an entry the writer had just removed, with a value read before the write committed. Every later read is a hit that never checks the database, so only the TTL ends it. A short per-key lock, or a second delete a moment after the write, closes the race.",
            },
          ],
        },
      ],
    },
    {
      slug: "pushing-content-outward",
      title: "Pushing content outward",
      description: "Moving bytes closer to users, and the state that stops you.",
      lessons: [
        {
          slug: "sd-cdn",
          title: "The CDN",
          summary:
            "A read-through cache with distance as the thing being saved, and why you version URLs instead of invalidating them.",
          contentFile: "sd-cdn.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does a CDN save that the cache tier does not?",
              options: [
                "Database queries",
                "Network distance between the user and the bytes",
                "Memory on the web servers",
                "Transfer cost, since CDN egress is free",
              ],
              answer: 1,
              explanation:
                "Same read-through shape, different saving. A user in Europe fetching from San Francisco pays around 150 ms per file, and a page with 30 assets pays it 30 times.",
            },
            {
              kind: "mcq",
              prompt: "Why prefer versioned URLs over calling the provider's invalidation API?",
              options: [
                "Invalidation asks a global network to forget something, which is slow and racy; a new name was never cached",
                "Versioned URLs use less bandwidth",
                "Invalidation APIs do not work across regions",
                "Versioning removes the need for a TTL",
              ],
              answer: 0,
              explanation:
                "Versioning never asks anyone to forget anything. It also makes very long TTLs safe, because the URL changes whenever the bytes do, so a file can be cached for a year.",
            },
            {
              kind: "predict",
              prompt:
                "Assets are versioned and cached for a year. You deploy a CSS fix and users still see the old layout, even though the CSS URL changed. Why?",
              options: [
                "The CDN has not finished propagating the new file",
                "The HTML that references the CSS is itself cached, so it still points at the old URL",
                "The version parameter is ignored by the CDN",
                "The browser cached the CSS under its old name",
              ],
              answer: 1,
              explanation:
                "Every layer is behaving correctly, which is what makes this confusing. A versioned asset and the document referencing it need opposite policies: immutable names with long TTLs for assets, short or no TTL for the HTML that carries the pointers.",
            },
          ],
        },
        {
          slug: "sd-stateless-web-tier",
          title: "A stateless web tier",
          summary:
            "The bill for horizontal scaling: sticky sessions and what they cost, and the state that is not the session.",
          contentFile: "sd-stateless-web-tier.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is the cost of sticky sessions during a traffic spike?",
              options: [
                "Sessions expire faster under load",
                "A new server only picks up new sessions, so relief arrives over the length of a session",
                "The load balancer must run health checks more often",
                "Sticky sessions require a shared session store anyway",
              ],
              answer: 1,
              explanation:
                "Traffic follows sessions rather than capacity, so an added server cannot take work from a hot one. Relief arrives on the wrong timescale, and removing a server signs its users out.",
            },
            {
              kind: "mcq",
              prompt:
                "Why is a key-value store the usual home for session data rather than the main database?",
              options: [
                "It is the exact access pattern: get and put by key, TTL to expire, no joins",
                "Relational databases cannot store session data",
                "Key-value stores are the only stores with expiry",
                "Sessions must be stored in memory to be secure",
              ],
              answer: 0,
              explanation:
                "For once the choice is not preference. It also needs to scale with the web tier rather than compete with the main database for connections.",
            },
            {
              kind: "predict",
              prompt:
                "Sessions are in Redis and sticky sessions are off, yet users are randomly signed out under load. Redis is healthy and the sessions are present. What is the likely cause?",
              options: [
                "Redis is evicting sessions under memory pressure",
                "The load balancer is misrouting requests",
                "Each server signs cookies with a key generated at startup, so a cookie signed by one fails on another",
                "The session TTL is shorter than the request timeout",
              ],
              answer: 2,
              explanation:
                'The request never gets far enough to look the session up. "Random under load" is the signature of this whole class of bug, because it means behavior depends on which server you land on. Removing state means removing all of it, including state you did not think of as data.',
            },
          ],
        },
      ],
    },
  ],
}
