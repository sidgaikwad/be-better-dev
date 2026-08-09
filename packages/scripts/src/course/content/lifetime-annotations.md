The syntax everyone fears, `<'a>`, does less than it appears to. An annotation never changes how long anything lives. It only _relates_ lifetimes the compiler already computed, so a signature can make a checkable promise.

## The problem annotations solve

```rust
fn longest(a: &str, b: &str) -> &str {
    if a.len() > b.len() { a } else { b }
}
```

This is E0106. The compiler checks callers from the signature alone, and the signature does not say whose lifetime the output borrows. If the answer is "could be either input", then the output is only safe while _both_ inputs live. Say exactly that:

```rust
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() > b.len() { a } else { b }
}
```

Read it as a sentence: _for some region `'a`, both inputs live at least that long, and the output is only usable inside it._ The compiler picks `'a` per call site, as the overlap of the two arguments' regions, and then enforces the promise:

```rust
let s1 = String::from("long string is long");
let result;
{
    let s2 = String::from("xyz");
    result = longest(&s1, &s2);   // 'a = the inner block (the overlap)
}
println!("{result}");             // error: borrowed value does not live long enough
```

`result` might borrow from `s2`, and `s2` is gone. The annotation is what let the compiler catch this at the call site without re-reading `longest`'s body.

If the output can only come from one input, say the narrower thing and callers get more freedom:

```rust
fn first<'a>(a: &'a str, _b: &str) -> &'a str { a }
```

## Elision: why you rarely write any of this

Most signatures fall into patterns so common the compiler fills them in. The three elision rules:

1. Each input reference gets its own fresh lifetime.
2. If there is exactly one input lifetime, the output borrows from it.
3. In methods, if `&self` or `&mut self` is present, the output borrows from `self`.

So `fn first_word(s: &str) -> &str` is complete as written (rule 2), and most methods returning references need nothing (rule 3). `longest` needed annotations precisely because it has _two_ input references and returns one: no rule applies, so the compiler asks you.

This reframes the annotation experience: **you are not adding lifetimes, you are answering a question the elision rules could not.**

## `'static`, the region that never ends

`&'static str` means "borrows from something alive for the whole program", which is exactly what string literals are: baked into the binary. Treat `'static` as a fact about literals and leaked allocations, not as an escape hatch. When a compiler suggestion says "consider using `'static`", it is usually the wrong fix for a design that wants owned data instead.

## Predict, then verify

```rust
fn shorten<'a>(s: &'a str) -> &'a str {
    &s[..5]
}

let owned = String::from("hello world");
let cut = shorten(&owned);
drop(owned);
println!("{cut}");
```

What does the compiler say?

Answer: `cannot move out of owned because it is borrowed`. The signature promises `cut` borrows from `owned` (one input, rule 2), so `drop(owned)` while `cut` is still used is exactly the dangling case the promise exists to prevent. Delete the `drop` or print first, and it compiles. The annotation did not extend anything's life; it connected two lifetimes so the checker could see the conflict.
