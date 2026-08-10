The dashboard wants subscribers listed alphabetically, and "everyone from m through n" paged. The `HashMap` from the last two lessons answers point lookups fast and answers "in order" not at all: its iteration order is whatever the random seed made it. You could collect the keys into a `Vec` and sort on every request, or reach for the structure that keeps order as an invariant.

## BTreeMap: sorted by construction

```rust
use std::collections::BTreeMap;

let mut subs = BTreeMap::new();
subs.insert("maria@example.com", true);
subs.insert("alice@example.com", false);

for (email, confirmed) in &subs {}           // alphabetical, always
for (email, confirmed) in subs.range("m".."n") {}  // emails starting with m
```

Every operation is O(log n) instead of O(1): the price of order. In exchange, iteration is sorted and deterministic (safe to snapshot in tests), and `range` does what a HashMap cannot fake cheaply: find the start in O(log n), then walk forward touching only matches.

## HashSet and VecDeque

`HashSet<T>` is a HashMap without values: membership only. Deduplicating a send list falls out of its API, because `insert` reports whether the value was new:

```rust
use std::collections::HashSet;

let mut seen = HashSet::new();
recipients.retain(|e: &String| seen.insert(e.clone()));
```

Everything from the HashMap lessons carries over: SipHash by default, `contains("bob")` against `String` elements through `Borrow`, no ordering. (`BTreeSet` is the sorted sibling.)

`VecDeque<T>` is the delivery queue's true shape: jobs `push_back`, workers `pop_front`, both amortised O(1). A `Vec` used as a queue gets one end wrong: `remove(0)` shifts the entire tail per job, the quadratic trap from the Vec lesson. VecDeque avoids it with a ring buffer: one contiguous allocation used circularly, head and tail indices chasing each other around it. Same doubling growth as Vec, indexing still O(1); the only visible seam is that the live elements may wrap past the buffer's end, so `as_slices` hands you two slices instead of one.

## LinkedList: the theoretical winner that loses

`std::collections::LinkedList` offers what the textbooks promise: O(1) insertion or removal at a position you already hold, O(1) append of one whole list onto another. In practice it almost never wins, and the standard library's own documentation says it is "almost always better to use Vec or VecDeque". Three reasons:

1. Every node is a separate heap allocation, the allocation lesson's cost paid n times, plus two pointers of overhead riding along with every element.
2. "A position you already hold" is doing heavy lifting: reaching the middle is an O(n) walk, so the O(1) splice is usually preceded by an O(n) search, while `Vec::insert`'s "slow" shift is one fast sequential copy.
3. Traversal chases pointers to scattered addresses, and that, as the next lesson shows in numbers, is the difference between streaming from cache and stalling on RAM at every element.

Rust adds a fourth: the classic pointer-surgery tricks fight the ownership rules, so the ergonomic wins are thin too. The remaining niche (splice-heavy workloads over long sequences, cheap list merges) is real and rare. Reach for it only after a benchmark says the others lose.

## The decision in one pass

- Default: `Vec`. Push, iterate, sort when needed.
- Queue: `VecDeque`.
- Point lookup by key: `HashMap`.
- Sorted iteration or range queries: `BTreeMap`.
- Membership and dedup: `HashSet`, or `BTreeSet` when order matters.
- `LinkedList`: only with a benchmark as a witness.

## One level down: why BTreeMap is not a binary tree

A classic binary search tree is LinkedList economics wearing a tree costume: one heap node per element, one pointer hop per comparison. The std map is instead a B-tree with branching factor 6: each node packs up to 11 keys in an array, so a search does a handful of comparisons inside one node, sitting in one or two cache lines, before following a single child pointer. Fewer allocations, denser memory, shallower trees: Vec instincts applied to sorted data.

## Predict, then verify

```rust
use std::collections::VecDeque;

let mut q: VecDeque<i32> = (1..=3).collect();  // [1, 2, 3]
q.push_back(4);
q.pop_front();
q.pop_front();
q.push_back(5);
println!("{:?} front={:?}", q, q.front());
```

What prints?

Answer: `[3, 4, 5] front=Some(3)`. FIFO in action: 1 and 2 left in arrival order, 4 and 5 joined the back, and nothing ever shifted. The head index advanced past the departed slots and the tail wrapped forward, which is the whole point of a ring: both ends move, the elements stay put.
