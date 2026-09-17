import type { SectionSeed } from "../../types"

export const sdAdClickAggregation: SectionSeed = {
  slug: "sd-ad-click-aggregation",
  title: "Design ad click event aggregation",
  description:
    "Counting billions of clicks correctly: windowing, watermarks, late events, and the reconciliation that catches what streaming missed.",
  badgeIcon: "🖱️",
  badgeTitle: "Aggregation",
  units: [
    {
      slug: "counting-correctly",
      title: "Counting correctly",
      description: "Two clocks, late arrivals, and a number that decides how much money moves.",
      lessons: [
        {
          slug: "sd-ac-event-time",
          title: "Event time against processing time",
          summary:
            "Why billing forces event time, what that creates, and why Kappa beats Lambda when a bug means replaying history.",
          contentFile: "sd-ac-event-time.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why use event time rather than processing time for billing aggregation?",
              options: [
                "Event time is more reliable, since servers can be misconfigured",
                "A click must be attributed to the minute it happened, not the minute the network delivered it",
                "Processing time cannot be partitioned",
                "Event time compresses better",
              ],
              answer: 1,
              explanation:
                "A client offline for an hour must not have its clicks counted against the hour it reconnected. The same conclusion as the Google Maps location stream, where ingestion time would report two-minute-old traffic as current.",
            },
            {
              kind: "mcq",
              prompt: "Why choose Kappa over Lambda here?",
              options: [
                "Lambda cannot handle this volume",
                "One implementation instead of two, and recalculation is replay through the path you already trust",
                "Kappa does not require retaining raw data",
                "Lambda cannot express windowed aggregation",
              ],
              answer: 1,
              explanation:
                "Lambda means two code paths computing the same thing, kept in agreement, with every fix applied twice. Route replays through a dedicated aggregation instance so history does not compete with live traffic.",
            },
            {
              kind: "predict",
              prompt:
                "An event's client-supplied timestamp says it happened three hours in the future. What do you do?",
              options: [
                "Accept it, since the client knows best",
                "Reject or clamp it, and count the rejections as a monitoring signal",
                "Replace it with the processing time",
                "Queue it until that time arrives",
              ],
              answer: 1,
              explanation:
                "An event cannot legitimately have happened after it arrived. Accepting future timestamps also hands anyone who can forge one control over which billing period a click lands in. A rising rejection rate means a broken clock, a bad SDK release, or someone probing.",
            },
          ],
        },
        {
          slug: "sd-ac-windows",
          title: "Windows and watermarks",
          summary:
            "Tumbling against sliding, how long to wait for late events, why this is the exception where exactly-once is worth it, and two correct numbers that disagree.",
          contentFile: "sd-ac-windows.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why do the two required queries need different window types?",
              options: [
                "One is real-time and the other is batch",
                "Clicks per minute needs non-overlapping tumbling windows; top 100 over the last 3 minutes needs an overlapping sliding window",
                "Sliding windows cannot be filtered by label",
                "Tumbling windows cannot be recomputed",
              ],
              answer: 1,
              explanation:
                "Each event belongs to exactly one tumbling window, which is right for per-minute counts. A three-minute window advancing every minute is right for a rolling top-N.",
            },
            {
              kind: "mcq",
              prompt: "Why not set the watermark to an hour to catch badly delayed events?",
              options: [
                "Watermarks are capped by the window size",
                "Every result would be delayed an hour to catch a tiny fraction of events; reconciliation handles the tail instead",
                "Memory usage would grow unboundedly",
                "Late events cannot be attributed to a window anyway",
              ],
              answer: 1,
              explanation:
                "Watermarks are for the common case and reconciliation is for the tail. Building one mechanism to handle both makes it bad at the common case.",
            },
            {
              kind: "predict",
              prompt:
                "An advertiser's dashboard showed 1,050,000 clicks and they were billed 1,047,000. Who is right?",
              options: [
                "The dashboard, since it counted more events",
                "Billing, since the dashboard double counted",
                "Both: one is the watermarked real-time sum, the other the reconciled batch total, and the design should have labelled them",
                "Neither: the 0.3% gap indicates a bug",
              ],
              answer: 2,
              explanation:
                "The system behaved as designed and the failure is presentation. A fast approximate path and a slow exact path owe users a clear statement of which they are seeing, or every discrepancy becomes a ticket engineering has to re-derive.",
            },
          ],
        },
      ],
    },
    {
      slug: "scale-and-proof",
      title: "Scale and proof",
      description: "Making it fast, and proving the number is right.",
      lessons: [
        {
          slug: "sd-ac-scale-and-correctness",
          title: "Hot ads, reconciliation and data monitoring",
          summary:
            "Why partitioning by ad id is a correctness requirement, splitting a hot key, reconciling against yourself, and alerting on the gap's baseline.",
          contentFile: "sd-ac-scale-and-correctness.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why must the queue be partitioned by `ad_id`?",
              options: [
                "To balance load evenly across aggregators",
                "So one ad's running count lives in one place: split across two aggregators, each count would be partial",
                "Because `ad_id` is the primary key in the database",
                "To keep events ordered by event time",
              ],
              answer: 1,
              explanation:
                "Here the keying rule is a correctness requirement rather than an optimization, which is a stronger reason than the one the message queue section gave for the same technique.",
            },
            {
              kind: "mcq",
              prompt: "How do you handle a single extremely popular ad?",
              options: [
                "Give it a dedicated aggregator",
                "Split the key with a random suffix across N partitions and sum the partial counts at query time",
                "Sample its events and extrapolate",
                "Move it to a separate topic",
              ],
              answer: 1,
              explanation:
                "The celebrity problem in a new costume. Apply it only to ads measured as hot, since reading a split key costs N reads and which ad is hot changes by the hour.",
            },
            {
              kind: "predict",
              prompt:
                "Reconciliation shows the batch total consistently 2% above real-time, every day. Is something broken?",
              options: [
                "Yes: any discrepancy means events are being lost",
                "Probably not: a stable gap with batch always higher is the expected signature of watermarks missing the late tail",
                "Yes: batch should never exceed real-time",
                "Cannot tell without comparing to a third-party count",
              ],
              answer: 1,
              explanation:
                "What indicates a bug is a change in shape: a sudden jump, a reversal (which can only mean double counting), or wild variation. Alert on deviation from the baseline rather than on the gap, and bill from the batch number.",
            },
          ],
        },
      ],
    },
  ],
}
