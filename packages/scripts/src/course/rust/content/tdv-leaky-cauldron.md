Three sections ago the newsletter signed up its first subscriber; last section it went live. It is deployed, instrumented, and it accepts absolutely anything. Chapter 6 opens by proving that with an integration test that posts troublesome payloads at `POST /subscriptions`:

```rust
let test_cases = vec![
    ("name=&email=ursula_le_guin%40gmail.com", "empty name"),
    ("name=Ursula&email=", "empty email"),
    ("name=Ursula&email=definitely-not-an-email", "invalid email"),
];
```

The test asserts `200 OK` for each case, and it passes. That is the bug: three invalid subscribers ride straight into Postgres, waiting to break newsletter delivery weeks from now.

## What a name must satisfy

Deciding what makes a name _valid_ is a fool's errand (real names break every assumption you can write down), and we only use it in a greeting line. So the requirements stay modest, and they are mostly about security:

- non-empty: at least one non-whitespace character;
- at most 256 graphemes: the `TEXT` column is effectively unbounded, and unbounded attacker-controlled input is a denial-of-service surface;
- none of `/ ( ) " < > \ { }`: common in SQL fragments and HTML, rare in names. Rejecting them raises the bar for injection and phishing. It is one layer of defense in depth, never the only one.

The obvious implementation is a check:

```rust
use unicode_segmentation::UnicodeSegmentation;

pub fn is_valid_name(s: &str) -> bool {
    let is_empty_or_whitespace = s.trim().is_empty();
    // A grapheme is a user-perceived character: "å" is one grapheme, two chars.
    let is_too_long = s.graphemes(true).count() > 256;
    let forbidden = ['/', '(', ')', '"', '<', '>', '\\', '{', '}'];
    let has_forbidden = s.chars().any(|c| forbidden.contains(&c));
    !(is_empty_or_whitespace || is_too_long || has_forbidden)
}
```

Call it at the top of the handler, return `400` on `false`, done. It looks like a solution. The chapter's central claim is that it gives a false sense of safety.

## The cauldron leaks

Look downstream at `insert_subscriber` and imagine it needs `form.name` to be non-empty, or something horrible happens. Can it assume that? Not from anything it can see: its parameter is a `String`, and a `String` guarantees nothing about its content. "We check at the edge, so everything after is safe" is a claim about the whole program. To trust it you must inspect every call site, today's and every future one. That is _global_ reasoning, and it decays: `insert_subscriber` gets split into helpers that each inherit the requirement, a second endpoint inserts subscribers and skips the check nobody told its author about, a load-bearing validation in an obscure corner gets deleted because no one remembers why it exists. Software is a living artifact; whole-system understanding is the first thing time takes.

If we stick with `is_valid_name`, the only honest move is to validate again inside every function that needs the invariant. That is the leaky cauldron: `is_valid_name` establishes that at one instant, on one code path, the conditions held. Then it returns a `bool` and the proof evaporates. The fact about the input's structure is stored nowhere, so no other code can reuse it, and every consumer must re-derive it.

## Where facts survive

Part 1's borrow-checker lesson showed why Rust verifies each function against signatures alone: local reasoning is the only kind that scales. The same standard applies to our own invariants. What we want is not a validation function but a _parsing_ function: take unstructured input and, if the checks pass, return a more structured output, a type that cannot exist unless the checks passed. Then the fact lives in the type, travels through every signature, and the compiler re-asserts it at every call boundary for free. Building that type, `SubscriberName`, is the next lesson.

## Predict, then verify

`is_valid_name` ships, wired into the one handler, and it is correct. Months later a teammate adds a CSV import endpoint that calls `insert_subscriber` directly. What does the compiler say about the missing validation?

Answer: nothing. The parameter is a `String`, any `String` satisfies the type checker, and the unvalidated path compiles cleanly and writes garbage. That silence is the whole argument: a boolean check constrains one path, at runtime, if everyone remembers it. A type constrains every path, at compile time, whether anyone remembers or not.
