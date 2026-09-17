"Avoid unnecessary allocations" is standard Rust advice. It only means something once you know what an allocation actually does.

## The chain under `String::from`

```rust
let s = String::from("hello");
```

1. `String` asks the global allocator for 5 bytes.
2. The allocator (on most Linux systems, glibc's malloc; jemalloc or mimalloc if you opted in) looks for a free block in memory it already manages. Most calls end here, in nanoseconds.
3. If the allocator is out of usable space, it asks the _kernel_ for more pages via `mmap` or `brk`. This is a syscall: orders of magnitude slower than step 2.
4. The kernel hands over virtual pages, lazily. The physical memory is often only wired up on first write, via a page fault.

So "an allocation" costs anywhere from nanoseconds (free-list hit) to microseconds (syscall plus page fault). The variance, not the average, is what shows up as tail latency in a hot service.

You can watch layer 3 happen: run a Rust program under `strace` on Linux and look for `mmap` calls as its memory usage grows. The Performance section of this course does exactly that.

## Why Vec::push is usually cheap

```rust
let mut v = Vec::new();
for i in 0..1000 {
    v.push(i);
}
```

A `Vec` allocates a buffer with spare _capacity_, and `push` normally just writes into it. When the buffer is full, the Vec allocates a new buffer roughly twice the size, copies everything over, and frees the old one.

Doubling means a thousand pushes trigger about ten reallocations, not a thousand. Spread over all pushes, each one costs _amortised_ constant time. But note what else this implies: a grow step copies every existing element, and the old pointer is dead the instant it happens. Rust's borrow checker will not let you hold a reference into a Vec across a `push`, and now you know the concrete disaster it is preventing: reading through a pointer into a freed buffer.

If you know the size in advance, say so and skip the whole dance:

```rust
let mut v = Vec::with_capacity(1000);
```

## Predict, then verify

How many heap allocations does this perform?

```rust
let a = String::from("hello ");
let b = String::from("world");
let c = a + &b;
```

Answer: two, usually. One for `a`, one for `b`. The `+` consumes `a` by value and _appends into it_, reusing `a`'s buffer when capacity allows; with 6 used of a 6-byte buffer it will need one grow, so in this exact case: three. The point of the exercise is not the number, it is the habit of asking. `cargo bench` and allocation profilers answer it precisely, and the Performance section teaches both.
