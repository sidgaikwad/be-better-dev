Rust concurrency learners pass through a predictable arc, the same one the clone lesson mapped for `.clone()`: discover that `Arc<Mutex<T>>` compiles everywhere, wrap everything in it, then read that message passing is more idiomatic and feel guilty about every lock. Both extremes are miscalibrated. Locks, actors, and sharding are tools with prices, and this lesson is the price list.

## What a lock actually costs

An uncontended `Mutex::lock` is one atomic compare-exchange, a few nanoseconds; unlock is the same. No syscall, no thread parks, nothing to fear. Contention is where the money goes: the cache line holding the lock ping-pongs between cores, losers park in the kernel and pay microseconds to wake, and the critical section becomes the whole program's throughput ceiling, the serial fraction you met in the threads section.

So the question is never "is there a lock" but "how often is it contended, and how long is it held". A mutex locked for eighty nanoseconds by four tasks is invisible. The same mutex around an awaited network call is a traffic jam.

## When Arc<Mutex<T>> is correct engineering

- Short, synchronous critical sections on self-contained state: bump a metrics map, insert into a cache, pop a work item. Lock, touch memory, unlock.
- Low-traffic state: startup wiring, reload paths, anything measured in operations per second. The clone lesson's "runs once, clarity wins" applies unchanged.
- Read-heavy state: step up to `RwLock`, and if writes are rare whole-value swaps, share an immutable `Arc<T>` and replace the pointer on update, so readers stop taking any lock at all.

## When it is a smell

- Holding a guard across `.await`. With `std::sync::Mutex` the compiler usually stops you: the guard is not `Send`, so the future cannot be spawned. Switching to `tokio::sync::Mutex` makes it compile, and now every task serializes on whatever is awaited inside the critical section. The fix is design, not a different mutex brand: move the await out of the section, or give the state to an actor.
- One big lock: `Mutex<AppState>` turns a 16-core server into a one-lane bridge.
- Check-then-act across two acquisitions: read under the lock, decide after releasing, write under a second lock. The state moved in between. Invariants that span steps belong inside one owner, which is the actor lesson again.
- Two locks taken in different orders in different places: the deadlock recipe from the threads section.

## Sharding: less contention, no messages

When one map is hot but its keys are independent, neither a bigger lock nor an actor is the answer. Split the data:

```rust
struct ShardedMap {
    shards: Vec<Mutex<HashMap<String, Entry>>>, // say, 16 of them
}

impl ShardedMap {
    fn shard(&self, key: &str) -> &Mutex<HashMap<String, Entry>> {
        &self.shards[hash(key) as usize % self.shards.len()]
    }
}
```

Two tasks touching different shards never meet, so contention divides by the shard count. The dashmap crate packages exactly this trick. The extreme version is per-worker state merged only at read time, taking contention to zero.

## The compass

Reads dominate and writes are snapshots: swap an `Arc<T>`. Small hot numbers: atomics. Independent keys under real contention: shard. Exclusive access that awaits, or invariants spanning fields: actor. Everything else, which is most things: `Arc<Mutex<T>>`, held briefly, and move on. Message passing is not a virtue and locks are not a sin; unmeasured guilt is the only real anti-pattern on this page.

## Predict, then verify

The delivery worker keeps settings in `Arc<Mutex<Config>>`. Every job locks it to read two fields; a reloader task replaces the config once a day. Under load, the profiler shows workers waiting on that mutex. What is the fix?

Answer: readers do not need a lock, they need a stable snapshot. Store an immutable `Arc<Config>` behind a swap point (the arc-swap crate, or a `tokio::sync::watch` channel): each job clones the `Arc`, which the clone lesson priced at one atomic increment with no copy of the config, reads freely, and drops it. The reloader builds a fresh `Config` and swaps the pointer. Readers stop queueing on a lock entirely, and a job mid-flight keeps its consistent snapshot even if the swap happens under it.
