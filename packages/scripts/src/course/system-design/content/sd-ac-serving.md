The pipeline produces counts. Serving them is a separate problem, and the filtering requirement makes it much harder than it first looks.

## The three queries

1. Clicks for an ad in the last M minutes.
2. Top 100 ads in the past minute.
3. Both of the above, filtered by ip, user or country.

Queries 1 and 2 are lookups against precomputed aggregates. Query 3 is the one that changes the design.

## Why filtering is expensive

The naive reading of query 3 is to filter the raw events at query time. At a billion events a day that is a scan per query, and the latency budget does not allow it.

So the filters have to be precomputed, which means aggregating per combination of dimensions rather than per ad:

```text
ad_id                                   -> count
ad_id, country                          -> count
ad_id, user_id                          -> count
ad_id, ip                               -> count
ad_id, country, user_id                 -> count
...
```

Every subset of the filterable dimensions is its own aggregate. With three dimensions that is eight combinations per ad per minute, and the count grows as a power of two in the number of dimensions. This is a data cube, and it is why a fourth filterable field is a much bigger request than it sounds.

The practical answer is not to precompute every combination but to precompute the ones people actually query. `ad_id, country` is asked constantly; `ad_id, ip, user_id` almost never, because an ip and a user together identify one person and one click. Measure which filters are used and materialize those, falling back to a slower path for the rest.

Saying that out loud is better than either extreme. Precomputing everything is exponential, and precomputing nothing means scanning, so the answer is to precompute what is asked, which requires knowing what is asked.

## The aggregation database

The workload is write-heavy from the pipeline, read-light from dashboards, and the writes are per ad per minute per dimension combination.

Cassandra fits: high write throughput, horizontal scaling, and a natural key of `(ad_id, minute)` where a partition holds one ad's timeline and a range read over minutes answers query 1 directly.

Query 2, the top 100, cannot be served the same way, because finding the top of two million ads means examining all of them. Compute it in the pipeline instead, where the aggregator already has every ad's count for the minute, and store the resulting list of 100 as one row.

That is the general move for a top-N query, and it is the same one the autocomplete section made with cached top-k per trie node: ranking is done where the data is already gathered, not at read time.

An OLAP store like ClickHouse or Druid is the other credible answer, since both are built for exactly this shape and would handle the dimensional filtering natively rather than making you materialize cubes by hand.

## Retention

Raw events are kept so history can be replayed, which Kappa requires. Aggregates are kept much longer than raw, because they are tiny by comparison and are what reporting reads.

The same tiering as the monitoring section: recent data at full resolution, older data rolled up to hourly and then daily.

## Predict, then verify

Query 2 asks for the top 100 ads in the past minute, computed in the pipeline. A dashboard then asks for the top 100 in the past hour. Can you answer it from the per-minute results?

Answer: not exactly, and the reason is that top-N does not compose. Summing 60 per-minute top-100 lists misses an ad that was consistently number 150 every minute, which over the hour may total more than an ad that spiked into one minute's top 100 and was absent from the other 59. The per-minute lists discarded exactly the information needed to detect that. There are two honest fixes. Store the full per-minute counts for every ad, not just the top 100, and compute any period's top-N from those, which costs storing two million rows per minute rather than one hundred, and is affordable because a count is a few bytes. Or keep a larger per-minute list, the top 1,000 rather than 100, which makes the hourly answer approximately right and still wrong in principle. Take the first: the per-minute counts are already being computed for query 1 anyway, so the top-N list is a materialized convenience rather than the only record. The general lesson is that aggregations that discard the tail cannot be re-aggregated over longer periods, so store the full distribution and derive the rankings.
