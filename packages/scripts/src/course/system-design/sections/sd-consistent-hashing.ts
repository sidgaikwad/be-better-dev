import type { SectionSeed } from "../../types"

export const sdConsistentHashing: SectionSeed = {
  slug: "sd-consistent-hashing",
  title: "Design consistent hashing",
  description:
    "Why modulo hashing collapses when a server joins or leaves, and how a hash ring with virtual nodes keeps the reshuffle small.",
  badgeIcon: "💍",
  badgeTitle: "Hash ring",
  units: [
    {
      slug: "the-ring",
      title: "The ring",
      description: "From a broken modulo to a ring that survives a changing server count.",
      lessons: [
        {
          slug: "sd-ch-rehashing-problem",
          title: "The rehashing problem",
          summary:
            "Why losing one server out of four invalidates most of the cache, and why the same event is a correctness bug for a shard.",
          contentFile: "sd-ch-rehashing-problem.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Losing one of four servers under `hash(key) % n`. What fraction of keys move?",
              options: [
                "About a quarter, the ones on the lost server",
                "Most of them, since every remainder changes",
                "None, until the hash function is changed",
                "About a third, since the pool shrank by a third",
              ],
              answer: 1,
              explanation:
                "The hashes are unchanged but the remainders are not. Only keys where the mod 4 and mod 3 results coincide stay put, and that is a small minority.",
            },
            {
              kind: "mcq",
              prompt: "Why does a single cache node failing threaten the database?",
              options: [
                "The cache node holds a write-behind buffer",
                "Nearly every client now asks the wrong server, so nearly every read misses and reaches the database",
                "The remaining cache nodes stop accepting writes",
                "The load balancer routes around the whole cache tier",
              ],
              answer: 1,
              explanation:
                "It is the cold cache scenario triggered by losing one machine. A database sized for 1% of read traffic receives most of it, so redundancy produced an outage instead of preventing one.",
            },
            {
              kind: "predict",
              prompt:
                "The same remapping happens to database shards rather than cache nodes. Why is that worse?",
              options: [
                "Shards are larger, so the migration takes longer",
                'A cache miss is slow but correct; a shard computed wrong answers "no such user", which is wrong',
                "Shards cannot be rebalanced while online",
                "It is not worse, since the database is the source of truth",
              ],
              answer: 1,
              explanation:
                "A misplaced row looks like a deletion, and writes create live duplicates on the new shard. A performance incident for a cache is a data correctness incident for a shard, and waiting does not fix it.",
            },
          ],
        },
        {
          slug: "sd-ch-hash-ring",
          title: "The hash ring",
          summary:
            "Joining the ends of the hash space, placing servers and keys in it, and walking clockwise to find an owner.",
          contentFile: "sd-ch-hash-ring.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What changes about a key's position when the server count changes?",
              options: [
                "It shifts by the number of servers added",
                "Nothing: a key's position depends only on the key",
                "It is recomputed modulo the new count",
                "It moves to the nearest new server",
              ],
              answer: 1,
              explanation:
                "That is exactly the property modulo lacked. Only the set of server positions changes, so only keys in the affected arc find a different first server clockwise.",
            },
            {
              kind: "mcq",
              prompt: "What does the ring cost compared to a modulo lookup?",
              options: [
                "A network round trip per lookup",
                "A binary search over server positions instead of one arithmetic operation",
                "A second hash of the key",
                "Storage proportional to the number of keys",
              ],
              answer: 1,
              explanation:
                "Logarithmic rather than constant, over a set of a few hundred or few thousand positions, which is a handful of comparisons. Worth it to be able to change the server count without invalidating the world.",
            },
            {
              kind: "predict",
              prompt:
                "Four servers on a basic ring. Server 1 is removed and its keys go to server 2. What is the risk?",
              options: [
                "Server 2 holds roughly double the load, and if headroom is thin its failure cascades to server 3",
                "The keys are lost, since server 2 has no copy",
                "The ring must be rebuilt from scratch",
                "Servers 0 and 3 must also rebalance",
              ],
              answer: 0,
              explanation:
                "A basic ring does not spread a failure across survivors, it dumps all of it on one neighbor. At 40% utilization server 2 reaches 80% and survives; at 60% it reaches 120%, falls over, and sends 180% to server 3.",
            },
          ],
        },
        {
          slug: "sd-ch-virtual-nodes",
          title: "Virtual nodes",
          summary:
            "Two problems with one cause, and why more points on the ring fixes both, including the cascade.",
          contentFile: "sd-ch-virtual-nodes.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What single fact causes both uneven partitions and uneven key distribution?",
              options: [
                "Hash functions are not uniform",
                "Few samples from a uniform distribution are not evenly spaced",
                "Servers are added at different times",
                "Keys are not hashed with the same function as servers",
              ],
              answer: 1,
              explanation:
                "Four arbitrary points do not divide a circle evenly, and the fewer points you take, the worse the imbalance. Taking more samples is the whole fix.",
            },
            {
              kind: "mcq",
              prompt: "Measured, what does raising virtual nodes from 100 to 200 per server do?",
              options: [
                "Halves the number of keys that move on a change",
                "Takes the standard deviation of load from about 10% of the mean to about 5%",
                "Doubles lookup cost",
                "Eliminates hotspots entirely",
              ],
              answer: 1,
              explanation:
                "It keeps improving with more, with diminishing returns, against more memory for the ring. A hundred to a few hundred per server is the usual range.",
            },
            {
              kind: "predict",
              prompt:
                "10 servers with 1 virtual node each, against 3 servers with 500 each. Which distributes keys more evenly?",
              options: [
                "The 10-server configuration, since more machines means finer division",
                "The 3-server configuration, since evenness depends on points on the ring, not machines",
                "They are equivalent",
                "Neither distributes evenly without rebalancing",
              ],
              answer: 1,
              explanation:
                "Ten points give arcs that vary wildly; fifteen hundred aggregate tightly to within a few percent of a third each. Virtual node count controls balance, server count controls capacity and blast radius, and they are independent.",
            },
          ],
        },
      ],
    },
    {
      slug: "in-practice",
      title: "In practice",
      description: "Which keys actually move, who uses this, and what it does not fix.",
      lessons: [
        {
          slug: "sd-ch-affected-keys",
          title: "Affected ranges, and the limits",
          summary:
            "Walking anticlockwise to find what must move, the systems built on this, and the hotspot it cannot help with.",
          contentFile: "sd-ch-affected-keys.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "How do you find the keys affected by adding or removing a node?",
              options: [
                "Rehash every key and compare",
                "Walk anticlockwise from the changed node to the next node; that arc is the affected range",
                "Walk clockwise from the changed node to the end of the ring",
                "Compare the ring before and after, key by key",
              ],
              answer: 1,
              explanation:
                "With virtual nodes you do this once per virtual node, so a server joining produces a few hundred small ranges. Knowing the ranges is what lets you copy data before flipping the mapping.",
            },
            {
              kind: "mcq",
              prompt: "What does consistent hashing NOT solve?",
              options: [
                "Uneven partition sizes",
                "Cache miss storms when a node is lost",
                "A single key being extremely popular",
                "Scaling the server pool up and down",
              ],
              answer: 2,
              explanation:
                "A key has one position and therefore one owner, however many virtual nodes you configure. It mitigates hotspots caused by uneven partitioning, not by uneven popularity, which needs dedicated shards, caching or read replicas.",
            },
            {
              kind: "predict",
              prompt:
                "100 servers at 200 virtual nodes each, and you add one. What fraction of keys moves, and from how many sources?",
              options: [
                "About 1%, arriving from roughly 200 different servers",
                "About 1%, all from the new server's single neighbor",
                "About 50%, since the ring is rebuilt",
                "About 20%, from the five nearest servers",
              ],
              answer: 0,
              explanation:
                "1/101 of the keys, drawn as 200 small arcs from nearly every existing server. Each gives up about 1% of its data, so no machine is saturated by the migration, at the cost of many concurrent range moves to coordinate.",
            },
          ],
        },
      ],
    },
  ],
}
