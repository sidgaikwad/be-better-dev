Geohash divides the world by a fixed rule and leaves you tuning precision against density. A quadtree divides by the data itself, so every leaf holds about the same number of businesses regardless of where it is.

## Building it

Start with one node covering the world and 200 million businesses. If a node holds more than some threshold, say 100, subdivide it into four quadrants and recurse.

```text
buildQuadtree(node):
  if countBusinesses(node) > 100:
    node.subdivide()
    for child in node.children:
      buildQuadtree(child)
```

Dense areas subdivide many times and end up with tiny leaves; oceans stop after one or two levels with one enormous leaf. The tree is deep where the data is and shallow where it is not, which is the property the even grid and geohash both lacked.

A search walks down to the leaf containing the point, and takes its businesses plus neighboring leaves as needed. The walk is proportional to depth, which is logarithmic in density rather than in total data.

## It is in memory, not in the database

This is the part that surprises people and the part worth stating clearly: a quadtree is an in-memory data structure built on each LBS server at startup, not a storage engine.

Each server loads the businesses, builds its own copy of the tree, and answers queries from memory. There is no database round trip on the search path at all.

That is only affordable because of the numbers. Sizing a leaf:

```text
4 coordinates × 8 bytes           = 32 bytes
100 business ids × 8 bytes        = 800 bytes
                                    832 bytes per leaf
```

And an internal node:

```text
4 coordinates × 8 bytes           = 32 bytes
4 child pointers × 8 bytes        = 32 bytes
                                    64 bytes
```

With 200 million businesses at up to 100 per leaf, that is at least 2 million leaves, so roughly 1.7 GB of leaves plus internal nodes. A few GB, which fits comfortably in one server's memory. This is the estimation section earning its place: the whole design rests on that number being gigabytes rather than terabytes.

## What it costs

**Startup time.** A server joining the pool has to build the tree before it can serve. For 200 million businesses that is minutes, so deployments and autoscaling are slower, and a server must not receive traffic until it is ready. This is exactly the readiness-check distinction from the load balancer lesson.

**Staleness.** The tree is a snapshot from startup. New businesses do not appear until servers rebuild, which is precisely why "effective next day" in the requirements mattered: it makes a daily rebuild acceptable.

**Updates are awkward.** Adding a business to a live tree can overflow a leaf and require subdivision, which is a structural change under concurrent reads. Most implementations do not bother and rebuild instead.

## Choosing

Quadtree when density varies wildly and you can afford an in-memory index rebuilt periodically, which is the case here. Geohash when you want the index in the database, updated continuously, and queried by ordinary SQL, which is simpler to operate and what Redis and PostGIS give you off the shelf.

Say both and pick one. The interviewer is checking whether you know that the adaptive structure costs you build time and update flexibility, not whether you can name it.

## Predict, then verify

Servers build the quadtree at startup, and you deploy a new version to 50 servers. What is the risk, and what would you change?

Answer: a rolling deploy replaces servers faster than they can build, so capacity drops below what traffic needs and the remaining servers are overwhelmed. Each new server spends minutes unable to serve while the ones it replaced are already gone, and since every server is doing identical work, you are also loading the entire business table 50 times in a short window, which can saturate the database the LBS was designed never to touch. Two changes. Deploy slowly enough that the fleet never loses more capacity than it has headroom for, gated on a readiness check that passes only when the tree is built, not when the process starts. And stop having every server build its own: serialize the tree once, store the snapshot, and have servers load it, which turns minutes of CPU plus a full table scan into a download. That also makes the fleet consistent, since 50 servers building independently at different moments can otherwise hold 50 slightly different views of the world.
