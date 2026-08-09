Looking up a subscriber by email in a `Vec` means scanning half of it on average. The newsletter service does that lookup on every confirmation click, so it keeps a `HashMap<String, bool>` of confirmed addresses and answers in constant time. Here is what that constant time is made of.

## Insert, step by step

```rust
use std::collections::HashMap;

let mut confirmed: HashMap<String, bool> = HashMap::new();
confirmed.insert(String::from("zoe@example.com"), false);
```

1. The map's hasher consumes the key's bytes and produces a `u64`.
2. Some of those bits select a slot in one contiguous table.
3. If the slot holds a different key (a collision), the map probes nearby slots until it finds room.
4. When the table passes roughly 87% full, the map allocates one twice the size and re-inserts every entry: a `Vec` grow with a rehash attached. `HashMap::with_capacity` skips the churn for the same reason `Vec::with_capacity` did in the allocation lesson.

Lookup replays steps 1 to 3 and confirms with `==`. Everything rests on step 1 spreading keys evenly, which raises a question: what happens when someone spreads them unevenly on purpose?

## HashDoS, and Rust's default

If an attacker knows your hash function, they can precompute thousands of strings that all land in the same slot. Every insert then probes past every previous entry: the map degrades to a linear scan per operation, quadratic to insert the batch. In 2011, researchers demonstrated exactly this against the web stacks of the day, PHP, Java, Python, Ruby: one POST body full of colliding form-field names pinned a CPU core for minutes. Any service that puts attacker-chosen strings into a hash table is exposed, and "form fields into a map" describes half the web, our subscription form included.

Rust's answer is the default hasher: currently SipHash-1-3, a _keyed_ hash. Each map draws random 128-bit key material at creation, seeded from the OS. Without the key, an attacker cannot predict which inputs collide, and the key never leaves the process. The cost is real: SipHash is noticeably slower than the fastest hashers, especially on small keys like integers. Rust ships the safe default and leaves speed opt-in: when keys are trusted, internal ids rather than user input, swap the hasher with `HashMap::with_hasher` (the `fxhash` and `ahash` crates are the usual picks; the compiler itself uses FxHashMap internally, on keys it generates itself).

One visible consequence of the random seed: iteration order is arbitrary and changes between runs. A test that snapshots `map.keys()` passes today and fails tomorrow.

## One level down: SwissTable

Since Rust 1.36, the std `HashMap` is `hashbrown`, a port of Google's SwissTable design. Alongside the entries it keeps one control byte per slot: empty, deleted, or seven bits of the key's hash. Probing loads a group of 16 control bytes and checks them with SIMD instructions, so one comparison filters sixteen slots down to the few worth a full key check. And because this is open addressing, everything lives in one allocation: no per-entry heap nodes, no pointer to chase per collision. Why that layout choice matters as much as the algorithm does is the cache locality lesson at the end of this section.

## Predict, then verify

```rust
use std::collections::HashMap;

let mut m = HashMap::new();
for word in ["ack", "bounce", "click", "drop", "expire"] {
    m.insert(word, 0);
}
for k in m.keys() {
    print!("{k} ");
}
```

You compile once and run the binary twice. Does the printed order match across the two runs?

Answer: almost certainly not. Each run seeds SipHash with fresh OS randomness, the same keys hash to different slots, and iteration walks the table in slot order. Within one run the order is stable while the map is untouched, but across runs it is deliberately unpredictable: the property that defeats collision-crafting also defeats your snapshot test. Sort the keys before asserting, or use a `BTreeMap`, later in this section.
