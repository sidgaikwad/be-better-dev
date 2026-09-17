A Grafana instance with forty panels is a wall of maybes. At 3am, the on-call needs a handful of graphs that answer "is it broken, how badly, and where do I look next", in that order. Dashboards are an interface you design, like an API, and the previous lessons dictate most of it.

## Panels that earn their place

Top row, per service, straight from the RED lesson: request rate by route, error ratio, and duration p50/p95/p99 from the histogram. For the delivery worker, add the two numbers RED misses because the worker's "requests" arrive from a table: `delivery_queue_depth`, and the age of the oldest unclaimed task. Queue age is the single most honest measure of a queue's health; depth says how much is waiting, age says how badly it is being betrayed. One dependency row: Postmark call duration and failure rate, and pool acquire wait from the connection pooling lesson. Everything else, per-table statistics, allocator stats, GC-equivalents, lives one click down on a drill-down dashboard. It exists to be consulted, not stared at.

## Alert on symptoms, not causes

The classic mistake is alerting on causes: CPU over 80%, a pod restarted, disk filling. Users do not experience CPU. They experience latency, errors, and stale newsletters. Cause alerts fail in both directions at once: they page you at 2am for a CPU spike users never felt, and they stay silent for the failure mode you did not list, which chapter 4's unknown unknowns lesson promised is the one that will actually come. A symptom alert, "p99 delivery latency exceeds the objective", catches every cause, including the ones you never imagined. Causes belong on the drill-down dashboard as diagnostics; symptoms decide who wakes up.

The refinement of "alert on symptoms" is the SLO. Pick a target: 99% of issue emails delivered within 10 minutes, measured over 30 days. That leaves an error budget: 1% of sends may be late. Burn rate is how fast you are spending that budget; burn rate 1 means exactly spending it by day 30. The standard two-tier setup, lightly: page when burning around 14x over the last hour (the month's budget would be gone in about two days), open a ticket when burning around 1x sustained over days. Compared to "error rate over 1% for 5 minutes", burn-rate alerts scale urgency to actual damage: a short blip within budget stays quiet, a slow leak that will exhaust the budget gets a ticket before it becomes a page.

## Joining the three signals

You now run three telemetry systems: JSON logs, Prometheus metrics, traces. An incident is navigated by jumping between them, and jumps need join keys.

Logs to traces: chapter 4 gave every request a `request_id`; keep it, and also stamp the OpenTelemetry `trace_id` onto every JSON line (a ten-line custom Layer, the slow-span ledger's pattern, reading the current span's OTel context). Then "show me the logs for this trace" is a filter, not an archaeology dig.

Metrics to traces are joined by exemplars. OpenMetrics lets a histogram bucket carry a reference to one real observation that landed in it:

```text
http_request_duration_seconds_bucket{route="/subscriptions",le="0.5"} 1287 # {trace_id="0af7651916cd43dd8448eb211c80319c"} 0.437 1721893000.0
```

Prometheus stores these when started with `--enable-feature=exemplar-storage`, and Grafana draws them as dots on the latency panel: click a dot in the slow region and land on an actual trace from the slow bucket. That closes the loop from "p99 degraded" (aggregate) to "here is one concrete victim" (trace) without guessing. Honest ecosystem note: exemplar support in Rust is uneven at the time of writing; the official `prometheus-client` crate supports attaching them, while the `metrics` facade does not yet expose them.

The full diagnostic loop, which the capstone will run in anger: a symptom alert fires, the RED row says which signal moved, an exemplar or trace search produces one afflicted request, and its trace id filters the logs down to the why.

## Predict, then verify

Every night at 02:00, a 3-minute batch job briefly pushes API p99 over 500ms; total damage is far inside the monthly error budget. Compare two alert configs: "p99 over 500ms for more than 1 minute" versus the burn-rate pair. Which one pages, and when?

Answer: the threshold alert pages every single night at 02:01, and within a month it is muted, which is the same as deleted. The burn-rate pair stays quiet: three minutes of budget spend is nowhere near a 14x hourly burn, and the slow-burn window sees a budget on track. If the nightly job ever grows until it genuinely threatens the SLO, the slow-burn ticket arrives days before users notice. Alerts that fire on tolerated behavior train humans to ignore alerts; budgets encode what "tolerated" means.
