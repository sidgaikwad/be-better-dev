import type { SectionSeed } from "../types"

// Part 4: databases in depth. Learners arrive from Zero to Production with
// sqlx in their hands (chapter 3's pool, chapter 7's transactions, chapter
// 11's SKIP LOCKED queue); this section opens those black boxes and ends
// with them building a small storage engine of their own.

export const rustDatabases: SectionSeed = {
  slug: "rust-databases",
  title: "Rust with databases in depth",
  description: "sqlx internals, diesel, sea-orm, pooling; build a small KV store.",
  badgeIcon: "🗄️",
  badgeTitle: "Databases × Rust",
  units: [
    {
      slug: "sqlx-and-orms",
      title: "sqlx and the ORM landscape",
      description: "What compile-time checked SQL actually does, and how to choose a data layer.",
      lessons: [
        {
          slug: "db-sqlx-under-the-hood",
          title: "What sqlx::query! actually does",
          summary:
            "Compile-time checking against a live database or the .sqlx cache, and the extended protocol underneath.",
          contentFile: "db-sqlx-under-the-hood.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "You clone the newsletter repo onto a laptop with no database running and no .sqlx directory, then run `cargo build`. What happens?",
              options: [
                "It compiles; the queries are checked on first run instead",
                "It fails to compile: the query! macros can reach neither a database nor a cache",
                "It compiles, with the queries typed as untyped rows",
                "cargo starts a temporary Postgres to check against",
              ],
              answer: 1,
              explanation:
                "The macros need schema metadata at expansion time, from DATABASE_URL or from .sqlx. With neither available, expansion itself fails; the checking never silently degrades.",
            },
            {
              kind: "mcq",
              prompt: "Where does `query!` get the Rust types for the struct it generates?",
              options: [
                "From type annotations you write on the Rust side",
                "From parsing the SQL text itself inside the macro",
                "From Postgres describing the prepared statement, or the cached recording of that answer",
                "From sqlx's bundled knowledge of common schemas",
              ],
              answer: 2,
              explanation:
                "The macro prepares your SQL and reads back parameter and column metadata; offline mode replays a recorded copy of the same answer. sqlx never guesses types by parsing SQL on its own.",
            },
            {
              kind: "mcq",
              prompt:
                'Why can a malicious `status` value not inject SQL through `sqlx::query!("... WHERE status = $1", status)`?',
              options: [
                "sqlx escapes quotes in the value before splicing it in",
                "The value travels in a Bind message after Parse has fixed the statement's meaning; it is never part of the SQL text",
                "The compile-time check rejects dangerous values",
                "The driver wraps every query in a transaction",
              ],
              answer: 1,
              explanation:
                "The extended protocol separates code from data: Parse fixes what the statement means, then Bind ships values as data. Nothing is spliced into text, so there is nothing to escape.",
            },
          ],
        },
        {
          slug: "db-orm-landscape",
          title: "diesel, sea-orm, or raw sqlx",
          summary:
            "Compile-time DSL, async entities, or checked SQL: a decision framework, not a winner.",
          contentFile: "db-orm-landscape.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "You typo a column name in a diesel DSL query. When do you find out?",
              options: [
                "At runtime, when Postgres rejects the query",
                "At compile time: the column item does not exist in the generated schema module",
                "Only when the row fails to decode",
                "The next time diesel print-schema runs",
              ],
              answer: 1,
              explanation:
                "diesel queries are built from Rust items in schema.rs, so a typo is an unresolved name, caught with no database anywhere near the build. The check is against that checked-in file, not the live schema.",
            },
            {
              kind: "predict",
              prompt:
                "A migration renames a column. Nobody regenerates schema.rs, sea-orm entities, or .sqlx. Which setups still compile?",
              options: [
                "None of them",
                "diesel and sea-orm, but not sqlx in any mode",
                "diesel, sea-orm, and sqlx in offline mode; only sqlx checking a live database fails the build",
                "Only diesel",
              ],
              answer: 2,
              explanation:
                "Stale artifacts satisfy the compiler; each tool trusts its own snapshot. Only the live-database check cannot go stale, which is why CI runs cargo sqlx prepare --check to catch the drift.",
            },
            {
              kind: "mcq",
              prompt: "What is sea-orm's relationship to sqlx?",
              options: [
                "A fork of sqlx with entities bolted on",
                "It is built on top of sqlx, which supplies the drivers and pool underneath",
                "They share no code; sea-orm ships its own Postgres driver",
                "sea-orm generates sqlx::query! calls at build time",
              ],
              answer: 1,
              explanation:
                "sea-orm layers entities, ActiveModel, and a runtime query builder over sqlx's connections and pooling. The layering matters in practice: you can reach the underlying sqlx pool when you need to drop down to raw SQL.",
            },
          ],
        },
      ],
    },
    {
      slug: "pools-and-transactions",
      title: "Pools and transactions",
      description: "Pooling internals, sizing arithmetic, and isolation beyond chapter 11.",
      lessons: [
        {
          slug: "db-connection-pooling",
          title: "Connection pools: why, and how big",
          summary:
            "What acquire costs, timeouts as backpressure, and sizing against max_connections.",
          contentFile: "db-connection-pooling.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Ten API instances each run a pool with max_connections = 20 against a Postgres with max_connections = 100. What happens as traffic warms every pool up?",
              options: [
                "Postgres queues the excess connection attempts until slots free up",
                "Once about 100 are open, further connection attempts fail with 'sorry, too many clients already'",
                "Postgres evicts idle connections from other instances to make room",
                "Nothing: pools coordinate to share the slots",
              ],
              answer: 1,
              explanation:
                "max_connections is a hard cap on backend processes and pools do not coordinate across instances. The fleet-wide sum, plus workers and your own psql, has to fit under it; that arithmetic is the sizing exercise.",
            },
            {
              kind: "mcq",
              prompt: "What is acquire_timeout actually for?",
              options: [
                "It limits how long a single query may run",
                "It bounds how long a request waits for a free connection, converting overload into fast errors instead of an unbounded queue",
                "It closes connections that sit idle longer than the timeout",
                "It caps how long any connection may live",
              ],
              answer: 1,
              explanation:
                "It is backpressure at the pool boundary, the same principle as Part 2's bounded channels: under saturation, failing fast beats queueing forever. Query time, idle time, and lifetime are separate knobs.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does the pool have max_lifetime at all, recycling perfectly healthy connections?",
              options: [
                "Postgres disconnects clients after 30 minutes anyway",
                "TCP connections stop working after a few hours",
                "Long-lived backends accumulate server-side state and memory, and after a failover old connections keep pointing at the wrong host; rotation heals both",
                "To keep the client-side statement cache small",
              ],
              answer: 2,
              explanation:
                "Rotation bounds per-backend resource growth and lets a fleet drift back to the current primary after failover or load-balancer changes. It is cheap insurance precisely because reconnecting happens off the request path.",
            },
          ],
        },
        {
          slug: "db-transactions-isolation",
          title: "Isolation levels and locks, concretely",
          summary:
            "The anomaly each level permits, FOR UPDATE and SKIP LOCKED generalized, advisory locks.",
          contentFile: "db-transactions-isolation.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which anomaly can Postgres never exhibit, at any isolation level?",
              options: ["Phantom reads", "Non-repeatable reads", "Dirty reads", "Write skew"],
              answer: 2,
              explanation:
                "MVCC readers only ever see committed row versions; READ UNCOMMITTED is accepted syntax that runs as READ COMMITTED. The other three each exist at some level: non-repeatable reads and phantoms at READ COMMITTED, write skew everywhere below SERIALIZABLE.",
            },
            {
              kind: "predict",
              prompt:
                "A REPEATABLE READ transaction counts confirmed subscribers, another connection inserts one and commits, and the first transaction counts again. Same number or different?",
              options: [
                "Different: each statement sees the latest committed data",
                "Same: the whole transaction reads from a snapshot fixed at its first query",
                "Same, but only if both counts run in a single statement",
                "It depends on whether the count used FOR UPDATE",
              ],
              answer: 1,
              explanation:
                "Postgres's REPEATABLE READ is snapshot isolation: one snapshot at the first query serves the whole transaction, which also suppresses phantoms. Under the default READ COMMITTED, the second count would see the new row.",
            },
            {
              kind: "mcq",
              prompt:
                "You need 'exactly one instance runs startup migrations' across N replicas booting at once. The cleanest Postgres tool is:",
              options: [
                "A SERIALIZABLE transaction around the migration",
                "SELECT FOR UPDATE on the migrations table",
                "An advisory lock on an agreed key, taken before migrating",
                "LOCK TABLE on every table involved",
              ],
              answer: 2,
              explanation:
                "Advisory locks are mutual exclusion on an application-chosen key with no row required: one instance wins, the rest wait or skip. sqlx's own migration runner uses exactly this trick.",
            },
          ],
        },
      ],
    },
    {
      slug: "build-a-kv-store",
      title: "Build a KV store",
      description:
        "A Bitcask-style engine: append-only log, in-memory index, compaction, recovery.",
      lessons: [
        {
          slug: "db-kv-log-and-index",
          title: "A KV store, part 1: log and index",
          summary: "Bitcask's trick: append-only writes plus a HashMap from key to file offset.",
          xp: 25,
          contentFile: "db-kv-log-and-index.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                'After put("a", ...), put("b", ...), then a second put("a", ...), what does the log file contain?',
              options: [
                "Two records: the newest a, and b",
                "Three records; the first a is dead bytes the index no longer points at",
                'Three records, and get("a") must scan all of them',
                "One merged record",
              ],
              answer: 1,
              explanation:
                "Appends never rewrite history: the file keeps all three records and the index simply repoints a to the newest offset. The dead first record is exactly the garbage compaction exists to reclaim.",
            },
            {
              kind: "mcq",
              prompt: "Why are writes fast in this design?",
              options: [
                "The OS caches the whole file in RAM",
                "The HashMap makes disk writes O(1)",
                "Each put is a sequential append: no seek, no read-modify-write of existing data",
                "BufWriter bypasses the kernel",
              ],
              answer: 2,
              explanation:
                "Sequential appends are the friendliest IO pattern a disk or SSD can receive, and the write path never has to locate or rewrite old data. All the finding happens in the in-memory index.",
            },
            {
              kind: "mcq",
              prompt: "What is the hard capacity limit built into this design?",
              options: [
                "The log file may not exceed 4 GiB",
                "Values may not exceed BufWriter's buffer size",
                "Every key must fit in memory, because the index is an in-memory HashMap",
                "One file descriptor is needed per key",
              ],
              answer: 2,
              explanation:
                "Values live on disk, but the keydir holds every key in RAM, so the key population is memory-bound; Bitcask documents the same constraint. The u32 length prefix caps a single value, not the log, at 4 GiB.",
            },
          ],
        },
        {
          slug: "db-kv-compaction-recovery",
          title: "A KV store, part 2: compaction and recovery",
          summary:
            "Reclaim dead bytes, rebuild the index by replaying the log, then place WALs, B-trees, and LSM trees.",
          xp: 25,
          contentFile: "db-kv-compaction-recovery.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "The process is killed halfway through compact(), before the rename. What does the store contain after restart?",
              options: [
                "A mix of old and new records",
                "Everything: the old log was never modified, the rename never happened, and the half-written temp file is ignored",
                "Only the keys compacted before the crash",
                "Nothing: the log was truncated first",
              ],
              answer: 1,
              explanation:
                "Compaction writes only to a temp file and installs it with one atomic rename; until that instant the old log is the truth. Every possible crash point lands in a good state by design, not by locking.",
            },
            {
              kind: "mcq",
              prompt:
                "During replay, two records for the same key sit at offsets 100 and 900. Which wins, and why?",
              options: [
                "Offset 100: first write wins",
                "Whichever record has the larger value",
                "Offset 900: replay scans in file order, so later records overwrite earlier index entries",
                "Neither: replay rejects the file as corrupt",
              ],
              answer: 2,
              explanation:
                "The log is a history and replay applies it in order, leaving the index pointing at each key's newest record, tombstones included. Postgres WAL replay honors the same contract after a crash.",
            },
            {
              kind: "mcq",
              prompt:
                "Your workload is heavy sequential ingest with point reads and few range scans. Which structure fits best?",
              options: [
                "A B-tree, because reads stay cheap",
                "A hash index over heap pages",
                "It makes no difference at this scale",
                "An LSM tree: writes hit a memtable and flush to sorted runs, at the cost of compaction work and read amplification",
              ],
              answer: 3,
              explanation:
                "LSM trees turn random writes into sequential ones, our log's trick with sorted order added, and bill you in background compaction and reads that check several runs. B-trees make the opposite bet: pricier in-place writes for cheap reads and range scans.",
            },
          ],
        },
      ],
    },
  ],
}
