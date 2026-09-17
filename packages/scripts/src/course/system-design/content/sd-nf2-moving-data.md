The proximity service indexed locations that never change. This one indexes locations that change every thirty seconds, and that single difference invalidates most of the previous design.

## Scope

- Nearby means within 5 miles, configurable
- The list refreshes every few seconds, each entry showing distance and when it was last updated
- A friend inactive for more than 10 minutes disappears rather than showing a stale position
- 1 billion users, 10% using the feature
- Location history is kept, since it is valuable for other purposes

Non-functional: low latency; reliability, with the explicit note that occasionally dropping a data point is acceptable; and eventual consistency, since a few seconds of divergence between replicas does not matter.

That tolerance is worth pausing on. A location that is three seconds old is indistinguishable from a current one when people walk at 3 miles per hour, so the system can drop updates and be eventually consistent without the product noticing. Very few systems get that much slack, and the design spends all of it.

## The estimate

```text
DAU                  = 100 million
concurrent           = 10% = 10 million
refresh interval     = 30 seconds
location update QPS  = 10 million / 30 = ~334,000
```

334,000 writes per second is already large. Then the number that defines the problem:

```text
friends per user     = 400
online and nearby    = ~10%
fanout per update    = 400 × 10% = 40
forwards per second  = 334,000 × 40 = ~14 million
```

14 million messages per second pushed to devices. The write rate is not the problem; the fanout is, and it is 40 times larger.

Why 30 seconds: walking speed is 3 to 4 miles per hour, so in 30 seconds someone moves about 45 yards, which does not change who is within 5 miles. The interval is chosen from the physics of the thing being tracked, and doubling it halves the entire load.

## Why not peer to peer

Every user holds a connection to every nearby friend, and the backend does nothing.

It fails on the client rather than the server. A mobile device cannot hold dozens of persistent connections over a flaky network, and each one costs battery, which is the resource a phone actually guards. The idea is still worth mentioning, because it frames what the backend is for: a shared relay so each client holds one connection instead of forty.

## What the backend does

1. Receive location updates from every active user.
2. For each update, find that user's active friends.
3. Compute the distance to each, and forward only when it is under the threshold.

Three lines, and the third one is where the 14 million per second lands.

## Predict, then verify

The proximity service used a geospatial index to find what is near a point. Would that work here?

Answer: no, and understanding why is the point of this section. A geospatial index is built for a query, "what is near this point", over data that mostly sits still. Here the question is inverted: you are not searching for nearby users, you are pushing an update to a known set of friends and filtering by distance. The candidate set comes from the friend graph, not from geometry, and it is about 400 people rather than everyone in the area. Distance is a filter applied at the end, not the thing you search by. And an index would be useless anyway, because with 334,000 updates per second every entry changes constantly, so you would spend more updating the index than querying it. The structures are chosen by the shape of the question: proximity service asks "who is near this point" over static data and wants a spatial index, while nearby friends asks "which of these specific people are near me" over data in constant motion and wants a message bus.
