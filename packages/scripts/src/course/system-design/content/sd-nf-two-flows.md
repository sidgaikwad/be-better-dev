A news feed is two systems that share a data model and almost nothing else. Publishing is a write that has to reach many people. Reading is a query that has to be instant. Separating them in the first minute is what makes the rest of the design tractable.

## Scope

- Web and mobile
- Publish a post, see friends' posts
- Reverse chronological order, to keep ranking out of scope
- Up to 5,000 friends per user
- 10 million daily active users
- Posts can contain images and video

The 5,000 number is the one to notice. It says fan-out is bounded, which quietly rules out the worst case, and it is exactly the number to push back on if the product is really follower-based rather than friend-based. A follow graph has no such bound, and the difference decides the architecture.

## The APIs

```text
POST /v1/me/feed
  params: content, auth_token

GET /v1/me/feed
  params: auth_token
```

Two endpoints. Everything in this section is about what happens behind them.

## Publishing

1. The client posts to `/v1/me/feed`.
2. The load balancer routes to a web server.
3. The web server authenticates and rate limits, then calls the post service.
4. The post service persists the post to the database and cache.
5. The fanout service delivers the post to friends' feeds.
6. The notification service tells friends there is something new.

Step 5 is the entire design problem, and the next lesson is about it.

## Reading

1. The client gets `/v1/me/feed`.
2. The load balancer routes to a web server.
3. The web server calls the news feed service.
4. The news feed service reads a list of post ids from the news feed cache.
5. It hydrates those ids into full objects: the post content, the author's name and picture, counts.
6. It returns JSON.

Step 5 deserves attention. The feed cache holds ids, not objects, and the difference is large. Storing whole posts and user records per feed entry duplicates every post once per recipient, so a post reaching 5,000 friends is stored 5,000 times. Storing ids means one copy of the post and 5,000 eight-byte references.

The cost is that reading a feed becomes many cache lookups rather than one. That is the right trade, because those lookups are batched and served from memory, and because the deduplication is what makes the memory fit at all.

## Bounding the cache

The feed cache holds a configurable maximum per user rather than everything.

The justification is behavioral: almost nobody scrolls through thousands of entries. Cache a few hundred and the miss rate stays low, because the requests that go past the cached window are rare. When they do, fall back to generating that part of the feed on demand.

This is the same reasoning as the working-set question from the estimation section. You do not cache the data, you cache the part anyone looks at.

## Predict, then verify

10 million daily active users, each posting twice a day, each with 500 friends on average. How many feed entries are written per day under the publishing flow above?

Answer: 10 billion. 10 million users times 2 posts is 20 million posts, and each one is written into 500 feeds, giving 10 billion feed entries per day, or about 115,000 writes per second sustained. That number is the whole reason this section exists. It says the write path, not the read path, is where the system strains, which is the opposite of most designs in this course and the opposite of what "read-heavy social network" suggests. It also says the feed entries must be tiny, because 10 billion of anything large per day is not storable: at 8 bytes per id that is 80 GB a day, and at 1 KB per denormalized post it would be 10 TB a day for the same information. The estimate justifies the ids-not-objects decision before anyone argues about it.
