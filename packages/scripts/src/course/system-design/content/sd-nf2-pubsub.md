Every user needs their location delivered to their online friends. That is a routing problem, and Redis pub/sub is the mechanism, chosen for one specific property.

## The components

- **Load balancer** in front of both the REST servers and the WebSocket servers.
- **REST API servers**, stateless, for the ordinary things: profiles, adding and removing friends, auth.
- **WebSocket servers**, stateful, holding one persistent connection per active client.
- **Redis location cache**, the most recent location per active user, with a TTL refreshed on each update. When the TTL expires the user is inactive and the entry disappears, which is how "inactive friends disappear" is implemented: as an absence rather than a cleanup job.
- **Redis pub/sub**, the routing layer.
- **User database** for profiles and the friend graph, **location history database** for the trail.

## A channel per user

Each user gets a channel. On app start, a user's connection handler subscribes to every friend's channel.

To every friend, including offline ones. That looks wasteful and is deliberate: subscribing to all of them means the backend never has to notice a friend coming online and subscribe then. The subscription is set up once at initialization and the design loses an entire class of state transition.

## The update flow

1. The client sends a location update over its WebSocket.
2. The WebSocket server writes it to the location history database.
3. It updates the location cache, refreshing the TTL, and keeps the location in a variable on the connection handler.
4. It publishes to the user's own channel.
5. Redis broadcasts to every subscriber of that channel, which is every online friend's connection handler.
6. Each receiving handler computes the distance between the incoming location and its own user's location, which it has in memory.
7. If under the radius, it pushes to that client. Otherwise it drops the message.

Steps 2 to 4 run in parallel. The distance filter is at step 6, on the receiving side, which matters: the sender does not need to know where its friends are, and each handler already knows its own user's position, so the check is local and needs no lookup.

## Why pub/sub, and why Redis

The routing is one-to-many with a membership list that changes, which is exactly what a message bus does.

Redis specifically because channels are nearly free. A channel is created when someone subscribes, a message published to a channel with no subscribers is dropped immediately, and an idle channel consumes no CPU. That last property is what makes subscribing to offline friends affordable: a channel for someone who has not opened the app in a month costs a little memory and nothing else.

## Sizing it

Memory:

```text
channels          = 1 billion × 10% = 100 million
subscribers each  = ~100 active friends
bytes per sub     = ~20 for pointers in the hash table and list
total             = 100 million × 100 × 20 bytes = 200 GB
```

At 100 GB per server, two servers hold every channel.

CPU:

```text
pushes per second = 14 million
per server        = ~100,000 (conservative)
servers needed    = 140
```

Two servers for memory, 140 for CPU. The bottleneck is not where the intuition points, and the calculation is what shows it: this cluster is sized by message throughput, and memory is free by comparison.

## Predict, then verify

Users subscribe to every friend's channel, online or not. A user has 400 friends, but sizing assumed 100 active. What is being paid for the other 300?

Answer: about 20 bytes each on the pub/sub server, and nothing else, which is why the simplification is affordable. An idle channel with subscribers but no publisher costs memory for the subscriber list and no CPU at all, since Redis does no work until something is published. 300 extra subscriptions per user across 100 million users is roughly 600 GB of pointers, which is real and is spread over a cluster already sized at 140 servers for CPU, so it fits in memory nobody is using. What you buy is the removal of an entire mechanism: without it, the backend would have to detect a friend coming online and make every one of their friends subscribe at that moment, which means watching presence, fanning out subscription changes, and handling the races when someone connects and disconnects repeatedly. Trading memory that is already idle for a piece of coordination that would have to be correct is a good trade, and naming it as a deliberate trade is better than presenting it as an oversight.
