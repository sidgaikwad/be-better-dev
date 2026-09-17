The sorted set answers in ranks and ids. Turning that into a screen means three more things: neighbours, ties, and names.

## The four above and below

Given a user's rank, the surrounding players are a range query:

```text
ZREVRANK  leaderboard user_id     -> rank r
ZREVRANGE leaderboard r-4 r+4     -> nine entries
```

Both are operations the skip list supports directly, so this costs about the same as the rank query alone. It is worth noticing that a structure chosen for one query answered a second one for free, which is usually a sign the structure matches the problem rather than the problem being easy.

The edge case is a player in the top four, where `r-4` is negative. Clamp to zero and return the first nine, since showing a player at rank 2 the top nine is more useful than showing them seven entries.

## Ties

Equal scores share a rank, per the requirements. Sorted sets do not do that: `ZREVRANK` returns a position, so of three players on 90 points, one is told they are 5th and another 7th.

Two players with identical scores seeing different ranks is the kind of thing that generates support tickets, so it has to be handled. Computing the true competition rank means counting members with a strictly higher score:

```text
ZCOUNT leaderboard (score +inf   -> players above
rank = that count + 1
```

One extra `O(log n)` operation, and every player on 90 points now gets the same number.

If ties should be broken rather than shared, the standard trick is to encode the tiebreaker into the score itself: combine points with an inverted timestamp into one numeric value, so an earlier achiever sorts above a later one on equal points and the sorted set does it natively. That is worth knowing because it generalizes: any secondary ordering can be folded into the primary score if you can pack both into one number without losing precision.

## Names and pictures

The sorted set holds ids. A leaderboard screen shows display names and avatars, which live in MySQL.

So a top-10 fetch is one Redis call plus a lookup of ten user records. Batch it as one query rather than ten, and cache the profiles of the top players, since they are read on nearly every leaderboard view while everyone else's profile is read only by them.

That is the hydration step from the news feed section, and the same reasoning applies: the ranking structure stores ids so it stays small, and the display data is joined at read time from a store built for it.

## Managed or self-hosted

The build-versus-buy question is worth a sentence. Running Redis yourself means managing persistence, replicas and failover. A managed offering removes that, and several clouds sell leaderboard-shaped services directly.

The reasoning matches the rate limiter section: this is infrastructure rather than product, so buy it unless you need something specific. What is specific here is the tie handling and any custom scoring, both of which live in your application rather than in the store.

## Predict, then verify

You cache the top 10 leaderboard response for 10 seconds to reduce load. Is that safe given the real-time requirement?

Answer: it is safe for the top 10 and unsafe for the query users care about most, which is their own rank. The top of a leaderboard with millions of players is remarkably stable, since displacing the leaders takes many wins, so a 10-second cache serves nearly-identical data and is an easy win. A specific player's rank is the opposite: they just finished a match, they are checking whether it moved them, and a cached answer showing their pre-match rank looks like the score was not counted. So the caching policy has to differ by query rather than by endpoint, which is a distinction worth making explicitly because the two are usually served by the same handler. Cache the leaderboard, never cache a player's own rank, and note that this is the same asymmetry as the replication lag lesson in Part 1: a user tolerates staleness about everyone else and notices it immediately about themselves.
