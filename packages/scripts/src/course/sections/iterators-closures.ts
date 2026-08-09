import type { SectionSeed } from "../types"

export const iteratorsClosures: SectionSeed = {
  slug: "iterators-closures",
  title: "Iterators and closures",
  description: "The zero-cost abstraction claim, tested rather than asserted.",
  badgeIcon: "🔁",
  badgeTitle: "Iterators",
  units: [
    {
      slug: "closures",
      title: "Closures",
      description: "Functions that capture, and the three traits that describe what capturing did.",
      lessons: [
        {
          slug: "iter-closures-capture",
          title: "Closures: functions that capture",
          summary:
            "Capture by shared borrow, exclusive borrow, or value: the ownership rules, applied silently.",
          contentFile: "iter-closures-capture.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "A closure's body only reads a captured `String` (no `move`). How is it captured?",
              options: [
                "By value; the String moves in",
                "By shared borrow, like an ordinary &String",
                "By exclusive borrow, &mut String",
                "It is copied byte for byte",
              ],
              answer: 1,
              explanation:
                "The compiler picks the least demanding mode the body allows, and reading only needs &T, so the original stays readable elsewhere while the closure lives.",
            },
            {
              kind: "predict",
              prompt:
                'let mut count = 0; let tick = || count += 1; println!("{count}"); tick(); What happens?',
              options: [
                "Prints 0, then tick runs",
                "Rejected: tick holds an exclusive borrow of count across the println",
                "Prints 1",
                "Compiles, but tick has no effect",
              ],
              answer: 1,
              explanation:
                "Mutating a capture takes &mut count from tick's definition to its last use, and the shared read in println cannot overlap it: the one-writer-or-many-readers rule, verbatim.",
            },
            {
              kind: "mcq",
              prompt: "What does the `move` keyword change about a closure?",
              options: [
                "The body runs immediately",
                "Captured values become mutable",
                "It captures by value instead of borrowing",
                "It can only be called once",
              ],
              answer: 2,
              explanation:
                "move affects how variables get in, nothing else: Copy types are copied, others moved, and how often it can be called is decided separately by what the body does.",
            },
          ],
        },
        {
          slug: "iter-fn-traits",
          title: "Fn, FnMut, FnOnce: the capture contract",
          summary:
            "The three call traits as ownership contracts, and choosing bounds that restrict callers least.",
          contentFile: "iter-fn-traits.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which traits does `|| drop(report)` implement, for a non-Copy `report`?",
              options: [
                "Fn, FnMut, and FnOnce",
                "FnMut and FnOnce",
                "FnOnce only",
                "None, until you add move",
              ],
              answer: 2,
              explanation:
                "The body moves its capture into drop, so a second call would need a value that is gone; closures that move a capture out are FnOnce only.",
            },
            {
              kind: "predict",
              prompt:
                'let cfg = String::from("prod"); let f = move || cfg.len(); Does f implement Fn?',
              options: [
                "Yes: move only sets the capture mode, and the body just reads, so all three traits",
                "No: move closures are always FnOnce",
                "No: cfg would need to be Copy",
                "Only if f is declared mut",
              ],
              answer: 0,
              explanation:
                "Trait inference looks at what the body does with captures, not how they arrived; owning cfg while merely reading it leaves the closure callable any number of times through &self.",
            },
            {
              kind: "mcq",
              prompt:
                "A helper calls its callback once per subscriber in a loop. The loosest bound that works?",
              options: ["Fn", "FnMut", "FnOnce", "fn (a function pointer)"],
              answer: 1,
              explanation:
                "FnOnce cannot be called in a loop, and Fn would exclude useful stateful closures; FnMut permits repeated calls and accepts every Fn closure as well.",
            },
          ],
        },
      ],
    },
    {
      slug: "the-iterator-trait",
      title: "The Iterator trait",
      description:
        "next() as the whole engine, lazy adapters, and the consumers that finally run them.",
      lessons: [
        {
          slug: "iter-the-trait",
          title: "The Iterator trait: next() is the engine",
          summary:
            "One required method returning Option, hand-driven iterators, and a Backoff schedule of your own.",
          contentFile: "iter-the-trait.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What must you write to implement Iterator for your own type?",
              options: [
                "next, size_hint, and fold",
                "An Item type and next; everything else is provided",
                "A separate impl for each adapter you want to use",
                "type Item, next, and a manual IntoIterator impl",
              ],
              answer: 1,
              explanation:
                "All 75-odd adapters and consumers are provided methods defined in terms of next, and IntoIterator comes from a blanket impl covering every iterator.",
            },
            {
              kind: "predict",
              prompt:
                "let v = vec![7]; let mut it = v.iter(); it.next(); What does the second it.next() return?",
              options: ["None", "Some(&7) again", "It panics", "Some(7)"],
              answer: 0,
              explanation:
                "The single element came out on the first call, so the cursor is exhausted and reports absence the Option way: as a value, not as an exception.",
            },
            {
              kind: "mcq",
              prompt: "Why does next take &mut self, forcing `let mut it`?",
              options: [
                "So the iterator can be reset later",
                "Each call advances the iterator's own cursor state",
                "It mutates the underlying collection",
                "Rust requires mut for all method calls",
              ],
              answer: 1,
              explanation:
                "An iterator is a stateful cursor (Backoff literally rewrites next_ms each call), and mutating that state through a reference requires an exclusive borrow.",
            },
          ],
        },
        {
          slug: "iter-adapters-consumers",
          title: "Adapters are lazy, consumers do the work",
          summary:
            "map, filter, and friends build a plan; collect, fold, and sum execute it one pull at a time.",
          contentFile: "iter-adapters-consumers.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Four raw lines, the second malformed, run through .map(|l| SubscriberEmail::parse(l)).collect::<Result<Vec<_>, _>>(). What comes back?",
              options: [
                "Err with the second line's error, after only two parses",
                "Ok with the three valid emails, after four parses",
                "Err, but all four lines were parsed first",
                "A Vec holding four Results",
              ],
              answer: 0,
              explanation:
                "Result's FromIterator short-circuits: the first Err ends the iteration and becomes the whole value, so lines three and four are never parsed.",
            },
            {
              kind: "mcq",
              prompt: "What does `emails.iter().map(|e| e.len());` do on its own?",
              options: [
                "Computes every length and discards them",
                "Fails to compile without collect",
                "Builds a lazy Map value and warns that it is unused; the closure never runs",
                "Allocates a Vec<usize> that is immediately dropped",
              ],
              answer: 2,
              explanation:
                "Adapters only wrap the source iterator in a new struct; until a consumer calls next, no element is touched, which is exactly what the must_use warning says.",
            },
            {
              kind: "mcq",
              prompt: "Which of these is a consumer rather than an adapter?",
              options: ["map", "zip", "take", "fold"],
              answer: 3,
              explanation:
                "fold drives next through the entire iterator to produce one value; the other three return new lazy iterators and do nothing by themselves.",
            },
          ],
        },
      ],
    },
    {
      slug: "ownership-and-cost",
      title: "Ownership and cost",
      description:
        "Three ways to iterate a collection, and the zero-cost claim under a disassembler.",
      lessons: [
        {
          slug: "iter-three-ways",
          title: "iter, iter_mut, into_iter: ownership again",
          summary:
            "&T, &mut T, or T: the for-loop ampersand from the patterns lesson, now with names.",
          contentFile: "iter-three-ways.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "`for s in &mut subs` is shorthand for which call, yielding what?",
              options: [
                "subs.iter(), yielding &Subscriber",
                "subs.iter_mut(), yielding &mut Subscriber",
                "subs.into_iter(), yielding Subscriber",
                "subs.iter_mut(), yielding Subscriber by value",
              ],
              answer: 1,
              explanation:
                "for desugars through IntoIterator, and the impl for &mut Vec forwards to iter_mut, so the loop holds an exclusive borrow and can edit elements in place.",
            },
            {
              kind: "predict",
              prompt:
                'let total: usize = names.iter().map(|n| n.len()).sum(); println!("{}", names.len()); Does it compile?',
              options: [
                "Yes: iter only borrows, and the borrow ends at sum",
                "No: sum consumes names",
                "No: map moved each String out",
                "Only if names is declared mut",
              ],
              answer: 0,
              explanation:
                "The consumer exhausts the iterator, not the collection; everything downstream of iter() worked through shared borrows, so names remains owned and usable.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does .iter().map(|s| s.email) fail while .into_iter().map(|s| s.email) compiles?",
              options: [
                "iter is lazy but into_iter is eager",
                "iter yields &Subscriber, and a field cannot move out through a shared borrow; into_iter yields owned values",
                "into_iter clones each Subscriber first",
                "iter yields Subscriber by value, which is ambiguous",
              ],
              answer: 1,
              explanation:
                "E0507 protects the vector you merely borrowed; consuming the vector makes each Subscriber yours, so moving its email into the output is legal.",
            },
          ],
        },
        {
          slug: "iter-zero-cost",
          title: "Zero-cost: tested, not asserted",
          summary:
            "Same assembly as the hand loop, vanished bounds checks, and the debug-build and chain() caveats.",
          contentFile: "iter-zero-cost.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does sum_iter contain no bounds checks, even before optimization?",
              options: [
                "The optimizer always deletes bounds checks at opt-level=3",
                "The slice iterator walks a pointer toward an end pointer; it never indexes, so no check is ever emitted",
                "Iterators use unsafe internally to disable checks",
                "Bounds are proven at compile time for all slices",
              ],
              answer: 1,
              explanation:
                "Indexing must check because i could be anything, and v[i] relies on the optimizer proving it in range; the iterator never indexes, so there is nothing to check or elide.",
            },
            {
              kind: "predict",
              prompt:
                "A hot path computes a.iter().chain(b.iter()).sum(). You split it into two separate sum loops. Faster, slower, or the same?",
              options: [
                "Often faster: chain's next branches on every call to pick a side",
                "Always the same: zero-cost guarantees it",
                "Slower: two loops mean twice the loop overhead",
                "Faster, but only in debug builds",
              ],
              answer: 0,
              explanation:
                "chain keeps per-call state deciding which iterator is live, a branch the optimizer cannot always remove; it is a known case where the hand-written version wins, and a benchmark should confirm it either way.",
            },
            {
              kind: "mcq",
              prompt:
                "The trustworthy way to settle whether your chain matches the hand-written loop?",
              options: [
                "Time one cargo run of each version",
                "Trust that adapters are zero-cost by definition",
                "Compare both at opt-level=3 on Compiler Explorer, and benchmark with criterion using black_box",
                "Count the adapter structs in the iterator's type",
              ],
              answer: 2,
              explanation:
                "The claim is empirical, per loop and per compiler version: read the optimized assembly for checks and vectorization, and let criterion do statistically sound timing on optimized code.",
            },
          ],
        },
      ],
    },
  ],
}
