The delivery worker takes 26 seconds to send an issue and you want it faster. Which function do you look at first? A benchmark cannot answer that: it measures functions you already suspect. A profiler tells you where the time actually went, and for CPU time the standard view is a flamegraph.

```toml
# Cargo.toml: keep symbols in release builds so stacks are readable
[profile.release]
debug = true
```

```bash
cargo install flamegraph
cargo flamegraph --bin worker    # perf on Linux, dtrace on macOS
```

This produces an interactive `flamegraph.svg`. The alternative is `samply` (`cargo install samply; samply record ./target/release/worker`), which opens the Firefox Profiler UI with a timeline, a call tree, and an inverted view. Same idea, different lens.

## How sampling works

Both are sampling profilers. Roughly a thousand times per second (cargo-flamegraph defaults to 997 Hz, a prime, so it cannot lock step with periodic work in your program), the profiler interrupts the process and records the call stack of whatever is on the CPU. Afterward it aggregates: identical stacks merge, and each function's share of samples estimates its share of CPU time.

This is statistics, not accounting. There is no per-call timer, which is why overhead stays near zero and you can run it against production-shaped load. The cost is resolution: a function using 40% of CPU shows up unmissably; one using 0.05% may not appear at all. For finding hot spots, that trade is exactly right. Instrumenting profilers make the opposite trade and can distort the very timings they report.

## Reading the graph

Three rules, because everyone misreads their first flamegraph:

- Width is time. A frame's width is its share of samples, itself plus everything it called. The x-axis is sorted alphabetically after merging: left-to-right is not chronological order.
- Height is not cost. A tall, narrow spike is just a deep call stack that was cheap. Depth tells you about your abstractions, not your time.
- Look at the top edge. A wide plateau with nothing stacked on it is self time: the code the CPU was actually executing when sampled. Those plateaus are your optimization targets. The inverted view ranks them directly.

On the worker's flamegraph, `render_email` shows up as a wide tower with a plateau inside a markdown parser. That is a finding: 60% of on-CPU time in rendering.

## On-CPU is not wall-clock

Now the trap that matters most for services. `perf` samples threads that are running on a CPU. A thread parked in `epoll_wait`, awaiting a Postgres row or an email provider response, accumulates no samples. It is invisible.

Recall the epoll lesson: an async worker under IO load is mostly waiting. Our worker's 26-second run spends about 6 CPU-seconds; the flamegraph explains those 6 seconds and says nothing about the other 20. A service with an 800 ms p99 and 4% CPU utilization will produce a flamegraph in which the slow endpoint barely appears, because its time is off-CPU.

For waiting, use the tools you built in the telemetry section: the `tracing` spans around `send_email` and the database calls are an off-CPU profiler you already deployed, and span durations tell you what the request waited on. `tokio-console` shows per-task poll and idle time; eBPF-based off-CPU profiling exists when you need the deep end. The discipline: first decide whether you are CPU-bound or wait-bound (compare CPU-seconds to wall-clock), then pick the instrument. Flamegraph for the former, spans and metrics for the latter.

## Predict, then verify

An async handler awaits one query with p50 of 300 ms, then does 2 ms of serialization. You profile the running service with `cargo flamegraph` under load. What dominates the handler's frames?

Answer: the serialization, by a landslide. The 300 ms wait happens off-CPU, in `epoll_wait`, invisible to a CPU sampler; runtime poll machinery and your 2 ms of serde are the only things on-CPU. The flamegraph is not wrong, it is answering a narrower question than "where did the latency go". Span durations from the telemetry section answer that one.
