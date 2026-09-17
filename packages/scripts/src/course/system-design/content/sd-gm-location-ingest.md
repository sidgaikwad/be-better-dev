Every navigating client reports where it is. That stream is the highest-volume thing in the system, and it is also the raw material for traffic, road updates and ETA training, so it is worth designing rather than treating as telemetry.

## Batch on the client

The naive version sends an update every second over a persistent connection. At any real user count that is an enormous request rate for data that is not individually urgent.

Buffer on the client instead. Record a position every second, send fifteen of them every fifteen seconds:

```text
POST /v1/locations
  locs: [(lat, lng, timestamp), (lat, lng, timestamp), ...]
```

Request volume drops fifteenfold and no information is lost, because each point carries its own timestamp. The server receives the same data, later and in fewer requests.

The cost is latency on the freshest point, which matters for exactly one thing: the traffic signal derived from this stream is up to fifteen seconds stale. That is inside the tolerance, since traffic conditions do not change meaningfully in fifteen seconds, and it is the calculation to state rather than assume.

Batching is also why HTTP with keep-alive is the right protocol here rather than a WebSocket. The client sends a small payload every fifteen seconds and needs no server-initiated message on this path, since route updates arrive on the separate channel from the previous lesson. A persistent bidirectional connection for one upload every fifteen seconds is cost without benefit, and that reasoning is worth stating because it is the opposite conclusion from the same system's rerouting channel.

## Storing it

Write-heavy, append-only, horizontally scalable, rarely read by key. That is the profile Cassandra fits, and a relational database does not.

```text
user_id | timestamp  | user_mode | driving_mode | location
101     | 1635740977 | active    | driving      | (20.0, 30.5)
```

Also push it into a stream, typically Kafka, because the writes have several independent consumers. The traffic update service derives current conditions, the routing tile pipeline finds new and closed roads, and other jobs use it for personalization and analysis.

That is the structural point: the same data feeds a database and several stream consumers, so it goes to a log that many things read rather than to a store that many things query. A consumer that falls behind or fails does not affect the others or the write path.

## Privacy

A continuous location trace tied to a user id is among the most sensitive data anyone collects. It reveals where someone lives, works, worships and sleeps, and re-identification from a trace is easy even without a name attached.

Design consequences worth naming: retain raw traces for a bounded period rather than forever, aggregate to the road segment for the traffic use case since the traffic database never needs to know who contributed a measurement, separate the identified store from the aggregate one so most consumers read only the latter, and make the collection an explicit opt-in with a visible control.

The proximity service lesson raised GDPR and CCPA. This system is where those obligations actually bite, because this is the data they were written about.

## Predict, then verify

You batch fifteen points and send every fifteen seconds. A client loses connectivity in a tunnel for two minutes, then reconnects. What does it send, and what should the server do?

Answer: it sends everything it buffered, eight batches' worth or one large batch of about 120 points, all at once and all timestamped in the past. The first hazard is the server: every client that just left the same tunnel does this in the same second, so a dead zone produces a synchronized burst proportional to how many people were in it, which is the thundering herd from the nearby friends lesson arriving through a different door. Client-side jitter on the reconnect send spreads it. The second hazard is the consumers: those points are two minutes old, and a traffic service that treats arrival time as observation time will conclude the tunnel road is congested right now based on where people were two minutes ago, which is exactly backwards if it has since cleared. Every consumer must key off the embedded timestamp rather than ingestion time, and be willing to discard points beyond a staleness threshold. That distinction between event time and processing time is the central problem of the ad click aggregation section later in this part, and this is the first place it bites.
