Find every restaurant within 5 km of me. It sounds like a filter and it is the one query a normal database index cannot help with, because the index is one-dimensional and the question is two-dimensional.

## Scope

- Return businesses given a latitude, longitude and radius
- Radius options: 0.5, 1, 2, 5, 20 km
- Owners can add, update and delete, effective next day rather than in real time
- View details of a business
- 100 million daily active users, 200 million businesses

That "effective next day" is the most useful thing the interviewer says. It means the index can be rebuilt in batch rather than updated live, which removes the hardest problem before you start.

Non-functional: low latency, and data privacy. Location is sensitive and regulated under GDPR and CCPA, which is worth naming because it constrains what you log and retain.

## The estimate

```text
seconds per day = 86,400, round to 10^5
search QPS      = 100 million × 5 / 10^5 = 5,000
```

5,000 searches per second, against 200 million businesses, with almost no writes.

## The naive query

```sql
SELECT business_id, latitude, longitude
FROM business
WHERE latitude  BETWEEN :my_lat  - :radius AND :my_lat  + :radius
  AND longitude BETWEEN :my_long - :radius AND :my_long + :radius
```

A bounding box, and it scans the table.

## Why indexes do not rescue it

Index both columns and it is still slow, and the reason is worth understanding because it generalizes.

A B-tree index answers a range on one column efficiently. Here you have a range on each of two columns. The index on latitude returns everything in a band circling the globe at your latitude; the index on longitude returns everything in a band from pole to pole at your longitude. Both sets are enormous, and the answer is their intersection.

The database must materialize two huge sets and intersect them to find the small answer. Work is proportional to the bands, not to the result, and the result is a rounding error next to either band.

That is the general problem with multi-dimensional range queries on one-dimensional indexes, and it points straight at the fix: map two dimensions down to one, so that nearby points are nearby in the index, and a proximity search becomes a range scan.

## Two families

Every geospatial index does this, and they divide into:

- **Hash**: even grid, geohash, Cartesian tiers. Divide space by a fixed rule and name each cell.
- **Tree**: quadtree, Google S2, R-tree. Divide space recursively, adapting to where the data is.

Geohash, quadtree and S2 are the ones used in practice. You are not expected to implement one, and real systems use Redis geohash commands or Postgres with PostGIS. What you are expected to explain is why a plain index fails and what a geospatial index does differently, which is a better answer than naming a product.

## Predict, then verify

Before either, consider the simplest idea: divide the world into a fixed grid of equal-sized cells and index by cell. What goes wrong?

Answer: the data is nowhere near evenly distributed, so the cells are useless at both ends of the range. A cell covering midtown Manhattan holds tens of thousands of businesses, so finding the nearby ones still means scanning a huge list, which is the original problem at smaller scale. A cell covering ocean or desert holds nothing, so you have spent index space on emptiness. Businesses cluster in cities, and any fixed cell size is simultaneously too coarse where people are and too fine where they are not. What you want is the opposite: small cells in dense areas and large cells in sparse ones, so every cell holds roughly the same number of businesses rather than covering the same area. That requirement is exactly what a quadtree provides by construction, and what geohash approximates by letting you choose precision per query. A second problem worth noting: with a fixed grid, finding a cell's neighbors is fiddly, and you always need the neighbors, because a circle drawn around a point rarely sits inside one cell.
