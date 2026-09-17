Here is a program that uses `unsafe` and still does not compile:

```rust
let mut v = vec![1, 2, 3];
unsafe {
    let a = &mut v;
    let b = &mut v;   // error[E0499]: cannot borrow `v` as mutable more than once at a time
    a.push(4);
    b.push(5);
}
```

If `unsafe` switched the rules off, this would build. It does not, because that is not what the keyword does.

## Five permissions

An `unsafe` block enables exactly five operations that safe Rust refuses:

1. dereference a raw pointer
2. call an `unsafe` function or method, including foreign functions
3. read or write a mutable `static`
4. implement an `unsafe` trait
5. access the fields of a `union`

That is the whole list. Everything else behaves exactly as before inside the block. The borrow checker still runs, as the rejection above shows. Types still have to match. Lifetimes are still enforced. Moves are still moves. Even runtime checks stay:

```rust
let v = vec![1, 2, 3];
unsafe {
    println!("{}", v[10]);   // panics: index out of bounds: the len is 3 but the index is 10
}
```

Indexing is a safe API with a bounds check, and wrapping the call in `unsafe` changes nothing about it. To skip the check you call a different function, `v.get_unchecked(10)`, which is marked `unsafe` precisely because it removes the guard and makes the bound your problem.

## What the keyword actually claims

In _What the borrow checker proves_, the compiler was a prover: it accepts a program only when it can construct a proof that the rules hold. Some true programs are beyond it. `unsafe` is the keyword for those places, and it means: the rules still hold here, and I am supplying the proof myself, because the compiler cannot.

It never means "no rules". Aliasing XOR mutation, from _&mut T: one writer, no readers_, still binds inside an `unsafe` block. The block merely hands you tools, raw pointers above all, that are physically capable of violating the rule, with nothing but your reasoning in the way. What happens when the reasoning is wrong is the next lesson's subject: undefined behavior.

The keyword appears in two positions, marking opposite sides of one obligation. An `unsafe` block says: the obligation is discharged here, by me. An `unsafe fn` says: this function has preconditions the type system cannot express, and meeting them is the caller's job. By convention, every `unsafe fn` states them under a `# Safety` heading:

```rust
/// Returns the element without checking the bound.
///
/// # Safety
/// `i` must be less than `v.len()`.
unsafe fn nth(v: &[i32], i: usize) -> i32 {
    unsafe { *v.get_unchecked(i) }
}
```

Note the block inside the `unsafe fn`. Since the 2024 edition, the body of an `unsafe fn` is not implicitly an `unsafe` block, so each dangerous operation is marked at its exact site rather than blessed wholesale by the signature.

## Why a keyword at all

One level down, `unsafe` is a search index. `grep -rn unsafe src/` enumerates every line of a project where undefined behavior could possibly originate. If memory is corrupted in a 50,000-line Rust service with twelve `unsafe` blocks, the suspect list is twelve sites and the modules around them, not 50,000 lines. C offers no such deal: in C, every line is inside the block. Production teams lean on this hard. Many enable the clippy lint `undocumented_unsafe_blocks`, so every block must carry a `// SAFETY:` comment stating its proof, which turns review into checking an argument instead of reconstructing one.

## Predict, then verify

Does this compile, and if so, what does it print?

```rust
let s = String::from("hi");
let _t = s;
unsafe {
    println!("{s}");
}
```

Answer: rejected with error[E0382]: borrow of moved value: `s`. Ownership, from _One owner per value_, is a compile-time system, and `unsafe` does not loosen compile-time checks: `s` moved into `_t`, so `s` is unusable, keyword or not. The block unlocks five operations; it does not resurrect moved values, silence the borrow checker, or skip bounds checks.
