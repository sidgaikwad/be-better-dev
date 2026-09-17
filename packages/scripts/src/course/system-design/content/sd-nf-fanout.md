Fanout is delivering a post to everyone who should see it. There are two ways to do it, they have opposite failure modes, and every real feed ends up using both.

## Fanout on write

Also called the push model. When a post is published, immediately write it into every friend's feed.

Reading is then trivial: the feed already exists, so `GET /feed` is one cache read of a precomputed list.

**Pros.** Reads are fast and cheap, which matters because reads are far more frequent than writes.

**Cons.** Writes cost one per friend, so a post from someone with 5,000 friends is 5,000 writes. And you precompute feeds for people who never log in, which is most of your users on most days.

## Fanout on read

Also called the pull model. Write only the post. When a user opens their feed, fetch their friend list, query recent posts from each, merge, and sort.

**Pros.** One write. Nothing computed for inactive users. No hot key problem.

**Cons.** Every feed load is a fan-in across hundreds of friends, a merge and a sort, on the path of the most frequent request in the system.

## Why neither works alone

The two costs land on different users, which is the key observation.

Fanout on write breaks on the **high-fanout author**. A celebrity with 40 million followers generates 40 million writes per post. That is the hot key problem, and it does not merely cost resources, it creates a burst that arrives as a spike whenever that one account posts.

Fanout on read breaks on the **normal reader**. Everyone pays for the worst case on every feed load, and the worst case is a user with many friends who post a lot.

## The hybrid

Push for most users, pull for the few with enormous followings.

- A post from an ordinary user is fanned out on write into their friends' feeds, as before.
- A post from a celebrity is not fanned out at all.
- When a user loads their feed, they read their precomputed feed and separately fetch recent posts from the handful of celebrities they follow, then merge.

The merge is cheap because the celebrity list is short: someone following 500 accounts might follow three that cross the threshold, so the read is one cache lookup plus three small queries.

This works because the distribution is extreme. The overwhelming majority of accounts have few followers and can be pushed; a tiny minority have millions and must be pulled. Handling both with one mechanism means either paying celebrity costs for everyone or paying celebrity latency for everyone.

The threshold is a tuning parameter, and saying that out loud is better than naming a number. It depends on your write capacity and read latency budget, and it is the kind of value you set from data rather than derive.

## Fanout, step by step

1. Fetch friend ids from the graph database, which is what graph databases are for.
2. Fetch friend details from the user cache and filter: muted friends, blocked users, and posts shared with a restricted audience.
3. Put the friend list and the post id on a message queue.
4. Fanout workers consume from the queue and write `(post_id, user_id)` into the feed cache.

Step 3 matters. Fanout happens asynchronously, so the poster's request returns as soon as the post is persisted rather than waiting for thousands of writes. The publish is fast and the delivery is eventual, which is the correct trade: nobody notices a post reaching a friend's feed 200 ms late, and everyone notices posting taking 3 seconds.

## Predict, then verify

You set the celebrity threshold at 1 million followers. An account with 900,000 followers posts during a live event and the system degrades. Was the threshold wrong?

Answer: the threshold was applied to the wrong quantity. 900,000 is below the cutoff, so that post is fanned out on write, producing 900,000 feed writes in a burst, and during a live event that account may post every few minutes, so the bursts overlap and the fanout queue never drains. The number itself is defensible; the mistake is treating follower count as a static property when the load depends on posting rate times follower count. An account with 900,000 followers posting twice a day is fine, and the same account posting twenty times an hour is not. The fix is to make the decision dynamic: measure recent fanout cost per author and switch an account to pull when its rate crosses a budget, rather than deciding once from a follower count. It is also worth noting the queue is doing its job here: the system degrades into a delay instead of failing, which is exactly the behavior the Part 1 queue lesson predicted.
