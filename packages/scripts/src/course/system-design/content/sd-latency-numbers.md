Jeff Dean's latency numbers are the single most useful table in system design. Not because the values are current, they are from 2010 and hardware has moved, but because the ratios between them have barely changed, and the ratios are what you reason with.

## The table

| Operation                                        | Time   |
| ------------------------------------------------ | ------ |
| L1 cache reference                               | 0.5 ns |
| Branch mispredict                                | 5 ns   |
| L2 cache reference                               | 7 ns   |
| Mutex lock and unlock                            | 100 ns |
| Main memory reference                            | 100 ns |
| Compress 1 KB with a fast algorithm              | 10 µs  |
| Send 2 KB over a 1 Gbps network                  | 20 µs  |
| Read 1 MB sequentially from memory               | 250 µs |
| Round trip within the same data center           | 500 µs |
| Disk seek                                        | 10 ms  |
| Read 1 MB sequentially from the network          | 10 ms  |
| Read 1 MB sequentially from disk                 | 30 ms  |
| Send a packet California to Netherlands and back | 150 ms |

A nanosecond is 10^-9 seconds, a microsecond 10^-6, a millisecond 10^-3. Each unit is a thousand of the one below.

## What to actually take from it

Five conclusions, and they are the reason to memorize any of this:

**Memory is fast, disk is slow.** Reading 1 MB from memory is 250 µs, from disk 30 ms. That is roughly 120 times. Every cache in this course exists because of that ratio.

**Avoid disk seeks.** A seek is 10 ms and does no useful work, it just moves the head. Reading 1 MB sequentially costs 30 ms, so a seek is a third of the cost of reading a whole megabyte. This is why databases work so hard to lay data out sequentially, and why an index that turns 1,000 random reads into one sequential scan can win even though it reads more bytes.

**Compression is cheap, and networks are not.** Compressing 1 KB costs 10 µs. Sending 2 KB across the network costs 20 µs, and sending 1 MB costs 10 ms. Compressing before sending is almost always worth it, because you are spending microseconds of CPU to save milliseconds of network.

**Distance is the dominant cost.** Within a data center, a round trip is 500 µs. California to the Netherlands and back is 150 ms, which is 300 times more. No amount of server optimization touches that number, and it is why the CDN and the multi-region sections exist.

**Everything below a millisecond is free by comparison.** If a request involves a cross-country round trip at 150 ms, then a mutex at 100 ns is a billionth of your budget. Optimizing it is not a small win, it is no win. Find the biggest number in the path and work on that one.

## Using it in an estimate

The numbers are for building a latency budget. A page that makes 3 sequential service calls within a data center plus one database read that misses cache costs roughly `3 × 0.5 ms + 10 ms`, so about 11.5 ms of unavoidable waiting before your code has done anything. If your target is 100 ms, you have room. If the page makes 30 such calls, you have spent 15 ms on round trips alone and the design needs to change.

## Predict, then verify

Two designs for the same page. Design A makes 100 sequential calls within one data center. Design B makes 2 calls to a service on another continent. Which is slower?

Answer: design B, by an order of magnitude, and the surprise is how large the gap is. Design A costs 100 round trips at 500 µs, which is 50 ms. Design B costs 2 round trips at 150 ms, which is 300 ms. The design that looks profligate, a hundred calls, beats the design that looks frugal, two calls, because distance dominates count. This is the reasoning behind keeping chatty communication inside one data center and being ruthless about the number of cross-region hops: one hundred local calls is a performance problem you can fix by batching, while two transatlantic calls is a physics problem you can only fix by moving the data.
