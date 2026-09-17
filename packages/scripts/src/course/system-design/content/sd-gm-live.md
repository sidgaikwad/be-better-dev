A route computed once is wrong the moment traffic changes. Adaptive ETA and rerouting mean the server keeps talking to a client for the whole journey, and that turns a request-response system into a streaming one.

## Two questions

**How do you track who is navigating?** Everyone with an active route is a subscriber to changes affecting it.

**How do you find who is affected by a traffic change?** With millions of active routes, checking every one against every change is not viable.

The answer uses the structure already there. A route is a sequence of routing tiles: user 1's journey is `r_1, r_2, ... r_7`. Traffic changes happen within a tile. So index active users by the tiles their route passes through, and a change in `r_4` requires notifying only the users whose route includes `r_4`.

That converts "which of millions of routes is affected" into a lookup keyed by tile. The tiles were introduced to bound pathfinding memory and turn out to be the right index for this too, which is worth noticing: a decomposition chosen for one reason often gives you the join key for another.

## Getting updates to the client

Four options, and the reasoning eliminates them in order.

**Mobile push notification.** Payload is capped at about 4 KB on iOS, and it does not work for web clients. Out.

**Long polling.** Works, and it is heavier on the server than the alternatives for a channel that carries frequent updates during a journey.

**Server-sent events.** One-directional server-to-client streaming, which fits the described need exactly.

**WebSocket.** Bidirectional and light on the server.

Take WebSocket. SSE would serve the stated requirement, and the client is already sending continuous location updates, so a bidirectional channel is doing work in both directions anyway, and features like delivery confirmation want a reply path.

Note this is the third protocol decision in the course and the third different answer. Chat took WebSocket for bidirectional chat, Drive took long polling for rare one-way notifications, and here it is WebSocket again but for a different reason: not because notifications are frequent, but because the client is already streaming upward.

## The update services

Consuming the location stream, typically through Kafka:

- **Traffic update service** derives current conditions from the location updates of active users, feeding the live traffic database. Users measuring traffic by driving through it is the whole mechanism, and it is why coverage is good where people are and poor where they are not.
- **Routing tile processing service** folds new roads and closures into rebuilt tiles.

Both are stream consumers writing to stores the serving path reads, so an outage in either degrades quality without breaking navigation, which is a good property to point at.

## Battery and data

Named in the requirements and easy to forget. The client is a phone with a screen on, GPS active and a persistent connection, which is close to the worst case for battery.

The levers: send location updates on an interval matched to speed rather than as fast as possible, prefetch tiles along the planned route so a tunnel or dead zone does not stall the map, and send route updates as deltas rather than as whole routes.

## Predict, then verify

Traffic is derived from the location updates of users currently navigating. What is the failure mode on a road where few people use the app?

Answer: the system has no traffic data there, so ETAs fall back to historical patterns or to speed limits, and both are wrong in the case that matters, which is an unexpected jam. Worse, it is self-reinforcing: if the app routes people away from a road because it lacks data and assumes the worst, fewer users drive it, so it never acquires data. Conversely a road the app favors gets more users, better data, and better estimates, which makes it favored more. The measurement changes what it measures, which is the awkward property of any system whose data comes from its own users' behavior. Practical mitigations are to fall back to historical and road-class estimates where coverage is thin, to mark low-confidence ETAs internally so ranking does not treat a guess as a measurement, and to source some data independently of app users. Worth raising unprompted, because it is a class of problem that does not appear in the architecture diagram at all.
