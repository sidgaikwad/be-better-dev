Here is the whole method, worked end to end. The task: estimate the queries per second and the storage a Twitter-like service needs. These numbers are made up for the exercise.

## The assumptions

Write them down before calculating anything. They are what makes the answer checkable, and they are what you change when the interviewer says "now assume ten times the users".

- 300 million monthly active users
- 50% of them use the service daily
- Each posts 2 tweets per day on average
- 10% of tweets contain media
- Data is stored for 5 years

## Queries per second

Start with daily active users, since a monthly figure tells you nothing about load:

```text
DAU = 300 million × 50% = 150 million
```

Then convert posts per day into posts per second. There are 86,400 seconds in a day, which for estimation is 24 × 3600:

```text
tweets per day = 150 million × 2 = 300 million
tweets per second = 300 million / 86,400 = ~3,500
```

So roughly 3,500 writes per second. Now peak. Traffic is not flat across the day: people are awake in bursts and asleep in unison. Doubling the average is the standard rule of thumb:

```text
peak QPS = 2 × 3,500 = ~7,000
```

Peak is the number that sizes your system, because a system provisioned for the average is down every evening.

## Storage

Size one record, then multiply. A tweet is:

- `tweet_id`: 64 bytes
- text: 140 bytes
- media: 1 MB, when present

The text is negligible: 300 million tweets at 204 bytes is about 60 GB a day, which is real but small next to the media. So estimate the media, and say out loud that you are ignoring the text because it is two orders of magnitude smaller. That is not sloppiness, it is knowing which term dominates.

```text
media per day = 150 million users × 2 tweets × 10% × 1 MB = 30 TB per day
five years = 30 TB × 365 × 5 = ~55 PB
```

## Reading the answer

Do not stop at 55 PB. The number exists to tell you something about the design, and here it says three things.

30 TB per day of ingest is roughly 350 MB per second sustained, which no single machine absorbs. Media storage is distributed from day one.

55 PB will not sit on machines you administer as a database. It is object storage, and the database holds references to it. The question "SQL or NoSQL for tweets" turns out to be about the 60 GB a day of text, not about the petabytes.

And 55 PB of storage that is almost never read is expensive in a way you can fix. A tweet from four years ago gets approximately no traffic, so tiering old media to colder, cheaper storage is not an optimization, it is most of the storage bill. The estimate found that for you.

## Predict, then verify

The read-to-write ratio is unstated. Someone assumes 100:1 and derives 700,000 peak read QPS. Is that a problem?

Answer: the arithmetic is right and the number is enormous, which is exactly what makes it useful. 700,000 reads per second against a database is not a design, it is a refutation of one, and it tells you the serving path cannot be a database at all. It has to be a cache tier and a CDN with a hit rate high enough to reduce the database to the misses: at 99%, 7,000 reads per second reach the database, which is a system you can build. So the ratio did not derail the estimate, it produced the single most design-relevant number in the exercise. This is the point of estimating before designing. An unstated assumption is worth stating and carrying, because the number it produces either confirms your design or tells you to throw it out, and both outcomes are worth the two minutes.
