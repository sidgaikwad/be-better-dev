Final project. The target is the newsletter delivery worker you have carried since "The naive implementation": dequeue batches from the issue delivery queue, render each subscriber's email, send through the provider, record the idempotency row. The harness: deliver one issue to 50,000 subscribers against a wiremock provider with 5 ms simulated latency, send concurrency 16 from the backpressure lesson, five runs per configuration, medians reported. One dev machine, so the absolute numbers are illustrative; the method is the deliverable.

The method, stated once and followed to the letter:

1. Measure, and write the numbers down.
2. Form one hypothesis from the measurement.
3. Change one thing.
4. Re-measure with the same harness.
5. Keep or revert. Repeat.

## Baseline

```text
wall time         26.4 s   (25.9 .. 27.2 over 5 runs)
CPU time (user)   29.8 s
send_email span   p50 5.8 ms      (tracing, telemetry section)
render_email      481 µs/email    (criterion)
allocations       38/email, 190 KB  (dhat)
```

First instinct check: is this CPU-bound or wait-bound? 29.8 CPU-seconds inside 26.4 wall-seconds on eight cores means the CPUs are mostly idle; the worker is mostly waiting, exactly what the flamegraphs lesson predicts for an IO service. But the flamegraph of the on-CPU part has one wide tower: 61% of samples under `render_email`, plateauing inside the markdown parser.

Hypothesis 1: we re-render the entire issue markdown for every subscriber, though only the unsubscribe link differs per email.

Change one thing: render the issue to HTML once per batch, then splice each subscriber's unsubscribe URL into the pre-rendered body. Re-measure:

```text
render_email   481 µs  ->  11.3 µs/email     (42x, criterion)
allocations    38      ->  4/email           (dhat)
CPU time       29.8 s  ->  6.1 s
wall time      26.4 s  ->  20.3 s            (-23%)
```

Keep. And read the asymmetry honestly: a 42x kernel win bought 23% of wall time, because 50,000 sends at 5.8 ms across 16 permits put a floor of about 18 seconds under the whole run. We removed most of the CPU that was competing with waiting; the waiting remains. That dial belongs to the concurrency capstone and the provider's rate limits, not to this section.

Hypothesis 2: with 16 tasks allocating concurrently, the allocator contends; mimalloc should help. Change one thing: swap the global allocator.

```text
wall time   20.3 s -> 20.1 s   (p = 0.31)
CPU time    6.1 s  -> 5.9 s
```

No detected change; the p-value says noise. A month ago this swap would have been a real win, because the render loop made 1.9 million allocations. Change 1 already deleted them, and the fix you land first changes which fixes remain worth landing. Revert: an unmeasurable improvement is not worth a dependency.

Hypothesis 3: cross-crate inlining is on the table since the hot path now leans on dependency code. `lto = "thin"`: CPU 5.9 s to 5.6 s, wall unchanged, link time +9 s. Keep, cheaply. `lto = "fat"`: wall +0.1% with the interval straddling zero, link time 38 s to 3 m 40 s. Revert, per the build-knobs price list.

Endstate: 26.4 s to 20.1 s wall, 29.8 to 5.6 CPU-seconds, 4 allocations per email with the dhat budget asserted in CI so the regression cannot sneak back, and a worker that now spends its time on the only thing it genuinely must wait for.

## Closing the loop

This course opened with "Stack and heap, for real" and "What an allocation costs": what memory is, and what one line touching it does. Everything since has been that question at larger scale. Iterators, monomorphization, and cache locality: what abstraction costs after the compiler is done. Async and epoll: what waiting is and who does it. The Zero to Production service: what those answers look like carrying real traffic, with telemetry to see it and idempotency to survive it. This section added the last piece: instruments, so "what does this cost" gets answered with a measurement instead of a mood.

The 42x fix above was one hoisted function call, visible only because a profiler pointed at it. That is the whole trade: Rust gives you control over costs, and control is only worth something when you can see. You can now read the asm, count the allocations, and time the change. Ship things.

## Predict, then verify

Same worker, but the provider's simulated latency drops from 5 ms to 0.1 ms. Which baseline change now matters most, and does the mimalloc verdict stand?

Answer: the render hoist goes from nice to decisive. At 0.1 ms latency the wait floor collapses to well under a second, the worker becomes CPU-bound, and 24 seconds of per-subscriber rendering would dominate wall time outright. The mimalloc revert would deserve a re-run too: verdicts are attached to workloads, not to crates, which is why the method ends with "re-measure" and not "remember".
