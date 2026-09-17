import type { SectionSeed } from "../../types"

export const sdPaymentSystem: SectionSeed = {
  slug: "sd-payment-system",
  title: "Design a payment system",
  description:
    "Payment in and payment out, the ledger and double-entry bookkeeping, reconciliation, and exactly-once in a world that retries.",
  badgeIcon: "💳",
  badgeTitle: "Payments",
  units: [
    {
      slug: "moving-money",
      title: "Moving money",
      description: "The flows, and the record that makes them checkable.",
      lessons: [
        {
          slug: "sd-ps2-flows",
          title: "Pay-in, pay-out and PCI scope",
          summary:
            "Ten transactions per second and why that is still hard, one event becoming several payment orders, and the hosted page that keeps card numbers off your servers.",
          contentFile: "sd-ps2-flows.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does the design use a PSP-hosted payment page?",
              options: [
                "It provides a better checkout experience",
                "The card number goes directly to the PSP, keeping your servers out of PCI DSS storage scope",
                "It is required by the card schemes",
                "It reduces latency on the checkout path",
              ],
              answer: 1,
              explanation:
                "That is the difference between an annual audit of your entire infrastructure and an audit of the integration. The cost is that your checkout is partly someone else's UI and their availability is your checkout's availability.",
            },
            {
              kind: "mcq",
              prompt: "Why is a payment event split into several payment orders?",
              options: [
                "To parallelize the PSP calls",
                "A basket spanning sellers is one customer action and several independent money movements, each able to succeed or fail separately",
                "Because PSPs limit transaction size",
                "To allow partial refunds later",
              ],
              answer: 1,
              explanation:
                "Modelling it as one payment would force all-or-nothing behaviour that neither the customer nor the sellers want.",
            },
            {
              kind: "predict",
              prompt: "At 10 transactions per second, why is this a hard system?",
              options: [
                "Because payment providers impose strict rate limits",
                "Because every failure is permanent and visible, across parties that cannot participate in a transaction with you",
                "Because encryption dominates the latency budget",
                "Because compliance checks cannot be parallelized",
              ],
              answer: 1,
              explanation:
                "A lost payment is a customer charged with no order; a duplicate is a customer charged twice. When throughput is low and correctness is absolute, the design effort goes entirely into failure handling.",
            },
          ],
        },
        {
          slug: "sd-ps2-ledger",
          title: "Double-entry and append-only",
          summary:
            "An invariant you can check continuously, why corrections are new entries, and the wallet as another derived view over a durable record.",
          contentFile: "sd-ps2-ledger.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does double-entry give you that a single balance column does not?",
              options: [
                "Faster balance reads",
                "An invariant you can check continuously: the sum of all entries is zero, so money cannot appear or disappear",
                "Automatic currency conversion",
                "Protection against concurrent updates",
              ],
              answer: 1,
              explanation:
                "With a single-entry record, a lost update is indistinguishable from a transaction that never happened. Double-entry also makes every balance derivable and every balance explainable.",
            },
            {
              kind: "mcq",
              prompt: "How is a refund recorded in an append-only ledger?",
              options: [
                "By deleting the original entries",
                "By adding a new compensating pair, so the history shows a payment and a refund rather than nothing",
                "By updating the original entry's amount to zero",
                "By marking the original entries as void",
              ],
              answer: 1,
              explanation:
                "The record is the events and every balance is derived, the same principle as the leaderboard's point table. It is what makes audit possible.",
            },
            {
              kind: "predict",
              prompt:
                "A payment succeeds, the ledger entries are written, and the wallet update fails. Is that recoverable?",
              options: [
                "No: the balance is permanently wrong",
                "Yes: the ledger is the truth, so the balance is recomputed by summing its entries",
                "No: the ledger must be rolled back to match",
                "Yes, but only if the PSP is re-queried",
              ],
              answer: 1,
              explanation:
                "It is also the right way round, and the design should ensure it always is. Always write the durable record before the derived view, so a crash between them leaves something you can rebuild from.",
            },
          ],
        },
      ],
    },
    {
      slug: "getting-it-right",
      title: "Getting it right",
      description: "Charging once, and finding out when you did not.",
      lessons: [
        {
          slug: "sd-ps2-exactly-once",
          title: "Exactly once, split in two",
          summary:
            "Retries for at-least-once and idempotency keys for at-most-once, why the key is generated first, and what to do when the outcome is simply unknown.",
          contentFile: "sd-ps2-exactly-once.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "How does the design achieve exactly-once?",
              options: [
                "A distributed transaction across the PSP and the ledger",
                "At-least-once from retries plus at-most-once from idempotency: two independent mechanisms",
                "By making the PSP call synchronous and blocking",
                "By deduplicating in the settlement file",
              ],
              answer: 1,
              explanation:
                "The same decomposition as the message queue section, with identical machinery and different stakes. Neither mechanism alone is sufficient.",
            },
            {
              kind: "mcq",
              prompt: "Why must an idempotency key be generated before the first attempt?",
              options: [
                "So it can be logged before the request",
                "A key generated per attempt makes each retry a distinct request, defeating the mechanism entirely",
                "Because PSPs reject keys created after a failure",
                "To allow the key to include a timestamp",
              ],
              answer: 1,
              explanation:
                "The identity of the operation exists before the operation is attempted, the same construction as the hotel reservation id. On your side the same key is a unique constraint, so duplicates fail at the database rather than in logic that can be wrong.",
            },
            {
              kind: "predict",
              prompt:
                "Repeated PSP timeouts with the same idempotency key leave you not knowing whether the customer was charged. What resolves it?",
              options: [
                "Retry until a response arrives",
                "Stop retrying and poll the PSP's status endpoint by idempotency key until it answers definitively",
                "Assume failure and refund proactively",
                "Wait for the nightly settlement file",
              ],
              answer: 1,
              explanation:
                "When a write's outcome is unknown, the resolution is a read. An integration that can write but not query its own result is one you cannot build a reliable system on, which is worth asking about when evaluating a provider.",
            },
          ],
        },
        {
          slug: "sd-ps2-reconciliation",
          title: "Reconciliation",
          summary:
            "The nightly settlement file, three kinds of mismatch, why a human applies uncertain corrections, and the discrepancy only reconciliation could find.",
          contentFile: "sd-ps2-reconciliation.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "How does payment reconciliation differ from ad click reconciliation?",
              options: [
                "It runs hourly rather than daily",
                "A genuine independent record exists: the PSP's settlement file is authoritative about money that actually moved",
                "It compares aggregates rather than individual records",
                "It requires no manual intervention",
              ],
              answer: 1,
              explanation:
                "Ad click aggregation had no second party and had to reconcile against itself. The same process here also checks internal components, since the wallet is derived from the ledger and their disagreement is detectable by comparison.",
            },
            {
              kind: "mcq",
              prompt: "Which mismatch category is the one to alert on?",
              options: [
                "Classifiable and automated, since volume indicates a systemic bug",
                "Unclassifiable, because its rate measures how well you understand your own system",
                "Classifiable but manual, because it consumes finance team time",
                "All three equally",
              ],
              answer: 1,
              explanation:
                "A growing unclassifiable rate means something new is going wrong. Alert on the change rather than the level, the same reasoning as the ad click reconciliation gap.",
            },
            {
              kind: "predict",
              prompt:
                "The settlement file contains a payment absent from your ledger. What happened?",
              options: [
                "The PSP double-reported a transaction",
                "The customer was charged and your system never learned it, so the order was probably never fulfilled",
                "Your ledger write was rolled back correctly",
                "The payment belongs to a different merchant account",
              ],
              answer: 1,
              explanation:
                "Money moved and your system does not know, which is the failure that produces an angry customer rather than a lost cent. Create the missing entries, check fulfilment, refund if needed, then find the cause: a single instance is a lost message and a pattern is a broken callback path.",
            },
          ],
        },
      ],
    },
  ],
}
