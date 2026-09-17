import type { SectionSeed } from "../../types"

export const sdProximityService: SectionSeed = {
  slug: "sd-proximity-service",
  title: "Design a proximity service",
  description:
    "Finding what is nearby: two-dimensional search, geohash against quadtree, and why the index is read-heavy and rebuilt rarely.",
  badgeIcon: "📍",
  badgeTitle: "Proximity",
  units: [
    {
      slug: "indexing-space",
      title: "Indexing space",
      description: "Why an ordinary index cannot answer this, and the two structures that can.",
      lessons: [
        {
          slug: "sd-ps-two-dimensions",
          title: "Why a normal index fails",
          summary:
            "The bounding-box query, why indexing both columns does not help, and why a fixed grid is wrong at both ends.",
          contentFile: "sd-ps-two-dimensions.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does indexing both latitude and longitude fail to make the query fast?",
              options: [
                "B-trees cannot index decimal columns",
                "Each index returns an enormous band, and the work is the intersection of two huge sets rather than the small result",
                "The optimizer cannot use two indexes at once",
                "Coordinates are not selective enough to index",
              ],
              answer: 1,
              explanation:
                "A latitude index returns a band circling the globe; a longitude index returns a band pole to pole. That is the general problem with multi-dimensional range queries on one-dimensional indexes, and it points at mapping two dimensions to one.",
            },
            {
              kind: "mcq",
              prompt: "Which requirement most simplifies the design, and why?",
              options: [
                "The 20 km maximum radius, because it bounds the search area",
                "Updates being effective next day, because the index can be rebuilt in batch rather than maintained live",
                "The five fixed radius options, because they can be precomputed",
                "Detail pages being separate, because they can be cached",
              ],
              answer: 1,
              explanation:
                "It removes the hardest problem before you start. A geospatial index that must be correct in real time is a much harder object than one rebuilt nightly.",
            },
            {
              kind: "predict",
              prompt: "Why is an evenly divided fixed grid the wrong structure?",
              options: [
                "Cells cannot be indexed efficiently",
                "Business density varies by orders of magnitude, so any cell size is too coarse in cities and too fine in deserts",
                "Neighbouring cells cannot be computed",
                "It requires storing empty cells",
              ],
              answer: 1,
              explanation:
                "What you want is cells holding roughly equal numbers of businesses rather than covering equal area. That is what a quadtree provides by construction and what geohash approximates by letting you pick precision.",
            },
          ],
        },
        {
          slug: "sd-ps-geohash",
          title: "Geohash",
          summary:
            "Recursive quadrant division into a prefix-shareable string, choosing precision from the radius, and turning proximity into a range scan.",
          contentFile: "sd-ps-geohash.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What property of geohash makes a B-tree index useful again?",
              options: [
                "Geohashes are shorter than coordinate pairs",
                "A prefix match is a range between two bounds, so a proximity search becomes an ordinary range scan",
                "Geohashes are uniformly distributed",
                "The encoding is reversible",
              ],
              answer: 1,
              explanation:
                "Two dimensions became one, and work is proportional to the businesses in the cell rather than to the table. That is the whole idea, better stated that way than as a description of the encoding.",
            },
            {
              kind: "mcq",
              prompt: "Why are only geohash lengths 4 to 6 interesting for this problem?",
              options: [
                "Longer geohashes cannot be indexed",
                "Shorter cells exceed any search radius, and longer ones are smaller than a city block, needing many neighbours to cover a circle",
                "Base32 only encodes six characters reliably",
                "Precision beyond 6 is not supported by most databases",
              ],
              answer: 1,
              explanation:
                "Length 4 is 39 km across and length 6 is about 1.2 km, which brackets the 0.5 to 20 km radius options. You pick the shortest geohash whose cell covers the search circle.",
            },
            {
              kind: "predict",
              prompt:
                "A 2 km search uses length 5 (4.9 km cells) and the user is near a corner of their cell. Is the result correct?",
              options: [
                "Yes, since the cell is larger than the radius",
                "No, and the failure is silent: businesses in neighbouring cells are missing with no error",
                "No, and the query returns an error",
                "Yes, provided results are filtered to the true radius",
              ],
              answer: 1,
              explanation:
                "A circle around a corner extends into as many as three neighbours. A geohash query is never one cell: compute the eight neighbours arithmetically, query all nine, then filter to the true circle.",
            },
          ],
        },
        {
          slug: "sd-ps-boundaries",
          title: "Boundaries and thin results",
          summary:
            "Points 30 km apart with no shared prefix, why neighbour fetching fixes both boundary problems, and why expansion is free but one-sided.",
          contentFile: "sd-ps-boundaries.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "La Roche-Chalais is `u000` and Pomerol is `ezzz`, 30 km apart. What does this show?",
              options: [
                "Geohash precision was chosen incorrectly",
                "A long shared prefix means closeness, but the converse is false: close points can share nothing",
                "The geohashes were computed with different algorithms",
                "Base32 encoding loses precision at that latitude",
              ],
              answer: 1,
              explanation:
                "They fall on opposite sides of the very first division. A prefix query is therefore not slow but wrong, omitting results without any error, which is the failure mode that survives testing.",
            },
            {
              kind: "mcq",
              prompt:
                "Why is dropping the last geohash character an elegant way to widen a search?",
              options: [
                "It halves the number of cells to query",
                "Widening is a string operation, needing no new index or coordinate arithmetic",
                "It preserves the neighbour relationships exactly",
                "It reduces the result set",
              ],
              answer: 1,
              explanation:
                "The cell becomes 32 times larger, covering the original and its siblings. The prefix property that made the search possible also makes the expansion free. Bound it, though: a restaurant 200 km away is not nearby.",
            },
            {
              kind: "predict",
              prompt:
                "Expansion fires when results are too few. One Manhattan cell holds 40,000 businesses. What is the flaw?",
              options: [
                "Expansion should fire on density too, but there is no rule for too many",
                "The cell should be split automatically",
                "Neighbour fetching makes it worse",
                "Nothing: sorting 40,000 rows by distance is fast",
              ],
              answer: 0,
              explanation:
                "Precision chosen from radius alone ignores density, which varies by orders of magnitude. Go the other way when a cell is too dense: use a longer geohash. That density sensitivity is what a quadtree removes by construction.",
            },
          ],
        },
      ],
    },
    {
      slug: "building-and-serving",
      title: "Building and serving",
      description: "An index in memory, and the service around it.",
      lessons: [
        {
          slug: "sd-ps-quadtree",
          title: "Quadtree",
          summary:
            "Subdividing by density rather than by area, why it lives in memory rather than the database, and what the build time costs you.",
          contentFile: "sd-ps-quadtree.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does subdividing until a node holds under 100 businesses achieve?",
              options: [
                "A balanced tree with uniform depth",
                "Leaves hold roughly equal counts, so the tree is deep where the data is and shallow where it is not",
                "Constant-time neighbour lookup",
                "A fixed memory footprint per region",
              ],
              answer: 1,
              explanation:
                "That is the property the even grid and geohash both lacked. A search walks down to a leaf, so the cost is logarithmic in density rather than in total data.",
            },
            {
              kind: "mcq",
              prompt: "Roughly what memory does a quadtree over 200 million businesses need?",
              options: [
                "A few hundred MB",
                "A few GB, which is why it fits in one server's memory",
                "A few hundred GB, requiring sharding",
                "A few TB, so it must stay on disk",
              ],
              answer: 1,
              explanation:
                "At most 100 ids per leaf and 832 bytes per leaf, 2 million leaves is about 1.7 GB plus internal nodes. The whole design rests on that number being gigabytes rather than terabytes, which is the estimation section earning its place.",
            },
            {
              kind: "predict",
              prompt:
                "Servers build the tree at startup. You roll a deploy across 50 servers. What is the risk?",
              options: [
                "The tree may be built inconsistently across servers",
                "Capacity drops while servers build, and 50 simultaneous full table scans can saturate the database the LBS was designed never to touch",
                "The deploy will fail readiness checks",
                "Memory fragmentation on rebuild",
              ],
              answer: 1,
              explanation:
                "Gate on a readiness check that passes when the tree is built, not when the process starts, and deploy within your headroom. Better still, serialize the tree once and have servers load a snapshot, which also stops 50 servers holding 50 slightly different views.",
            },
          ],
        },
        {
          slug: "sd-ps-serving",
          title: "Serving it",
          summary:
            "Two services with different ratios, the one design where replication lag is already accepted, and keying a cache on the canonical query.",
          contentFile: "sd-ps-serving.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is replication lag harmless in this design specifically?",
              options: [
                "Reads go to the primary",
                "Business data is already allowed to be a day stale, so 50 ms of lag is far inside the tolerance",
                "The LBS does not read from the database",
                "Writes are applied synchronously",
              ],
              answer: 1,
              explanation:
                'The one design in the course where the answer to "what about replication lag?" is that the requirements already accepted it. Saying so beats describing mitigations you do not need.',
            },
            {
              kind: "mcq",
              prompt: "What should be validated before an index build is served?",
              options: [
                "Nothing, since the build is deterministic",
                "Record count and known queries, with the previous snapshot kept so rollback is a restart",
                "Only that the file parses",
                "Latency against the previous build",
              ],
              answer: 1,
              explanation:
                "If every LBS server loads a bad index, every server is wrong at once. The build pipeline is part of the design rather than an implementation detail.",
            },
            {
              kind: "predict",
              prompt:
                "The cache is keyed on exact latitude, longitude and radius, and the hit rate is near zero. What is the fix?",
              options: [
                "Round coordinates to three decimal places",
                "Key on the geohash cell at the chosen precision plus the radius, so everyone in the cell shares an entry",
                "Increase the cache size",
                "Cache the business detail pages instead",
              ],
              answer: 1,
              explanation:
                "GPS coordinates differ for two people standing together, so the cache stores a million keys for a handful of answers. A cache key should be the canonical form the system reduces the input to, and that reduction was already computed.",
            },
          ],
        },
      ],
    },
  ],
}
