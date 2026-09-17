One block remains in the pod template, and it holds the sharpest production edge in this section:

```yaml
resources:
  requests:
    cpu: 250m
    memory: 64Mi
  limits:
    memory: 128Mi
```

`requests` and `limits` look like a range. They are two unrelated mechanisms. A request is a reservation: the scheduler places pods onto nodes by summing requests against node capacity, and under CPU contention your share of the node is proportional to it. Nothing stops a container from using more than it requested on an idle node. A limit is enforcement, translated into Linux cgroup settings, and the two resources are enforced in opposite temperaments.

## Memory: the wall

Memory is not compressible, so the limit is a wall. Exceed 128Mi and the kernel's OOM killer terminates the process; the pod shows `OOMKilled`, exit code 137, and the kubelet restarts it with the same backoff as a crash loop. For the newsletter this is a comfortable wall: no garbage collector demanding headroom, a small steady footprint, allocations you reasoned about back in the allocation-cost lesson. But a wall converts slow leaks and unbounded buffering into a kill. The unbounded channel that the backpressure lesson warned about no longer degrades a node gradually; it fills, hits 128Mi, and produces a corpse with a clear label. That is genuinely the better failure mode, provided you set the limit from a measured baseline (`kubectl top pod`) with room for real spikes, not from wishful thinking.

## CPU: the meter

CPU is compressible, so a CPU limit is not a wall but a meter: CFS bandwidth control. `cpu: 500m` becomes a quota of 50ms of CPU time per 100ms period, summed across every thread in the container. When the budget is spent, the kernel freezes all of the container's threads until the period rolls over.

Now recall what a tokio worker is: an OS thread running a cooperative scheduler, whose entire model assumes that if one task yields, another can run. The runtime spawns a worker per CPU it thinks it has. Put 8 workers on an 8-core node under a 500m limit and they can burn 50ms of budget in about 6ms of wall time. Then every worker is frozen for the remaining 94ms: not one slow task, but the accept loop, every in-flight request, every timer, and the thread that would have answered the liveness probe, all stopped at once. Cooperative scheduling has no move here; the preemption is happening a layer below the runtime, invisible to it.

The symptoms are distinctive: a latency histogram with a cliff, p50 in microseconds and a p99 quantized near 100ms multiples, plus probe timeouts under load (the probes lesson's `timeoutSeconds: 1` default becomes a restart machine). The confirmation is the throttling counter, `container_cpu_cfs_throttled_periods_total`, climbing while average CPU usage looks modest.

Three honest mitigations:

- Size the pool to the quota. Modern Rust reads cgroup CPU quotas on Linux (`std::thread::available_parallelism`), so a limited container gets a small default pool; you can pin it explicitly with `TOKIO_WORKER_THREADS=1` or the runtime builder. Fewer workers drain the budget more slowly and shrink freezes; they cannot eliminate them.
- Drop the CPU limit and keep an honest request. Common production practice: memory limits always, CPU limits rarely. Requests still guarantee your proportional share under contention; there is simply no quota to slam into.
- If policy mandates limits, set them from measured peak plus margin, and treat throttle metrics as an alarm, not trivia.

## Predict, then verify

The newsletter serves p99 = 4ms at 30% average CPU of its 500m limit, running 4 workers. Marketing sends the weekly issue and traffic triples for ten minutes. Average CPU rises to 80% of the limit. What does p99 do: roughly triple, or something stranger?

Answer: something stranger. Utilization is an average over periods, but spending is bursty: whenever a burst of ready tasks drains 50ms of quota early in a period, every worker freezes until the next one, and each affected request absorbs up to ~100ms of pure stall. p99 does not drift from 4ms to 12ms; it jumps to the vicinity of the period length, while p50 barely moves. If the freeze catches the probe handler a few cycles running, the kubelet starts restarting pods that were merely metered, and the probes lesson's thundering restart arrives on schedule. Averages do not show it; the throttled-periods counter does.
