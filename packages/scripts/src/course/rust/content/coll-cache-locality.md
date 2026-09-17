Sum ten million `i64`s in a `Vec` and in a `LinkedList`. Both are O(n). Both execute the same ten million additions. On a laptop, the Vec finishes in a few milliseconds; the list takes the better part of a second. Big-O counts operations. The gap is the memory system, and it is the single strongest force behind every recommendation this section has made.

## The hierarchy and the line

A load that hits L1 cache costs about 1ns. L2, roughly 4ns. L3, maybe 15ns. Main memory, 60 to 100ns: two orders of magnitude above L1. And the CPU never fetches single bytes: memory moves in _cache lines_ of 64 bytes. Touch one `i64` and its seven neighbors arrive with it, wanted or not.

Contiguous data turns that into a discount. Reading `v[0]` misses and pulls a line; `v[1]` through `v[7]` are then already in L1, effectively free. One RAM stall pays for eight elements.

Then the hardware prefetcher joins in. It watches the address stream, recognizes "sequential", and starts fetching lines before the loop asks for them. A tight scan over a Vec ends up limited by memory _bandwidth_ (tens of GB/s) rather than memory _latency_: 80MB of `i64`s at 20GB/s is about 4ms, with the CPU almost never waiting.

## Why the list cannot be saved

A `LinkedList` node holds the element plus two pointers, in its own heap allocation, wherever the allocator happened to place it. The address of node n+1 is _data inside node n_: the CPU cannot even begin loading the next node until the current one has arrived. Dependent loads, back to back.

- No spatial discount: list neighbors are not memory neighbors, so a 64-byte line delivers one node and some strangers.
- No prefetch: the next address is unpredictable by construction.
- Full latency per element: ten million nodes at 80 to 100ns each lands near a second. Same n, same big-O, a couple of hundred times slower.

This is also why the "slow" O(n) options keep winning in practice. `Vec::insert`'s shift is a sequential, prefetched copy that moves data at bandwidth speed; _finding_ a splice point in a list stalls at full latency on every hop before the O(1) part even starts.

## The section, re-read through the cache

- `swap_remove`, `retain`, `drain`: contortions to preserve contiguity, because contiguity is the performance.
- hashbrown's SwissTable: open addressing in one slab, 16 control bytes filtered per SIMD step. Collisions probe nearby memory instead of chasing chained nodes.
- `BTreeMap`'s 11-key nodes: comparisons batched into a line or two per level, instead of one miss per comparison.
- `VecDeque`'s ring: a queue that never leaves its single allocation.
- `LinkedList`: full memory latency per element, which no asymptotic argument refunds.

The effect reaches inside your structs too. Scanning a `Vec<Subscriber>` to read one `u8` status flag out of each 200-byte struct fetches a fresh line per element and uses one byte of it. Analytics engines flip the layout to struct-of-arrays, one Vec per field, for exactly this reason; you now have the vocabulary to see why that is not an exotic trick but the same principle again.

## Predict, then verify

A 1000 by 1000 grid stored as `Vec<Vec<i64>>`, summed two ways:

```rust
for row in 0..1000 { for col in 0..1000 { total += grid[row][col]; } }
```

```rust
for col in 0..1000 { for row in 0..1000 { total += grid[row][col]; } }
```

Same million additions. Which loop is faster, and roughly why?

Answer: the first, typically by several times. Row order walks each inner Vec sequentially: line discount plus prefetch, RAM touched once per eight elements. Column order hops to a different row's buffer, a different heap allocation, on every access: a fresh line per element, a stride no prefetcher trusts, and by the time the loop returns to a line it already fetched, the 8MB grid has usually pushed it out of the nearer caches. Measure it: the Performance section of this course builds the benchmark harness, and this pair of loops is a perfect first specimen.
