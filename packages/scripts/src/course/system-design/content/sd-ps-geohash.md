Geohash turns a latitude and longitude into a short string, with the property that strings sharing a prefix are near each other. That single property turns proximity search into a prefix match.

## How it works

Start with the whole world and cut it in four along the equator and prime meridian:

- Longitude in `[-180, 0]` gives bit `0`, in `[0, 180]` gives bit `1`
- Latitude in `[-90, 0]` gives bit `0`, in `[0, 90]` gives bit `1`

Two bits name a quadrant. Now cut that quadrant in four the same way, appending two more bits, alternating longitude and latitude. Repeat until the cells are as small as you want.

Each added pair of bits quarters the area. The resulting bit string is written in base32 for compactness:

```text
Google headquarters: 1001 10110 01001 10000 11011 11010  ->  9q9hvu
Facebook headquarters: 1001 10110 01001 10001 10000 10111  ->  9q9jhr
```

Both start `9q9`, which says they are in the same region, and they diverge at the fourth character.

## Precision

Each character narrows the cell:

| Length | Cell size           |
| ------ | ------------------- |
| 1      | 5,009 km x 4,992 km |
| 2      | 1,252 km x 624 km   |
| 3      | 156 km x 156 km     |
| 4      | 39.1 km x 19.5 km   |
| 5      | 4.9 km x 4.9 km     |
| 6      | 1.2 km x 609 m      |
| 7      | 153 m x 152 m       |
| 8      | 38 m x 19 m         |

Only lengths 4 to 6 are interesting here. Shorter cells are bigger than any search radius; longer ones are smaller than a city block, so you would need a great many neighbors to cover a circle.

Pick the shortest geohash whose cell covers the search circle:

| Radius | Length |
| ------ | ------ |
| 0.5 km | 6      |
| 1 km   | 5      |
| 2 km   | 5      |
| 5 km   | 4      |
| 20 km  | 4      |

## The query

With a geohash column indexed, a search becomes a prefix match:

```sql
SELECT business_id FROM geohash_index WHERE geohash LIKE '9q8zn%'
```

That is an ordinary B-tree range scan, because a prefix match on a string is a range between two bounds. The work is proportional to the number of businesses in the cell rather than to the size of the table, which is exactly what the two-dimensional query could not achieve.

Two dimensions became one, and an index that could not help now can. That is the whole idea, and it is worth stating in those terms rather than as a description of the encoding.

## The table

```sql
CREATE TABLE geohash_index (
  geohash     VARCHAR(12) NOT NULL,
  business_id BIGINT NOT NULL,
  PRIMARY KEY (geohash, business_id)
);
```

Separate from the business table, which holds addresses and details. The index table is read by the search path and the business table by the detail page, and keeping them apart lets each be optimized and scaled for its own query.

## Predict, then verify

A user searches with a 2 km radius, so you use length 5, whose cells are 4.9 km on a side. Their location falls near a corner of its cell. Is the result correct?

Answer: no, and it is wrong in the direction that is hardest to notice, because it returns plausible results with businesses silently missing. The cell contains the user, but a 2 km circle around a point near a corner extends well outside it, into as many as three neighboring cells, and businesses there are simply absent from the prefix match. The user sees a list of nearby restaurants, none of the results are wrong, and there is no error, so nobody reports it. The fix is that a geohash query is never one cell: you compute the eight neighbors as well and query all nine, which is cheap because neighbor geohashes are derived arithmetically rather than looked up. Then you filter the combined results to the true circle, since the nine cells cover a square area larger than the circle. This is the first of the boundary problems, and the next lesson has a worse one.
