import type { SectionSeed } from "../../types"

export const sdObjectStorage: SectionSeed = {
  slug: "sd-object-storage",
  title: "Design an S3-like object storage",
  description:
    "Buckets and objects over a flat namespace, durability by replication or erasure coding, garbage collection, and versioning.",
  badgeIcon: "🪣",
  badgeTitle: "Object store",
  units: [
    {
      slug: "the-trade",
      title: "The trade",
      description: "What object storage gives up, and what six nines costs.",
      lessons: [
        {
          slug: "sd-os-three-kinds",
          title: "Block, file and object",
          summary:
            "Three abstractions and one deliberate compromise, why a flat immutable namespace scales, and what object storage can never be used for.",
          contentFile: "sd-os-three-kinds.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does object storage trade away, and for what?",
              options: [
                "Durability, for lower cost",
                "Performance, for durability, vast scale and low cost",
                "Consistency, for availability",
                "Capacity, for lower latency",
              ],
              answer: 1,
              explanation:
                "It targets relatively cold data and is slow compared to block and file storage. That sentence is the whole design, and the sacrifice buys three things the others cannot offer together.",
            },
            {
              kind: "mcq",
              prompt: "Why does a flat namespace scale where a directory tree does not?",
              options: [
                "Flat names are shorter to index",
                "No parent to lock when creating a child, no rename touching many entries, no path resolution: every object is independent",
                "Directories require a filesystem driver",
                "Flat namespaces allow larger objects",
              ],
              answer: 1,
              explanation:
                "Combined with immutability, which removes write conflicts and locking, the system scales by adding machines with nothing to coordinate. Every earlier section that reached for object storage did so for these reasons.",
            },
            {
              kind: "predict",
              prompt:
                "Why can a database not run on object storage, despite it being cheaper and more durable?",
              options: [
                "Object storage has no transactions",
                "A database mutates small pieces in place, and object storage can only replace whole objects, turning microseconds into milliseconds",
                "Object storage cannot store binary data",
                "Object storage limits object size below a page",
              ],
              answer: 1,
              explanation:
                "This is why the three kinds coexist rather than the cheapest winning. The modern hybrid writes immutable segment files to object storage and keeps a small mutable layer on fast local disk, which is the log-structured design arranged so immutability lives where it is cheap.",
            },
          ],
        },
        {
          slug: "sd-os-durability",
          title: "Six nines",
          summary:
            "Three copies and what the arithmetic assumes, failure domains making that assumption true, erasure coding's trade, and checksums at every boundary.",
          contentFile: "sd-os-durability.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "What does spreading replicas across failure domains actually do for durability?",
              options: [
                "It raises the arithmetic durability by an order of magnitude",
                "Nothing to the arithmetic: it makes the independence assumption true, without which the number is a fiction",
                "It reduces the number of replicas needed",
                "It improves read latency during failures",
              ],
              answer: 1,
              explanation:
                "0.0081 cubed assumes independent failures. Three copies in one rack survive a server and not the switch, so placement matters as much as count. Easy to overclaim, so state it precisely.",
            },
            {
              kind: "mcq",
              prompt: "When does erasure coding beat replication?",
              options: [
                "Always: 11 nines against 6, at a quarter of the overhead",
                "For cold data, where 50% overhead instead of 200% is an enormous saving and nobody notices slower reads",
                "For latency-sensitive data, since reads are parallel",
                "Never: the compute cost outweighs the storage saving",
              ],
              answer: 1,
              explanation:
                "It is better on the headline numbers and worse on everything about latency and complexity: every read comes from multiple nodes, and a read during a failure must reconstruct first. Choose by workload, and say the option exists.",
            },
            {
              kind: "predict",
              prompt:
                "Two of three replicas fail checksum verification, differently. Can you tell which copy is right?",
              options: [
                "No: majority voting requires a majority",
                "Yes: a checksum is stored with each copy and verifies it against itself, so both failing copies are provably corrupt",
                "No: you must restore from backup",
                "Yes, by comparing the two corrupt copies byte by byte",
              ],
              answer: 1,
              explanation:
                "A checksum is not a vote. That requires the checksum itself to be protected, stored separately and often replicated independently. All three failing means the object is lost, and detecting that is what makes durability measurable at all.",
            },
          ],
        },
      ],
    },
    {
      slug: "metadata-and-space",
      title: "Metadata and space",
      description: "Names over a flat namespace, and reclaiming what deletes leave behind.",
      lessons: [
        {
          slug: "sd-os-metadata",
          title: "Buckets, prefixes and versions",
          summary:
            "Why slashes are just characters, why listing is the hard query, why a delete is an append, and the multipart uploads that never complete.",
          contentFile: "sd-os-metadata.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In `s3://mybucket/abc/d/e/f/file.txt`, what is the object name?",
              options: [
                "`file.txt`, inside directory `abc/d/e/f`",
                "The whole string `abc/d/e/f/file.txt`: the slashes are characters, not a hierarchy",
                "`abc`, with the rest as metadata",
                "`mybucket/abc/d/e/f/file.txt`",
              ],
              answer: 1,
              explanation:
                "Prefix listing rolls up anything with further slashes, which looks exactly like a directory listing and is a string operation over a flat namespace. The hierarchy is in the client's head.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does deleting a versioned object write a delete marker rather than removing anything?",
              options: [
                "To keep the delete fast",
                "So reads return not-found while every prior version stays addressable: deletion is an append",
                "To preserve the object's checksum",
                "Because the data store has no delete operation",
              ],
              answer: 1,
              explanation:
                "The same immutability the whole design rests on. The cost is that storage only grows, and a bucket with versioning and no lifecycle policy is the most common way object storage bills surprise people.",
            },
            {
              kind: "predict",
              prompt:
                "A client uploads 60 of 100 multipart pieces and disappears. What is the state, and who cleans it up?",
              options: [
                "The service assembles a partial object after a timeout",
                "60 parts are stored and billed, belonging to no object, and only a lifecycle rule aborting old incomplete uploads reclaims them",
                "The parts are discarded when the connection drops",
                "The next upload to the same key overwrites them",
              ],
              answer: 1,
              explanation:
                "The orphaned-blob problem again, and worse here because it is routine rather than exceptional. The service cannot tell a client that gave up from one that is slow, which is why S3 exposes this as a bucket setting: everyone hits it.",
            },
          ],
        },
        {
          slug: "sd-os-gc",
          title: "Garbage collection",
          summary:
            "Why nothing is deleted when you ask, compaction and the transactional mapping update, and an ordering where a crash costs space rather than correctness.",
          contentFile: "sd-os-gc.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why are small objects packed into large files, and what does that force?",
              options: [
                "To improve compression ratios; it forces periodic recompression",
                "A billion files would exhaust inodes and make every operation a metadata lookup; packing forces deletion to become compaction",
                "To align with erasure coding chunk sizes; it forces fixed object sizes",
                "To reduce checksum overhead; it forces per-file checksums",
              ],
              answer: 1,
              explanation:
                "Deleting one packed object leaves a hole rather than freeing space, so the collector rewrites files to remove holes. The price of packing is compaction.",
            },
            {
              kind: "mcq",
              prompt: "What does lazy deletion buy beyond speed?",
              options: [
                "Lower storage cost",
                "Safety under concurrency, since a read in flight still finds the bytes, and it is what makes versioning possible",
                "Stronger consistency for listings",
                "Simpler checksum verification",
              ],
              answer: 1,
              explanation:
                "The cost is that deleted data persists for a window, which matters for regulatory deletion where deleted must mean gone by a deadline. Such systems run collection on a schedule tight enough to satisfy it.",
            },
            {
              kind: "predict",
              prompt:
                "Compaction copies to a new file, then updates the mapping, then deletes the old file. It crashes after copying. What is the state?",
              options: [
                "Data is lost, since the mapping still points at the old file",
                "Nothing lost or corrupt: a wasted file that a later pass collects, because the reference switch is the last durable step",
                "Readers see duplicate objects",
                "The mapping must be rebuilt from the data store",
              ],
              answer: 1,
              explanation:
                "Copy, switch references, delete old means every crash point leaves readers pointed at data that exists. The leftover is itself garbage the same process will find. Aim for this in any compaction or migration: failure costs space, not correctness.",
            },
          ],
        },
      ],
    },
  ],
}
