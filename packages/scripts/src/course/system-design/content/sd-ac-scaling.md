The trie is in memory and answers in `O(1)`. What remains is fitting it on machines and serving 48,000 requests per second, and the most effective answer is to not serve most of them at all.

## Sharding the trie

Eventually one trie does not fit in one machine's memory. Splitting it is less obvious than splitting a table, because the access unit is a prefix rather than a row.

**By first character.** Shard 1 holds everything under `a`, shard 2 under `b`, and so on. Routing is trivial: read the first character. The distribution is terrible, because queries are not uniform across the alphabet. `s` and `t` carry far more than `x` and `z`, so one shard is hot and another idle.

**By first character, weighted.** Same idea with uneven assignment: `s` gets a shard to itself, while `u`, `v`, `w`, `x`, `y`, `z` share one. This needs a shard map built from measured query distribution, which is exactly the data the gathering pipeline already produces.

The second is the right answer and the reasoning is the transferable part: when a partition key's distribution is known and stable, measure it and assign ranges by load rather than by key. This is the same move as weighting virtual nodes by server capacity in the consistent hashing section.

## The browser does most of the work

The highest-leverage optimization is not on your servers.

Suggestions for a given prefix change rarely, so they can be cached in the browser. Google sends autocomplete responses with:

```text
Cache-Control: private, max-age=3600
```

`private` means only this user's browser may cache it, not a shared proxy, which matters because suggestions can be personalized. `max-age=3600` is one hour.

The effect on your load is large and worth working out. A user typing `dinner` sends six requests the first time. Typing it again within the hour sends none, and the prefixes `d`, `di`, `din` are shared with every other query they type starting that way. Since people repeat their own searches and their prefixes overlap heavily, a substantial share of the 48,000 QPS never leaves the browser.

This is the CDN lesson at a smaller scale: the cheapest request is the one that does not reach you, and an immutable-enough response with a sensible max-age is how you get it.

## Sending the requests

Use AJAX so a keystroke fetches suggestions without touching the page. Obvious now, and the reason it is worth a sentence is that the response must be small: at 24,000 QPS, a response carrying more than five strings is bandwidth spent on data nobody reads.

## Availability

The trie cache is the serving path, so losing it means losing the feature. Replicate it, and spread replicas so a single failure domain cannot take all of them, which is the cold-cache argument from Part 1.

Autocomplete has an unusually graceful failure, though, and it is worth saying so: if suggestions do not appear, search still works. Failing open, returning an empty list rather than an error, degrades the product without breaking it. Not every system has that option, and the ones that do should use it.

## Predict, then verify

You shard by first character, weighted by measured load. Six months later one shard is at 90% memory and the others are at 40%. What happened, and what is the fix?

Answer: the query distribution moved, which it always does. A product launch, a news cycle or a seasonal shift changes which prefixes are popular, and a shard map computed from six-month-old data is now wrong. Nothing failed; the assumption that the distribution is stable turned out to hold only in the short term. The fix has two halves. Recompute the shard map from recent aggregated data, which you already have because the gathering pipeline produces exactly that, and make rebalancing routine rather than an incident response: since the trie is rebuilt on a schedule anyway, the rebuild is the natural moment to reassign prefixes to shards at no extra cost. That is the useful property of a periodically-rebuilt structure, and it is worth stating as a benefit rather than only as a constraint: a system that reconstructs itself regularly gets rebalancing for free, while one that mutates in place has to migrate data to do the same thing.
