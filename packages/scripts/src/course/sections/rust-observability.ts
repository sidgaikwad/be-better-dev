import type { SectionSeed } from "../types"

// Part 4: observability in depth. Learners arrive from chapter 4's telemetry
// section with a working subscriber stack, instrumented futures, and request
// ids; this section opens the dispatch machinery, sends the signals out of
// the process (OTLP traces, Prometheus metrics), and ends with a staged
// incident diagnosed from telemetry alone.

export const rustObservability: SectionSeed = {
  slug: "rust-observability",
  title: "Observability in depth",
  description: "tracing, OpenTelemetry, Prometheus, Grafana; diagnose a staged incident.",
  badgeIcon: "📊",
  badgeTitle: "Observability × Rust",
  units: [
    {
      slug: "inside-tracing",
      title: "Inside tracing",
      description: "What the chapter 4 subscriber stack is actually made of, and how to extend it.",
      lessons: [
        {
          slug: "obs-layers-and-filtering",
          title: "Layers, filters, and what a Subscriber dispatches",
          summary:
            "The dispatch verbs under the macros, Registry's bookkeeping, and per-layer filters so two outputs can disagree.",
          contentFile: "obs-layers-and-filtering.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Where does a span's Id come from?",
              options: [
                "The span! macro generates it at compile time",
                "The subscriber assigns it when new_span is dispatched; Registry hands out slab indexes",
                "It is the hash of the file and line number",
                "tracing-core increments one global atomic counter",
              ],
              answer: 1,
              explanation:
                "Ids are the subscriber's to mint, which is why a Span in your code is just a cheap handle wrapping one. Registry uses slab slots and reuses them after close, so an Id is only meaningful while its span is alive.",
            },
            {
              kind: "predict",
              prompt:
                "Stack: a fmt layer with_filter(INFO) and an OpenTelemetry layer with_filter(DEBUG). A `debug!` event fires. What happens?",
              options: [
                "It is never constructed: the global level is INFO",
                "It is constructed twice, once per layer",
                "It is constructed once and dispatched to both layers; the fmt layer's Filtered wrapper drops it, the OpenTelemetry layer records it",
                "Both layers record it, since filters only apply to spans",
              ],
              answer: 2,
              explanation:
                "Construction is all-or-nothing at the callsite: if any layer wants the event, it is built once and fanned out. Filtered then gates each layer individually, which is exactly how two outputs get different verbosity from one dispatch.",
            },
            {
              kind: "mcq",
              prompt:
                "Why is it fine to leave `trace!` calls in the worker's hot claim loop in production?",
              options: [
                "trace! is compiled out of release builds automatically",
                "With static filters rejecting the callsite, interest is cached as never: the macro short-circuits on a cached check and the event is never constructed",
                "The subscriber processes trace events on a background thread",
                "It is not fine; disabled events still format their fields",
              ],
              answer: 1,
              explanation:
                "register_callsite/enabled exist so disabled telemetry costs about one atomic load, with fields never formatted. Dynamic filters weaken the answer to Interest::sometimes, which re-runs enabled() per hit: still cheap, no longer free.",
            },
          ],
        },
        {
          slug: "obs-custom-layer",
          title: "Write a Layer: a slow-span ledger",
          summary:
            "Stamp a clock in on_new_span, read it in on_close: the same extensions trick fmt and tracing-opentelemetry use.",
          contentFile: "obs-custom-layer.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does the custom Layer require `S: Subscriber + for<'a> LookupSpan<'a>`?",
              options: [
                "LookupSpan lets the layer iterate every live span for reporting",
                "Extensions, the per-span typed storage, live in the Registry, and ctx.span(id) needs span lookup to reach them",
                "It is required for the layer to receive on_event callbacks",
                "It makes the layer object-safe so it can be boxed",
              ],
              answer: 1,
              explanation:
                "The bound is the price of admission to Registry's storage: ctx.span(id) returns a SpanRef whose extensions hold your typed data. fmt's formatted fields and tracing-opentelemetry's half-built OTel spans live in the same map.",
            },
            {
              kind: "predict",
              prompt:
                "A layer calls `tracing::warn!(...)` inside its own on_event, for every event it sees. What happens at the first event?",
              options: [
                "One warning is emitted alongside the original event",
                "The warn is silently dropped because layers cannot emit",
                "Unbounded recursion: the emitted event re-enters dispatch, the layer's on_event fires again, and the stack overflows",
                "A compile error: on_event's Context is not Send",
              ],
              answer: 2,
              explanation:
                "Dispatch is re-entrant: anything a layer emits goes through the whole stack again, including the emitting layer. Real layers write to a side channel or guard with a reentrancy flag; the lesson's ledger uses eprintln for exactly this reason.",
            },
            {
              kind: "predict",
              prompt:
                "A handler span awaits a 2-second database query (future parked, a few quick polls). Compare on_new_span to on_close elapsed time against the sum of on_enter to on_exit intervals.",
              options: [
                "Both are about 2 seconds",
                "New-to-close is about 2 seconds of wall time; summed enter-to-exit is microseconds of busy time across a handful of polls",
                "Both are microseconds; parked time is invisible to layers",
                "Enter-to-exit is larger, since it includes queue time",
              ],
              answer: 1,
              explanation:
                "Enter and exit fire once per poll (the instrumenting futures mechanism), so their sum is busy time, while birth to close spans the whole life including parking. A slow span with tiny busy time is waiting on something, a distinction the capstone leans on.",
            },
          ],
        },
      ],
    },
    {
      slug: "exporting-the-signals",
      title: "Signals that leave the process",
      description:
        "Traces to a collector over OTLP, metrics to Prometheus, context across the queue.",
      lessons: [
        {
          slug: "obs-otel-propagation",
          title: "OpenTelemetry: one trace across two processes",
          summary:
            "OTLP export, traceparent riding the delivery queue, and what each sampling strategy costs.",
          contentFile: "obs-otel-propagation.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "In `traceparent: 00-0af7...319c-b7ad...3331-01`, what does the trailing `01` mean, and what does a ParentBased sampler do with it?",
              options: [
                "It is the protocol version; samplers ignore it",
                "It is the sampled flag: the root kept this trace, and ParentBased children keep exporting so the trace stays whole",
                "It is a priority hint that tail samplers may override",
                "It marks the trace as containing an error",
              ],
              answer: 1,
              explanation:
                "The flags byte carries the root's sampling decision across every boundary, and ParentBased makes children obey it. That is what prevents a backend full of orphan fragments: traces are kept or dropped as trees, not span by span.",
            },
            {
              kind: "predict",
              prompt:
                "A short-lived CLI tool exports spans through the batch processor and exits by falling off the end of main, never calling provider.shutdown(). What reaches the collector?",
              options: [
                "Everything: the exporter flushes on Drop",
                "Everything except spans still open at exit",
                "Possibly nothing: finished spans sit in the batch buffer, and the process exits before the batch ships",
                "The collector pulls the spans on its next poll",
              ],
              answer: 2,
              explanation:
                "Batching trades latency for throughput, and the buffer is process memory: exit before flushing and the tail of the story is gone. shutdown() (or an explicit flush) is part of correct wiring, exactly like flushing buffered writers.",
            },
            {
              kind: "mcq",
              prompt: "What makes tail sampling more expensive than head sampling?",
              options: [
                "It samples a higher percentage of traces by design",
                "It runs in-process and slows every request",
                "The collector must buffer complete traces in memory and route all spans of a trace to the same instance before deciding",
                "It requires every service to re-check the sampling decision",
              ],
              answer: 2,
              explanation:
                "Deciding after the outcome means holding the whole trace until it completes, which costs memory and forces trace-id-aware routing. Head sampling decides at the root from the trace id: cheap, but blind to errors and latency it has not seen yet.",
            },
          ],
        },
        {
          slug: "obs-metrics-red",
          title: "Metrics: RED, Prometheus, honest percentiles",
          summary:
            "The metrics facade and exporter, RED per route, and p99 computed from buckets, never averaged.",
          contentFile: "obs-metrics-red.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Instance A reports p99 = 120ms, instance B reports p99 = 900ms, equal traffic. A dashboard shows avg(p99) = 510ms. What is the true fleet p99?",
              options: [
                "510ms, the average is correct for equal traffic",
                "900ms, the worst instance dominates",
                "Unknowable from these two numbers: percentiles do not compose; it must be recomputed from the summed bucket counters",
                "705ms, the midpoint weighted toward the tail",
              ],
              answer: 2,
              explanation:
                "Two percentile points cannot recover the merged distribution, so averaging them is a category error, not an estimate. Bucket counts are counters and counters add, which is why histogram_quantile runs after sum by (le), never before.",
            },
            {
              kind: "mcq",
              prompt:
                "Why must the Prometheus exporter be given explicit buckets for the duration histogram?",
              options: [
                "Unbucketed histograms are rejected by the Prometheus scraper",
                "Buckets make recording faster on the client",
                "Otherwise it renders client-computed quantile summaries, which cannot be merged across instances the way bucket counters can",
                "Buckets are required for the RED method's error ratio",
              ],
              answer: 2,
              explanation:
                "A pre-computed p99 is a dead end: you cannot combine two of them across instances or time windows. Bucket counts stay raw, so any quantile over any aggregation remains computable later, including questions you have not thought of yet.",
            },
            {
              kind: "mcq",
              prompt:
                "Adding `subscriber_email` as a label on `http_requests_total` would be a mistake because:",
              options: [
                "Emails contain characters Prometheus labels forbid",
                "Every distinct label value is a live time series in the exporter and in Prometheus, so an unbounded label grows memory with the user base",
                "It would make the counter reset on every new subscriber",
                "Labels are limited to five per metric",
              ],
              answer: 1,
              explanation:
                "Cardinality is the metric system's scarce resource: series cost memory whether or not anyone queries them. High-cardinality detail belongs on spans, which are sampled, while labels stay small and bounded, like route and status.",
            },
          ],
        },
      ],
    },
    {
      slug: "from-graphs-to-diagnosis",
      title: "From graphs to diagnosis",
      description:
        "Dashboards and symptom alerts, signals joined by ids, and a staged incident worked end to end.",
      lessons: [
        {
          slug: "obs-dashboards-correlation",
          title: "Dashboards, alerts, and joining three signals",
          summary:
            "Panels that earn their place, symptom alerts with burn rates, exemplars from a bucket to a trace.",
          contentFile: "obs-dashboards-correlation.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Two candidate pages: 'worker CPU over 90% for 5 minutes' and 'delivery latency p99 burning the SLO budget fast'. Which should page, and why?",
              options: [
                "CPU, because it fires earlier and predicts the latency",
                "The latency burn: users feel latency, not CPU, and a symptom alert catches every cause including ones never listed; CPU belongs on the drill-down dashboard",
                "Both, for redundancy",
                "Neither; pages should come from log volume",
              ],
              answer: 1,
              explanation:
                "Cause alerts fail both ways: they wake you for spikes users never felt and stay silent for the unlisted failure mode, chapter 4's unknown unknown. Symptoms define brokenness; causes are diagnostics you consult after the page.",
            },
            {
              kind: "predict",
              prompt:
                "A service burns its 30-day error budget at 14x. Roughly how long until the budget is gone, and what should that trigger?",
              options: [
                "About 2 days: this is the fast-burn page",
                "About 14 hours: open a ticket",
                "About 30 days: no action needed",
                "About 7 days: schedule it for the next sprint",
              ],
              answer: 0,
              explanation:
                "30 days divided by a 14x burn is roughly two days of budget left, which is wake-someone territory. The same math is why a 3-minute nightly blip stays quiet: burn-rate alerting scales urgency to damage instead of firing on any threshold crossing.",
            },
            {
              kind: "mcq",
              prompt: "What is an exemplar?",
              options: [
                "A synthetic request replayed to reproduce an incident",
                "The slowest trace of the last hour, stored by the collector",
                "A reference (trace id, value, timestamp) attached to a histogram bucket sample, letting Grafana jump from the latency panel to one real trace",
                "A log line promoted to a metric by the exporter",
              ],
              answer: 2,
              explanation:
                "Exemplars are the metrics-to-traces join key: the aggregate says p99 degraded, the exemplar names one actual victim inside the slow bucket. In Rust, prometheus-client can attach them; the metrics facade does not expose them yet.",
            },
          ],
        },
        {
          slug: "obs-incident-capstone",
          title: "Capstone: the 09:00 latency spike",
          summary:
            "Five hypotheses against the telemetry: four disconfirmed, then the queue confesses in arithmetic.",
          xp: 25,
          contentFile: "obs-incident-capstone.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Per-send duration is flat, error rate is zero, yet end-to-end delivery latency p99 is at minutes. Before opening another dashboard, where must the time be going?",
              options: [
                "Clock skew between the API and the worker",
                "Waiting: latency is queue time plus service time, service time is measured flat, so the gap is time spent enqueued; check queue depth and oldest-task age",
                "Prometheus scrape lag distorting the histogram",
                "TLS handshakes to Postmark",
              ],
              answer: 1,
              explanation:
                "This is the decomposition that cracks the incident: with service time and errors both flat, only wait time is left. The queue-depth sawtooth then shows a 52,000-task wall draining at a fixed slope, and the arithmetic matches the p99 exactly.",
            },
            {
              kind: "mcq",
              prompt: "What did the exemplar trace contribute that the metrics could not?",
              options: [
                "It showed the Postmark span slowing down under load",
                "It showed 9 minutes with no spans at all between enqueue and claim: no code was slow, disconfirming 'something inside the worker degraded'",
                "It proved the database was holding locks",
                "It identified which subscriber caused the spike",
              ],
              answer: 1,
              explanation:
                "Queue wait is invisible as work and visible only as absence, and a trace timeline is where absence shows. Every span was fast; the latency lived in the gap, confirming queueing without instrumenting anything new.",
            },
            {
              kind: "mcq",
              prompt:
                "During the spike, pool acquire wait p99 rose from 3ms to 9ms. The investigation set it aside because:",
              options: [
                "Gauges are unreliable during incidents",
                "Acquire waits never affect delivery latency",
                "The effect being explained is minutes; a change measured in milliseconds is orders of magnitude too small to be the cause, however guilty the graph looks",
                "The pool metrics were not being scraped at 09:00",
              ],
              answer: 2,
              explanation:
                "A cause must be commensurate with its effect: 6 extra milliseconds cannot buy 600 extra seconds. Magnitude discipline is what stops an incident review from 'fixing' every graph that wiggled during the window, like doubling a pool that was never the problem.",
            },
          ],
        },
      ],
    },
  ],
}
