Counting opens per subscriber looks like a job for "check, then insert":

```rust
use std::collections::HashMap;

let mut counts: HashMap<String, u32> = HashMap::new();
for email in opens {
    if counts.contains_key(&email) {
        *counts.get_mut(&email).unwrap() += 1;
    } else {
        counts.insert(email, 1);
    }
}
```

It works, but every pass hashes and probes the table twice, and the `unwrap` is a claim the compiler cannot check. The waste is structural: the first probe already discovered whether the slot is occupied or vacant, then threw that answer away.

## Entry: the slot as a value

```rust
for email in opens {
    *counts.entry(email).or_insert(0) += 1;
}
```

`entry` hashes once and hands back an `Entry`, an enum with `Occupied` and `Vacant` variants, the same make-the-states-explicit move as `Option` in "Option: absence made visible". You rarely match on it directly; the combinators cover the common shapes:

```rust
*counts.entry(email).or_insert(0) += 1;

by_domain.entry(domain).or_insert_with(Vec::new).push(address);

clicks.entry(url).and_modify(|c| *c += 1).or_insert(1);
```

`or_insert_with` earns its keep when the default allocates: `or_insert(Vec::new())` constructs a Vec even on hits and immediately drops it, while `or_insert_with(Vec::new)` builds one only if the slot is vacant. The allocation lesson again, one closure away. (`or_default()` is the shorthand when the default is `Default::default()`.)

## The map owns its keys

`insert(k, v)` takes both arguments by value: "One owner per value" applies, and the map is the owner until the entry is removed. Two consequences are worth knowing cold:

```rust
let mut m = HashMap::new();
m.insert(String::from("a"), 1);
let old = m.insert(String::from("a"), 2);  // old == Some(1)
```

Overwriting returns the old value, and the map keeps the _original_ key: the second `String::from("a")` is dropped. Likewise `entry(key)` takes the key by value even when the entry turns out to be occupied; the map already owns an equal key, so yours is dropped. Using a key after passing it in is the same moved-value error you met in "Passing values into functions".

## Looking up without allocating

The keys are `String`. The lookup you want to write is:

```rust
counts.get("zoe@example.com")
```

and it compiles, even though `&str` is not `&String`. `get` does not demand `&K`; it accepts a reference to any type the key can be _borrowed as_, through a small trait named `Borrow` whose contract says the borrowed form must hash and compare identically to the owned one. `String` borrows as `str`, so `&str` works. `Vec<u8>` borrows as `[u8]`, so a map keyed by `Vec<u8>` accepts `&[u8]`. The trait mechanics belong to the traits section; the payoff is usable now: lookups take the two-word view from the slices lesson, never a freshly allocated `String`.

Without that bridge, a handler writing `counts.get(&String::from(email))` would pay one heap allocation per request just to throw the key away, exactly the tax "What an allocation costs" taught you to notice. The same bridge is why a `HashSet<String>` answers `contains("bob")`.

## Predict, then verify

```rust
let mut m = HashMap::new();
m.insert(String::from("a"), 1);
let k = String::from("a");
*m.entry(k).or_insert(10) += 1;
println!("{:?}", m.get("a"));
println!("{k}");
```

What happens?

Answer: it does not compile: `borrow of moved value: k`. `entry` consumed `k`, occupied or not. Delete the last line and it prints `Some(2)`: the entry was occupied, so `or_insert(10)` ignored the 10 and returned a reference to the existing 1, which the `+=` turned into 2. One hash, no `unwrap`, no second probe, and the ownership story identical to every other move you have made so far.
