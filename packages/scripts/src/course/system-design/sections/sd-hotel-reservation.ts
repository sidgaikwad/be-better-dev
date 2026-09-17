import type { SectionSeed } from "../../types"

export const sdHotelReservation: SectionSeed = {
  slug: "sd-hotel-reservation",
  title: "Design a hotel reservation system",
  description:
    "Inventory that must not be oversold: concurrency control, idempotent booking, and the microservice boundaries around a transaction.",
  badgeIcon: "🏨",
  badgeTitle: "Reservations",
  units: [
    {
      slug: "not-overselling",
      title: "Not overselling",
      description: "A low-throughput system whose whole difficulty is one contended row.",
      lessons: [
        {
          slug: "sd-hr-inventory",
          title: "Inventory as a counter",
          summary:
            "Three reservations per second, why you book a room type rather than a room, and why an average rate says nothing about contention.",
          contentFile: "sd-hr-inventory.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does the estimate of ~3 reservations per second tell you?",
              options: [
                "That a single database instance is sufficient for all traffic",
                "That nothing here is a throughput problem, so the difficulty is correctness under contention",
                "That caching is unnecessary",
                "That the system can be built as a monolith",
              ],
              answer: 1,
              explanation:
                "An answer built around sharding and caching is answering a question nobody asked. Page views are much higher and scale by ordinary caching.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does modelling inventory as a count per room type per date make this a concurrency problem?",
              options: [
                "Counts cannot be indexed",
                "With individual rooms, two bookings conflict only if they want the same room; with a counter, every booking for that type and date contends on one row",
                "Counts must be recomputed on every read",
                "Dates cannot be part of a primary key",
              ],
              answer: 1,
              explanation:
                "A guest books a king room and the specific room is assigned at check-in, so the API takes a room type and a count. A three-night stay touches three rows that must succeed or fail together.",
            },
            {
              kind: "predict",
              prompt:
                "At 3 reservations per second, is a race on one inventory row actually likely?",
              options: [
                "No: that is one reservation per hotel every half hour",
                "Yes: reservations cluster on desired hotels and dates, so contention concentrates exactly where inventory is nearly exhausted",
                "Only if the database isolation level is set incorrectly",
                "Only during scheduled maintenance windows",
              ],
              answer: 1,
              explanation:
                "An average rate tells you about capacity and nothing about concurrency. For correctness you need the peak on the hottest single row, which is bounded only by how many people want the same room.",
            },
          ],
        },
        {
          slug: "sd-hr-concurrency",
          title: "Double clicks and double bookings",
          summary:
            "An idempotency key the database enforces, the check-then-act race on inventory, and three fixes with one clear winner at this rate.",
          contentFile: "sd-hr-concurrency.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why generate the `reservation_id` before showing the confirmation page?",
              options: [
                "So the price can be locked in",
                "So it can be the insert's primary key, making a second submission violate a unique constraint",
                "So the reservation can be cancelled before submission",
                "So the payment processor can reference it",
              ],
              answer: 1,
              explanation:
                "The database enforces it: no coordination, no check-then-insert race, just a constraint that makes the second write impossible. The key is generated before the risky operation rather than after.",
            },
            {
              kind: "mcq",
              prompt: "Why is optimistic locking unpleasant under heavy contention?",
              options: [
                "It holds locks for the duration of the transaction",
                "Fifty clients read the same version, one succeeds and forty-nine retry, and the survivors retry again",
                "It requires a serializable isolation level",
                "Version numbers can overflow",
              ],
              answer: 1,
              explanation:
                "Correct, and a terrible experience, since a user may retry several times before succeeding or being told the room is gone. It suits low contention, which describes most reservations most of the time.",
            },
            {
              kind: "predict",
              prompt:
                "Two concurrent multi-night bookings update the same three date rows. What must you do to avoid a deadlock?",
              options: [
                "Use a shorter transaction timeout",
                "Apply the row updates in a consistent order, typically ascending by date",
                "Lock the hotel row first",
                "Split each night into its own transaction",
              ],
              answer: 1,
              explanation:
                "Every transaction then acquires rows in the same sequence, so deadlock is impossible. The three updates must also be in one transaction, or a guest can be charged for a booking that holds two of three nights.",
            },
          ],
        },
      ],
    },
    {
      slug: "service-boundaries",
      title: "Lifecycle and boundaries",
      description: "Running the booking backwards, and where to draw the lines around it.",
      lessons: [
        {
          slug: "sd-hr-lifecycle",
          title: "Cancellation, expiry and price",
          summary:
            "Why inventory is held at creation rather than payment, the conditional update that makes cancellation run once, and where a quoted price must live.",
          contentFile: "sd-hr-lifecycle.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does a pending_pay reservation need a timeout?",
              options: [
                "To free the idempotency key for reuse",
                "Inventory is consumed at creation, so an abandoned payment page would hold a room forever",
                "To let the price be re-quoted",
                "Because payment providers expire their sessions",
              ],
              answer: 1,
              explanation:
                "Holding the room while payment is in flight is the right behaviour, and the expiry job is easy to forget. Its absence takes days to notice: the symptom is a hotel that appears full while having empty rooms.",
            },
            {
              kind: "mcq",
              prompt: "Why is double-cancelling worse than double-booking?",
              options: [
                "It refunds the customer twice",
                "It releases inventory twice, which moves the count in the direction the constraint does not check, so it is silent",
                "It corrupts the reservation primary key",
                "It cannot be detected by reconciliation",
              ],
              answer: 1,
              explanation:
                "The constraint only checks that reserved does not exceed inventory. A conditional status update fixes it: zero rows updated means someone already cancelled, so the release is skipped. The state column does the job the idempotency key did at booking.",
            },
            {
              kind: "predict",
              prompt:
                "Cancellation sets the status, releases inventory, then issues a refund, and the refund call fails. What should change?",
              options: [
                "Issue the refund first, before releasing inventory",
                "Record the refund as owed in the same transaction, and let a monitored worker drive it to completion",
                "Roll back the whole cancellation",
                "Retry the refund inline until it succeeds",
              ],
              answer: 1,
              explanation:
                "The customer has lost the room and the money, and only they will notice. A call to an external system cannot be atomic with a database write, so write the obligation transactionally and discharge it asynchronously. Persist-before-promise, applied to money.",
            },
          ],
        },
        {
          slug: "sd-hr-services",
          title: "When a transaction spans services",
          summary:
            "What splitting inventory from reservations costs, two-phase commit against sagas, and the rule for where a service boundary belongs.",
          contentFile: "sd-hr-services.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is the cost of two-phase commit?",
              options: [
                "It cannot guarantee atomicity across nodes",
                "It blocks: a participant failing after prepare holds its locks until it recovers, and everyone waits",
                "It requires all participants to share a database",
                "It cannot be rolled back",
              ],
              answer: 1,
              explanation:
                "A real availability cost for a real guarantee. Sagas are the non-blocking alternative and are eventually consistent, with observable intermediate states.",
            },
            {
              kind: "mcq",
              prompt: "What is the rule for where a service boundary belongs?",
              options: [
                "One service per team",
                "Draw it so that a transaction never has to cross one: data that must change together belongs in the same store",
                "One service per database table",
                "Split by read and write paths",
              ],
              answer: 1,
              explanation:
                "A reservation exists if and only if inventory was consumed for it, so splitting them means rebuilding in application code a guarantee the database already provides. Hotels, rates and guests share no invariant with reservations and separate cleanly.",
            },
            {
              kind: "predict",
              prompt:
                "In a saga, the compensating increment that should release inventory itself fails. What is the state?",
              options: [
                "The saga retries the original step automatically",
                "Inventory is consumed for a reservation that does not exist, and you cannot compensate the compensation",
                "Two-phase commit takes over as a fallback",
                "The inventory service detects the orphan and repairs it",
              ],
              answer: 1,
              explanation:
                'Real implementations make compensations idempotent and retry them indefinitely from a durable saga log, so "failed" becomes "not yet succeeded". That is a compensating action per step, a durable log, a retry loop and an alert, all to replicate what BEGIN and ROLLBACK did in one database.',
            },
          ],
        },
      ],
    },
  ],
}
