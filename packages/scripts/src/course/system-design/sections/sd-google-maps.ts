import type { SectionSeed } from "../../types"

export const sdGoogleMaps: SectionSeed = {
  slug: "sd-google-maps",
  title: "Design Google Maps",
  description:
    "Tiles at several zoom levels, the routing graph behind a shortest path, and ETA under live traffic.",
  badgeIcon: "🗺️",
  badgeTitle: "Maps",
  units: [
    {
      slug: "tiles",
      title: "Tiles",
      description: "Two completely different things cut into grids for two different reasons.",
      lessons: [
        {
          slug: "sd-gm-tiles",
          title: "Map tiles and routing tiles",
          summary:
            "Why zoom levels get their own tile sets, why the road graph is cut into a second kind of tile, and why only one of them belongs on a CDN.",
          contentFile: "sd-gm-tiles.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does each zoom level get its own set of tiles?",
              options: [
                "Higher zooms need higher resolution images",
                "So data transferred stays roughly constant: enough tiles to cover a screen, at any zoom",
                "Because tiles cannot be scaled client-side",
                "To allow different projections per zoom",
              ],
              answer: 1,
              explanation:
                "Zoomed fully out, the world is one 256x256 tile. With only street-level tiles you would download hundreds of thousands and discard nearly all the detail.",
            },
            {
              kind: "mcq",
              prompt: "Why are there three levels of routing tile detail?",
              options: [
                "To match the three most common zoom levels",
                "Cross-country routing over street-level tiles would traverse hundreds of millions of nodes; over highway tiles it is thousands",
                "So tiles can be cached at three different TTLs",
                "Because road data arrives from three kinds of source",
              ],
              answer: 1,
              explanation:
                "Tiles at different levels connect, so a freeway entrance is an edge from a local tile's node to a highway tile's node. The detailed tiles are used only at the two ends of a long journey.",
            },
            {
              kind: "predict",
              prompt: "Map tiles go on a CDN. Why not routing tiles, which are also immutable?",
              options: [
                "Routing tiles are too large for a CDN",
                "Their consumers are your own routing servers in a few data centers, so edge proximity serves nobody",
                "Binary files cannot be CDN-cached",
                "Routing tiles change too often",
              ],
              answer: 1,
              explanation:
                "A CDN is for content whose consumers are geographically spread. Routing servers want a local in-process cache instead, and their working set is small. Same data shape, opposite answer, because the question is who is asking.",
            },
          ],
        },
        {
          slug: "sd-gm-routing",
          title: "Finding a route",
          summary:
            "The service pipeline, why shortest path and ETA are deliberately separate, loading tiles on demand, and the cache that a road closure breaks.",
          contentFile: "sd-gm-routing.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why separate the shortest-path service from the ETA service?",
              options: [
                "They are owned by different teams",
                "Shortest path depends only on the rarely-changing road graph and is highly cacheable; ETA depends on live traffic and is not",
                "ETA requires a GPU and shortest path does not",
                "So ETA can be skipped for short journeys",
              ],
              answer: 1,
              explanation:
                "Computing them together would make the whole result uncacheable. Separated, the expensive graph search is reused and only the cheap prediction is redone.",
            },
            {
              kind: "mcq",
              prompt: "Why store routing tiles in object storage rather than a database?",
              options: [
                "Databases cannot store binary blobs",
                "You would be paying for query features, transactions and indexes that a blob fetched by key does not need",
                "Object storage is strongly consistent",
                "Tiles are too numerous to index",
              ],
              answer: 1,
              explanation:
                "Keyed by geohash, so lookup by coordinate is a direct fetch rather than a search, which is the proximity service's property applied to file naming.",
            },
            {
              kind: "predict",
              prompt:
                "Routes are cached with a long TTL because the road graph rarely changes. A road closes. What must the invalidation be?",
              options: [
                "A shorter TTL tuned to catch closures",
                "Event-driven from the tile pipeline, invalidating routes that traversed a changed tile",
                "A manual cache flush during incidents",
                "No invalidation: rerouting handles it live",
              ],
              answer: 1,
              explanation:
                "A TTL short enough to catch closures discards nearly every entry before reuse, removing the point of caching. When a cache is justified by data that changes rarely, the invalidation must be event-driven, because the rarity is what provided the benefit.",
            },
          ],
        },
      ],
    },
    {
      slug: "live-conditions",
      title: "Live conditions",
      description: "Keeping a route correct while someone is driving it.",
      lessons: [
        {
          slug: "sd-gm-live",
          title: "Adaptive ETA and rerouting",
          summary:
            "Indexing active routes by tile, the third protocol decision with a third answer, and a data source that changes what it measures.",
          contentFile: "sd-gm-live.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "How do you find which of millions of active routes a traffic change affects?",
              options: [
                "Recompute every active route on each change",
                "Index active users by the routing tiles their route passes through, so a change in one tile is a lookup",
                "Notify all users in the affected geographic region",
                "Have clients poll for changes along their route",
              ],
              answer: 1,
              explanation:
                "The tiles were introduced to bound pathfinding memory and turn out to be the right index for this too. A decomposition chosen for one reason often gives you the join key for another.",
            },
            {
              kind: "mcq",
              prompt: "Why is mobile push eliminated as the delivery protocol?",
              options: [
                "It is too slow for live updates",
                "Payloads are capped around 4 KB on iOS and it does not work for web clients",
                "It cannot be sent while the app is open",
                "It requires a third-party provider",
              ],
              answer: 1,
              explanation:
                "WebSocket wins over SSE here not because notifications are frequent but because the client is already streaming location upward, so a bidirectional channel is doing work in both directions anyway.",
            },
            {
              kind: "predict",
              prompt:
                "Traffic data is derived from the location updates of users navigating. What happens on a road few app users drive?",
              options: [
                "Estimates fall back to historical data and stay accurate",
                "There is no data, estimates are wrong exactly when it matters, and the effect is self-reinforcing",
                "The road is excluded from routing entirely",
                "Nearby roads' data is interpolated across it",
              ],
              answer: 1,
              explanation:
                "Routing people away from a low-data road means it never acquires data, while a favored road gets more users and better estimates. The measurement changes what it measures, which is the awkward property of any system whose data comes from its own users' behavior.",
            },
          ],
        },
      ],
    },
  ],
}
