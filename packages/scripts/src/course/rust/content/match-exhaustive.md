`match` is where enums pay off. It is not a switch statement; it is a proof obligation: handle every shape this value can take, or the program does not compile.

## Match is an expression that must cover everything

```rust
enum OrderStatus {
    Pending,
    Shipped { tracking: String },
    Cancelled { reason: String },
}

fn describe(status: &OrderStatus) -> String {
    match status {
        OrderStatus::Pending => "waiting to ship".into(),
        OrderStatus::Shipped { tracking } => format!("shipped: {tracking}"),
        OrderStatus::Cancelled { reason } => format!("cancelled: {reason}"),
    }
}
```

Three things distinguish this from a switch:

- **It is an expression.** Each arm produces a value; the match itself is the function body. No mutable temp, no fallthrough, no `break`.
- **It destructures.** The `tracking` binding pulls the payload out of the variant in the same stroke that identifies it. You can never read `tracking` on a `Pending`; the field only exists inside its arm.
- **It is exhaustive.** Delete the `Cancelled` arm and compilation fails with `non-exhaustive patterns: OrderStatus::Cancelled { .. } not covered`. The compiler knows the full set of variants and holds you to it.

## Exhaustiveness is a refactoring tool

The real payoff arrives months later, when requirements change. Add a variant:

```rust
enum OrderStatus {
    Pending,
    Shipped { tracking: String },
    Delivered { at: String },     // new
    Cancelled { reason: String },
}
```

Every `match` on `OrderStatus` in the entire codebase now fails to compile, each error naming the file, the line, and the missing case. The compiler just handed you a complete, guaranteed-exhaustive worklist of every place that must consider the new state. In languages where the switch has a default arm, this worklist does not exist; the new case silently falls into `default` everywhere and you find the misses in production.

Which is why the wildcard arm deserves suspicion:

```rust
match status {
    OrderStatus::Shipped { tracking } => notify(tracking),
    _ => {}    // swallows Pending, Cancelled, and every FUTURE variant
}
```

`_` is honest when unlisted cases genuinely share one behavior. It is a trap when it exists to quiet the compiler, because it also quiets the refactoring worklist. Prefer listing variants; reach for `_` deliberately, not habitually.

Matches also check the other direction: an arm that can never be reached (already covered by an earlier pattern) is an `unreachable_pattern` warning. Arm order matters; first match wins.

## Guards and bindings, the two extras worth knowing early

```rust
match order.total_cents {
    0 => Discount::Free,
    n if n < 1000 => Discount::None,
    n => Discount::Percent(if n > 100_000 { 10 } else { 5 }),
}
```

A guard (`if n < 1000`) refines a pattern with a runtime condition; the compiler then treats that arm as possibly-not-matching, so something after it must still complete the coverage. Bindings (`n`) name whatever the pattern matched. Between patterns, guards, and bindings, most conditional logic over data shapes itself into a match, and the book's request-handling code in Part 3 is one long demonstration.

## Predict, then verify

```rust
fn check(n: Option<i32>) -> &'static str {
    match n {
        Some(x) if x > 0 => "positive",
        Some(_) => "zero or negative",
    }
}
```

The two arms cover `Some(positive)` and `Some(anything)`. What does the compiler say?

Answer: `non-exhaustive patterns: None not covered`. Guards do not count toward coverage (the compiler treats `Some(x) if ...` as possibly failing), so the second arm covers all remaining `Some`, but nothing covers `None`. Add a `None => ...` arm and it compiles. The prover only credits what it can verify, which is exactly the property that makes its worklists trustworthy.
