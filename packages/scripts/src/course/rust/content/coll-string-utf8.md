A subscriber signs up as `Zoë`, and the greeting code reaches for the first letter:

```rust
let name = String::from("Zoë");
let initial = name[0];
```

```
error[E0277]: the type `String` cannot be indexed by `{integer}`
  = help: the trait `Index<{integer}>` is not implemented for `String`
```

Not a lint, not a warning: `String` simply does not implement indexing by position. To see why, look at what is actually in the buffer.

## Bytes, scalars, graphemes

A `String` is a `Vec<u8>` plus one guarantee: the bytes are always valid UTF-8. UTF-8 encodes each Unicode scalar value in 1 to 4 bytes. ASCII stays at 1, `ë` takes 2, most CJK characters take 3, emoji take 4.

```rust
let name = "Zoë";
println!("{}", name.len());           // 4  (bytes: Z, o, 0xC3, 0xAB)
println!("{}", name.chars().count()); // 3  (Z, o, ë)
```

`len` counts bytes. `bytes()` iterates them as `u8`. `chars()` walks the buffer decoding one scalar at a time and yields `char`, a 4-byte scalar value. Both iterators are honest about cost: `name.chars().nth(2)` visibly scans from the start, and `char_indices()` gives you each scalar with its byte offset when you need both.

One level above the scalar sits the grapheme, what a reader calls "a character". `é` can be a single scalar or `e` followed by a combining accent: two `char`s, one visible glyph. A flag emoji is two scalars. `chars()` does not model any of that; the `unicode-segmentation` crate does. For most server code, byte-level thinking plus `chars()` for display logic is enough, but know the caveat before you truncate or reverse text users typed.

## Why O(1) indexing is impossible

Because widths vary, the byte offset of the nth character depends on the width of every character before it. There are only two things `name[2]` could mean:

1. The third _byte_: constant time, but it can hand you half of `ë` and break the UTF-8 guarantee.
2. The third _char_: honest, but O(n), while `[]` everywhere else in Rust is constant time.

Rust refuses to pick a default and makes you say which one you meant. Byte-range slicing exists, checked at runtime:

```rust
let s = "Zoë";
let cut = &s[..3];
```

```
thread 'main' panicked at src/main.rs:2:16:
byte index 3 is not a char boundary; it is inside 'ë' (bytes 2..4) of `Zoë`
```

The panic is the guarantee defending itself. As with `v.get(..)` from the slices lesson, `s.get(..3)` returns an `Option` instead of panicking, and `s.is_char_boundary(i)` lets you walk a cut point backward to safety. That pair is how you shorten a subject line to fit a limit without corrupting someone's name.

## Why UTF-8 anyway

The layout earns its complications. ASCII costs 1 byte per character instead of the 4 that a fixed-width encoding would spend, and every ASCII file is already valid UTF-8. Continuation bytes all match the bit pattern `10xxxxxx`, so a decoder dropped at a random offset finds the next boundary within 3 bytes: the encoding is self-synchronizing, and `is_char_boundary` is a one-byte check. And `&str`, from the slices lesson, is exactly `&[u8]` with the validity guarantee riding along: two words, pointer and byte length, over anyone's text.

## Predict, then verify

```rust
let s = "naïve";
println!("{} {}", s.len(), s.chars().count());
```

What prints?

Answer: `6 5`. Five scalar values, but `ï` encodes as 2 bytes, so the byte length is 6. Any code that mixes the two counts, sizing a buffer from `chars().count()` or slicing at `len() / 2`, is a bug waiting for its first non-ASCII subscriber. Keep the two questions separate: bytes for storage and slicing, chars for display logic, graphemes when a human is counting.
