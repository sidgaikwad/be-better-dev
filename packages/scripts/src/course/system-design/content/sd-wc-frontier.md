The URL frontier holds what is still to be downloaded. It has to serve two goals that pull against each other, which is why it is two layers of queues rather than one.

## Back queues: politeness

The rule is one request at a time to a given host, with a delay between requests.

The structure that enforces it:

- **A mapping table** from hostname to queue.
- **Back queues b1 to bn**, each holding URLs from exactly one host.
- **A queue router** that reads the hostname and puts each URL in its host's queue.
- **A queue selector** assigning each worker thread to one queue.
- **Worker threads**, each downloading only from its own queue, one URL at a time, with a delay between fetches.

Because a worker owns a queue and a queue holds one host, a host is only ever contacted by one worker, one request at a time. Politeness is guaranteed by the topology rather than by a check anyone can forget.

Throughput comes from having many queues. A thousand back queues means a thousand hosts in flight, so one request per second per host gives 1,000 pages per second while no server sees more than one request per second.

## Front queues: priority

Above the back queues sits prioritization:

- **A prioritizer** computes a priority for each URL from PageRank, site traffic, update frequency.
- **Front queues f1 to fn**, one per priority level.
- **A queue selector** picks a front queue at random, biased toward the high-priority ones.

The bias is the part worth noticing. It selects randomly rather than always taking the highest priority, because strict priority starves the low queues completely: a queue that is never selected while anything sits above it is a queue whose URLs are never crawled. Random-with-bias means high priority is crawled much more often while low priority still advances.

## The two layers together

Front queues decide what should be crawled next. Back queues decide when a host may be contacted. A URL flows from a front queue, through the router, into its host's back queue, and out to a worker.

The separation is what makes both possible at once. Prioritization happens without knowing about hosts; politeness happens without knowing about priority.

## Storage

A real frontier holds hundreds of millions of URLs. Neither pure option works: memory is not large enough and is lost on restart, and disk is too slow to be in the path of every enqueue and dequeue at 400 pages per second.

The answer is hybrid. Most URLs live on disk, with in-memory buffers for enqueue and dequeue, flushed periodically. Reads and writes hit memory at the ends of the queue, which is where the activity is, while the bulk sits on disk where the capacity is.

This is the same structure as the key-value store's write path: a memory buffer in front of durable storage, because the access pattern is concentrated at one end.

## Predict, then verify

A crawl has 1,000 back queues and 1,000 workers. 90% of discovered URLs are from ten enormous hosts. What happens?

Answer: ten workers are saturated and 990 are idle, so the crawl runs at roughly 1% of its capacity. The back queues for those ten hosts grow without bound while their single workers each plod through at one request per second, and the other 990 queues are empty because there is little from other hosts to put in them. The crawler is perfectly polite and almost entirely stalled. Worse, the frontier's memory and disk fill with URLs for hosts that cannot be drained faster. The fixes are all about not treating a host as one unit: allow more than one worker per host when the host is large and its robots.txt permits it, shard a big host by subdomain or path prefix into several back queues, or cap how many URLs per host the frontier accepts so a single site cannot consume it. The general lesson is that per-host politeness sets a hard ceiling on throughput per host, so a crawl whose discovered URLs are concentrated on few hosts is limited by that ceiling and not by its machines.
