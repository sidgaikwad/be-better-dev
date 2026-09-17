The scope said reverse chronological, and that simplification is doing more work than it looks. No large feed is chronological any more, and the reason is not engagement metrics. It is arithmetic.

## Why chronological stops working

Follow 500 accounts that post twice a day and your feed receives 1,000 items daily. Open the app twice for ten minutes and you might see 60. Chronological order means you see the most recent 60, which is whatever happened in the last hour, selected by nothing except timing.

A post from a close friend two hours ago loses to an automated account that posted four minutes ago. As the graph grows, the signal-to-noise ratio of a chronological feed falls, and it falls fastest for the most engaged users, who follow the most accounts.

Ranking is the response: choose the best 60 rather than the newest 60.

## What it costs the design

Everything in the previous lessons assumed a precomputed list. Ranking breaks that in three places.

**The feed is no longer stable.** A chronological feed is append-only, so the fanout writes an id and the order is implied by time. A ranked feed's order depends on signals that change, so the same set of posts can be ordered differently five minutes later. You cannot simply store an ordered list and read it.

**Ranking needs the candidate set.** Scoring 60 posts requires more than 60 candidates, typically hundreds, so the feed cache holds a candidate pool and the ranking runs at read time over it. Read work goes up, which is the cost the push model existed to avoid.

**Signals are per reader per post.** How often this reader interacts with this author, whether they have seen this post, how the post is performing generally. That is the action tier and the counter tier from the caching lesson, now on the critical path of every feed load rather than used for rendering.

The usual resolution is two stages. Fanout on write still produces a candidate pool, unranked and cheap. Ranking happens at read time over that pool, with the scores cached briefly so a refresh within a few minutes does not recompute everything. Push for candidate generation, pull for ordering.

## Signals

What a score is usually built from:

- **Affinity** between reader and author: past interactions, message history, profile visits.
- **Post quality**: engagement relative to the author's norm, media type, whether it is a reshare.
- **Recency**, as one signal among many rather than the sort key.
- **Negative signals**: hidden, reported, or scrolled past without stopping.

Interviewers rarely want the model. They want to know you understand that it is one, that it is trained rather than written, and that the serving system's job is to compute features fast enough to score hundreds of candidates inside a page load.

## Worth saying out loud

Ranking is also a product decision with consequences you should name, because it comes up and a candidate who has not thought about it looks naive. A ranked feed optimizing for engagement will favor whatever provokes reaction, which is not the same as what people value. Systems that rank add explicit counterweights: diversity rules so one author cannot fill a feed, penalties for known low-quality patterns, and controls letting readers see chronological order when they want it.

## Predict, then verify

You move from chronological to ranked. Feed load latency rises from 50 ms to 400 ms. What is the likely dominant cost, and what would you do?

Answer: feature fetching, not scoring. Ranking 500 candidates means gathering per-reader-per-post signals for 500 pairs, plus counters and author features, and if those are individual lookups you have turned one cache read into several thousand. The model itself is cheap by comparison: scoring 500 candidates with a small model is single-digit milliseconds, which is why "the model is slow" is usually the wrong diagnosis. The fixes are all about the shape of the fetching: batch every lookup into one multi-get per tier rather than per candidate, precompute author and post features at write time so read time only gathers the reader-specific ones, and cut the candidate pool using a cheap first-pass filter so the expensive features are fetched for 100 rather than 500. This is the same conclusion as the action-cache lesson, arrived at from the other direction: when the work is per reader per post, batching the fetch is the lever, not caching it.
