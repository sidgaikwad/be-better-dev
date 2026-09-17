Every other system in this course measured latency in milliseconds. Here the target is tens of microseconds, and that difference is not a matter of tuning. It changes what the architecture is allowed to be.

## Where the budget goes

```text
latency = sum of execution time along the critical path
```

Two ways to reduce it: fewer tasks on the path, or less time per task.

The critical path is:

```text
gateway -> order manager -> sequencer -> matching engine
```

Only what is necessary. Even logging is off the critical path, which tells you how tight the budget is: most systems consider logging free, and here it is not.

## Why the conventional design cannot get there

Run those components on separate servers, as every other design in this course does, and:

- **Network**: a round trip is about 500 microseconds. Several hops add up to single-digit milliseconds.
- **Disk**: the sequencer persists events, and even sequential writes cost milliseconds.

Total, tens of milliseconds. Respectable in the 1990s and not competitive now.

The gap between tens of milliseconds and tens of microseconds is a factor of a thousand, which cannot be closed by making each step faster. It requires removing the steps, and the two steps are the network and the disk.

## Everything on one server

The time-tested answer: put every component on one machine. No network hops on the critical path, because there is no network.

Components communicate through **mmap**, a memory-mapped file, which serves as the event store. Writing to it is a memory write that the operating system persists in the background, so the sequencer gets durability without a synchronous disk wait.

That single decision reverses much of what this course has taught. Distributing components across machines is how everything else achieves scale and fault tolerance, and here it is what makes the target unachievable. Worth stating plainly, because the instinct to distribute is right almost everywhere and wrong here.

## Application loops

Each component is a process running an **application loop**: a `while` loop polling for work.

Polling rather than blocking, which is wasteful and deliberate. A blocked thread must be woken by the scheduler, and that wake-up costs microseconds and, worse, varies. Polling means the work is picked up the instant it appears, with predictable timing.

Each loop is single-threaded and **pinned to a CPU core**, which avoids two costs: the scheduler moving a thread between cores and invalidating its cache, and context switching between threads. One core, one thread, running one loop forever.

Only mission-critical work belongs in these loops. Everything else, logging, position reporting, aggregation, runs in separate processes reading the same mmap, off the path.

## The 99th percentile is the number

Average latency is not the target. Stability is, and it is measured at the 99th percentile.

An exchange whose average is 20 microseconds and whose 99th percentile is 5 milliseconds is a bad exchange, because participants build strategies against expected timing and an unpredictable outlier costs money. That is why garbage collection pauses, page faults and scheduler jitter are treated as correctness problems rather than performance ones: each produces a rare, large, unpredictable delay, which is exactly the thing being engineered away.

## Predict, then verify

Everything on one server removes the network. What has been given up, and how is it recovered?

Answer: fault tolerance and horizontal scale, both of which every previous design in this course treated as non-negotiable. One server is a single point of failure, and it cannot be scaled by adding machines. Both are recovered by moving the redundancy to a different axis. Fault tolerance comes from a hot standby server consuming the same inbound sequence and, because the engine is deterministic, holding identical state ready to take over, which is why determinism appears before performance in the design rather than after. Scale comes from partitioning by symbol rather than by component: Apple's order book runs on one server and Microsoft's on another, and since orders for different symbols never interact, the partitions are completely independent. That is the same insight as every other sharding decision in this course, applied to the one dimension where the data genuinely does not interact, and it is why an exchange can run hundreds of symbols on hundreds of single-threaded engines without any of them coordinating.
