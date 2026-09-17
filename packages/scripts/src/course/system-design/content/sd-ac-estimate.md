Autocomplete looks like a small feature and generates more requests than almost anything else you build, because it fires on every keystroke rather than on every search.

## Scope

- Match at the start of the query only, not in the middle
- Return 5 suggestions
- Ranked by historical query frequency
- No spell check, English only, lowercase
- 10 million daily active users

The response-time requirement is the one that shapes everything: results must arrive within about 100 ms. Slower than that and the suggestions lag behind typing, which reads as the interface stuttering. It is a harder constraint than it sounds, because it is measured from a keystroke rather than from a page load, and it has to hold at the 99th percentile rather than on average.

## The estimate

A typed query produces one request per character:

```text
search?q=d
search?q=di
search?q=din
search?q=dinn
search?q=dinne
search?q=dinner
```

Six requests to type one six-character word. So:

```text
queries per day     = 10 million × 10 = 100 million
characters typed    = 100 million × 20 = 2 billion requests per day
QPS                 = 2 billion / 86,400 = ~24,000
peak QPS            = ~48,000
```

24,000 requests per second for a feature that helps you type. That number is the design brief: it rules out touching a database on the request path, it rules out any per-request work that is not a lookup, and it is why the browser cache in the last lesson matters more than it sounds.

Storage is trivial by comparison. At 20 bytes per query with 20% of daily queries new:

```text
100 million × 20 bytes × 20% = 0.4 GB per day
```

The asymmetry is worth naming: enormous read rate, negligible data. That combination points at holding everything in memory, which is what the trie design assumes.

## The two services

The system splits cleanly:

- **Data gathering** takes what people search for and turns it into a ranked structure.
- **Query serving** takes a prefix and returns the top five.

They have opposite requirements. Gathering is a batch job that can take hours and runs occasionally. Serving must answer in under 100 ms at 48,000 per second. Separating them lets each be built for its own constraint, and it is the first thing to draw.

## The naive version

Keep a frequency table and query it:

```sql
SELECT query, frequency FROM frequency_table
WHERE query LIKE 'tw%'
ORDER BY frequency DESC
LIMIT 5;
```

Correct, and fine for a small dataset. At 48,000 QPS against billions of rows it is not a design, and the reason is worth stating precisely: a prefix scan with a sort is not a lookup, and the sort's cost grows with how many queries share the prefix. The single-character prefixes, which are the most frequently requested, are the ones with the most matches.

## Predict, then verify

Would an index on the `query` column make the naive design viable?

Answer: it fixes the wrong half. A B-tree index makes `LIKE 'tw%'` efficient, because a prefix match is a range scan and that is exactly what B-trees do well, so finding the matching rows is fast. What it cannot help is the sort: the index is ordered by query text, not by frequency, so the database must read every row matching the prefix and sort them by frequency to find the top five. For `tw` that might be thousands of rows; for `t` it is a substantial share of the entire table, on the request that is most common because every query starts with a single character. You could add a composite index, but the prefix is a range rather than an equality, so the index cannot then be ordered usefully by frequency within it. This is the general shape of the problem and the reason a trie with cached top-k per node exists: the work has to be done once at build time, not per request.
