Rust has no null. The gap where null would be is filled by an ordinary enum, and the difference is not the enum, it is who the compiler forces to deal with absence: the person who can actually handle it.

## Absence is in the type, not in the value

```rust
fn find_subscriber(email: &str) -> Option<Subscriber>
```

In most languages this returns `Subscriber`, and absence hides inside the value as null, waiting for a forgotten check to become a runtime crash somewhere far from the cause. Here, absence is in the _type_. You cannot call `.email` on an `Option<Subscriber>`; the code does not compile until you have said what happens in the `None` case. The billion-dollar mistake becomes a compile error at the exact line where the decision belongs.

```rust
match find_subscriber("a@b.com") {
    Some(sub) => println!("found {}", sub.name),
    None => println!("no such subscriber"),
}
```

## The everyday toolkit

`match` on every Option would be exhausting, so Option carries a method vocabulary. A handful covers real code:

```rust
let found = find_subscriber("a@b.com");

let name: Option<&str> = found.as_ref().map(|s| s.name.as_str());
let name_or: String = found.map(|s| s.name).unwrap_or_else(|| "guest".into());
let maybe_domain: Option<&str> = sub.email.split('@').nth(1);   // chaining producers
```

- `map`: transform the value if present, stay `None` otherwise.
- `and_then`: like map, when the transform itself returns an Option (flattens).
- `unwrap_or` / `unwrap_or_else` / `unwrap_or_default`: exit Option-land with a fallback.
- `is_some` / `is_none`: when you only need the fact, not the value.
- `ok_or`: upgrade an Option into a Result by naming the error absence implies.

The shape to internalise: stay inside Option while transforming, exit once, at the boundary where a concrete value is required, with an explicit story for `None`.

## unwrap, expect, and honesty

```rust
let sub = find_subscriber("a@b.com").unwrap();                 // panics on None
let sub = find_subscriber("a@b.com").expect("seeded in test"); // panics with your words
```

`unwrap` says "crash the program if absent." That is sometimes exactly right: in tests, in examples, and when some earlier check _proves_ presence and you want violation to be loud. The book takes a clear line you will meet again in chapter 6: panics are for bugs, Options and Results are for expected situations. `expect` with a message explaining _why it cannot be None_ is the honest form; an unexplained `unwrap` in application code is a review comment waiting to happen.

The `?` operator, which you will use constantly with Result in the next lesson, also works on Option inside functions returning Option: `let user = cache.get(id)?;` returns `None` early, keeping happy paths flat.

## Predict, then verify

```rust
let numbers = vec![1, 2, 3];
let doubled = numbers.first().map(|n| n * 2);
let missing: Option<i32> = Vec::<i32>::new().first().map(|n| n * 2);
println!("{:?} {:?}", doubled, missing);
```

What prints?

Answer: `Some(2) None`. `first()` returns `Option<&i32>`; `map` runs the closure only on the `Some` path, and passes `None` through untouched. No check was written, yet no absence was ignored: the pipeline carried the question "was there a first element?" all the way to the `println!`, which is the entire design in one line.
