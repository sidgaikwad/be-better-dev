A full `match` for a single interesting case is ceremony. Rust's answer is that patterns are not a `match` feature, they are a language feature: `let`, `if`, `while`, function parameters, and `for` loops all accept the same pattern grammar.

## if let and while let: one case, minus the ceremony

```rust
if let Some(sub) = find_subscriber(email) {
    send_welcome(&sub);
}
```

Read: _if the pattern fits, bind and run the block._ The other cases are simply not your concern here (add `else` when they are). `while let` is the loop form, and is the idiomatic way to drain anything:

```rust
while let Some(job) = queue.pop() {
    process(job);
}
```

The trade against `match` is explicit: you give up exhaustiveness checking for brevity. That is fine for "do something extra in one case", and wrong for "route every case somewhere". If you find yourself stacking `if let`/`else if let` over the same value, the compiler has no way to tell you a case went missing; that shape wants to be a `match` again.

## let-else: the guard clause, typed

The newest of the family (stable since 2022) solves the early-return shape that dominates request handlers:

```rust
fn handle(input: &str) -> Result<Response, ApiError> {
    let Some(id) = parse_id(input) else {
        return Err(ApiError::BadRequest);
    };
    // id is bound here, in the OUTER scope, for the rest of the function
    lookup(id)
}
```

`let Some(id) = ... else { ... }` requires the else block to diverge (return, break, panic), and in exchange binds the success case without indentation. Compare the `if let` version, where the happy path lives inside a nested block for the rest of the function. Flat happy paths, early exits for the rest: the same shape `?` gives Result pipelines, available for any pattern.

## Destructuring: patterns in let and parameters

Any irrefutable pattern (one that always fits) works directly in `let` and in function parameters:

```rust
let (name, domain) = split_email(&email);          // tuple apart, two bindings

let Subscriber { email, confirmed, .. } = sub;      // struct apart; .. skips the rest

for (index, line) in lines.iter().enumerate() {     // for loops are patterns too
    println!("{index}: {line}");
}
```

This is the answer promised back in the Copy-versus-move lesson: destructuring is the idiomatic way to take a tuple or struct apart, and each field moves (or copies, if `Copy`) into its own binding under the ordinary ownership rules. Add `ref` or match on `&sub` when you want to destructure by borrowing instead of moving.

The refutable/irrefutable line is where the compiler draws its rules: `let` and parameters demand patterns that cannot fail (`let Some(x) = maybe;` is an error), while `if let`, `while let`, `let-else`, and `match` arms exist precisely to host the ones that can.

## Predict, then verify

```rust
let pairs = vec![("a", 1), ("b", 2), ("c", 3)];
let mut total = 0;
for (_, n) in &pairs {
    total += n;
}
println!("{total} and still have {} pairs", pairs.len());
```

Does this compile, and why does `pairs` survive the loop?

Answer: it compiles and prints `6 and still have 3 pairs`. Iterating `&pairs` yields references to the tuples, the pattern `(_, n)` destructures through the reference (so `n` is a `&i32`, and `+=` auto-derefs it), and nothing was moved out of the vector. Drop the `&` and iterate `pairs` by value, and the loop consumes the vector: the final `pairs.len()` becomes a borrow-of-moved-value error. One ampersand, and every rule from the ownership section decides what the loop leaves behind.
