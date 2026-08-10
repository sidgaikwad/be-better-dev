import type { SectionSeed } from "../types"

export const collectionsLayouts: SectionSeed = {
  slug: "collections-layouts",
  title: "Collections and their layouts",
  description: "Vec, String and &str, HashMap, slices, and their memory shapes.",
  badgeIcon: "🗃️",
  badgeTitle: "Collections",
  units: [
    {
      slug: "sequences-and-text",
      title: "Sequences and text",
      description: "Vec's removal toolkit, and UTF-8 strings without illusions.",
      lessons: [
        {
          slug: "coll-vec-in-depth",
          title: "Vec in depth: growth and removal",
          summary: "remove, swap_remove, retain, drain: what each costs and when order matters.",
          contentFile: "coll-vec-in-depth.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "`let mut v = vec![10, 20, 30, 40]; v.swap_remove(0);` What is `v` afterward?",
              options: ["[20, 30, 40]", "[40, 20, 30]", "[10, 20, 30]", "[40, 30, 20]"],
              answer: 1,
              explanation:
                "swap_remove evicts index 0 and moves the last element into the hole: one write instead of shifting the whole tail, at the price of order.",
            },
            {
              kind: "mcq",
              prompt:
                "A worker prunes every bounced email from a 100k-element Vec by calling `remove(i)` inside a scan. What is the right reading of that code?",
              options: [
                "Fine: remove is O(1)",
                "Quadratic: each remove shifts the whole tail; retain does the same job in one pass",
                "It will not compile: remove needs `&mut self` twice",
                "Fine, but swap_remove would preserve order better",
              ],
              answer: 1,
              explanation:
                "Each remove memmoves every later element left, so n removals approach n^2/2 element moves. retain shifts survivors down once. (swap_remove is the one that breaks order.)",
            },
            {
              kind: "mcq",
              prompt:
                "After `queue.clear()` on a Vec with capacity 4096, what does the allocator see?",
              options: [
                "The buffer is freed immediately",
                "The buffer shrinks to a minimum size",
                "Nothing: the buffer is kept and capacity stays 4096",
                "Nothing until the next push",
              ],
              answer: 2,
              explanation:
                "clear drops the elements and sets len to 0, keeping the buffer for reuse. Memory returns to the allocator on drop or an explicit shrink_to_fit, which is what a refilling queue wants.",
            },
          ],
        },
        {
          slug: "coll-string-utf8",
          title: "String, &str, and UTF-8 for real",
          summary: "Why `s[0]` does not compile, bytes versus chars, and the grapheme caveat.",
          contentFile: "coll-string-utf8.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why does `name[0]` on a String fail to compile rather than return something?",
              options: [
                "Strings are immutable, so indexing would be pointless",
                "Either meaning breaks a promise: a byte could split a character, and a char position would hide an O(n) scan behind O(1) syntax",
                "The compiler cannot prove index 0 exists at compile time",
                "It compiles, but only inside unsafe blocks",
              ],
              answer: 1,
              explanation:
                "UTF-8 is variable-width, so byte 0 and char 0 are different questions. Rust makes you choose explicitly: byte slicing with `&s[..n]`, or scanning with `chars()`.",
            },
            {
              kind: "predict",
              prompt: 'What does `"café".len()` return?',
              options: ["3", "4", "5", "8"],
              answer: 2,
              explanation:
                "len counts bytes, and é encodes as two bytes in UTF-8, so 5. `chars().count()` is the call that returns 4.",
            },
            {
              kind: "mcq",
              prompt:
                "A user types é as `e` followed by a combining accent. What does `chars().count()` report for that glyph?",
              options: ["1", "2", "It depends on the terminal", "0"],
              answer: 1,
              explanation:
                "chars() yields Unicode scalar values, and this é is two of them. One user-perceived character (a grapheme) can span several chars; the unicode-segmentation crate handles that layer.",
            },
          ],
        },
      ],
    },
    {
      slug: "hashmap",
      title: "HashMap",
      description: "From key to bucket: hashing, HashDoS, the entry API, and key ownership.",
      lessons: [
        {
          slug: "coll-hashmap-hashing",
          title: "HashMap: from key to bucket",
          summary: "Hashing, resizing, and why the default hasher is deliberately slow.",
          contentFile: "coll-hashmap-hashing.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does a HashDoS attack actually exploit?",
              options: [
                "A buffer overflow in the table's resize code",
                "Keys crafted to collide into one slot, degrading each operation from O(1) toward O(n)",
                "Hash functions too slow to keep up with requests",
                "Maps that never release memory after remove",
              ],
              answer: 1,
              explanation:
                "If collisions are predictable, an attacker submits thousands of colliding keys and every insert probes past all the previous ones: quadratic total work from one crafted request body.",
            },
            {
              kind: "mcq",
              prompt:
                "Rust's default hasher is slower than alternatives like FxHash. Why is it still the right default?",
              options: [
                "SipHash produces fewer collisions on random data",
                "It is keyed with per-map random state, so attackers cannot precompute colliding keys for maps holding their input",
                "It is required for storing passwords securely",
                "The difference only affects integer keys, which are rare",
              ],
              answer: 1,
              explanation:
                "The default assumes the common dangerous case: attacker-chosen strings entering a map. An unpredictable seed makes collision-crafting infeasible; with_hasher opts into speed when keys are trusted.",
            },
            {
              kind: "predict",
              prompt:
                "You insert 1,000 entries into a `HashMap::new()`. Roughly how many times does the table grow, moving every entry each time?",
              options: ["0", "About 10", "About 1,000", "Exactly 1"],
              answer: 1,
              explanation:
                "Capacity doubles like a Vec's, so reaching 1,000 takes about ten grows and the cost amortises out. with_capacity(1_000) makes the answer 0, the same lesson as Vec::with_capacity.",
            },
          ],
        },
        {
          slug: "coll-entry-and-keys",
          title: "The entry API and key ownership",
          summary: "One hash instead of two, moved keys, and `&str` lookups against `String` keys.",
          contentFile: "coll-entry-and-keys.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "On a key miss, `contains_key` followed by `insert` hashes and probes twice. How many times does `entry(key).or_insert(0)` hash?",
              options: [
                "Zero: entry reuses the previous lookup",
                "Once",
                "Twice, but faster",
                "Once per collision",
              ],
              answer: 1,
              explanation:
                "entry does the single hash-and-probe, then hands back the found slot as an Occupied/Vacant enum, so the insert-or-update decision reuses the same position.",
            },
            {
              kind: "predict",
              prompt:
                '`m` maps String "x" to 10. You run `let k = String::from("x"); *m.entry(k).or_insert(0) += 1;` What value does "x" map to now?',
              options: ["0", "1", "10", "11"],
              answer: 3,
              explanation:
                "The entry is occupied, so or_insert(0) discards the 0 and returns a reference to the existing 10, which += makes 11. And k is gone either way: entry took it by value.",
            },
            {
              kind: "mcq",
              prompt:
                'The map\'s keys are `String`, yet `m.get("bob")` with a `&str` compiles. What makes that work?',
              options: [
                "&str silently converts into &String",
                "get clones the argument into a String first",
                "get accepts any type the key borrows as; str is String's borrowed form, hashing and comparing identically",
                "The map secretly stores keys as &str",
              ],
              answer: 2,
              explanation:
                'The Borrow trait bridges the owned key and its cheap view, so lookups never allocate a temporary String. The same bridge lets a HashSet<String> answer contains("bob").',
            },
          ],
        },
      ],
    },
    {
      slug: "choosing-structures",
      title: "Choosing structures",
      description: "The rest of the toolbox, ranked by the memory hierarchy.",
      lessons: [
        {
          slug: "coll-choosing-structures",
          title: "Choosing the structure",
          summary: "BTreeMap, HashSet, VecDeque, and the case against LinkedList.",
          contentFile: "coll-choosing-structures.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                'The dashboard needs every subscriber whose email starts with "m", walked in order. Which structure answers without a full scan or a sort?',
              options: [
                "HashMap with a filter",
                'BTreeMap with `range("m".."n")`',
                "HashSet",
                "VecDeque kept sorted by hand",
              ],
              answer: 1,
              explanation:
                "BTreeMap keeps keys sorted as a structural invariant, so range finds the start in O(log n) and walks only matches. A HashMap must visit everything and sort afterward.",
            },
            {
              kind: "predict",
              prompt:
                'You insert keys "cara", "alice", "bob" into a BTreeMap in that order and print `m.keys()`. What comes out?',
              options: [
                "cara, alice, bob (insertion order)",
                "alice, bob, cara (sorted)",
                "A different order on each run",
                "bob, alice, cara (reverse insertion)",
              ],
              answer: 1,
              explanation:
                "Order is a property of the tree itself, not of insertion history or a random seed. That determinism is also why BTreeMap iteration is safe to snapshot in tests where HashMap's is not.",
            },
            {
              kind: "mcq",
              prompt:
                "LinkedList advertises O(1) insertion. Why does it still lose to Vec in almost every real workload?",
              options: [
                "Its insert is secretly O(log n)",
                "Reaching the insertion point is an O(n) pointer chase over scattered per-node allocations, and traversal stalls on memory latency",
                "It only accepts Copy types",
                "Rust implements it as a Vec internally",
              ],
              answer: 1,
              explanation:
                "The O(1) splice needs a position you already hold; getting there walks scattered nodes, each a separate allocation and likely cache miss. Vec's shifting is one fast sequential copy by comparison.",
            },
          ],
        },
        {
          slug: "coll-cache-locality",
          title: "Cache locality: why contiguous wins",
          summary: "Cache lines, prefetching, and the numbers under every collection choice.",
          xp: 25,
          contentFile: "coll-cache-locality.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What actually moves between main memory and the cache when you read `v[0]`?",
              options: [
                "Exactly the bytes of v[0]",
                "One element, plus metadata",
                "A 64-byte cache line, bringing v[0]'s neighbors along",
                "The whole 4KB page",
              ],
              answer: 2,
              explanation:
                "Memory transfers happen in 64-byte lines. For i64s, one miss delivers eight elements, which is why sequential scans pay RAM latency once per eight reads, not per read.",
            },
            {
              kind: "predict",
              prompt:
                "Summing 10 million i64s takes a Vec a few milliseconds. Given roughly 100ns of RAM latency per dependent load, the LinkedList version takes:",
              options: [
                "About the same",
                "2-3x longer",
                "On the order of 100x longer",
                "Less time: no bounds checks",
              ],
              answer: 2,
              explanation:
                "Each node's address lives inside the previous node, so every element is a full-latency stall the prefetcher cannot hide: 10M stalls near 100ns is close to a second against the Vec's few milliseconds.",
            },
            {
              kind: "mcq",
              prompt:
                "Why can the hardware prefetcher accelerate a Vec scan but not a LinkedList traversal?",
              options: [
                "Prefetchers only work on the stack",
                "The next node's address is data inside the current node, unknowable until that load completes; a Vec's next address is just pointer plus stride",
                "LinkedList disables prefetching to stay memory-safe",
                "It can, but only for Copy types",
              ],
              answer: 1,
              explanation:
                "Prefetchers predict address patterns. A sequential stride is trivially predictable; pointer-chasing is by definition not, so each hop eats the full memory latency.",
            },
          ],
        },
      ],
    },
  ],
}
