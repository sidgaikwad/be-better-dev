The index answers the query. What remains is the shape of the service around it, and this system has an unusually convenient shape: enormous read volume, negligible writes, and data that is allowed to be a day stale.

## Two services

**Location-based service.** Finds nearby businesses. Read-only, no writes at all, highest QPS, and stateless in the sense that any server can answer any query. It holds the index and nothing user-specific.

**Business service.** Create, update and delete businesses, and serve the detail page. Writes are rare; detail-page reads are frequent.

Splitting them is the tier-splitting argument from Part 1 with an unusually clean seam: the two have different read-to-write ratios, different scaling curves, and different data.

## The database

Primary with read replicas. The primary takes the rare writes, replicas serve reads.

Replication lag, which every earlier section treated as a hazard, is harmless here. Business details are already allowed to be a day old, so a replica being 50 ms behind is far inside the tolerance. This is the one design in the course where the answer to "what about replication lag?" is that the requirements already accepted it, and saying so is better than describing mitigations you do not need.

## Scaling the read path

Both services are stateless, so they scale by adding servers, which means autoscaling works properly. The traffic shape is strongly diurnal, with lunch and dinner peaks in each timezone, so the fleet should grow and shrink on a daily cycle rather than being provisioned for peak.

Caching helps more than usual because the query space is small. Users searching "restaurants near me" in a dense area produce the same geohash cell over and over, so caching by cell and radius has a high hit rate, and the results only change when the index is rebuilt. That last part is worth noticing: a daily rebuild means the cache TTL can be hours rather than seconds, which almost never happens.

## Where the index comes from

Both index options are built rather than maintained:

- **Geohash** is a column, computed when a business is written. A batch job recomputes it if precision changes.
- **Quadtree** is rebuilt from the business table and loaded by LBS servers.

Either way the build is a batch job over the business table, and its output is deployed to the read path. Treat that pipeline as part of the design rather than an implementation detail, and the failure worth naming is the build producing a bad index: if every LBS server loads it, every server is wrong at once. Validate the output before serving it, on record count and a few known queries, and keep the previous snapshot so a rollback is a restart rather than a rebuild.

## Privacy

Named in the requirements and worth returning to at the end. Search queries are location traces, and a log of them is a record of where individuals were. GDPR and CCPA both apply.

Practical consequences: do not retain raw coordinates against user identity longer than needed, truncate to a coarse geohash for analytics since a 5-character cell is enough for aggregate trends and does not identify an address, and keep this data out of general-purpose logs where it spreads to every system that consumes them.

## Predict, then verify

Your cache key is the exact latitude and longitude plus the radius. The hit rate is almost zero. Why, and what is the key?

Answer: coordinates from a phone GPS have many decimal places and change constantly, so two users standing together, or one user standing still a minute apart, produce different keys for what is the same query. The cache is storing a million distinct keys for a handful of distinct answers. The key should be the thing the query actually resolves to: the geohash cell at the precision chosen for that radius, plus the radius. Everyone in the cell shares an entry, and the hit rate goes from nothing to very high in dense areas, which is where it matters. The general lesson is that a cache key should be the canonical form of the query rather than its raw input, and the canonical form is whatever the system reduces the input to before doing work. Here that reduction is the geohash, and it was already computed: the cache was keyed one step too early.
