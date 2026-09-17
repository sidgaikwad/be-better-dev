A feed request touches user data, post data, relationships, counters and the reader's own history. Serving that from a database at the rate a social app generates would need an implausible number of machines, so the feed is served from cache and the cache is not one thing.

## Five tiers

Divided by what the data is and how it behaves:

- **News feed.** The post ids per user. Small, per user, changes on every fanout.
- **Content.** The posts themselves. Shared across every reader of a post, which is what makes storing ids in the feed tier worthwhile. Popular posts get a hot tier of their own.
- **Social graph.** Who follows whom. Read on every fanout and every pull, written rarely.
- **Action.** Whether this user liked or replied to this post. Per user per post, which is the largest set by count.
- **Counters.** Likes, replies, followers, following. Tiny values, enormous read rate, updated constantly.

## Why separate them

They have nothing in common operationally, and a single cache forces one policy on all of them.

**Different sizes.** A counter is 8 bytes and a post is kilobytes. Sharing a memory budget means the posts evict the counters, and counters are read on every rendered item.

**Different write rates.** The graph changes rarely, counters change constantly. One invalidation strategy cannot suit both.

**Different lifetimes.** A feed entry matters for days. A counter matters until it changes. A post is worth caching as long as it is read.

**Different consequences on a miss.** Missing a counter means rendering a post without a like count, which you can do. Missing the post means rendering nothing.

That last point is the useful one. Separating the tiers lets you degrade unevenly: when the counter tier is struggling you can serve stale counts or none, and the feed still renders. With one cache you get one failure mode for everything.

## Counters are their own problem

Counters look like the easiest tier and are the hardest.

A like count is read on every render of that post, so a popular post's counter is read millions of times a minute, and it is written every time anyone likes it. Read-heavy and write-heavy on the same key is the combination caches are worst at, because every write invalidates an entry that is about to be read by thousands of people.

The standard answers all give up exactness. Update the counter in the cache directly rather than invalidating and reloading. Batch increments and flush periodically, accepting that the count is a second stale. Nobody notices a like count of 40,102 that should be 40,109, and everyone notices the page being slow, which makes this a rare case where the correct engineering answer is to be slightly wrong on purpose.

## Media

Images and video do not belong in any of these tiers. They go to a CDN, referenced by URL from the content tier.

This follows from the CDN lesson: media is large, static, immutable once uploaded, and requested from everywhere. It is the ideal CDN object, and keeping it out of your caches means your memory budget is spent on the metadata that actually needs to be near the application.

## Predict, then verify

The action cache holds whether a user liked a post. It is by far the largest tier by entry count and has the worst hit rate. Why, and what would you change?

Answer: the key is `(user_id, post_id)`, so its size is users times posts they have seen, which is the largest product in the system, and any individual entry is read by exactly one person. Every other tier is shared: one post is cached once and read by thousands, so a single entry earns its memory thousands of times over. An action entry earns its memory once, from one reader, and only if that reader happens to see that post again. That is why the hit rate is poor, and adding memory will not fix it, because the problem is that the data is not shared rather than that the cache is small. The change is to stop caching it per pair and instead fetch a reader's actions for the posts in their current feed page in one batched query, keyed on the reader. One query per feed load returns all fifty answers, which converts the worst-shaped cache tier into a single indexed lookup, and it is a good instance of the general move: when a cache has no sharing, batching the underlying query usually beats caching it.
