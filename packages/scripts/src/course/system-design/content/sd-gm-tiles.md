Rendering a map means sending pixels for wherever someone is looking, at whatever zoom they chose. Computing that per request would be ruinous and mostly repeated, so the world is precomputed into tiles.

## What a tile is

Instead of one enormous image, the world is cut into small images, typically 256x256 pixels. The client downloads only the tiles covering its viewport and stitches them like a mosaic.

Separate sets exist per zoom level. That is the important part, and the reason is bandwidth rather than detail. Zoomed fully out, the world is one 256x256 tile. If there were only street-level tiles, showing the whole world would mean downloading hundreds of thousands of them and throwing away almost all the detail.

So a client picks the tile set matching its zoom, and the data transferred is roughly constant regardless of zoom: enough tiles to cover a screen, always.

## Why precompute

Rendering roads, labels and features into an image is real work, and it is identical for every user looking at the same area at the same zoom. Computing it per request means doing the same work millions of times.

Precompute each tile once, store in object storage, serve through a CDN. Tiles are immutable until the map data changes, which makes them ideal CDN objects by the criteria from the CDN lesson: static, requested constantly from everywhere, and identical for everyone.

This is the same conclusion as YouTube reached about video, arrived at from a different direction: the expensive artifact is produced once by a batch pipeline and served from the edge, and the serving path never touches the system that produced it.

## Routing tiles are different

Navigation needs road data as a graph, not as pixels: intersections are nodes, roads are edges, and pathfinding runs over that.

The graph of every road in the world is far too large to hold in memory or search efficiently, and pathfinding algorithms are very sensitive to graph size. So the road network is cut into grids by the same subdivision idea, and each grid becomes a small graph: the nodes and edges inside it, plus references to the tiles it connects to.

These are **routing tiles**. Same spatial idea as map tiles, entirely different content: map tiles are PNG images, routing tiles are binary serializations of a road graph.

The payoff is that pathfinding loads a few tiles rather than the world, and pulls in neighbors as the search expands.

## Three levels of detail

One resolution is not enough, because the right level depends on the journey.

- **Most detailed**: small tiles, local streets.
- **Middle**: larger tiles, arterial roads between districts.
- **Least detailed**: large tiles, highways between cities.

Tiles at different levels connect: a freeway entrance is an edge from a node in a small local tile to a node in a large highway tile.

This is why cross-country routing is fast. Searching a New York to Los Angeles route over street-level tiles would traverse a graph with hundreds of millions of nodes. Over highway tiles it is thousands, and the detailed tiles are only used at the two ends.

## Predict, then verify

Map tiles are served from a CDN. Routing tiles are in object storage, aggressively cached on the routing servers. Why not put routing tiles on the CDN too?

Answer: because the consumer is different, and the CDN's whole value is proximity to end users. Map tiles are requested by millions of clients spread around the world, so an edge copy near each of them is exactly right. Routing tiles are requested by your own routing servers, which sit in a handful of data centers, so a CDN edge in each city serves nobody: the servers are not there. What those servers want is a local in-process cache, which they can have, because a routing server working on journeys in one region loads the same tiles repeatedly and the working set is small. The general rule is that a CDN is for content whose consumers are geographically spread, and putting internal service-to-service data on one adds a hop and a bill for a locality benefit that does not exist. Same data shape, same immutability, opposite answer, because the question is who is asking.
