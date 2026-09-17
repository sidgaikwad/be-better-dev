The previous lesson ended on why the trie cannot be updated per search. So it is built offline, from logs, on a schedule, and everything about the gathering pipeline follows from that decision.

## The pipeline

1. **Analytics logs.** Raw search events, append-only and unindexed. Just `query, timestamp`, written as fast as they arrive because the write path must not slow down search.
2. **Aggregators.** Batch jobs that roll raw events into counts per query per period.
3. **Aggregated data.** `query, time, frequency`, where `time` is the start of the period.
4. **Workers.** Build the trie from aggregated data, computing the cached top-k per node, and write it to the trie database.
5. **Trie cache.** A distributed in-memory copy, which is what the query service actually reads.
6. **Trie database.** The persistent snapshot.

The shape is a batch pipeline, and its important property is that nothing in it is on the request path. A search request never touches a log, an aggregator, or the database.

## How often to rebuild

This is the question to ask the interviewer, because the answer differs by product and it changes the pipeline.

**Weekly is fine for most search.** Autocomplete suggestions for ordinary Google queries barely move day to day. `wea` suggested `weather` last week and will next week.

**Real time is required for some.** Twitter's suggestions must reflect what is being talked about in the last hour, because the whole value is currency. A weekly trie would suggest last week's news.

The pipeline is the same either way; the aggregation window changes. Verify which one you are building rather than assuming, because designing a real-time trie for a product that does not need one buys you complexity and an update problem for nothing.

## Sampling

At billions of searches a day, logging every one costs real storage and processing. Log 1 in N instead.

Sampling works here because the output is a ranking of popular queries, and popularity is exactly what survives sampling. A query searched a million times appears roughly a million over N times in a 1-in-N sample, and its rank against other popular queries is preserved. What you lose is the tail: a query searched three times may appear zero times, and it was never going to reach anyone's top five anyway.

Say why it is safe rather than just proposing it. Sampling is unsafe when you need exact counts or care about rare events, and this system needs neither, which is what makes it an easy win rather than a risk.

## Serving

1. A request reaches the load balancer.
2. It routes to an API server.
3. The API server reads the prefix's cached top-k from the trie cache and returns it.
4. On a cache miss, read from the trie database and populate the cache.

Read-through again. The miss path exists for a cache server restarting or running out of memory, not as the normal case, because the whole trie is intended to be resident.

## Predict, then verify

You rebuild the trie weekly. A major news event happens on Monday and millions search for a new term. When do users see it suggested, and how would you fix it?

Answer: next Monday, which is useless, because by then nobody is searching for it. The weekly rebuild is right for the stable majority of queries and wrong for exactly the queries people are typing right now, and those are the ones where autocomplete helps most. The fix is not to rebuild the whole trie faster, which is expensive and mostly recomputes things that did not change. It is a second, small, frequently-rebuilt trie of recent trending queries, merged with the main one at query time: look up the prefix in both, merge the two top-five lists by score, return five. The trending trie covers hours of data so it is small and can be rebuilt every few minutes, while the main trie keeps its weekly schedule. This is the same two-speed structure as the news feed's push-plus-pull hybrid: one mechanism for the bulk that changes slowly, another for the small set that changes fast, combined at read time.
