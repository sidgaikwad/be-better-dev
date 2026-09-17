import type { SectionSeed } from "../../types"

export const sdUniqueId: SectionSeed = {
  slug: "sd-unique-id",
  title: "Design a unique ID generator",
  description:
    "Why auto-increment does not survive sharding, and how snowflake buys sortable 64-bit ids with a timestamp, a machine id and a sequence.",
  badgeIcon: "🆔",
  badgeTitle: "Unique ID",
  units: [
    {
      slug: "the-options",
      title: "The options",
      description: "Four approaches, and why three of them fail the requirements.",
      lessons: [
        {
          slug: "sd-uid-why-not-autoincrement",
          title: "Why not auto-increment",
          summary:
            "Multi-master, UUID and ticket servers, and what each one breaks: ordering, size, or availability.",
          contentFile: "sd-uid-why-not-autoincrement.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does multi-master replication with stepped auto-increment break?",
              options: [
                "Uniqueness, since offsets can collide",
                "Time ordering across servers: a larger id does not mean a later record",
                "Numeric ids, since offsets are encoded as text",
                "Availability, since every server must be reachable",
              ],
              answer: 1,
              explanation:
                "Server 1 might be at 1,000,001 while server 2 is at 57. Adding or removing a server also changes the step for everyone at once, which is fragile across data centers.",
            },
            {
              kind: "mcq",
              prompt: "Which requirements does a UUID fail?",
              options: [
                "Uniqueness and availability",
                "64-bit size, time ordering, and numeric-only",
                "Only the 64-bit size",
                "Throughput and uniqueness",
              ],
              answer: 1,
              explanation:
                "128 bits, random rather than ordered, and usually hex with dashes. Its coordination-free generation is genuinely excellent, which is why UUID v7 exists: it puts a timestamp in the high bits to recover ordering.",
            },
            {
              kind: "predict",
              prompt:
                'A colleague says 128-bit ids versus 64-bit is "just storage, and storage is cheap". What are they missing?',
              options: [
                "Network transfer costs on every query",
                "Index performance: a random key scatters inserts across the whole B-tree instead of appending to its tail",
                "That UUIDs cannot be primary keys",
                "That 128-bit integers are slower to compare",
              ],
              answer: 1,
              explanation:
                "Sequential ids keep the hot part of the index to a few cached pages. Random ones make the working set the whole structure, so write throughput falls as the table grows, which looks like a mysterious degradation rather than a consequence of the key.",
            },
          ],
        },
        {
          slug: "sd-uid-snowflake",
          title: "Snowflake",
          summary:
            "Sixty-four bits divided into fields, why each is the size it is, and how to tune the split against your own numbers.",
          contentFile: "sd-uid-snowflake.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does the timestamp occupy the high bits?",
              options: [
                "It is the largest field",
                "Comparing ids numerically then compares timestamps first, so sorting by id sorts by time",
                "The sign bit must be adjacent to it",
                "It makes the sequence reset cheaper",
              ],
              answer: 1,
              explanation:
                "Time ordering falls out of the layout rather than needing an index on a separate column. That is the property multi-master and UUID both failed.",
            },
            {
              kind: "mcq",
              prompt: "Why use a custom epoch rather than 1970?",
              options: [
                "It makes ids shorter",
                "41 bits is about 69 years, and counting from 1970 would spend decades of that before launch",
                "It avoids collisions with other systems' ids",
                "The sign bit requires a positive offset",
              ],
              answer: 1,
              explanation:
                "2^41 - 1 milliseconds is roughly 69.7 years. Counting from deployment day gives you all of it; counting from 1970 would have burned 40 years before the system was switched on.",
            },
            {
              kind: "predict",
              prompt:
                "Machine id comes from an environment variable, and an autoscaling group launches every instance from one template. What happens?",
              options: [
                "Instances fail to start until an id is assigned",
                "Every instance shares a machine id and silently produces duplicate ids",
                "The sequence counter prevents collisions between instances",
                "The timestamp makes collisions impossible",
              ],
              answer: 1,
              explanation:
                "Same machine bits plus the same millisecond plus the same sequence is the same id, with no exception and no log line. Ids must be assigned at startup, by a coordination service or derived from something unique to the instance, and the generator should refuse to start rather than start with a duplicate.",
            },
          ],
        },
      ],
    },
    {
      slug: "clocks-and-availability",
      title: "Clocks and availability",
      description: "The assumption the whole design rests on, and what happens when it fails.",
      lessons: [
        {
          slug: "sd-uid-clocks",
          title: "When the clock moves backwards",
          summary:
            "Skew, NTP steps, the three ways to handle a backward jump, and why an independent generator per host is the real argument for snowflake.",
          contentFile: "sd-uid-clocks.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is clock skew a problem for reasoning about id order across machines?",
              options: [
                "Ids from different machines can collide",
                "Ids closer together than the skew carry no information about which event happened first",
                "The sequence counter drifts with the clock",
                "Skew causes the timestamp field to overflow early",
              ],
              answer: 1,
              explanation:
                "Within one machine the ordering is exact; across machines it is exact only to the skew. Resolving a conflict by comparing ids repeats the last-write-wins timestamp mistake from the key-value section.",
            },
            {
              kind: "mcq",
              prompt: "Which NTP behavior should a host running an id generator be configured for?",
              options: [
                "Stepping, so corrections apply immediately",
                "Slewing, so the clock's rate changes and time never moves backwards",
                "Disabling NTP entirely",
                "Stepping forward only, with backward corrections queued",
              ],
              answer: 1,
              explanation:
                "A backward step puts the generator at a millisecond it has already issued ids for, with the sequence reset. Slewing corrects by changing the rate and never goes backwards.",
            },
            {
              kind: "predict",
              prompt:
                "NTP steps one host's clock 30 seconds forward, then back to correct. Which step causes the damage?",
              options: [
                "The forward step, since its ids sort ahead of everyone else's",
                "The backward step, since the host reissues timestamps it has already used",
                "Both equally",
                "Neither, since the sequence counter disambiguates",
              ],
              answer: 1,
              explanation:
                "The forward step only makes that host's ids sort early and read wrong as creation times. The backward step produces 30 seconds of duplicates unless the generator refuses, which is an outage on one of twenty hosts and entirely survivable.",
            },
          ],
        },
      ],
    },
  ],
}
