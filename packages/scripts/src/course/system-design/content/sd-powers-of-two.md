Every capacity estimate ends in bytes, and bytes are counted in powers of two. Getting the units wrong by a factor of 1000 is the most common way an otherwise sound estimate produces an absurd answer, so this is the table to know cold.

## The table

A byte is 8 bits. One ASCII character is one byte. From there:

| Power | Approximate value | Full name  | Short |
| ----- | ----------------- | ---------- | ----- |
| 2^10  | 1 thousand        | 1 kilobyte | 1 KB  |
| 2^20  | 1 million         | 1 megabyte | 1 MB  |
| 2^30  | 1 billion         | 1 gigabyte | 1 GB  |
| 2^40  | 1 trillion        | 1 terabyte | 1 TB  |
| 2^50  | 1 quadrillion     | 1 petabyte | 1 PB  |

The exact values are 1024, 1,048,576 and so on, and in an estimate you should use 1000, 1 million, 1 billion. The 2.4% error at each step is far smaller than the error in your assumption about how many users post per day, so carrying it costs you accuracy you never had and buys you arithmetic you cannot do in your head.

What matters is that each step up is three zeros. KB, MB, GB, TB, PB. Counting the steps is the skill; the precision is not.

## Sizes worth carrying

An estimate needs a size for the thing being stored, and you will rarely be given one. These are the reference points to reason from:

- A UUID or a 64-bit id: **8 to 16 bytes**
- A timestamp: **8 bytes**
- A tweet-length piece of text: **140 to 300 bytes**
- A row of user metadata with a handful of fields: **about 1 KB**
- A compressed photo: **about 1 MB**
- A minute of standard-definition video: **about 5 MB**

You are not being tested on whether a photo is 0.8 MB or 1.3 MB. You are being tested on whether you know it is megabytes rather than kilobytes or gigabytes, because that is the judgment that changes the answer by three orders of magnitude and therefore changes the design.

## Where the order of magnitude changes the design

This is the point of the exercise, and it is worth making concrete.

Say you are storing metadata for 100 million objects. At 100 bytes each that is 10 GB, which fits in memory on one machine, so the entire design can be "keep it in memory, back it with one database". At 10 KB each it is 1 TB, which does not fit in memory and does not fit comfortably on one machine, so now you need sharding, a cache tier, and a story about which subset is hot.

Same object count. One assumption about row size, off by two orders of magnitude, and you have designed a completely different system. That is why estimation comes before architecture rather than after it, and why an interviewer asks for it: not to check your arithmetic, but to see whether the design you then propose is the one your own numbers call for.

## Predict, then verify

A system stores 1 billion rows of 1 KB each. Does it fit on one machine?

Answer: 1 billion times 1 KB is 1 TB, and the honest answer is that it depends on what "fit" means, which is the real lesson. It fits on one disk easily; you can rent a 4 TB volume without thinking about it. It does not fit in memory on any ordinary machine, so if the access pattern is random reads across the whole billion, almost every read is a disk seek at around 10 ms, and at any real request rate the disk is the bottleneck long before the storage is. So the storage question answers itself and the useful question is different: what fraction is hot? If 1% is hot, that is 10 GB, which fits in RAM comfortably, and one machine with a cache serves it well. If reads are uniform across all 1 TB, no cache helps and you are sharding. "Does it fit" is nearly always really "does the working set fit", and that is the number to estimate.
