This program prints nothing:

```rust
let emails = ["a@x.com", "b@y.com"];
emails.iter().map(|e| println!("{e}"));
```

```text
warning: unused `Map` that must be used
note: iterators are lazy and do nothing unless consumed
```

`map` did not loop. It returned a small struct, `Map`, wrapping the source iterator and your closure, and nobody ever called `next` on it. Every iterator method is one of two kinds, and the warning names the split: adapters build lazy pipelines, consumers run them.

## Adapters: iterator in, iterator out

The daily vocabulary, on the newsletter's subscriber list:

```rust
let recipients: Vec<&str> = subscribers
    .iter()
    .filter(|s| s.confirmed)         // keep subscribers who confirmed
    .map(|s| s.email.as_str())       // &Subscriber -> &str
    .collect();
```

- `map` transforms each item; `filter` keeps the items that pass a test.
- `filter_map` does both at once: its closure returns an `Option`, and `None` means drop. `lines.iter().filter_map(|l| l.split('@').nth(1))` yields only the domains that exist.
- `take(n)` stops after n items, as it did to the infinite `Backoff` last lesson.
- `enumerate` pairs items with indices: the `(index, line)` loop from "if let, let-else, destructuring".
- `zip` walks two iterators in lockstep, yielding pairs, ending at the shorter one.
- `chain` runs one iterator, then another.

Each returns a new lazy iterator wrapping the old. Stack five deep and still nothing has happened.

## Consumers: where next finally runs

A consumer calls `next` in a loop until it has an answer:

```rust
let total: usize = recipients.iter().map(|e| e.len()).sum();
let any_dev = recipients.iter().any(|e| e.ends_with(".dev"));
let first_gmail = recipients.iter().position(|e| e.ends_with("@gmail.com"));
let bytes = recipients.iter().fold(0, |acc, e| acc + e.len());
```

`fold` is the general form, an accumulator threaded through every element; `sum` and `count` are folds with names. `any` short-circuits on the first true; `position` returns `Option<usize>`, absence visible as ever. A `for` loop is a consumer too.

`collect` is the consumer that builds collections, and it is deliberately generic: `Vec`, `String`, `HashMap`, and more. You must name the target, either by annotating the binding, as `recipients` did, or inline with the turbofish:

```rust
let recipients = subscribers.iter().map(|s| &s.email).collect::<Vec<_>>();
```

`::<Vec<_>>` reads: collect into a `Vec`, infer the element type.

## Collecting into Result

Signups arrive as raw lines, and "Result: failure as a value" gave us a parse function that returns `Result`. Mapping it over the lines yields an iterator of `Result`s, but what you usually want is all-or-nothing. `collect` knows the trick:

```rust
let emails: Result<Vec<SubscriberEmail>, String> = lines
    .iter()
    .map(|line| SubscriberEmail::parse(line))
    .collect();
```

`Result` implements `FromIterator` with short-circuit semantics: the first `Err` stops the iteration and becomes the whole answer; otherwise you get `Ok` of everything. It is the spirit of `?`, applied across a batch.

## One level deeper: the pull model

When `collect` asks for an element, the request travels down the chain (`Map` asks `Filter`, `Filter` asks the slice iterator) and one item bubbles back up through every closure. Elements move through one at a time; there are no intermediate collections. Coming from TypeScript, this is the flip to internalize: `arr.filter(...).map(...)` allocates a whole array at each stage, while the Rust chain allocates once, in `collect`, which even pre-sizes the `Vec` using the iterator's `size_hint`. What the tower of structs itself costs at runtime is the final lesson's question, and the answer needs this picture.

## Predict, then verify

```rust
let n: u32 = (1..=10).filter(|x| x % 2 == 0).take(2).sum();
println!("{n}");
```

What is `n`, and how many of the ten numbers does `filter` ever test?

Answer: 6, after testing four numbers. `sum` pulls, `take` relays at most two items, and `filter` tests 1 (drop), 2 (pass), 3 (drop), 4 (pass); then `take` has delivered its two and answers `None` without asking `filter` again, so 5 through 10 never enter the pipeline. Laziness is not just deferred work, it is work skipped, and it is why last lesson's infinite iterator was consumable at all.
