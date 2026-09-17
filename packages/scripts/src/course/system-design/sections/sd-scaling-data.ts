import type { SectionSeed } from "../../types"

export const sdScalingData: SectionSeed = {
  slug: "sd-scaling-data",
  title: "Sharding and the pieces around it",
  description:
    "Multiple data centers, a message queue between tiers, the observability you need to run any of it, and sharding when one database is no longer enough.",
  badgeIcon: "🗄️",
  badgeTitle: "Sharding",
  units: [
    {
      slug: "beyond-one-region",
      title: "Beyond one region",
      description: "Spreading out, decoupling, and being able to see what is happening.",
      lessons: [
        {
          slug: "sd-data-centers",
          title: "More than one data center",
          summary:
            "geoDNS, failover through a DNS TTL, and why cross-region replication multiplies every consistency problem you already had.",
          contentFile: "sd-data-centers.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does DNS TTL matter during a data center failover?",
              options: [
                "A long TTL makes DNS queries slower",
                "Resolvers cache the answer, so users keep reaching the dead data center until it expires",
                "geoDNS cannot change its answer while a TTL is active",
                "The TTL determines how long replication lag lasts",
              ],
              answer: 1,
              explanation:
                "Failover is a DNS change, and a cached answer keeps pointing at the failure. A short TTL shortens the outage and multiplies query volume, which is why systems that need fast failover run 60 seconds or less and accept the load.",
            },
            {
              kind: "mcq",
              prompt:
                "Why should redundancy within one region usually come before a second region?",
              options: [
                "A second region cannot improve latency",
                "Cross-region replication is synchronous and too slow",
                "Zones in one region cover the failures that actually happen, at a fraction of the cost",
                "Regions cannot be added after a system is built",
              ],
              answer: 2,
              explanation:
                "A rack, a switch or a power feed failing is common; a whole region failing is rare, and rarer than a bad deploy, which propagates to both data centers in seconds. The exception is latency: if half your users are on another continent, the second region is a performance project standing on its own.",
            },
            {
              kind: "predict",
              prompt:
                "Active-active in two regions with asynchronous replication. One region fails, traffic moves, then the failed region returns holding writes that were never replicated. What is the state?",
              options: [
                "The returning region discards its unreplicated writes automatically",
                "Divergence: two regions hold conflicting writes for the same rows, and no automatic rule resolves it correctly",
                "The writes replicate on recovery and both regions converge",
                "The load balancer replays the missing writes",
              ],
              answer: 1,
              explanation:
                "Conflicting concurrent writes to one row have no correct automatic resolution. Active-active across regions therefore requires deciding up front what owns a record, usually by pinning each user to a home region so the conflict cannot arise.",
            },
          ],
        },
        {
          slug: "sd-message-queue-intro",
          title: "Decoupling with a queue",
          summary:
            "Getting slow work out of the request, scaling producers and consumers separately, and why a queue turns a failure into a delay.",
          contentFile: "sd-message-queue-intro.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does a queue provide that an in-process thread pool does not?",
              options: [
                "Faster processing per job",
                "Decoupling in time: either side can do its work while the other is down",
                "Guaranteed exactly-once execution",
                "Automatic retries of failed jobs",
              ],
              answer: 1,
              explanation:
                "Producers publish when no consumer is running and the messages wait; consumers work when the producer is down. That is what lets the two sides be scaled, deployed and fail independently.",
            },
            {
              kind: "mcq",
              prompt:
                "Ten thousand uploads arrive in a minute against workers that handle a hundred a minute. With a queue, what happens?",
              options: [
                "The queue rejects the excess and clients retry",
                "The queue grows to ten thousand and drains over roughly a hundred minutes",
                "Workers autoscale instantly to absorb the burst",
                "The producers block until capacity frees up",
              ],
              answer: 1,
              explanation:
                "The queue converts a failure into a delay. Without it the same burst is ten thousand simultaneous requests and a web tier that falls over, and a delay is almost always the better failure.",
            },
            {
              kind: "predict",
              prompt:
                "A queue that normally sits near zero grows at 500 messages per minute after a deploy. Consumers report no errors. Does adding consumers fix it?",
              options: [
                "Yes, and it is also the diagnosis",
                "Yes for the backlog, but the real number to find is time-per-message before and after",
                "No, because the arrival rate is what changed",
                "No, the queue must be drained manually first",
              ],
              answer: 1,
              explanation:
                "Arrival did not change with the deploy, so throughput per consumer dropped. Adding consumers is the right immediate action and says nothing about why. If each message doubled in cost you now need double the workers forever, which is a regression rather than a capacity problem.",
            },
          ],
        },
        {
          slug: "sd-observability",
          title: "Logs, metrics and automation",
          summary:
            "Request ids that turn scattered log lines into a story, why you watch percentiles rather than averages, and what instrumentation actually buys.",
          contentFile: "sd-observability.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What makes aggregated logs useful rather than merely large?",
              options: [
                "Compressing them before shipping",
                "A request id attached to every line a request produces, across every service",
                "Sampling to reduce volume",
                "Storing them on the machine that produced them",
              ],
              answer: 1,
              explanation:
                "Without it you have many machines' worth of true statements and no way to assemble them into one story. With it, a single search returns the whole path of one failure.",
            },
            {
              kind: "mcq",
              prompt: "Why watch percentiles instead of averages?",
              options: [
                "Percentiles are cheaper to compute",
                "An average is consistent with everyone being fine and with 1% being terrible, and hides the second case",
                "Averages cannot be computed per endpoint",
                "Percentiles include the host-level metrics",
              ],
              answer: 1,
              explanation:
                "The average is the one number that reliably hides your worst outcomes. At a million requests a day, the 99th percentile is ten thousand people, and they are the ones filing tickets.",
            },
            {
              kind: "predict",
              prompt:
                "Average response time is flat at 120 ms all week while slowness complaints rise sharply. Both are accurate. What happened?",
              options: [
                "The complaints are about something other than speed",
                "A small fraction of requests got much slower and the average absorbed it",
                "The average is computed over the wrong time window",
                "Host metrics are degraded but request metrics are not",
              ],
              answer: 1,
              explanation:
                "2% of requests moving from 120 ms to 3 seconds shifts the average to roughly 178 ms and can move it far less. The 99th percentile went from around 300 ms to 3 seconds, which is where the tickets come from. The diagnosis is whatever correlates with that tail: one endpoint, one shard, one region, one customer.",
            },
          ],
        },
      ],
    },
    {
      slug: "sharding-the-data-tier",
      title: "Sharding the data tier",
      description: "Splitting the data itself, and the three problems that always follow.",
      lessons: [
        {
          slug: "sd-sharding",
          title: "Splitting the database",
          summary:
            "Choosing a sharding key, why it must appear in your queries, and what stops being free once data is spread across machines.",
          contentFile: "sd-sharding.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does sharding do that adding read replicas cannot?",
              options: [
                "Improve read latency",
                "Split the data and the write load, since every replica holds a complete copy",
                "Provide redundancy against a machine failing",
                "Remove the need for a cache",
              ],
              answer: 1,
              explanation:
                "Replication gives redundancy and read capacity while leaving the data whole, so it cannot help when one machine can no longer hold the data or absorb the writes. Sharding splits both.",
            },
            {
              kind: "mcq",
              prompt:
                "You shard by `user_id` but your hottest query looks rows up by `email`. What follows?",
              options: [
                "The query is rejected by the router",
                "The query becomes a scatter-gather across every shard, worsening as you add shards",
                "The email column is automatically indexed on each shard",
                "Nothing, since the router can infer the shard from any column",
              ],
              answer: 1,
              explanation:
                "Nothing tells you which shard holds a given email, so you must ask all of them. Sharding privileges one access path and makes every other one more expensive, which is why the key must appear in the queries you actually run.",
            },
            {
              kind: "predict",
              prompt:
                "Rows are placed by `hash(user_id) % 4`. You move to 8 shards. Roughly what fraction of rows must move?",
              options: ["About a quarter", "About half", "About three quarters", "None"],
              answer: 2,
              explanation:
                "Only rows where both functions agree stay put, which is about a quarter. Until the migration finishes, every read must know whether a row has moved yet, so both mappings run against live traffic. This is precisely what consistent hashing exists to fix.",
            },
          ],
        },
        {
          slug: "sd-sharding-problems",
          title: "Resharding, hotspots and joins",
          summary:
            "The three problems every sharded system meets, and why the best answer to resharding is to never do it.",
          contentFile: "sd-sharding-problems.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is the cheapest defense against ever having to reshard?",
              options: [
                "Start with far more logical shards than machines and move logical shards between them",
                "Keep a spare shard empty from the start",
                "Use a random sharding key",
                "Shard by time so old data can be dropped",
              ],
              answer: 0,
              explanation:
                "1024 logical shards on 4 machines means growth is a mapping change and a data copy, never a change to the hash function, so no key is ever recomputed. It costs nothing on day one and is what most production systems do.",
            },
            {
              kind: "predict",
              prompt:
                "Rows are distributed perfectly evenly, yet one shard serves far more traffic than the rest. Does adding shards help?",
              options: [
                "Yes, more shards means finer distribution",
                "No: the load is a few hot keys, and a key lives on one shard by construction",
                "Yes, once the sharding key is changed",
                "No, because the shards are unbalanced in size",
              ],
              answer: 1,
              explanation:
                "The celebrity or hotspot problem. Sharding distributes rows, not traffic, and traffic is not uniform across rows. The fixes break the one-key-one-place assumption: dedicate shards to the hottest keys, cache them hard, or replicate the hot shard for reads.",
            },
            {
              kind: "mcq",
              prompt: "Why is denormalizing to avoid cross-shard joins a consistency decision?",
              options: [
                "Because denormalized tables cannot be indexed",
                "Because there are now two copies of the field, they will disagree for some window, and something must repair it",
                "Because joins are still required for writes",
                "Because it requires a distributed transaction",
              ],
              answer: 1,
              explanation:
                "Storing an author's name on every post removes the join and means a name change must update every post. You trade a read cost paid constantly for a write cost paid rarely, which is right for a read-heavy system, and you own the divergence window.",
            },
          ],
        },
      ],
    },
  ],
}
