import type { SectionSeed } from "../../types"

export const sdMetricsMonitoring: SectionSeed = {
  slug: "sd-metrics-monitoring",
  title: "Design metrics monitoring and alerting",
  description:
    "Time-series ingestion at scale, push against pull, downsampling and retention, and alerting that does not page on noise.",
  badgeIcon: "📈",
  badgeTitle: "Monitoring",
  units: [
    {
      slug: "ingesting",
      title: "Ingesting",
      description: "A data shape unlike anything else in this course, and how it gets in.",
      lessons: [
        {
          slug: "sd-mm-time-series",
          title: "What a time series is",
          summary:
            "Name plus labels plus timestamped values, an access pattern that is all writes and aggregations, and the arithmetic that rules out storing raw data for a year.",
          contentFile: "sd-mm-time-series.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What do labels add to a metric name?",
              options: [
                "Human-readable descriptions",
                "The ability to aggregate across matching series, such as average CPU over every web server in a region",
                "A retention policy per series",
                "Compression hints for the storage engine",
              ],
              answer: 1,
              explanation:
                "A name alone gives you one number. Names plus labels turn a query into an aggregation over every series whose labels match, which is what the whole query language is built on.",
            },
            {
              kind: "mcq",
              prompt:
                "Facebook measured that 85% of queries hit data from the past 26 hours. What does that imply?",
              options: [
                "Retention beyond a day is unnecessary",
                "A store that keeps recent data hot and compresses older data to cheaper media fits the workload",
                "Queries should be cached for 26 hours",
                "Downsampling can be skipped for the first day",
              ],
              answer: 1,
              explanation:
                "Data is written once and read almost entirely while fresh, then kept for a year and barely touched. Gorilla and InfluxDB's engine are both built on that observation.",
            },
            {
              kind: "predict",
              prompt:
                "10 million series collected every 10 seconds at 16 bytes per point. How much raw data per day, and what does it force?",
              options: [
                "About 140 GB, which one machine can hold",
                "About 1.4 TB, which forces downsampling and built-in compression",
                "About 14 TB, which forces sharding by metric name",
                "About 140 TB, which forces sampling at collection",
              ],
              answer: 1,
              explanation:
                "86.4 billion points a day, roughly 500 TB a year raw. That is why the requirements specified tiered retention rather than one number, and why compression is built into every time-series database rather than optional.",
            },
          ],
        },
        {
          slug: "sd-mm-collection",
          title: "Pull, push and a queue",
          summary:
            "The debate with no winner, why a free health check is worth real money, and why alerting must not read from storage.",
          contentFile: "sd-mm-collection.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does pull give you that push cannot?",
              options: [
                "Lower latency on metric delivery",
                "A free health check and an inspectable endpoint, since a target that does not answer is a target that is down",
                "Support for short-lived jobs",
                "Reachability through firewalls",
              ],
              answer: 1,
              explanation:
                "Push wins on short-lived jobs and complex networks; pull wins on debuggability, liveness and authenticity. There is no winner, and saying so is the correct answer here.",
            },
            {
              kind: "mcq",
              prompt: "Why put a queue between collection and storage?",
              options: [
                "To reorder out-of-sequence metrics",
                "Buffering, and more importantly multiple consumers: storage, alerting and downsampling all read the same stream",
                "To deduplicate metrics from the same host",
                "To apply downsampling in transit",
              ],
              answer: 1,
              explanation:
                "Writing to a log that several things read, rather than a store that several things query, is the same structure as the location stream in Google Maps. Partition by series so points stay ordered.",
            },
            {
              kind: "predict",
              prompt: "Why should alerting read from the queue rather than querying storage?",
              options: [
                "Storage queries are billed per read",
                "Because storage being overloaded would suppress the alerts about it being overloaded",
                "Because the queue retains data longer",
                "Because storage cannot answer range queries fast enough",
              ],
              answer: 1,
              explanation:
                "A monitoring system is most likely to be struggling exactly when something is wrong. Reading from the queue keeps alerting working while storage is degraded, and evaluating a five-minute rule needs a short window in memory rather than a database.",
            },
          ],
        },
      ],
    },
    {
      slug: "storing-and-alerting",
      title: "Storing and alerting",
      description: "Making a year affordable, and reaching a person without exhausting them.",
      lessons: [
        {
          slug: "sd-mm-storage",
          title: "Compression and downsampling",
          summary:
            "Delta encoding on timestamps, rolling up resolution over time, and the spike that averaging destroys forever.",
          contentFile: "sd-mm-storage.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does delta encoding work so well on metric timestamps?",
              options: [
                "Timestamps are stored as strings",
                "Points arrive at regular intervals, so consecutive differences are tiny and fit in about 4 bits instead of 32",
                "Timestamps are optional for most metrics",
                "Compression algorithms detect the pattern automatically",
              ],
              answer: 1,
              explanation:
                "Double-delta goes further, since the deltas themselves are nearly identical. Values compress the same way, because CPU load at consecutive timestamps is nearly the same number.",
            },
            {
              kind: "mcq",
              prompt: "What should you store per bucket when downsampling, and why?",
              options: [
                "The average, since it is the most representative",
                "Min, max, average and count, so a spike survives as the max instead of being averaged away",
                "The median, since it resists outliers",
                "The first and last values in the bucket",
              ],
              answer: 1,
              explanation:
                '"Downsample to the average" is the obvious answer and it silently destroys the thing you monitor for. Four numbers instead of 360 still saves almost everything.',
            },
            {
              kind: "predict",
              prompt:
                "Raw data is kept 7 days. You need to know whether latency spiked for a few seconds during an incident 10 days ago. Can you?",
              options: [
                "Yes, at 1-minute resolution the spike is still visible",
                "No: a 3-second spike averaged across a minute looks like mild elevation, and the raw data is gone",
                "Yes, if the spike exceeded the alert threshold",
                "No, but it can be reconstructed from the alert history",
              ],
              answer: 1,
              explanation:
                "This is discovered during a post-incident review rather than when setting the policy. Keep max alongside average, and set the raw window from how long investigations take rather than from storage cost. A retention policy decides which questions you can answer later.",
            },
          ],
        },
        {
          slug: "sd-mm-alerting",
          title: "Alerting without fatigue",
          summary:
            "The `for` duration that suppresses blips, grouping a rack failure into one page, and why ratio alerts need a floor on volume.",
          contentFile: "sd-mm-alerting.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does a `for: 5m` clause on an alert rule do?",
              options: [
                "Re-sends the alert every five minutes",
                "Requires the condition to hold continuously for five minutes, suppressing transient blips",
                "Delays delivery by five minutes",
                "Groups alerts arriving within five minutes",
              ],
              answer: 1,
              explanation:
                "Without it, every brief spike pages someone and the answer to every page is that it already recovered.",
            },
            {
              kind: "mcq",
              prompt:
                "A rack loses power and 100 machines stop reporting. Why does grouping matter?",
              options: [
                "It reduces load on the notification workers",
                "One incident should be one page: 100 identical messages bury the useful signal, that they share a rack",
                "It prevents duplicate deliveries",
                "It allows the alerts to be retried together",
              ],
              answer: 1,
              explanation:
                "Deduplication collapses repeats of the same alert; grouping collapses related alerts by label. Without it, a large failure is worse than useless.",
            },
            {
              kind: "predict",
              prompt:
                "An alert fires above 1% error rate. During a deploy, traffic drops to 10 requests per minute and one fails. What is the fix?",
              options: [
                "Raise the threshold to 20%",
                "Add a minimum request count, because every ratio, percentile and average is unstable when the denominator is small",
                "Suppress alerts during deploys",
                "Use a longer `for` duration",
              ],
              answer: 1,
              explanation:
                "One failure in ten is 10% and means nothing. Deploys, maintenance windows and quiet nights are exactly when denominators get small, so any ratio-based alert needs a floor on sample size. That one addition removes a large share of 3am pages.",
            },
          ],
        },
      ],
    },
  ],
}
