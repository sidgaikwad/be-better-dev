1.4 TB a day of raw points, and 85% of queries ask about the last 26 hours. Those two facts drive every storage decision.

## Compression

Metric data compresses extremely well because it is repetitive by nature, and time-series databases build this in rather than leaving it to you.

**Delta encoding on timestamps.** Points arrive at regular intervals, so consecutive timestamps differ by a nearly constant amount:

```text
raw:    1610087371, 1610087381, 1610087391, 1610087400, 1610087411
deltas: 1610087371, 10, 10, 9, 11
```

The first is a full 32-bit timestamp; each delta fits in about 4 bits. That is an eightfold saving on the timestamp half of every point.

**Double-delta** goes further: the deltas themselves are nearly identical, so store the difference between consecutive deltas, which is usually zero.

Values compress the same way. CPU load at consecutive timestamps is nearly the same number, so the difference is small and encodes in few bits.

## Downsampling

Compression shrinks each point. Downsampling reduces how many points exist, and it is what makes a year of retention affordable.

```text
7 days   raw resolution
30 days  1-minute resolution
1 year   1-hour resolution
```

Rolling up 10-second data to 30-second data means aggregating three points into one:

```text
19:00:00  10        19:00:00  avg of 10, 16, 20  = 15.3
19:00:10  16   ->   19:00:30  avg of 30, 20, 30  = 26.7
19:00:20  20
19:00:30  30
19:00:40  20
19:00:50  30
```

The saving is proportional to the ratio. Going from 10-second to 1-hour resolution is 360 points becoming 1.

What you lose is the spike. A 5-second CPU spike to 100% is visible in raw data and averaged into invisibility at 1-hour resolution, and it is gone permanently, since downsampling discards the originals.

The mitigation is to store more than one aggregate per rolled-up bucket. Keep min, max, average and count rather than just average, and the spike survives as the max while the storage cost is four numbers instead of 360. That is worth proposing, because "downsample to the average" is the obvious answer and it silently destroys the thing you monitor for.

## The database

The 26-hour figure means a store that treats recent data differently, keeping it in memory or on fast storage while older data is compressed and pushed to cheaper media. Facebook's Gorilla was built on exactly this observation, and InfluxDB's storage engine makes the same assumption.

Do not build one. Naming a time-series database and explaining why its properties fit is the right depth; designing a storage engine is the wrong problem for the hour you have.

## Predict, then verify

You downsample to 1-minute after 7 days. An incident happened 10 days ago and you need to know whether latency spiked for a few seconds. Can you?

Answer: no, and this is the failure people discover during a post-incident review rather than when setting the policy. The raw data is gone, so a 3-second spike is averaged across a minute, and if the rest of that minute was normal, a spike to 5 seconds becomes an average of maybe 350 ms, which looks like mild elevation rather than an outage. The investigation reaches the wrong conclusion from data that is not wrong, just too coarse. Two mitigations, and they are complementary. Keep max alongside average when rolling up, which preserves the existence and size of the spike even after the shape is lost. And set the raw window from how long incidents take to investigate, not from storage cost: if reviews routinely happen a week later, seven days of raw data is exactly one day too few. The general lesson is that a retention policy is a decision about which questions you will be able to answer later, and it is usually set by whoever is optimizing storage rather than by whoever will be asking.
