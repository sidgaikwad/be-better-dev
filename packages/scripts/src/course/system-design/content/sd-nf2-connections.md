The pub/sub layer routes updates. The WebSocket tier holds the connections, and it is stateful, which makes every routine operation more careful than it would be for a web tier.

## Initialization

A client starts, opens a WebSocket, and sends its current location. The handler then:

1. Updates the user's location in the location cache.
2. Keeps that location in a variable on the handler, for the distance checks the previous lesson described.
3. Loads the user's friends from the user database.
4. Makes one batched request to the location cache for every friend's location.
5. Computes the distance to each returned location, and sends back the profile, location and timestamp for every friend inside the radius.
6. Subscribes to every friend's channel.
7. Publishes the user's own location to their channel.

Step 4 is where the TTL earns its place. Inactive friends simply are not in the cache, so the batched fetch returns only active ones, and no separate presence check exists anywhere in the system. A user goes offline by their entry expiring, which is state that cleans itself up rather than state someone has to maintain.

Step 4 being batched also matters: 400 individual cache lookups on every app start, multiplied by the connection rate, is the difference between a fast start and a thundering herd on the cache.

## Draining, not killing

WebSocket servers are stateful, so removing one is not the same as removing a web server.

Each connection is a client that will lose updates when it drops. Reconnection works, since the client re-runs initialization against a new server, but it costs a round of database and cache reads per client, and doing it to every connection on a node at once is a burst.

So a node is drained rather than killed:

1. Mark it draining at the load balancer, so it receives no new connections.
2. Wait for existing connections to close naturally, with a timeout.
3. Remove it.

Deploying a new version needs the same treatment, which means deploys are slow, and the slowness is the feature. This is the stateless web tier lesson read in reverse: everything that made a stateless tier easy to replace is absent here, and the cost is paid in operational care rather than in design complexity.

## Sizing the location cache

```text
active users      = 10 million
bytes per entry   = ~100
total             = 1 GB
```

One server holds it easily. Then the throughput:

```text
updates per second = 10 million / 30 = 334,000
```

Too much for one Redis server, so shard by user id. Locations are independent per user, so the sharding is trivial and needs no coordination. Each shard gets a standby for failover.

The same pattern as the pub/sub cluster: memory is comfortable, throughput is not, and the cluster size comes from the second number.

## The user database

Profiles and friendships, which will not fit one instance at a billion users, and shard cleanly by user id.

At this scale, that data belongs to another team behind an internal API rather than to this system. Worth saying, because it changes the design: the WebSocket servers call a service rather than a database, and the friend list becomes a dependency with its own latency and availability.

## Predict, then verify

A WebSocket server holding 200,000 connections crashes without draining. What happens in the next few seconds?

Answer: 200,000 clients reconnect at once, and each one runs the full initialization, which is a friend-list query, a batched location fetch for 400 friends, and 400 channel subscriptions. That is 200,000 database queries, 200,000 batched cache reads covering 80 million keys, and 80 million subscription operations across the pub/sub cluster, all inside a few seconds. The reconnection is far more expensive than the connection was, so a crash converts a capacity problem into a much larger load spike on three other systems, and if that spike takes down the cache, the remaining servers start failing too. The defenses are on the client: reconnect with exponential backoff and jitter so the herd spreads over a minute rather than arriving in one instant, which is the same jitter argument as the notification retry lesson. On the server side, keep the fleet within the headroom to absorb one node's clients. The general point is that with stateful connections, the cost of a node failing is not the traffic it was serving but the reconnection work its clients generate, and that is usually much bigger.
