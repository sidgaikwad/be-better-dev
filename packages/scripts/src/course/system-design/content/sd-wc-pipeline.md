The algorithm is three steps:

1. Download the pages at a set of URLs.
2. Extract the URLs from those pages.
3. Add the new ones to the set and repeat.

That is genuinely all of it, and a version that works on one website fits in an afternoon. Everything that makes a crawler hard comes from the web being large, hostile and constantly changing.

## Scope and scale

The questions worth asking, with the answers this design assumes:

- Purpose: search engine indexing
- 1 billion pages per month
- HTML only
- Recrawl pages that change
- Store pages for 5 years
- Ignore duplicate content

The estimate:

```text
QPS      = 1 billion / 30 / 24 / 3600 = ~400 pages per second
peak QPS = 2 × 400 = 800
storage  = 1 billion × 500 KB = 500 TB per month
5 years  = 500 TB × 12 × 5 = 30 PB
```

400 pages per second is not a throughput problem; one machine can open that many connections. 30 PB is the number that shapes the storage design, and it lands in the same place as the YouTube and object storage sections: not a database, but object storage with an index in front.

## The pipeline

The components, and what each exists to do:

- **Seed URLs.** Where the crawl starts. To cover the whole web you want seeds that reach as much as possible, usually chosen by splitting the space by locality (popular sites per country) or by topic.
- **URL frontier.** The set of URLs to download. Its own lesson, because it is where politeness and priority live.
- **HTML downloader.** Fetches pages.
- **DNS resolver.** Turns hostnames into addresses. Listed separately because it is a bottleneck, not a detail.
- **Content parser.** Parses and validates the HTML. Separate from the downloader so a malformed page slows parsing rather than crawling.
- **Content seen?** Has this content been stored before, under any URL?
- **Content storage.** The pages. Mostly disk, with popular content in memory.
- **URL extractor.** Pulls links out, converting relative paths to absolute.
- **URL filter.** Drops unwanted extensions, error links, blacklisted hosts.
- **URL seen?** Has this URL been queued or fetched before?
- **URL storage.** Visited URLs.

The loop: seeds go into the frontier, the downloader takes URLs and fetches them, the parser validates, "content seen?" discards duplicates, the extractor pulls links, the filter drops unwanted ones, "URL seen?" discards known ones, and what survives goes back into the frontier.

## The two membership tests

Notice that two separate components ask "have I seen this?", and they are not redundant.

**URL seen?** stops the crawler queueing the same page twice, which would waste requests and can produce infinite loops.

**Content seen?** catches the same content at different URLs. About 29% of the web is duplicated, so without this you store the same bytes many times. Comparing pages byte by byte across billions of documents is not viable; compare hashes instead, and the comparison becomes a lookup.

Both are membership tests over enormous sets, which is what Bloom filters are for. A Bloom filter that says "definitely not seen" is trusted immediately, and only a "probably seen" needs the real lookup.

## Predict, then verify

The content parser is drawn as a separate component rather than living inside the downloader. Why does that matter at 400 pages per second?

Answer: because parsing is CPU-bound and downloading is IO-bound, and combining them makes the slower one set the pace for both. A downloader thread waiting on a network read is using almost no CPU, so one machine can hold thousands of connections open. Parsing megabytes of malformed HTML is real CPU work, and a thread that parses after each fetch spends most of its time not fetching, so throughput collapses to whatever the CPU allows. Separating them lets you scale each to its own bottleneck: many cheap connection-holding downloaders, and a separate pool of parser machines sized by CPU. It also contains the blast radius, since a page that sends the parser into a pathological case takes out one parser rather than stalling a crawl thread. This is the same reasoning as the message queue lesson in Part 1, and the components are usually separated by exactly that.
