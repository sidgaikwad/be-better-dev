Slices are borrowing applied to _part_ of something, and they complete the picture of why Rust APIs look the way they do.

## A view, not a copy

```rust
let v = vec![10, 20, 30, 40, 50];
let middle: &[i32] = &v[1..4];
println!("{:?}", middle);   // [20, 30, 40]
```

`middle` copies nothing. It is a _fat pointer_: two words, a pointer to element 1 and a length of 3. That is the entire runtime representation of `&[T]`, and it is why slicing a million-element Vec costs the same as slicing a ten-element one.

```
v:      { ptr ─────▶ [10, 20, 30, 40, 50], len 5, cap 8 }
                          ▲
middle: { ptr ────────────┘ len 3 }
```

`&str` is exactly this shape over UTF-8 bytes, which finally closes the loop from the very first memory lesson: a `String` owns a heap buffer; a `&str` is a two-word view into anyone's text, a `String`'s buffer, a literal in the binary, a section of another `&str`.

Being borrows, slices obey every rule you already know. A slice is a shared borrow of the whole collection it views, so mutation is locked out while it lives; `v.push(60)` while `middle` exists is the same rejected program as the Vec lesson, wearing new syntax.

## The API design payoff

Compare three candidate signatures for a function that sums numbers:

```rust
fn sum(v: Vec<i32>) -> i32      // consumes; caller loses the Vec
fn sum(v: &Vec<i32>) -> i32     // borrows, but only accepts Vec
fn sum(v: &[i32]) -> i32        // borrows, accepts Vec, arrays, other slices
```

The slice version accepts `&v`, `&[1, 2, 3]`, `&v[10..20]`, anything contiguous, through the same deref coercion that turns `&String` into `&str`. Taking `&[T]` and `&str` at boundaries is not a style preference; it is the widest possible front door at zero cost, and it is what the standard library does everywhere.

One caution that the type system will not catch for you: slice _indexing_ panics on out-of-range, `&v[1..10]` on a five-element Vec aborts at runtime. When the range comes from user input, use `v.get(1..10)`, which returns an `Option` instead. Panics versus Options is a chapter 6 theme in the book; slices are where it first bites.

## Predict, then verify

```rust
fn first_word(s: &str) -> &str {
    match s.find(' ') {
        Some(i) => &s[..i],
        None => s,
    }
}

let mut sentence = String::from("hello world");
let word = first_word(&sentence);
sentence.clear();
println!("{word}");
```

What does the compiler say, and which three lessons is it enforcing at once?

Answer: `cannot borrow sentence as mutable because it is also borrowed as immutable`. `word` is a slice into `sentence`'s buffer (elision rule 2 tied them together), `clear` needs `&mut self`, and `word` is still used afterward. Aliasing XOR mutation, lifetimes at the function boundary, and slices as borrows, one error message, all three rules cooperating to stop a read of freed-in-spirit memory.
