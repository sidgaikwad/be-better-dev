The short code is the product. Two ways to produce it, and they differ in more than technique: one asks the database a question on every write, the other does not.

## How long

The alphabet is `[0-9, a-z, A-Z]`, which is 10 + 26 + 26 = 62 characters. Find the smallest `n` with `62^n` at least 365 billion:

```text
62^5 = 916 million        too small
62^6 = 56.8 billion       too small
62^7 = 3.5 trillion       enough
```

Seven characters, with roughly ten times the headroom over the ten-year estimate. Say the headroom out loud, because a design with 1.05 times what it needs is one bad assumption from running out.

## Hash and resolve collisions

Hash the long URL with something standard, MD5 or SHA-1 or CRC32, and take the first 7 characters.

Every one of those produces more than 7 characters, so truncation is required, and truncation reintroduces collisions the full hash did not have. Two different long URLs can map to the same 7 characters, and the second one would hijack the first one's link.

So every write has to check. Look up the candidate code; if taken, append a fixed string to the input, rehash, and try again until free.

The cost is a database read on the write path, on a table with 365 billion rows, before every insert. A Bloom filter in front helps: it answers "definitely not present" cheaply, and only a possible hit needs the real lookup. That reduces the reads without removing the fundamental shape, which is that you are guessing and checking.

The benefit is that the same long URL always produces the same code with no lookup by URL, so it deduplicates for free.

## Base 62 conversion

Give each URL a unique integer id, then write that id in base 62.

```text
0-9 map to 0-9
10-35 map to a-z
36-61 map to A-Z

11157 = 2 × 62² + 55 × 62¹ + 59 × 62⁰
      = [2, 55, 59]
      = "2TX"
```

No collisions, ever, because the ids are unique and base conversion is a bijection. No database check before writing. The code is as short as the id allows, so early URLs get short codes and they lengthen as ids grow.

The requirement it creates: unique ids, generated without coordination, at 1,160 per second. That is exactly the previous section, and snowflake is the answer.

## Choosing

Take base 62. Removing a database read from the write path matters at 365 billion rows, and "no collisions by construction" beats "collisions handled by retry" in a system that will run for a decade.

What you give up is deduplication, since the same long URL submitted twice gets two ids and two codes. That is fixable with a lookup by long URL when you want it, and it is worth asking whether you do: two people shortening the same article usually want separate links precisely so their analytics are separate.

The other cost is that ids are guessable, which is the enumeration problem from the unique ID section. Snowflake ids are not consecutive, which helps, and if codes must be unguessable the answer is a random id rather than a transformation of a sequential one.

## Predict, then verify

You pick base 62 over snowflake ids. A snowflake id is 64 bits, up to about 9.2 × 10^18. How many base-62 characters is that, and is it a problem?

Answer: about 11 characters, since `62^11` is roughly 5.2 × 10^19 and `62^10` is 8.4 × 10^17, which is too small. So the short URLs are 11 characters rather than the 7 the estimate justified, and for a product whose entire promise is shortness that is a real regression. The cause is that a snowflake id encodes a 41-bit timestamp counted from an epoch, so even the first id you ever issue is an enormous number. Two fixes: use a much more recent custom epoch and trim the sequence bits, which shrinks the ids but not below about 9 characters; or do not use snowflake here at all and take ids from a counter partitioned per machine, where the first id really is small. This is the useful general point, which is that "use the id generator from the last section" is not automatic. The id generator optimized for time-sortability, and this problem optimizes for the id being short, and those pull in opposite directions.
