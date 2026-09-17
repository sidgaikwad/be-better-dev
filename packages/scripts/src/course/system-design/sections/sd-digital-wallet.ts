import type { SectionSeed } from "../../types"

export const sdDigitalWallet: SectionSeed = {
  slug: "sd-digital-wallet",
  title: "Design a digital wallet",
  description:
    "Transfers between accounts, why a distributed transaction is the hard part, and event sourcing with a reproducible state machine.",
  badgeIcon: "👛",
  badgeTitle: "Wallet",
  units: [
    {
      slug: "atomicity",
      title: "Atomicity across shards",
      description: "Two balances on two machines, and no cheap way to move both.",
      lessons: [
        {
          slug: "sd-dw-distributed-txn",
          title: "2PC, TC/C and Saga",
          summary:
            "Why the hotel section's answer is unavailable here, what separating the phases into their own transactions buys, and why Confirm can only be retried.",
          contentFile: "sd-dw-distributed-txn.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why can't you use the hotel section's answer of putting both accounts in one database?",
              options: [
                "Wallet balances need a different schema",
                "At a million transactions per second, one database is not an option, so the transaction must cross machines",
                "The accounts belong to different services",
                "Relational databases cannot hold balances",
              ],
              answer: 1,
              explanation:
                "There the two pieces of data shared an invariant and fit in one store. Here they share an invariant and cannot, so the only question is how the transaction crosses machines.",
            },
            {
              kind: "mcq",
              prompt: "What is the structural difference between 2PC and TC/C?",
              options: [
                "TC/C uses optimistic locking",
                "2PC's phases are inside one transaction so locks span them; each TC/C phase is its own transaction that commits and releases immediately",
                "TC/C requires a coordinator and 2PC does not",
                "2PC compensates while TC/C rolls back",
              ],
              answer: 1,
              explanation:
                "Nothing is held between TC/C phases, which is what makes it viable at this rate. The price is that reservation and compensation are your application's logic rather than the database's.",
            },
            {
              kind: "predict",
              prompt: "In TC/C, Confirm succeeds for A and fails for C. Can you cancel?",
              options: [
                "Yes: send Cancel to both participants",
                "No: a confirm is not reversible, so the only correct path is retrying C's Confirm until it succeeds",
                "Yes, but only within the Try timeout window",
                "No: the transaction must be re-run from the start",
              ],
              answer: 1,
              explanation:
                "Once every participant says yes to Try, the transaction is committed in principle. So Confirm must be idempotent, the decision must be durable before any Confirm is sent, and a recovered coordinator must finish rather than re-evaluate.",
            },
          ],
        },
      ],
    },
    {
      slug: "reproducibility",
      title: "Reproducibility",
      description: "Answering how a balance got that way, and making it fast enough.",
      lessons: [
        {
          slug: "sd-dw-event-sourcing",
          title: "Event sourcing",
          summary:
            "Commands, events, state and a state machine, why events must be deterministic, and replay as a regression test over your entire production history.",
          contentFile: "sd-dw-event-sourcing.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is the key difference between a command and an event?",
              options: [
                "Commands are internal and events are external",
                "A command is an intention that may be invalid; an event is a validated fact, and applying one must be deterministic",
                "Commands are durable and events are transient",
                "Events are batched while commands are individual",
              ],
              answer: 1,
              explanation:
                'Nondeterminism belongs in validation, when the command becomes an event, with its result baked in. An event saying "apply today\'s exchange rate" is wrong; one saying "applied rate 1.0934" is right.',
            },
            {
              kind: "mcq",
              prompt:
                'How does event sourcing answer "is the logic still correct after a code change?"',
              options: [
                "By running the unit test suite against the new code",
                "By replaying historical events through the new code and comparing the resulting states",
                "By diffing the event schema between versions",
                "By reconciling against the bank's statements",
              ],
              answer: 1,
              explanation:
                "It turns every transaction the system ever processed into a test case, which is the strongest argument for the pattern and the one most people miss.",
            },
            {
              kind: "predict",
              prompt:
                "A full replay through updated code produces different balances from the stored ones. What do you check first?",
              options: [
                "Whether the new code has a bug",
                "Whether event application was ever fully deterministic, since if it was not, the comparison tells you nothing",
                "Whether the snapshot was corrupt",
                "Whether events were replayed in the correct order",
              ],
              answer: 1,
              explanation:
                "Three possibilities: new bug, old bug now fixed, or broken determinism. The third invalidates the comparison entirely, which is why a replay test run regularly beats one run at audit time: it catches the day determinism broke.",
            },
          ],
        },
        {
          slug: "sd-dw-scaling",
          title: "Partitioning, CQRS and snapshots",
          summary:
            "Ordering per account rather than globally, three mechanisms serving three requirements, and a deadlock the hotel section already solved.",
          contentFile: "sd-dw-scaling.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "How do you get parallelism from a strictly ordered command queue?",
              options: [
                "Process commands optimistically and reorder on conflict",
                "Partition by account, since ordering only has to hold per account and nobody asks about ordering across unrelated accounts",
                "Batch commands and apply them together",
                "Run several state machines over the same partition",
              ],
              answer: 1,
              explanation:
                "The same resolution as the message queue section. A transfer touches two accounts and so two partitions, which is where the distributed transaction from the previous lesson does its work.",
            },
            {
              kind: "mcq",
              prompt: "What does separating the read model force you to state explicitly?",
              options: [
                "That reads may be served from a replica",
                "That the read model is eventually consistent, so a completed transfer may briefly show an unchanged balance",
                "That balances are approximate",
                "That the event store is not queryable",
              ],
              answer: 1,
              explanation:
                'CQRS is forced rather than chosen here, since an ordered event log and a key-value lookup are not one structure. "My transfer completed and my balance is unchanged" is alarming, so the lag must be a stated decision rather than an accident.',
            },
            {
              kind: "predict",
              prompt:
                "Transfers A-to-C and C-to-A run concurrently across two partitions. Can they deadlock, and what is the fix?",
              options: [
                "No: partitions are independent",
                "Yes, and the fix is to reserve accounts in a consistent global order, such as by ascending account id",
                "Yes, and the fix is a shorter Try timeout",
                "No: TC/C reservations never block",
              ],
              answer: 1,
              explanation:
                "The second time the same one-line rule resolves a deadlock in a different system, after the hotel section's date rows. Any operation acquiring multiple resources must acquire them in a total order every participant agrees on.",
            },
          ],
        },
      ],
    },
  ],
}
