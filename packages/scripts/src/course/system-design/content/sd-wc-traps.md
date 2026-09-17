The web is not a cooperative data source. Some of it is duplicated, some is designed to trap you, and a lot of it is worthless. A crawler that does not defend against all three spends its budget on nothing.

## Duplicate content

About 29% of the web is duplicated. The same article appears on a dozen syndication sites; a product page is reachable through five URL forms that differ only in tracking parameters.

Comparing documents character by character across a billion pages is not viable. Hash each page and compare hashes, which turns the comparison into a lookup.

Exact hashing catches byte-identical copies and misses near-duplicates, where the content is the same but a timestamp or an ad slot differs. Catching those needs a similarity hash, where similar documents produce similar fingerprints, so near-duplicates can be detected without comparing documents directly. It is the difference between "is this the same bytes" and "is this the same article", and for a search index the second question is the one that matters.

## Spider traps

A spider trap is a page that generates infinite distinct URLs, so the crawler never finishes:

```text
www.example.com/foo/bar/foo/bar/foo/bar/...
```

Each URL is genuinely new, so "URL seen?" does not help. A calendar with a next-month link does the same thing, usually without anyone intending it.

There is no general solution, and being honest about that is the right answer. What works in practice:

- **Cap URL length.** Crude and effective against path-repetition traps.
- **Cap depth** from the seed.
- **Cap pages per host.** A domain producing an unusual number of distinct URLs is the signature, and this bounds the damage from any one trap without identifying it.
- **Manual exclusion.** Traps are obvious in aggregate statistics, so a human looks at the hosts with absurd page counts and adds a filter.

That last one is not a failure of imagination. Deciding automatically whether a million-URL site is a trap or a large legitimate catalogue is genuinely hard, and the cost of a human deciding occasionally is lower than the cost of being wrong automatically.

## Data noise

Advertisements, boilerplate navigation, code snippets and spam pages. Not traps, just worthless, and they consume storage and index space. Filter what you can identify, and accept that the line between low-value and valuable is a judgment call your ranking pipeline makes better than your crawler does.

## Robustness

Things that keep a crawl running for weeks:

- **Consistent hashing** to spread hosts across downloaders, so adding or losing a server moves a small fraction of the assignment.
- **Checkpointed crawl state.** Write the frontier and progress to storage periodically, so a crash resumes rather than restarts. At a billion pages a month, losing a week of progress is not recoverable by simply going faster.
- **Exception handling everywhere.** Malformed HTML, invalid encodings, servers that send a 200 with an error page, certificates that fail. Each must fail one page rather than one worker.
- **Data validation**, so a page claiming to be HTML and containing something else does not reach the parser unchecked.

## What is left out

Worth raising at the end: JavaScript-rendered pages, where links are generated client-side and a plain fetch retrieves almost nothing, which needs a rendering step before parsing. Anti-spam filtering to keep low-quality pages out of finite storage. And keeping the crawl servers stateless so the fleet can scale horizontally, which is what the frontier and the storage being external buys you.

## Predict, then verify

Your crawler has URL-seen checks, a 200-character URL cap and a depth cap of 20. A site serves the same page at `example.com/product?id=X&session=Y` for millions of session values. Do the defenses hold?

Answer: no, and every defense misses for a different reason. The URLs are short, so the length cap does not fire. The depth is 1, since every URL is linked from the front page, so the depth cap does not fire. Every URL is genuinely distinct, so "URL seen?" does not fire. The crawler will happily fetch millions of pages from one host. The defense that does work here is the one that does not try to recognize the trap: "content seen?" catches it, because all those URLs return the same content, so after the first fetch every subsequent one is discarded as a duplicate. It still costs the fetches, which the per-host page cap bounds. The lesson is that URL-shaped defenses catch URL-shaped traps and content-shaped defenses catch content-shaped ones, so you need both, plus a per-host cap as the backstop for traps neither recognizes.
