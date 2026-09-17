A route request is an origin and a destination. Getting from that to a list of directions runs through several services, and separating them is what makes each one tractable.

## The pipeline

1. **Geocoding service** turns an address into a latitude and longitude. A key-value store, since reads are frequent and writes are rare.
2. **Route planner** orchestrates the rest.
3. **Shortest-path service** returns the top k routes by road structure alone, ignoring traffic.
4. **ETA service** predicts a duration for each route, using current and historical traffic.
5. **Ranker** applies user filters, avoiding tolls or freeways, and orders by predicted time.

The split between 3 and 4 is the design decision worth defending. Shortest path depends only on the road graph, which barely changes, so its results are highly cacheable. ETA depends on live traffic, which changes constantly and is uncacheable. Computing them together would make the whole thing uncacheable, so separating them means the expensive graph search is reused while only the cheap prediction is redone.

## Pathfinding over tiles

The shortest-path service runs a variant of A* against the routing tiles:

1. Convert origin and destination to geohashes, which locate the starting tiles.
2. Start at the origin tile and traverse its graph.
3. As the search expands past a tile's edge, load the neighbor from object storage, or from the local cache if it is already there.
4. Follow cross-level edges to coarser tiles as the search moves away from the endpoints.
5. Stop when the best routes are found.

Tiles are loaded on demand rather than up front, which is what keeps memory proportional to the search rather than to the world. A cross-country route loads detailed tiles near each end and highway tiles in between, which is why the middle of a long journey costs almost nothing to compute.

## Storing routing tiles

Not in a database. You would be using it purely as storage, paying for query features, transactions and indexes that a binary blob fetched by key does not need.

Object storage, keyed by geohash, cached aggressively on the routing servers. The geohash key is what makes lookup by coordinate a direct fetch rather than a search, which is the same property the proximity service used, applied to file naming.

## Where the data comes from

Road data arrives from mapping authorities and other sources, terabytes of it, and is not in graph form. A periodic offline pipeline, the routing tile processing service, transforms it into tiles and reruns as the data changes.

User location updates feed back in. They improve the road data, revealing new roads and closures, and they build the live and historical traffic database that the ETA service predicts from. Location writes are heavy and horizontally scalable, so something like Cassandra fits.

This is the second batch pipeline in the section, alongside map tile rendering, and they share a shape: an offline job turns messy source data into an immutable artifact that the serving path reads and never writes.

## Predict, then verify

Shortest-path results are cached because the road graph rarely changes. A road closes for construction. What happens?

Answer: cached routes keep sending drivers into a closed road until the cache expires or is invalidated, and the cache was given a long TTL precisely because the graph was assumed stable. The assumption is right in aggregate and wrong for exactly the changes that matter: a closure is rare, and it is the one change that makes a cached route not merely suboptimal but wrong. So the invalidation has to be driven by the update pipeline rather than by a timer. When the routing tile processing service publishes a tile whose edges changed, every cached route that traversed that tile is invalidated, which means the cache key or an index has to record which tiles a route used. That is extra bookkeeping on every cache write, and it is worth it because the alternative is a TTL short enough to catch closures, which would discard almost every entry before it was reused and remove the point of caching. The general form: when a cache is justified by data that changes rarely, the invalidation must be event-driven, because a TTL tuned for the rare change destroys the benefit that the rarity provided.
