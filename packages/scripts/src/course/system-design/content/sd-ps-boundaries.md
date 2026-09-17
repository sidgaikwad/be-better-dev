Geohash guarantees one direction only: a long shared prefix means two points are close. The converse is false, and every practical problem with geohash comes from that asymmetry.

## Close points with no shared prefix

Two locations either side of the equator or the prime meridian fall in different halves of the very first division, so they differ in the first bit and share nothing.

The standard example is in France. La Roche-Chalais has geohash `u000`. Pomerol has `ezzz`. They are 30 km apart and share not one character.

So this query is wrong:

```sql
SELECT * FROM geohash_index WHERE geohash LIKE '9q8zn%'
```

Not slow. Wrong, in a way that returns results and omits others, which is the failure mode that survives testing.

## Long shared prefix, different cells

The second problem is the one from the previous lesson. Two points a few metres apart can sit on opposite sides of a cell boundary, sharing a long prefix and differing in the final character.

Both problems have the same cause: cell boundaries are arbitrary lines in the encoding, and physical closeness does not respect them.

## The fix

Query the cell and all eight neighbors. Neighbor geohashes are computed in constant time from the geohash itself rather than looked up, so this is nine prefix matches instead of one, with no extra round trips if batched.

Nine cells cover a 3x3 square around the user, which for a well-chosen precision comfortably contains the search circle. Then filter the results to the actual radius, because a square is not a circle and the corners are outside it.

This also handles the prime meridian case, since a point just west of the meridian is a neighbor of one just east, and neighbor computation crosses the boundary correctly even though prefix matching does not.

## Not enough results

The bonus question: the nine cells hold only three restaurants and the user wants twenty.

**Option 1: return what you have.** Easy, and it fails the user in the case where the feature matters most, which is being somewhere sparse.

**Option 2: widen the search.** Drop the last character of the geohash. The cell becomes 32 times larger, covering the original and its siblings, and you query again. Repeat until you have enough.

Option 2, and the reason it is elegant is that widening is a string operation. `9q8zn` becomes `9q8z`, and no new index or coordinate arithmetic is involved. The prefix property that made the search possible also makes the expansion free.

Bound the expansion, though. Two or three drops and you are searching a region hundreds of kilometres across, and a restaurant 200 km away is not a nearby restaurant. At some point the correct answer is that there is nothing near you.

## Predict, then verify

You query nine cells at length 5 and expand by dropping a character when results are thin. In central Manhattan, one cell holds 40,000 businesses. What happens, and how does that interact with the expansion rule?

Answer: the query returns 40,000 rows and you sort them by distance to take the nearest twenty, which is slow in exactly the place the product is used most. The expansion rule makes it worse in a subtle way: it only ever fires when results are too few, so it never helps here, and the system has no matching rule for too many. That asymmetry is the flaw, and the fix mirrors the expansion: when a cell is too dense, go the other way and use a longer geohash, searching a smaller cell with its neighbors. Choosing the precision from the radius alone is what causes this, because the right precision depends on density as well, and density varies by orders of magnitude between Manhattan and a rural county. A system can either measure density per region and store a precision per area, or start at a fine precision and expand, which costs an extra round trip in sparse areas and is fast where the users are. That density sensitivity is precisely what a quadtree removes by construction, which is the next lesson.
