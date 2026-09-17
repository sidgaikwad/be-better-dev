import type { SectionSeed } from "../../types"

export const sdGoogleDrive: SectionSeed = {
  slug: "sd-google-drive",
  title: "Design Google Drive",
  description:
    "Block-level sync, delta uploads, the notification service that tells other clients, and how conflicts get resolved rather than avoided.",
  badgeIcon: "📁",
  badgeTitle: "Drive",
  units: [
    {
      slug: "files-as-blocks",
      title: "Files as blocks",
      description: "The decision the rest of the system is built around.",
      lessons: [
        {
          slug: "sd-gd-blocks",
          title: "Splitting files into blocks",
          summary:
            "Delta sync, deduplication and parallelism from one decision, the order of compression and encryption, and what content-hash dedup leaks.",
          contentFile: "sd-gd-blocks.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "480 peak QPS against 500 PB allocated. What does that tell you?",
              options: [
                "The system needs aggressive request-level caching",
                "It is a storage problem wearing a request-handling costume, so spend the time there",
                "The metadata database will be the bottleneck",
                "The design needs a CDN",
              ],
              answer: 1,
              explanation:
                "480 requests per second is nothing; 500 PB is not. Noticing which number is hard tells you where to spend the interview. Note also the 1:1 read-to-write ratio, so there is no read skew to cache away.",
            },
            {
              kind: "mcq",
              prompt: "Why compress each block before encrypting it?",
              options: [
                "Encryption is faster on compressed input",
                "Encrypted data is indistinguishable from random and does not compress, so the reverse order silently disables compression",
                "Compression algorithms cannot read encrypted blocks",
                "It keeps block hashes stable",
              ],
              answer: 1,
              explanation:
                "The pipeline is split, compress, encrypt, upload. Reversing two steps produces a system that appears to work and transfers far more than it should.",
            },
            {
              kind: "predict",
              prompt:
                "Blocks are deduplicated by content hash across all accounts. What is the problem?",
              options: [
                "Hash collisions could return the wrong block",
                "It leaks whether a file already exists, to anyone who can measure upload time",
                "Dedup prevents per-user encryption keys",
                "Deleting one user's file would delete another's",
              ],
              answer: 1,
              explanation:
                "An instant upload means the server already had it, which discloses that someone else stored that exact file. Worse if a client can claim a block by presenting its hash. Deduplicate within an account, or globally at the storage layer where the client cannot observe it.",
            },
          ],
        },
      ],
    },
    {
      slug: "sync-and-storage",
      title: "Sync and storage",
      description: "Keeping three copies in agreement, and keeping the bill bounded.",
      lessons: [
        {
          slug: "sd-gd-sync",
          title: "Notifying, uploading, conflicting",
          summary:
            "Why long polling beats WebSocket here specifically, the pending status, and why the conflict rule is a last resort rather than the design.",
          contentFile: "sd-gd-sync.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why long polling here when the chat system chose WebSocket?",
              options: [
                "Long polling scales to more clients",
                "Communication is one-directional and infrequent, so the bidirectional persistent connection buys nothing",
                "WebSocket cannot carry file metadata",
                "Long polling works better through corporate firewalls",
              ],
              answer: 1,
              explanation:
                "The server tells clients something changed; clients never push through this channel. Holding a persistent connection per device for a channel silent most of the day is a cost without a matching benefit.",
            },
            {
              kind: "mcq",
              prompt: "Why does the metadata carry a `pending` status during upload?",
              options: [
                "To prevent other clients from editing the file",
                "So other devices show the file arriving rather than it being invisible for minutes",
                "To allow the upload to be resumed",
                "So the notification service can batch events",
              ],
              answer: 1,
              explanation:
                "Without it, a 2 GB upload is invisible until complete and the user wonders whether it worked. Metadata and content upload in parallel, as with YouTube.",
            },
            {
              kind: "predict",
              prompt:
                "A user edits a file offline on a laptop, then edits the same file on their phone online. The laptop reconnects. What happens, and what is the real fix?",
              options: [
                "The laptop's version wins, since it was edited first",
                "The laptop gets a conflict with itself; the fix is to sync on reconnect before allowing edits, not to change the rule",
                "The versions merge automatically, since it is the same user",
                "The laptop's edit is discarded silently",
              ],
              answer: 1,
              explanation:
                "First write processed wins, so the phone won and the laptop conflicts. One user with several devices is far more common than two collaborators, and a conflict rule is a last resort: most of the work in a sync system is in not needing it.",
            },
          ],
        },
        {
          slug: "sd-gd-storage-and-failure",
          title: "Keeping the bill and the failures bounded",
          summary:
            "What block dedup does for revision history, bounded version policies, cold storage, and the orphaned blocks nobody remembers to collect.",
          contentFile: "sd-gd-storage-and-failure.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does block deduplication do for revision history specifically?",
              options: [
                "It removes the need to store old versions at all",
                "A version shares every unchanged block with its predecessor, so history costs the delta rather than the file",
                "It compresses each version against the last",
                "It limits how many versions can be kept",
              ],
              answer: 1,
              explanation:
                "Ten versions of a 100 MB file cost 1 GB without block dedup and roughly 100 MB plus the changed blocks with it.",
            },
            {
              kind: "mcq",
              prompt: 'Why do so many of the failure answers reduce to "it is stateless"?',
              options: [
                "Because the design avoided databases",
                "Because the stateless web tier decision is paying off: the failure needs no handling beyond removing the node from the pool",
                "Because cloud storage handles all state",
                "Because failures are rare enough to ignore",
              ],
              answer: 1,
              explanation:
                "API servers and block servers both fall out this way. Worth pointing out as one payoff rather than reciting each case as if it were independent. The metadata database is the exception, and the promotion caveat from the replication lesson applies to it.",
            },
            {
              kind: "predict",
              prompt:
                "Blocks for a 5 GB file upload successfully, then the metadata write fails before committing. What is the state?",
              options: [
                "The blocks are rolled back with the metadata transaction",
                "5 GB of orphaned blocks nothing will ever reference, paid for forever",
                "The upload retries automatically from the blocks already stored",
                "Cloud storage garbage-collects them on its own",
              ],
              answer: 1,
              explanation:
                "Metadata is the only record of which blocks compose which file. Blob and pointer cannot be written atomically across two systems, so the answer is a garbage collector over blocks older than the longest plausible upload with no referencing row. It costs nothing to raise and is the difference between a design that works and one that quietly accumulates cost.",
            },
          ],
        },
        {
          slug: "sd-gd-sharing",
          title: "Sharing and permissions",
          summary:
            "Inherited folder grants, materializing the check the way a feed fans out, what sharing breaks, and reference counting shared blocks.",
          contentFile: "sd-gd-sharing.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is an authorization check expensive without extra machinery?",
              options: [
                "Permissions are stored in a different database",
                "A folder grant applies to everything inside it, so effective permissions require walking every ancestor",
                "Roles must be resolved through group membership",
                "Encryption keys are per file",
              ],
              answer: 1,
              explanation:
                "For a deeply nested file that is several lookups on the path of every read, which is not affordable at any real rate.",
            },
            {
              kind: "mcq",
              prompt: "Why materialize effective permissions rather than compute them per read?",
              options: [
                "Materialized permissions are easier to audit",
                "Checks vastly outnumber changes, so you pay on the rare operation",
                "The ancestor chain cannot be cached",
                "It avoids storing folder grants at all",
              ],
              answer: 1,
              explanation:
                "Same reasoning as fanout on write. A grant near the root updating a million descendants is handled the way celebrities were: asynchronously, checking the ancestor chain directly during the brief window the materialized view is behind.",
            },
            {
              kind: "predict",
              prompt:
                "Blocks are deduplicated globally. A file shared with fifty people is deleted by its owner. What must happen to the blocks?",
              options: [
                "They are deleted with the file, since the owner controls them",
                "They must survive: they are referenced by other copies, so deletion needs reference counting",
                "They are moved to cold storage",
                "They are re-uploaded by the remaining users",
              ],
              answer: 1,
              explanation:
                "A naive delete corrupts everyone else's files, and silently: the damage surfaces months later when someone opens a file that cannot be reassembled. Counters drift, so most systems use the count to find candidates and verify no references remain before removing, the same shape as the orphaned-block collector.",
            },
          ],
        },
      ],
    },
  ],
}
