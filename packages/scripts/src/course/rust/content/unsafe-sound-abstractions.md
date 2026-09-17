Some operations are obviously fine and still rejected. Splitting a slice into two disjoint mutable halves is the classic:

```rust
fn halves(v: &mut [i32]) -> (&mut [i32], &mut [i32]) {
    let mid = v.len() / 2;
    (&mut v[..mid], &mut v[mid..])
    // error[E0499]: cannot borrow `*v` as mutable more than once at a time
}
```

The ranges cannot overlap, so no aliasing rule is threatened. But from _What the borrow checker proves_, the checker is a conservative prover that reasons about variables, not index ranges: two `&mut` from `v` is two `&mut` from `v`, rejected. The standard library hits this exact wall in `split_at_mut` and resolves it with `unsafe`:

```rust
use std::slice;

fn split_at_mut(v: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = v.len();
    let ptr = v.as_mut_ptr();
    assert!(mid <= len);
    unsafe {
        (
            slice::from_raw_parts_mut(ptr, mid),
            slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}
```

The block's proof: the slices cover `[0, mid)` and `[mid, len)`, which never overlap, so each location still has one writer and aliasing XOR mutation holds. The `assert!` is not decoration; it is the proof's first premise. And notice the payoff: the function's signature is fully safe. Callers get two `&mut` halves, the borrow checker governs them from there, and no caller can tell there is `unsafe` inside.

## Soundness

An API is _sound_ when no possible safe caller, however adversarial, can cause undefined behavior through it. `split_at_mut` handles every input: valid split or clean panic. It is _unsound_ if some sequence of safe calls triggers UB, even one nobody has written yet. Unsound code is treated as broken in the Rust world before any crash exists, because it silently invalidates the guarantee every downstream crate is built on.

This is the discipline's core move: encapsulation of the proof. Callers receive the theorem, a safe signature they can use freely. The proof obligations stay inside, discharged once, reviewed once.

## Soundness is a module property

`Vec` runs the same play at scale. From _Stack and heap, for real_, it is (ptr, len, cap), with an invariant: `len <= cap`, the first `len` elements are initialized, and ptr owns a buffer that `Drop`, from _Drop: deterministic cleanup_, frees exactly once. Dozens of `unsafe` blocks inside `Vec` rely on that invariant. Now suppose `len` were a public field:

```rust
let mut v: Vec<i32> = Vec::with_capacity(8);
// v.len = 8;   // if this compiled, v[7] would then read uninitialized memory
```

The attacking code contains no `unsafe` at all, and the resulting UB would be `Vec`'s bug: its `unsafe` relied on an invariant that safe code was permitted to break. So the unit of review is never the `unsafe` block alone. It is the module boundary within which the invariant can be touched: every function, safe or not, that can reach the private fields. Field privacy is a soundness mechanism, not tidiness. `pub` is part of your proof.

## The discipline in practice

Keep `unsafe` in a small module with the invariant written at the top. Give every block a `// SAFETY:` comment stating why its obligations hold; the std source does this everywhere, and clippy's `undocumented_unsafe_blocks` enforces it. Then test that module hard, including under Miri, next lesson. The goal state: users of your crate never read your source to stay safe, exactly as you have never read `Vec`'s.

## Predict, then verify

Delete the `assert!(mid <= len)` from `split_at_mut` above, keeping the safe signature. Is the function now unsound, and what happens for a caller passing `mid = len + 10`?

Answer: unsound, by definition: a safe call now reaches UB. `from_raw_parts_mut(ptr, mid)` fabricates a slice extending ten elements past the allocation, which already violates that function's documented contract, so UB begins at creation, before any element is touched. The second length, `len - mid`, underflows as a bonus: panic in debug, an absurd wrapped length in release. One line of `assert!` was the entire difference between a sound API and a latent memory-safety hole.
