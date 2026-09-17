import type { SectionSeed } from "../../types"

export const sdEmailService: SectionSeed = {
  slug: "sd-email-service",
  title: "Design a distributed email service",
  description:
    "Sending and receiving mail at scale, the metadata store behind a mailbox, search over a billion messages, and consistency you can live with.",
  badgeIcon: "📧",
  badgeTitle: "Email",
  units: [
    {
      slug: "protocols-and-storage",
      title: "Protocols and storage",
      description: "Constraints set in the 1980s, and a mailbox that partitions perfectly.",
      lessons: [
        {
          slug: "sd-es-protocols",
          title: "SMTP, POP, IMAP and why HTTP",
          summary:
            "Why the client protocol can be modern while the server protocol cannot, where attachments go, and what it means that your ingress accepts connections from strangers.",
          contentFile: "sd-es-protocols.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why can the client protocol be HTTP while SMTP remains unavoidable?",
              options: [
                "SMTP is faster for server-to-server transfer",
                "SMTP is how you interoperate with every other mail service, while the client side is yours to define",
                "HTTP cannot carry attachments",
                "IMAP is being deprecated",
              ],
              answer: 1,
              explanation:
                "IMAP and POP define a fixed operation set, so threading, labels and server-side search cannot be expressed. Every provider that wanted them built a proprietary HTTP protocol. Gmail's web client does not speak IMAP to Gmail.",
            },
            {
              kind: "mcq",
              prompt: "Where do attachments go, and what does that enable?",
              options: [
                "In the metadata database as BLOBs, keeping mail self-contained",
                "In object storage referenced by the metadata, so one 20 MB file sent to 50 people is one blob and 50 references",
                "In a dedicated attachment database sharded by size",
                "In the search index, so they can be searched",
              ],
              answer: 1,
              explanation:
                "Same split as YouTube's videos and Drive's blocks: large immutable blobs in an object store, small structured records in a database, with the same caveat about what cross-user deduplication can leak.",
            },
            {
              kind: "predict",
              prompt: "What does accepting SMTP from any server on the internet imply?",
              options: [
                "That TLS must be mandatory on the ingress",
                "That the primary input is hostile by default: filtering is mandatory in the path, rate limiting is by IP reputation, and the ingress must be isolated",
                "That inbound mail must be queued before validation",
                "That authentication can be deferred to the recipient",
              ],
              answer: 1,
              explanation:
                "No other system in this course has an unauthenticated, publicly reachable endpoint whose whole purpose is accepting data from strangers. Designing that ingress as a normal API is the mistake.",
            },
          ],
        },
        {
          slug: "sd-es-storage",
          title: "Storing a billion mailboxes",
          summary:
            "Why nothing off the shelf fits, the properties a custom store would need, and why `user_id` partitions without any of Part 1's difficulty.",
          contentFile: "sd-es-storage.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does `user_id` partition so cleanly here?",
              options: [
                "Users are evenly distributed in mailbox size",
                "Nothing is shared: every operation is performed by the mailbox's owner, so no query crosses a shard",
                "Mail is immutable once written",
                "The recency pattern keeps partitions small",
              ],
              answer: 1,
              explanation:
                "The sharding problem that made Part 1 difficult does not exist here. The stated limitation, that messages cannot be shared across users, is not a requirement, so the model costs nothing.",
            },
            {
              kind: "mcq",
              prompt: "At a billion users, what is the binding constraint on the metadata store?",
              options: [
                "Total storage capacity",
                "Disk operations per second, which is why the layout is designed to reduce I/O rather than for query flexibility",
                "CPU for query parsing",
                "Network bandwidth between shards",
              ],
              answer: 1,
              explanation:
                "This is the property candidates miss. It is also why large providers build custom stores: a single column of several MB, strong consistency, minimal I/O, and easy incremental backup.",
            },
            {
              kind: "predict",
              prompt:
                "A mailing list reaches 100,000 employees. Partitioning by `user_id` means writing it 100,000 times. Is that right?",
              options: [
                "No: store one copy and have each mailbox reference it",
                "Yes: the alternative breaks single-shard reads for every user to save space on a few messages",
                "No: mailing lists should bypass the partition scheme",
                "Yes, but only because metadata is small",
              ],
              answer: 1,
              explanation:
                "Fanout on write, the same arithmetic as the news feed. The attachment is stored once and referenced 100,000 times, so what duplicates is headers and text. The write burst should be queued rather than done inline while the sending server waits.",
            },
          ],
        },
      ],
    },
    {
      slug: "searching-and-sending",
      title: "Searching and sending",
      description: "An index written far more than it is read, and a delivery that takes days.",
      lessons: [
        {
          slug: "sd-es-search",
          title: "Search that is mostly writes",
          summary:
            "Why email search inverts every property of web search, the 460,000 index writes per second, and a stale index that reads as data loss.",
          contentFile: "sd-es-search.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "How does email search invert web search?",
              options: [
                "It sorts by relevance rather than by date",
                "It is written far more than it is read, and must be near real-time and exact rather than eventually complete",
                "It searches a larger corpus",
                "It cannot use an inverted index",
              ],
              answer: 1,
              explanation:
                "Every send, receive and delete requires reindexing, while a search runs only when someone presses the button. The index must be cheap to update and may be relatively expensive to query, which is the reverse of usual search infrastructure.",
            },
            {
              kind: "mcq",
              prompt:
                "Why would sizing the search tier from the query rate under-provision it badly?",
              options: [
                "Queries are bursty and unpredictable",
                "Indexing is roughly 460,000 writes per second, several times the send rate and the largest write workload in the system",
                "Elasticsearch requires headroom for merges",
                "Search must be replicated across regions",
              ],
              answer: 1,
              explanation:
                "40 billion index writes a day from receives alone, plus reads, deletes and flag changes. The instinct to size search from query volume is off by orders of magnitude here.",
            },
            {
              kind: "predict",
              prompt:
                "A Kafka consumer falls an hour behind, so search cannot find an email the mailbox clearly shows. What is the best response?",
              options: [
                "Rebuild the index from the mail store",
                "Surface index lag to the user, and search the last day directly in the mail store partition, merging with the index",
                "Block search until the consumer catches up",
                "Increase consumer parallelism and wait",
              ],
              answer: 1,
              explanation:
                "Nothing is lost; the damage is trust. Searching one user's recent partition is cheap and makes the freshness requirement independent of the indexing pipeline's health. A banner beats silence.",
            },
          ],
        },
        {
          slug: "sd-es-sending",
          title: "Sending, deferral and reputation",
          summary:
            "Why retries are measured in days, why sending IPs are a managed resource, and why delivery state has to be per recipient.",
          contentFile: "sd-es-sending.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why are SMTP retries measured in hours and days rather than seconds?",
              options: [
                "SMTP connections are expensive to establish",
                "A 4xx deferral is routine, and greylisting deliberately defers first attempts from unknown senders",
                "Receiving servers rate limit by connection count",
                "DNS propagation delays MX resolution",
              ],
              answer: 1,
              explanation:
                "A retry schedule that gives up after five minutes, which is what you would write for any other integration, discards mail that would have been delivered.",
            },
            {
              kind: "mcq",
              prompt: "Why must bounces and spam complaints be processed rather than logged?",
              options: [
                "They are required for billing reconciliation",
                "Ignoring them degrades sending reputation until delivery quietly fails",
                "They contain the recipient's new address",
                "Receiving servers require an acknowledgement",
              ],
              answer: 1,
              explanation:
                "A complainer must stop receiving mail and a repeatedly bouncing address must be suppressed. Sending IPs are a managed resource: pooled, warmed, monitored, and separated so transactional mail does not share reputation with bulk.",
            },
            {
              kind: "predict",
              prompt:
                "A message to ten recipients: nine accept, one defers for two days then rejects. What does the design need?",
              options: [
                "A single message status, resolved when all recipients complete",
                "Per-recipient delivery state with its own retries, since one status cannot express delivered to nine and failed for one",
                "An immediate bounce after the first deferral",
                "A rollback of the nine successful deliveries",
              ],
              answer: 1,
              explanation:
                "A single status would record a 90% delivered message as either delivered or failed, and both are lies. The two-day silence is correct, since greylisting makes a first deferral expected, and the bounce must name the specific recipient and reason.",
            },
          ],
        },
      ],
    },
  ],
}
