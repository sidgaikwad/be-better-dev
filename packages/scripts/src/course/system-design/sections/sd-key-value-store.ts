import type { SectionSeed } from "../../types"

export const sdKeyValueStore: SectionSeed = {
  slug: "sd-key-value-store",
  title: "Design a key-value store",
  description:
    "CAP in practice, quorum reads and writes, vector clocks, gossip, Merkle trees, and the write path down to an SSTable.",
  badgeIcon: "🔑",
  badgeTitle: "Key-value",
  units: [
    {
      slug: "partition-and-replicate",
      title: "Partition and replicate",
      description: "Spreading the data, copying it, and deciding how many copies must answer.",
      lessons: [
        {
          slug: "sd-kv-cap",
          title: "CAP, in practice",
          summary:
            "Why CA is not a category you can deploy, and what CP and AP actually look like during a partition.",
          contentFile: "sd-kv-cap.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why can a CA system not exist in a real distributed deployment?",
              options: [
                "Consistency and availability are mathematically incompatible",
                "Partitions are not a design choice, so partition tolerance is mandatory",
                "CA systems cannot be replicated",
                "No database implements the CA combination",
              ],
              answer: 1,
              explanation:
                "A switch fails or a cable is cut and two halves stop hearing each other. The real question is what happens then: refuse to serve, or serve possibly-stale data. CP or AP.",
            },
            {
              kind: "mcq",
              prompt: "A bank balance during a partition. Which choice, and why?",
              options: [
                "AP, because customers need access to their balance",
                "CP, because wrong data is worse than no data here",
                "CA, because banks require both",
                "AP, with conflicts reconciled at read time",
              ],
              answer: 1,
              explanation:
                "Showing a stale balance, or accepting two withdrawals that each looked affordable, is worse than an error. A cart or a session is the opposite case, which is the argument Dynamo made.",
            },
            {
              kind: "predict",
              prompt:
                'A team says "we need consistency and availability, so we will use a CA system". What is the useful correction?',
              options: [
                "Tell them to pick a CP system instead",
                'Reframe it as "during a partition, which do we give up?", because that question has an answer',
                "Point out that availability is measured in nines, not as a CAP property",
                "Explain that CAP does not apply to key-value stores",
              ],
              answer: 1,
              explanation:
                'Choosing "CA" means nobody has decided, so the behavior will be whatever the implementation does, discovered during an incident. They probably mean a CP system with enough redundancy that partitions are rare, which is reasonable and worth saying precisely.',
            },
          ],
        },
        {
          slug: "sd-kv-partition-replication",
          title: "Partitioning and replication",
          summary:
            "The ring again, why replicas must be unique physical servers in distinct data centers, and what N is actually for.",
          contentFile: "sd-kv-partition-replication.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Walking clockwise for N replicas can land on s1_4, s1_9 and s2_1. Why is that a problem?",
              options: [
                "Virtual nodes cannot hold replicas",
                "Three virtual nodes are only two machines, so a replication factor of 3 is really 2",
                "The walk must start from a physical node",
                "The replicas would be in the same data center",
              ],
              answer: 1,
              explanation:
                "One machine failing would lose two of three copies. Skip virtual nodes belonging to a server already chosen, so N counts distinct physical servers.",
            },
            {
              kind: "mcq",
              prompt: "What does placing replicas in distinct data centers cost?",
              options: [
                "Storage, since cross-site copies are compressed less",
                "Write latency: any write waiting for more than one ack pays a cross-site round trip",
                "Consistency, which can no longer be strong",
                "Nothing, since replication is asynchronous",
              ],
              answer: 1,
              explanation:
                "Tens of milliseconds instead of under one. Durability against a regional failure is bought with write latency, and the quorum settings are what tune that trade.",
            },
            {
              kind: "predict",
              prompt:
                "With N = 3, a node fails and its successor takes over its keys. Why is the window before re-replication the dangerous part?",
              options: [
                "The successor may run out of disk",
                "Those keys are down to two copies, so a second failure in the same arc loses data outright",
                "Reads must now consult all three replicas",
                "The ring must be rebuilt before reads resume",
              ],
              answer: 1,
              explanation:
                "The successor also doubles its load, but the real hazard is the reduced replica count. That urgency is why hinted handoff exists: get a third copy somewhere immediately rather than waiting for the failed node.",
            },
          ],
        },
        {
          slug: "sd-kv-quorum",
          title: "Quorum reads and writes",
          summary:
            "N, W and R, why W plus R greater than N guarantees an overlap, and why that rule says nothing about whether a configuration is sensible.",
          contentFile: "sd-kv-quorum.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "With N = 3, what does W = 1 mean?",
              options: [
                "The data exists on one replica",
                "All three replicas are written; the coordinator answers after the first acknowledgment",
                "Only the coordinator holds the write",
                "The write is asynchronous and may be lost",
              ],
              answer: 1,
              explanation:
                "W is how long the client waits, not how many copies exist. The write still goes to all N.",
            },
            {
              kind: "mcq",
              prompt: "Why does raising W or R cost more latency than the number suggests?",
              options: [
                "Each additional replica adds a full round trip in series",
                "You wait for the slowest replica in the quorum, which means waiting further into the latency tail",
                "The coordinator must re-hash the key per replica",
                "Acknowledgments are batched on a timer",
              ],
              answer: 1,
              explanation:
                "W = 2 of 3 waits for the second-fastest. W = N waits for the slowest every time, and at high percentiles some replica is always having a bad moment.",
            },
            {
              kind: "predict",
              prompt: "N = 3, W = 1, R = 3. Consistent? Sensible?",
              options: [
                "Consistent and sensible: it is optimized for fast writes",
                "Not consistent, since W = 1 is below quorum",
                "Consistent but fragile: any one replica down makes reads fail entirely",
                "Neither, since W plus R must equal N",
              ],
              answer: 2,
              explanation:
                "1 + 3 = 4 > 3, so reads are consistent. But R = 3 tracks the slowest replica and cannot be satisfied with one node down, so read availability is worse than a single machine. W = 2, R = 2 gives the same guarantee while tolerating a failure.",
            },
          ],
        },
      ],
    },
    {
      slug: "conflict-and-failure",
      title: "Conflict and failure",
      description:
        "Reconciling divergent writes, surviving dead nodes, and what one node does on disk.",
      lessons: [
        {
          slug: "sd-kv-versioning",
          title: "Versioning with vector clocks",
          summary:
            "Why last-write-wins is decided by clock skew, how vector clocks record causality instead, and who has to resolve the conflict.",
          contentFile: "sd-kv-versioning.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is wrong with resolving conflicts by last-write-wins on a timestamp?",
              options: [
                "Timestamps are too coarse to distinguish writes",
                "Clocks on different machines disagree, so the winner is decided by skew rather than causality, and the loser is silently discarded",
                "Timestamps cannot be stored alongside the value",
                "It requires a synchronized clock service, which is expensive",
              ],
              answer: 1,
              explanation:
                "For a shopping cart that means an item vanishes with no error. Vector clocks record what a write knew about rather than guessing at order.",
            },
            {
              kind: "mcq",
              prompt: "Which pair of vector clocks indicates a conflict?",
              options: [
                "`([s0, 1], [s1, 1])` and `([s0, 1], [s1, 2])`",
                "`([s0, 1], [s1, 2])` and `([s0, 2], [s1, 1])`",
                "`([s0, 1])` and `([s0, 2])`",
                "`([s0, 2], [s1, 1])` and `([s0, 2], [s1, 1])`",
              ],
              answer: 1,
              explanation:
                "Each has a counter higher than the other's somewhere, so neither descends from the other: siblings. In the first case every counter is less than or equal, so the second simply wins.",
            },
            {
              kind: "predict",
              prompt:
                "Two cart siblings come back: one with A and B, one with A and C. Your code picks the later timestamp. What should it do?",
              options: [
                "Take the union, giving A, B and C",
                "Take the intersection, giving A",
                "Pick the sibling from the coordinator node",
                "Reject both and ask the client to retry",
              ],
              answer: 0,
              explanation:
                "Either choice silently deletes a real item. Prefer the resolution whose error the user can correct: a false addition is removable, a silent deletion is not. Deletion is what makes this hard, which is why real carts record removals as entries rather than as absences.",
            },
          ],
        },
        {
          slug: "sd-kv-failures",
          title: "Gossip, handoff and Merkle trees",
          summary:
            "Detecting failure without n-squared messages, writing through a temporary outage, and repairing a replica in proportion to what differs.",
          contentFile: "sd-kv-failures.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What makes gossip robust compared to all-to-all heartbeating?",
              options: [
                "It compresses the membership list",
                "Random peer selection means no coordinator to lose and no fixed path to partition, with constant messages per node",
                "It uses UDP rather than TCP",
                "It only gossips when a node is suspected down",
              ],
              answer: 1,
              explanation:
                "Each round roughly multiplies the number of nodes that know something, so thousands converge in a handful of rounds while all-to-all is n-squared and stops scaling at a few dozen.",
            },
            {
              kind: "mcq",
              prompt: "How does a Merkle tree make repair proportional to the difference?",
              options: [
                "It compresses the key space into a single hash",
                "Equal roots prove identity in one comparison; unequal roots are descended, locating a divergent bucket in about 20 comparisons",
                "It transfers only keys modified since the last sync timestamp",
                "It stores a version vector per bucket",
              ],
              answer: 1,
              explanation:
                "Two replicas differing in one key exchange a few dozen hashes and one bucket, rather than a billion keys. A typical configuration is a million buckets over a billion keys.",
            },
            {
              kind: "predict",
              prompt:
                "A node has been down two days and hints have been accumulating on its neighbors. What is the risk?",
              options: [
                "The hints will be replayed out of order",
                "Hints are unreplicated state: if the holder fails, acknowledged writes are simply gone",
                "The returning node will reject the hints as stale",
                "Gossip will have removed the node from the ring",
              ],
              answer: 1,
              explanation:
                "Each hint exists in fewer places than the replication factor promises, and the pile grows. Real systems expire hints after hours and rebuild the returning node by anti-entropy instead: handoff is a bridge across a short outage, not a substitute for replication.",
            },
          ],
        },
        {
          slug: "sd-kv-read-write-path",
          title: "The write path and the read path",
          summary:
            "Commit log, memtable and SSTable, the Bloom filter that keeps reads from touching every file, and the compaction tax for cheap writes.",
          contentFile: "sd-kv-read-write-path.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why can the client be acknowledged before data reaches an SSTable?",
              options: [
                "The memtable is replicated to other nodes first",
                "The commit log is an append-only durable record, so a crash replays it on restart",
                "SSTables are written synchronously in the background",
                "The coordinator holds the write until the flush completes",
              ],
              answer: 1,
              explanation:
                "An append is a sequential write and the memtable is memory, so neither involves a seek. That is why this family is called log-structured: it never updates in place.",
            },
            {
              kind: "mcq",
              prompt: "What does a Bloom filter answer, and why is that enough?",
              options: [
                "Exactly which SSTable holds the key",
                "Definitely-not or probably-yes, which eliminates nearly every SSTable for a few hundred bytes each",
                "How many versions of the key exist",
                "Whether the key was deleted",
              ],
              answer: 1,
              explanation:
                'It never says no about a key that is present, so a "definitely not" is safe to trust. At a few bits per key the false positive rate is around 1%, so about one lookup in a hundred reads an SSTable unnecessarily.',
            },
            {
              kind: "predict",
              prompt:
                "Read latency climbs for weeks while write latency, traffic and data size are all flat. What is the cause?",
              options: [
                "Bloom filters have degraded and need rebuilding",
                "Compaction has fallen behind, so the same data is spread across more SSTables and every read consults more of them",
                "The memtable threshold is too high",
                "Replication lag is growing",
              ],
              answer: 1,
              explanation:
                "Flat data size is the clue: the extra work comes from file count, not volume. A log-structured store's read latency is a function of file count, so that is the metric to alert on rather than a symptom to discover later.",
            },
          ],
        },
      ],
    },
  ],
}
