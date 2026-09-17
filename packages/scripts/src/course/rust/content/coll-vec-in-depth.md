The delivery worker for the newsletter keeps its queue in a `Vec<PendingEmail>`. Jobs join at the end, get taken in batches, and bounced addresses need pruning. Every one of those operations has a right tool, and picking the wrong one quietly turns a linear pass into a quadratic one.

## The shape, one more time

From "Stack and heap, for real": a `Vec<T>` is three words wherever the variable lives, a pointer to a heap buffer, a length, and a capacity. From "What an allocation costs": `push` writes into spare capacity, doubles the buffer when it runs out, and so costs amortised constant time, with `Vec::with_capacity` skipping the dance entirely.

What that lesson skipped is getting things _out_.

## Four ways to remove

```rust
let mut v = vec![10, 20, 30, 40, 50];

v.remove(1);            // [10, 30, 40, 50]  order kept, shifts the tail: O(n)
v.swap_remove(1);       // [10, 50, 40]      last element fills the hole: O(1)
v.retain(|&x| x > 10);  // [50, 40]          keep matches, one pass
v.truncate(1);          // [50]              drop the tail, keep the buffer
```

`remove(i)` preserves order by shifting every later element one slot left, a `memmove` of the whole tail. Call it inside a loop over a large Vec and you have an O(n^2) program that looks innocent: n removals approach n^2/2 element moves.

`swap_remove(i)` moves the _last_ element into the hole and shrinks the length by one. One read, one write, done, at the price of order. A batch of deliveries where order within the batch does not matter is exactly where it belongs.

`retain(pred)` answers "delete everything that matches" in a single left-to-right pass, shifting survivors down as it goes. It is what the loop-calling-`remove` version was trying to be.

`drain(range)` removes a range and lends you the removed elements as an iterator, ownership moving out one element at a time:

```rust
let n = queue.len().min(100);
let batch: Vec<PendingEmail> = queue.drain(..n).collect();
```

The worker takes the first hundred jobs; whatever remains shifts down once when the drain finishes.

## What clear does not do

```rust
queue.clear();
assert_eq!(queue.len(), 0);
// capacity is unchanged
```

`clear`, `truncate`, `pop`, `drain`: none of them return memory to the allocator. The elements are dropped, the buffer stays, ready for reuse. That is exactly what a long-running worker wants: a queue that fills and empties every second should not be calling the allocator every second, paying the variable costs the allocation lesson measured. When a spike really is over, `shrink_to_fit` reallocates down to fit. The buffer is guaranteed to be freed only when the Vec itself drops, on schedule, as in "Drop: deterministic cleanup".

## Lend a slice, not a Vec

A recap from "Slices: borrowing a view", because this is where it pays daily: the functions around this queue should not take `&Vec<PendingEmail>`. Code that only reads takes `&[PendingEmail]` and accepts the whole queue, a drained batch, or `&queue[..10]` alike, through one two-word fat pointer. Reserve `&mut Vec<PendingEmail>` for the code that actually grows or shrinks the vector; everything else gets the view.

## Predict, then verify

```rust
let mut v = vec![1, 2, 3, 4, 5];
let x = v.swap_remove(1);
println!("{x} {:?}", v);
```

What prints?

Answer: `2 [1, 5, 3, 4]`. `swap_remove` returns the evicted element at index 1, moves the last element into its slot, and touches nothing else. That is the entire trade: one displaced element instead of a shifted tail, order exchanged for constant time. If you find yourself sorting afterward anyway, you wanted `remove`, or a different structure, which is where this section is headed.
