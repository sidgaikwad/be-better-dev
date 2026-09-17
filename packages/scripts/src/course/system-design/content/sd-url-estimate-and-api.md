Give a long URL, get a short one. Click the short one, land on the long one. The product is two sentences, which is what makes it a good first design: there is nowhere to hide behind features, and the entire difficulty is in the numbers.

## Scope

Worth pinning down before anything else:

- 100 million URLs created per day
- Short URLs use `[0-9, a-z, A-Z]`
- As short as possible
- No deletion or updating, for simplicity
- Run for 10 years

That last one looks like a throwaway detail. It is the constraint that decides the length of the short code, which is the most visible property of the product.

## The estimate

Writes:

```text
100 million / 24 / 3600 = ~1,160 per second
```

Reads, assuming 10 reads per write, which is conservative for a link shortener:

```text
1,160 × 10 = ~11,600 per second
```

Records over ten years:

```text
100 million × 365 × 10 = 365 billion
```

Storage, at about 100 bytes per URL:

```text
365 billion × 100 bytes = ~36.5 TB
```

Four numbers, and each one drives a decision. 1,160 writes per second is comfortable for one database. 11,600 reads per second is not, and points at a cache. 365 billion records does not fit on one machine, so the data tier is sharded. And 365 billion is the number that sizes the short code.

## The API

Two endpoints:

```text
POST /api/v1/data/shorten
  body: { longUrl: "https://example.com/very/long/path" }
  returns: { shortUrl: "https://tinyurl.com/zn9edcu" }

GET /api/v1/{shortUrl}
  returns: an HTTP redirect to the long URL
```

The second is not a normal API call. It is what a browser does when someone clicks a link, so the response is a redirect rather than JSON. That single fact shapes the next lesson, because which redirect you choose determines whether you see the traffic at all.

## Read-heavy by construction

Note the asymmetry. A URL is created once and clicked many times, so the system is 10:1 read-heavy at the conservative estimate and far worse in practice for anything popular.

That points at a design before you have drawn anything: the write path can be simple and even slow, while the read path has to be fast and cached. It also makes the data a good fit for a key-value store, which is the worked example from the relational-or-not lesson, for the same reasons: get by key, no joins, and a row count heading somewhere a single machine will not hold.

## Predict, then verify

The interviewer says the service must run for 100 years rather than 10. What changes?

Answer: the record count goes to 3.65 trillion, which changes the code length and almost nothing else. Seven base-62 characters give 3.5 trillion combinations, which is just short, so you would need eight, giving 218 trillion. That is the entire architectural consequence: one more character in the URL. Storage goes to 365 TB, which is ten times more and still just a sharding parameter rather than a new design. What the question is really testing is whether you notice that the retention period and the code length are the same decision, and whether you can say so without redoing the work. The follow-up worth volunteering is that nobody should commit to a hundred years of a fixed code length: the design should be able to grow the code by a character later, which works cleanly here because old seven-character codes stay valid while new ones get eight.
