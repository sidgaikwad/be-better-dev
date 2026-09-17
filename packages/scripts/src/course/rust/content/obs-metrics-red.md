A trace answers "what happened to this request." It is the wrong tool for "how is the service doing," because traces are per-request and, after the last lesson, sampled. A counter is the opposite trade: one number, no per-request detail, summarizing every request including the unsampled ones. Metrics are the cheap, always-on signal, and Prometheus is where they usually land.

## A facade, again

The `metrics` crate is to metrics what the `log` crate was in chapter 4: a facade. Libraries and your code emit through macros; the application installs one recorder at startup to say where numbers go.

```rust
metrics::counter!("http_requests_total", "route" => "/subscriptions", "status" => "201")
    .increment(1);
metrics::histogram!("http_request_duration_seconds", "route" => "/subscriptions")
    .record(started.elapsed().as_secs_f64());
metrics::gauge!("delivery_queue_depth").set(depth as f64);
```

Three instrument types: counters only go up (rates come from asking "how fast is it going up"), gauges hold a current value, histograms bucket observations. The recorder side is `metrics-exporter-prometheus`; `install_recorder()` returns a handle whose `render()` you serve from a `/metrics` route. Prometheus pulls that endpoint every 15 seconds or so: the service holds current state, the database samples it. (The ecosystem's other residents, the official `prometheus`/`prometheus-client` crates and OpenTelemetry's metrics API, do the same job with more ceremony; the facade wins for the same reason `log` did: libraries can emit without choosing a backend.)

One setup step is not optional:

```rust
PrometheusBuilder::new()
    .set_buckets_for_metric(
        Matcher::Full("http_request_duration_seconds".into()),
        &[0.005, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5],
    )?
    .install_recorder()?
```

Without configured buckets this exporter renders histograms as client-computed quantile summaries, and summaries cannot be aggregated across instances. Bucket counts are just counters, and counters add.

## RED, applied

The RED method says: for every service, track Rate, Errors, Duration. For the newsletter service that means, per API route: request rate by status, and the duration histogram above. For the delivery worker: `newsletter_emails_sent_total`, `newsletter_send_failures_total`, and a histogram of Postmark call duration. Add two non-RED numbers that will earn their keep in the capstone: the `delivery_queue_depth` gauge, and a histogram of end-to-end delivery latency (enqueue to sent, computable because the queue row carries its insertion time).

One rule guards the whole scheme: labels must be small and bounded. Every distinct label combination is a live time series in your process and in Prometheus. `route` and `status` are dozens of series; `subscriber_email` would be one series per subscriber, memory growing with your user base until the exporter and Prometheus both hurt. High-cardinality data belongs on spans, which you sample, not on metrics, which you keep.

## Percentiles without lying

The p99 query, the one worth memorizing:

```promql
histogram_quantile(0.99,
  sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
```

Read inside out: per-bucket increase rates, summed across instances by bucket edge (`le`), then the quantile interpolated from the merged distribution. Two dishonest shortcuts this replaces:

- Averages. 99 requests at 20ms and one at 8 seconds average under 100ms; the average says fine, one user waited 8 seconds. Tail latency is the product experience of your unluckiest users, and the mean structurally hides it.
- Averaging percentiles. The average of per-instance p99s is not the fleet p99; percentiles do not compose. Only the bucket counters compose, which is why the `sum by (le)` happens before `histogram_quantile`, never after.

The honest caveat: bucketed quantiles are estimates, interpolated within a bucket, so precision is set by your edges. Put an edge exactly at any threshold you will alert on (0.5s above), because counts at edges are exact: "what fraction exceeded 500ms" has a precise answer even when "what is p99" is an interpolation.

## Predict, then verify

Two instances serve equal traffic. Instance A reports p99 = 120ms, instance B reports p99 = 900ms. A dashboard averages them and displays 510ms. What is the true fleet p99, from just these two numbers?

Answer: unknowable. From two percentile points you cannot recover the merged distribution; the true fleet p99 could sit anywhere from roughly 500ms up toward 900ms depending on the shape of each tail. 510ms is not an estimate, it is a category error. The only correct route is back through the raw bucket counters: sum both instances' buckets, then take the quantile of the merged histogram, which is exactly what the PromQL above does.
