The downloader fetches pages over HTTP. At 400 pages per second across millions of hosts, four things decide whether it works.

## robots.txt

Before crawling a site, fetch `https://host/robots.txt` and obey it. It states which paths a given user agent may fetch:

```text
User-agent: Googlebot
Disallow: /creatorhub/*
Disallow: /rss/people/*/reviews
Disallow: /gp/aw/cr/
```

Not optional. Ignoring it gets you blocked, and in some jurisdictions is worse than that. Treat it as part of the protocol.

Fetching it before every page would double your request count, so cache it per host with a periodic refresh. The cache is per host and small, and it is consulted on every URL before the URL reaches a queue.

## DNS is the bottleneck

Every fetch needs a hostname resolved, and DNS responses take 10 to 200 ms. Worse, many DNS interfaces are synchronous: a thread issuing a lookup blocks, and in some implementations it blocks others.

Put that next to the rest of a fetch. Connecting and downloading a page might be 100 ms. If resolution is another 100 ms, half your crawl is waiting on DNS, and it is waiting on the one part that returns the same answer every time for a given host.

So cache the hostname-to-address mapping yourself, refreshed periodically by a background job rather than on the request path. Hit rates are very high because the crawler revisits the same hosts constantly. This is the single highest-leverage optimization in the downloader, and it is worth naming as such rather than listing among others.

## Distribution and locality

400 pages per second is one machine's work; a real crawl wants far more, so the URL space is partitioned across many crawl servers, each responsible for a subset.

Partition by host, so the politeness guarantee holds without cross-machine coordination: all of one host's URLs land on one server, which already serializes them. Use consistent hashing to assign hosts to servers, so adding or removing a crawl server moves a small fraction rather than repartitioning everything.

Then place the servers geographically. A crawler in Frankfurt fetching European sites pays a fraction of the round trip that one in Virginia does, and from the latency table that difference is 150 ms per request against a few milliseconds.

## Short timeouts

Some servers are slow, and some accept a connection and never respond. Without a timeout, a worker waits indefinitely and its whole back queue stops.

Set an aggressive maximum wait and move on. A page not fetched is cheap; a worker blocked for two minutes is not. The right number is a few seconds, and the reasoning is the one from the wrap-up lesson: a slow dependency is more dangerous than a dead one, because a dead one fails fast.

## Predict, then verify

You add a DNS cache and crawl throughput barely improves. Cache hit rate is 98%. What is happening?

Answer: the 2% of misses are absorbing the gain, because the resolver is still synchronous and a blocking miss stalls more than the thread that issued it. With a shared blocking resolver, one lookup taking 200 ms can hold up every thread that wants to resolve during that window, so 2% of requests can occupy a large share of wall-clock time. The arithmetic is worth doing: if a miss costs 200 ms and a hit costs nothing, 2% misses add 4 ms per fetch on average, which should be invisible against a 100 ms fetch. Seeing no improvement therefore means the cost is not being paid per miss but per miss times the number of threads it blocks, which points at the resolver's concurrency rather than its hit rate. The fix is an asynchronous resolver, or a pool of resolvers so a slow lookup occupies one, and the general lesson is that a cache hit rate tells you nothing about tail behavior when the miss path serializes.
