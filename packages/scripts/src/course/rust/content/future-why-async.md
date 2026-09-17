The newsletter service's delivery worker has one job: for each subscriber, make an HTTP request to the email provider and record the outcome. Here is where the wall-clock time of one send goes:

```
build the request         ~40 µs    CPU
write it to the socket    ~10 µs    CPU
wait for the provider     ~300 ms   nothing
read and parse response   ~50 µs    CPU
```

The numbers are illustrative; the shape is universal. About a hundred microseconds of computation wrapped around three hundred milliseconds of waiting: the thread spends 99.9% of the request blocked in `read`, asleep in the kernel until response bytes arrive. Asleep, it burns no CPU, but it keeps everything it owns: its stack, its kernel bookkeeping, its slot in the scheduler's ledger.

## Ten thousand threads

The straightforward architecture is thread-per-connection: every in-flight send gets its own thread, blocking calls everywhere, code that reads top to bottom. At ten concurrent sends it is a fine design. At ten thousand, arithmetic takes over.

Each Rust thread reserves 2 MiB of stack by default, so 10,000 threads reserve about 20 GiB. That is virtual address space (from Stack and heap, for real: a process sees virtual addresses), and only the pages a thread actually touches become physical memory, but hundreds of real MiB plus a kernel task structure per thread is routine. The scheduler, meanwhile, is juggling 10,000 threads that each wake for a tenth of a millisecond, sleep for hundreds, and shed their cache state at every context switch, each switch costing on the order of a microsecond.

This wall has a name: the C10K problem, coined in 1999, when ten thousand concurrent connections per machine was the visibly absurd target. The diagnosis matters more than the number. The machine is not out of CPU; the total compute in 10,000 slow requests fits comfortably on a core or two. What fails is spending an entire thread to represent each wait.

## A server is a waiting machine

Look again at what a web server does all day. It computes briefly and rarely. Mostly it tracks pending waits: is this socket readable yet, has the database replied, has that retry timer fired, and it runs a short burst of code whenever one resolves. The scarce resource is not compute. It is how cheaply you can represent one paused piece of work.

A thread is one representation: megabytes reserved, kernel-scheduled, preemptible at any instruction. Async is the other: represent paused work as a plain value, a struct holding exactly what resumption needs, and let a few threads drive many thousands of such values, touching only the ones that can make progress right now.

If you came from TypeScript, you have already run this model for years: Node drives every pending fetch and timer from one event-loop thread, and `await` marks the pause points. Rust's version differs in one deep way. There is no runtime built into the language and no garbage collector keeping paused work alive, so a paused computation must be an honest value with a size, an owner, and a Drop: Part 1 machinery, about to do real work. The rest of this section builds it from the ground up: the Future trait, the state machine an async fn compiles to, the waker protocol, and a working executor in about forty lines of std.

## Predict, then verify

Suppose you keep the blocking design and run 10,000 in-flight sends as 10,000 threads. Which gives out first: CPU or memory?

Answer: usually neither, exactly, and that is the point. The CPU work totals about one second (10,000 × 100 µs) spread over each 300 ms window: a couple of cores, barely warm. Stacks reserve ~20 GiB virtually but touch far less physically. What degrades is the aggregate: tens of thousands of context switches per second, cache misses at each one, a kernel structure per thread, scheduler queues in constant churn. Throughput sags and latency jitters while no single gauge reads 100%, which is exactly the C10K observation, and why the fix was a cheaper representation of waiting rather than a bigger machine.
