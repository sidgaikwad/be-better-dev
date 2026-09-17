A dashboard nobody is looking at is not monitoring. Alerting is the part that reaches a person, and it is the part where the engineering problem is mostly about human attention.

## The pipeline

1. **Rules** live in configuration: a metric, a condition, a duration, a severity, a destination.
2. The **alert manager** evaluates rules against the metric stream.
3. A firing alert is checked against **suppression and deduplication**.
4. It goes on a **queue**, and workers deliver it to email, SMS, PagerDuty or a webhook.

That last step is the notification system from Part 3, and saying so is better than redesigning it: queue per channel, retry with backoff, dead letter for what cannot be delivered.

## Rules as configuration

```yaml
- name: instance_down
  rules:
    - alert: InstanceDown
      expr: up == 0
      for: 5m
      labels:
        severity: page
      annotations:
        summary: "Instance {{ $labels.instance }} down"
```

`for: 5m` is the significant field. The condition must hold continuously for five minutes before the alert fires, which suppresses the transient blip that resolves itself. Without it, every brief spike pages someone, and the answer to every page is that it already recovered.

## Deduplication and grouping

A rack loses power and 100 machines stop reporting. That is 100 alerts, one incident, and one person.

**Deduplication** collapses repeats of the same alert into one notification with a count. **Grouping** collapses related alerts, by label, into a single notification: one message saying 100 instances in `rack-7` are down.

Without grouping, a large failure produces a page per affected machine, which is worse than useless because it buries the one useful signal, that they share a rack, in a hundred identical messages.

## Why alert fatigue is the real problem

A monitoring system's failure mode is not missing an alert. It is sending so many that people stop reading them.

An on-call engineer paged five times a night for things that resolve themselves learns that pages do not require action, and that lesson is applied to the page that does. The system did its job every time and produced an outage anyway.

Practical defenses, and they are design decisions rather than process:

- **Page on symptoms, not causes.** "Checkout error rate is 5%" is actionable. "CPU on host 47 is high" usually is not, and its consequence is either visible in a symptom metric or does not matter.
- **Every page needs an action.** If the response is to look and do nothing, it should have been a dashboard.
- **Separate severities and route them differently.** Page for what needs a human now; send everything else to a ticket or a channel.
- **Track pages per week per person** as a metric of the monitoring system itself. A rising number is a defect in the alerting, not in the people.

## Visualization

Dashboards read from the same store, and the query pattern is different from alerting: broad time ranges, many series aggregated, interactive. That means heavy aggregation queries whose cost is bounded by the downsampling from the previous lesson, since a one-year dashboard reads hourly points rather than raw ones.

Building your own is rarely right. Grafana exists, speaks to every time-series database, and is what people already know.

## Predict, then verify

An alert fires when error rate exceeds 1%. During a deploy, traffic briefly drops to 10 requests per minute, one fails, and the rate is 10%. Should it page?

Answer: no, and the rule as written will, which is the classic false positive for any ratio-based alert. At low volume a ratio is dominated by noise: one failure out of ten is 10% and means nothing, while one failure out of ten thousand is 0.01% and might be the same underlying rate. The condition is measuring a quantity that is not meaningful at that sample size. The fix is a second clause requiring absolute volume, so the alert fires only when the error rate exceeds 1% _and_ there are at least some minimum number of requests in the window. That single addition eliminates a large share of the 3am pages in most systems, and it generalizes: any alert on a ratio, a percentile or an average needs a floor on the sample size, because every one of those statistics is unstable when the denominator is small, and deploys, maintenance windows and quiet nights are exactly when denominators get small.
