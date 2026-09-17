import type { SectionSeed } from "../../types"

export const sdNotificationSystem: SectionSeed = {
  slug: "sd-notification-system",
  title: "Design a notification system",
  description:
    "Push, SMS and email behind one API, third-party providers you do not control, and the retry and dedup that keeps one event from ringing twice.",
  badgeIcon: "🔔",
  badgeTitle: "Notifications",
  units: [
    {
      slug: "the-channels",
      title: "The channels",
      description: "Three delivery mechanisms you do not own, behind one API.",
      lessons: [
        {
          slug: "sd-ns-channels",
          title: "Three channels, three providers",
          summary:
            "APNs, FCM, Twilio and SendGrid, what they have in common, and the contact info you need before sending anything.",
          contentFile: "sd-ns-channels.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "16 million notifications a day is about 185 per second. What does that tell you?",
              options: [
                "That the system needs aggressive sharding",
                "That throughput is not the hard part, so reliability and provider fan-out are",
                "That a single server is sufficient",
                "That the queues can be omitted",
              ],
              answer: 1,
              explanation:
                "Working the rate early tells you where the difficulty is. At 370 per second at peak, nothing about the volume is challenging; everything challenging is about third parties and about not annoying people.",
            },
            {
              kind: "mcq",
              prompt: "Why are device tokens in their own table rather than on the user row?",
              options: [
                "Tokens are too long for the user table",
                "One user has many devices, so a push fans out to all of them inside your system",
                "Tokens must be encrypted separately",
                "It allows tokens to be sharded independently",
              ],
              answer: 1,
              explanation:
                'Email and phone are single-valued per user; device tokens are not. The fan-out from "notify this user" to "make these API calls" therefore happens in your system.',
            },
            {
              kind: "predict",
              prompt:
                "Users reinstall the app over the years and old device tokens stay in the table. What is the consequence?",
              options: [
                "Nothing, since invalid tokens are silently ignored",
                "Growing pointless API calls that waste quota and can hurt your sending reputation",
                "Duplicate notifications to the same device",
                "Push notifications begin to fail for valid tokens",
              ],
              answer: 1,
              explanation:
                "Tokens are per installation, not per device. APNs and FCM both report invalid tokens in their responses, so the fix is to treat the response as data and delete the row. Slow-growing waste that never causes an incident and quietly makes every metric worse.",
            },
          ],
        },
        {
          slug: "sd-ns-decoupling",
          title: "Queues, one per channel",
          summary:
            "The three problems with one notification server, and why a queue per channel is worthless if the worker pool is shared.",
          contentFile: "sd-ns-decoupling.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does each channel get its own queue?",
              options: [
                "Different channels have different message formats",
                "Failure isolation: a slow provider backs up its own queue instead of blocking every channel",
                "Queues cannot hold mixed message types",
                "It allows per-channel ordering guarantees",
              ],
              answer: 1,
              explanation:
                "With one shared queue, a SendGrid outage means push notifications sit behind email that cannot be delivered. Same reasoning as the crawler's back queues: separate the things that fail independently.",
            },
            {
              kind: "mcq",
              prompt: "What does moving to queues change about the API contract?",
              options: [
                "Nothing, since the caller still gets a response",
                "The API can only report acceptance, not delivery, so it returns 202 rather than 200",
                "The API must become asynchronous for the caller too",
                "The caller must poll before every send",
              ],
              answer: 1,
              explanation:
                "That change has to be honest. Anything needing the outcome learns it from a callback or a status endpoint rather than from the send response.",
            },
            {
              kind: "predict",
              prompt:
                "Four separate queues, but one worker pool reading all of them in round robin. Twilio starts taking 30 seconds per call. What happens to email?",
              options: [
                "Email is unaffected, since it has its own queue",
                "Email is badly delayed, because a growing share of shared workers is blocked on Twilio",
                "Email is delayed only until the SMS queue drains",
                "Round robin skips the slow queue automatically",
              ],
              answer: 1,
              explanation:
                "The separate queues bought nothing because the scarce resource was worker threads, not queues. A bulkhead only works if it is drawn around the thing that actually runs out, which here means a separate worker pool per channel.",
            },
          ],
        },
      ],
    },
    {
      slug: "reliability-and-restraint",
      title: "Reliability and restraint",
      description: "Never losing one, rarely duplicating one, and not sending too many.",
      lessons: [
        {
          slug: "sd-ns-reliability",
          title: "Never lost, occasionally twice",
          summary:
            "Persisting before promising, backoff and dead letters, and why exactly-once delivery does not exist when the last hop is someone else's system.",
          contentFile: "sd-ns-reliability.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why write the notification log before putting the event on the queue?",
              options: [
                "The queue needs the row id as its message key",
                "Queues can lose messages, so if the log is the only durable record, a lost message is a notification that silently never happened",
                "It makes the queue write faster",
                "The log is what the workers read from",
              ],
              answer: 1,
              explanation:
                'Persist before you promise. The log also gives a status per notification, which is what makes retries and "did my customer get the email?" answerable at all.',
            },
            {
              kind: "mcq",
              prompt: "Why is exactly-once delivery impossible here?",
              options: [
                "Providers do not support idempotency keys",
                "There is a gap between calling the provider and recording that you did, and you cannot commit a transaction across someone else's system",
                "Message queues cannot guarantee ordering",
                "Device tokens can be reused",
              ],
              answer: 1,
              explanation:
                "A worker can send, then crash before marking it sent. You reduce duplicates with an event id check rather than eliminating them, and prefer at-least-once because a missing notification can mean a missed flight while a duplicate is mildly annoying.",
            },
            {
              kind: "predict",
              prompt:
                "Dedup is keyed on event id. A campaign sends the same event id to a million users. What happens?",
              options: [
                "All million are delivered, since the recipients differ",
                "One is delivered and 999,999 are discarded as duplicates",
                "The dedup window expires and all are sent after 24 hours",
                "The campaign fails with a duplicate key error",
              ],
              answer: 1,
              explanation:
                "A notification is the pair of an event and a recipient, so the key must be `(event_id, user_id)`. Keying it wrong converts a duplicate-delivery problem into a silent non-delivery problem, which is worse and much harder to notice.",
            },
          ],
        },
        {
          slug: "sd-ns-settings-and-limits",
          title: "Opt-outs, limits and templates",
          summary:
            "Why churn rather than overload is the binding constraint, where the checks belong, and why one rate limit across all notifications is a trap.",
          contentFile: "sd-ns-settings-and-limits.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why check opt-in settings in the notification server rather than in the worker?",
              options: [
                "Workers have no database access",
                "It avoids spending queue capacity and worker time on notifications that will be discarded, and keeps the check in one place",
                "Settings change too often to cache in a worker",
                "Workers cannot reject a message once dequeued",
              ],
              answer: 1,
              explanation:
                "Cheap checks first, and the ones that reject the most traffic before the ones that cost the most. It also means one place to forget rather than several.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does a per-user notification rate limit belong in the shared notification system?",
              options: [
                "Only it has a Redis instance",
                "Many services send, none know about each other, so only the shared component can see a user's total",
                "Calling services cannot be trusted",
                "It reduces the number of queues needed",
              ],
              answer: 1,
              explanation:
                "The failure mode is churn rather than overload: one over-eager service can make a user disable notifications permanently, losing the other ten you were going to send that month.",
            },
            {
              kind: "predict",
              prompt:
                "A flat limit of 5 notifications per user per day is in place. A password reset arrives for a user who hit the limit on marketing email. What happens?",
              options: [
                "The reset is queued and delivered tomorrow",
                "The reset is dropped and the user is locked out, because discretionary traffic starved essential traffic",
                "The reset bypasses the limit automatically",
                "The limit resets when a transactional message arrives",
              ],
              answer: 1,
              explanation:
                "Transactional and promotional notifications are not comparable, so limiting them together fails in the direction that generates lockouts. Classify by category and limit per category. The same applies to opt-out: opting out of marketing is not opting out of a password-change alert.",
            },
          ],
        },
        {
          slug: "sd-ns-monitoring",
          title: "Seeing a silent failure",
          summary:
            "Queue depth as the vital sign, why provider error codes are data rather than counts, and the gap between sent and delivered.",
          contentFile: "sd-ns-monitoring.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why parse provider error codes rather than count them together?",
              options: [
                "Providers bill differently per error type",
                "An invalid token, a 429 and a 500 each call for a different action: delete a row, slow down, or retry",
                "Counting errors exceeds the metrics cardinality budget",
                "Error codes are needed for the dead letter queue",
              ],
              answer: 1,
              explanation:
                'Counting them all as "errors" loses exactly the distinction that tells you what to do. Provider responses are data to be processed, not status codes to be checked.',
            },
            {
              kind: "mcq",
              prompt: "Which engagement metric do most notification dashboards omit?",
              options: [
                "Open rate",
                "Click rate",
                "Opt-out rate per notification category",
                "Delivery rate",
              ],
              answer: 2,
              explanation:
                "It tells you which notification is costing you the channel. A campaign with a good click rate and a terrible opt-out rate is not a success, and usually only one of those is on the dashboard.",
            },
            {
              kind: "predict",
              prompt:
                "Push delivery rate drifts from 98% to 91% over three months. Queue depth, worker latency and error rate are all normal. What is it?",
              options: [
                "A provider regression that is not surfacing as errors",
                "Accumulating dead device tokens inflating the denominator",
                "Clock skew in the delivery timestamps",
                "Users disabling notifications",
              ],
              answer: 1,
              explanation:
                "Your side is healthy because your side is healthy: you build, call, and get a prompt response that increasingly says the token is invalid. A slow monotonic decline with no operational symptom is almost always an accumulating data problem rather than a system one.",
            },
          ],
        },
      ],
    },
  ],
}
