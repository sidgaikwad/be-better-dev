import type { SectionSeed } from "../../types"

export const sdEstimation: SectionSeed = {
  slug: "sd-estimation",
  title: "Back-of-the-envelope estimation",
  description:
    "Powers of two, the latency numbers worth memorizing, availability in nines, and how to turn a vague product into QPS and terabytes.",
  badgeIcon: "🔢",
  badgeTitle: "Estimation",
  units: [
    {
      slug: "the-numbers",
      title: "The numbers",
      description: "Three tables worth carrying in your head, and what each one is for.",
      lessons: [
        {
          slug: "sd-powers-of-two",
          title: "Powers of two",
          summary:
            "Data volume units, the object sizes to reason from, and why an order of magnitude changes the design rather than the answer.",
          contentFile: "sd-powers-of-two.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why use 1000 rather than 1024 when estimating?",
              options: [
                "Because storage vendors define a kilobyte as 1000 bytes",
                "Because the 2.4% error is far smaller than the error in your assumptions, and 1000 is arithmetic you can do in your head",
                "Because 1024 only applies to memory, not disk",
                "Because the difference compounds to nothing over five steps",
              ],
              answer: 1,
              explanation:
                "Carrying precision you never had costs you arithmetic you can do out loud and buys nothing. What matters is counting the steps: KB, MB, GB, TB, PB, three zeros each.",
            },
            {
              kind: "mcq",
              prompt: "Storing metadata for 100 million objects: why does row size matter so much?",
              options: [
                "It determines the choice of relational or NoSQL",
                "At 100 bytes it is 10 GB and fits in memory; at 10 KB it is 1 TB and needs sharding and a cache tier",
                "It determines the sharding key",
                "It has little effect below a billion rows",
              ],
              answer: 1,
              explanation:
                "Same object count, one assumption off by two orders of magnitude, and it is a completely different system. That is why estimation comes before architecture rather than after it.",
            },
            {
              kind: "predict",
              prompt: "1 billion rows of 1 KB each. Does it fit on one machine?",
              options: [
                "Yes, 1 TB fits on one disk without difficulty",
                "No, 1 TB exceeds what a single machine can store",
                "The storage fits easily; the real question is whether the working set fits in memory",
                "It depends entirely on the choice of database",
              ],
              answer: 2,
              explanation:
                '1 TB is an unremarkable disk. If reads are random across the whole billion, almost every one is a 10 ms seek and the disk is the bottleneck long before storage is. "Does it fit" is nearly always "does the working set fit", and if 1% is hot that is 10 GB of RAM.',
            },
          ],
        },
        {
          slug: "sd-latency-numbers",
          title: "Latency numbers worth knowing",
          summary:
            "The ratios that have not changed since 2010: memory against disk, compression against network, and distance dominating everything.",
          contentFile: "sd-latency-numbers.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why compress data before sending it over a network?",
              options: [
                "Compression is free and networks are metered",
                "You spend microseconds of CPU to save milliseconds of network",
                "Compressed data is less likely to be corrupted",
                "Networks cannot transmit uncompressed payloads efficiently",
              ],
              answer: 1,
              explanation:
                "Compressing 1 KB costs about 10 µs while sending 1 MB costs about 10 ms. The ratio makes it nearly always worth it, and it is one of the five conclusions the table exists to give you.",
            },
            {
              kind: "mcq",
              prompt:
                "A request spends 150 ms on a cross-continental round trip. What follows about optimizing a 100 ns mutex in that path?",
              options: [
                "It is a small win worth taking",
                "It is not a win at all: it is a billionth of the budget",
                "It matters because mutexes are held under contention",
                "It should be optimized before the network hop",
              ],
              answer: 1,
              explanation:
                "Find the biggest number in the path and work on that one. Everything below a millisecond is free next to a 150 ms round trip, and no server optimization touches that number.",
            },
            {
              kind: "predict",
              prompt:
                "Design A makes 100 sequential calls inside one data center. Design B makes 2 calls to another continent. Which is slower?",
              options: [
                "Design A, at about 50 ms",
                "Design B, at about 300 ms",
                "They are roughly equal",
                "Design A, because call count dominates",
              ],
              answer: 1,
              explanation:
                "100 × 0.5 ms is 50 ms; 2 × 150 ms is 300 ms. Distance dominates count, which is why chatty communication stays inside one data center. A hundred local calls is a batching problem; two transatlantic calls is a physics problem.",
            },
          ],
        },
        {
          slug: "sd-availability-nines",
          title: "Availability in nines",
          summary:
            "What each nine costs in minutes per year, why dependencies multiply downward, and how degradation removes a term.",
          contentFile: "sd-availability-nines.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why is five nines a different engineering discipline rather than a harder version of four?",
              options: [
                "It requires specialized hardware",
                "The yearly budget is about 5 minutes, so a human being paged and deciding what to do spends it on one incident",
                "It requires more than one cloud provider",
                "Four nines already has no downtime budget",
              ],
              answer: 1,
              explanation:
                "At four nines you have 52 minutes a year, which is one bad deploy and its rollback. At five, all recovery has to be automatic, because a person reading a dashboard is already over budget.",
            },
            {
              kind: "mcq",
              prompt: "A service sits on three dependencies each at 99.9%. What is its ceiling?",
              options: [
                "99.9%, since they are independent",
                "About 99.7%, because dependencies multiply",
                "99.99%, because redundancy compounds upward",
                "It cannot be computed without their failure correlation",
              ],
              answer: 1,
              explanation:
                "0.999 cubed is about 0.997, before any of your own code fails. Dependencies multiply and the direction is always down, which is a real argument for having fewer of them.",
            },
            {
              kind: "predict",
              prompt:
                "Dependencies are a database at 99.99%, a cache at 99.9%, and a third-party payment API at 99.5%. What is the highest-leverage fix?",
              options: [
                "Add a second cache tier",
                "Negotiate a better SLA with the payment provider",
                "Take the payment API out of the request path by queueing attempts",
                "Replicate the database across regions",
              ],
              answer: 2,
              explanation:
                "The product is about 99.4%, roughly 53 hours a year. The payment API is the worst term by an order of magnitude and the one you cannot improve. Queue it and the multiplication drops to about 99.89%. Removing a dependency from the request path beats hardening one.",
            },
          ],
        },
      ],
    },
    {
      slug: "working-an-estimate",
      title: "Working an estimate",
      description: "One worked example, then the technique for doing it out loud.",
      lessons: [
        {
          slug: "sd-qps-and-storage",
          title: "QPS and storage, worked",
          summary:
            "From 300 million monthly users to 7,000 peak QPS and 55 PB, and what each number says about the design.",
          contentFile: "sd-qps-and-storage.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why convert monthly active users to daily active users first?",
              options: [
                "Monthly figures are usually inaccurate",
                "A monthly figure says nothing about load, which happens per second",
                "Daily figures are what SLAs are written against",
                "It avoids double-counting returning users",
              ],
              answer: 1,
              explanation:
                "Load is a rate. 300 million monthly users could be 10 million a day or 200 million a day, and those are different systems, so the daily figure is the first thing the estimate needs.",
            },
            {
              kind: "mcq",
              prompt:
                "In the worked example, why is the tweet text ignored in the storage estimate?",
              options: [
                "Text is not stored, only indexed",
                "At about 60 GB a day it is two orders of magnitude below the 30 TB of media",
                "Text compresses to nearly nothing",
                "Text is stored in the cache rather than on disk",
              ],
              answer: 1,
              explanation:
                "Knowing which term dominates is the skill, and saying out loud that you are dropping a term is part of the method. It also reframes the storage question: the SQL-or-NoSQL decision is about 60 GB a day of text, not about petabytes of media.",
            },
            {
              kind: "predict",
              prompt:
                "Assuming a 100:1 read-to-write ratio gives 700,000 peak read QPS. Is that a problem with the estimate?",
              options: [
                "Yes, the ratio was never stated so the number is meaningless",
                "No: it is the most design-relevant number in the exercise, because it rules out serving reads from a database",
                "Yes, peak should not be multiplied by the ratio",
                "No, but it should be recomputed against average rather than peak",
              ],
              answer: 1,
              explanation:
                "700,000 reads per second against a database is a refutation of a design rather than a design. It forces cache plus CDN with a hit rate that leaves the database only the misses, which at 99% is 7,000 per second. The estimate did its job.",
            },
          ],
        },
        {
          slug: "sd-estimation-technique",
          title: "Doing it out loud",
          summary:
            "Round aggressively, write the assumptions where both of you can see them, label every unit, and know the five quantities that get asked.",
          contentFile: "sd-estimation-technique.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is three-significant-figure precision worse than a round number here?",
              options: [
                "It takes longer to compute",
                "It suggests a confidence the estimate does not have, since the inputs are guesses",
                "Round numbers are easier to verify later",
                "Interviewers are instructed to penalize decimals",
              ],
              answer: 1,
              explanation:
                'If "half of monthly users are daily" could be off by a factor of two, carrying three figures through the arithmetic is false precision. Round to 1, 2, 5, 10 and powers of ten.',
            },
            {
              kind: "mcq",
              prompt: "What is the least obvious benefit of writing assumptions down?",
              options: [
                "They can be reused in a later question",
                "They turn disagreement into a conversation about the product rather than a wrong answer",
                "They prove you did the work",
                "They let you skip the arithmetic",
              ],
              answer: 1,
              explanation:
                "If the interviewer thinks 10% media is low, that is a fact about the product, not an error in your method. Visible assumptions also make the answer revisable one line at a time when the scale changes.",
            },
            {
              kind: "predict",
              prompt:
                "7,000 peak QPS divided by 1,000 requests per server gives 7 servers. What is wrong with that?",
              options: [
                "Nothing, provided the servers are identical",
                "Seven servers at 100% utilization have no headroom, and 1,000 per server is an unstated assumption that is probably too high",
                "Peak QPS should not be used for provisioning",
                "The division should use average QPS instead",
              ],
              answer: 1,
              explanation:
                "One failure pushes the rest past capacity and the tier cascades, so real targets are 50 to 70% at peak. And a request doing a query and serialization is more like 200 to 500 per second, giving 14 to 35 servers before headroom. State the per-server figure and add headroom explicitly.",
            },
          ],
        },
      ],
    },
  ],
}
