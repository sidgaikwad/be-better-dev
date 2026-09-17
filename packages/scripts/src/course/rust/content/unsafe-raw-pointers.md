No `unsafe` keyword appears in this program:

```rust
let x = 42;
let p: *const i32 = &x;
let q = 0xdead_beef as *const i32;
println!("{p:?} {q:?}");
```

It compiles and prints two addresses, one real, one invented. Creating raw pointers, even absurd ones, is safe. Comparing them, printing them, storing them in structs: all safe. The keyword appears at exactly one operation:

```rust
let v = unsafe { *p };
```

The line is drawn where memory is touched. A wrong address in a variable harms nothing; following it does.

## An address, and nothing else

A `*const T` or `*mut T` is an address plus a type for interpreting what it points at. Recall everything a reference carries, from _&T: look, don't touch_ and the lifetime lessons: guaranteed non-null, aligned, pointing at a live initialized value, aliasing tracked, lifetime attached. A raw pointer promises none of it. It may be null, dangling, unaligned, or overlapping another pointer, and once created it is invisible to the borrow checker, which is exactly why the dangling program in the UB lesson compiled.

`*const T` versus `*mut T` is declared intent, not enforcement: `as` casts freely in both directions. What governs defined behavior is derivation. A pointer derived from `&mut` may write; one derived from a shared `&` may not, no matter how it is cast, because aliasing XOR mutation from _&mut T: one writer, no readers_ applies to the memory, not to the pointer's type.

Three ways to make one:

```rust
let mut x = 5i32;
let a = &x as *const i32;     // cast from a shared reference
let b = &mut x as *mut i32;   // cast from an exclusive reference
let c = &raw mut x;           // no intermediate reference (stable since Rust 1.82)
```

`&raw` exists because sometimes even the intermediate reference would be instant UB: a field of a `#[repr(packed)]` struct can be unaligned, references promise alignment (an invalid-value rule from the last lesson), so you must take its address without ever materializing `&`.

Arithmetic counts elements, not bytes:

```rust
let a = [10i32, 20, 30];
let p = a.as_ptr();
let second = unsafe { *p.add(1) };   // 20: add(1) moves 4 bytes here
```

## You already own thousands of them

From _Stack and heap, for real_, a `Vec` is (ptr, len, cap). That ptr is a raw pointer. `String`, `Box`, every collection: raw pointers inside, managed by code that upholds the contract for you. The dereference contract, in full: the pointer is non-null, aligned, in bounds of a single live allocation, the memory is initialized, and the access respects the aliasing rules. Every `unsafe { *p }` is a claim that all five hold.

## Provenance, one level down

Two pointers with equal addresses are not interchangeable. A pointer carries provenance: a record of which allocation it was derived from and what access that derivation permits. `0xdead_beef as *const i32` has an address but no provenance, so dereferencing it is UB even if some allocation happens to live there. This is why integer-to-pointer round trips are being formalized under the strict provenance APIs (`with_addr`, `expose_provenance`), and why Miri, next unit, can catch fabricated pointers: it tracks provenance exactly. An address is a number; a pointer is a number plus a permission.

## Predict, then verify

```rust
let mut a = [10, 20, 30];
let p = a.as_mut_ptr();
let end = unsafe { p.add(3) };
let v = unsafe { *end };
```

Two unsafe operations: computing `p.add(3)` and dereferencing it. Which is UB?

Answer: only the dereference. `add`'s contract permits offsets that stay within the allocation or land exactly one element past its end, and one-past-the-end is a legal, useful position: slice iterators carry exactly that pointer as their finish line. Reading it, though, touches memory outside the allocation: UB. For contrast, `p.add(4)` would violate the arithmetic contract itself and be UB with no read required.
