Part 1 said to instrument everything. This is the system that receives it, and the first thing to understand is that the data has a shape nothing else in this course has.

## Scope

- Internal use, not a SaaS product
- Operational metrics: CPU, memory, disk, requests per second, pool sizes. Not business metrics
- 1,000 server pools, 100 machines each, 100 metrics per machine, so about 10 million metrics
- Retention: raw for 7 days, 1-minute resolution for 30 days, 1-hour resolution for 1 year
- Alerts by email, phone, PagerDuty and webhooks
- Not logs, not distributed tracing

Excluding logs and tracing matters. They are different problems with different storage, and a candidate who folds all three into one design has widened the scope past what an hour holds.

## What a time series is

A metric is a name, a set of labels, and a sequence of timestamped values.

```text
metric_name: cpu.load
labels:      host=i631, env=prod
timestamp:   1613707265
value:       0.29
```

The labels are what make it useful. A name alone gives you one number; names plus labels let you ask for the average CPU across every web server in `us-west`, which is an aggregation over every series whose labels match.

The line protocol, used by Prometheus and OpenTSDB, writes it as:

```text
cpu.load host=webserver01,region=us-west 1613707265 50
cpu.load host=webserver02,region=us-west 1613707265 43
```

## The access pattern

Three properties, and each one rules something out.

**Writes are constant and enormous.** 10 million series, each reporting on an interval, is a continuous firehose with no idle period. There is no quiet hour.

**Writes are append-only.** A measurement at a timestamp is never updated. Nothing is edited, ever.

**Reads are aggregations over ranges.** Nobody asks for one data point. They ask for the 95th percentile across a pool over the last hour, which touches many series and many points and returns one line.

And the observation that shapes the storage: Facebook measured that at least 85% of queries to their operational store were for data from the past 26 hours. The data is written once and read almost entirely while it is fresh, then kept for a year and barely touched.

## Why not a relational database

It would work and it fits badly, in two ways.

The write volume is wrong for a general-purpose database that maintains indexes and transactions for access patterns this workload never uses.

And the queries are painful to express. A rolling average in SQL needs nested subqueries and window functions:

```sql
select id, temp, avg(temp) over (partition by group_nr order by time_read) as rolling_avg
from ( select id, temp, time_read, interval_group,
       id - row_number() over (partition by interval_group order by time_read) as group_nr
       from ( ... ) t1 ) t2
order by time_read;
```

The same thing in a time-series query language is one line. That is not cosmetic: a monitoring system is used by people writing ad-hoc queries during an incident, and a query language that takes ten minutes to get right is a query language nobody uses at 3am.

## Predict, then verify

Ten million metrics collected every 10 seconds, stored as an 8-byte value plus an 8-byte timestamp. How much raw data per day, and what does it say?

Answer: 10 million series times 8,640 collections per day is 86.4 billion points, and at 16 bytes each that is about 1.4 TB a day, or roughly 500 TB a year before any optimization. The number rules out storing raw data for a year, which is exactly why the requirements specified downsampling rather than leaving retention as one figure. It also explains why compression is built into every time-series database rather than being optional: the values are highly repetitive, since CPU load at consecutive timestamps is nearly the same number, and timestamps are nearly evenly spaced, so delta encoding turns a 32-bit timestamp into about 4 bits. Working this out early is what turns "we need a time-series database" from a name into a justification, and it tells you the two techniques the next lesson is about.
