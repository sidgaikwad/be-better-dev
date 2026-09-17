This compiles, runs, and may well print 42:

```rust
fn main() {
    let p: *const i32;
    {
        let x = 42;
        p = &x;
    }
    println!("{}", unsafe { *p });
}
```

It compiles because raw pointers are invisible to the borrow checker: no borrow of `x` outlives `x`, as far as it can see. It is still, by the language's definition, a broken program. Reading `*p` after `x` is gone is undefined behavior, and "it printed 42" is one of the behaviors that "undefined" includes.

## The actual list

Undefined behavior is any violation of the validity rules that `unsafe` code promises to uphold. Four families cover most of it:

- **Dangling pointers.** Reading or writing memory that was freed or whose owner is gone: the use-after-free from _No dangling: why lifetimes exist_, reachable again because the checker cannot see through raw pointers.
- **Aliasing violations.** The rule from _&mut T: one writer, no readers_ is not a borrow-checker preference, it is a validity requirement. Two live `&mut` to the same memory, or a write through a `*mut` while a shared reference is live, is UB even though raw pointers make it expressible.
- **Invalid values.** Every type has bit patterns that must never exist: a `bool` other than 0 or 1, a null or unaligned reference, an enum discriminant that is not one of its variants.
- **Data races.** Unsynchronized access from two threads where at least one writes. Part 2 covers how safe Rust excludes these.

Invalid values connect straight to layout. From _Enums: one of several shapes_, `Option<&i32>` has no tag byte: the niche optimization stores `None` as the null pattern, legal only because a valid reference is never null.

```rust
let r: &i32 = unsafe { std::mem::transmute(0usize) };  // invalid value: UB right here
let o = Some(r);                                       // bit-identical to None
```

`o` is `Some` in the source and `None` in the bits. A `match` may take either arm, or different arms at different optimization levels. Break the validity premise and every layout decision built on it collapses.

## "The optimizer may assume it never happens"

Each optimization is a small theorem: this rewrite preserves the behavior of every program that has no UB. A program with UB is outside the theorem, so any rewrite is licensed. Concretely:

```rust
unsafe fn read_or_zero(p: *const i32) -> i32 {
    let v = unsafe { *p };
    if p.is_null() {
        return 0;
    }
    v
}
```

The first line dereferences `p`, which asserts `p` is valid, so `is_null` is provably false and the check may be deleted. Checked-then-read is fine; read-then-checked makes the guard dead code by assumption. Real compilers do this, and the C equivalent has produced real kernel vulnerabilities: check deleted, attacker maps page zero.

This is the same machinery that makes correct code fast. In _&mut T: one writer, no readers_, exclusivity let values live in registers; here, validity lets a branch disappear. One assumption engine serves both. Feed it truths and it optimizes; feed it a falsehood, which is what UB is, and it "optimizes" your program into something else. The damage is not even local: after inlining, an assumption born in one function rewrites another, and symptoms can surface before the offending line runs.

## Why "it works" proves nothing

UB is a property of an execution under a particular compilation, not of source text. The dangling read printed 42 because that stack slot still held 42 under this compiler, this optimization level, this inlining. A toolchain upgrade can change which assumption gets exploited, which is how code "works for years" and then breaks with no diff. Tests cannot argue soundness. The next lessons supply what can: a discipline for structuring the proof, and Miri, a tool that mechanically checks executions.

## Predict, then verify

```rust
let b: bool = unsafe { std::mem::transmute(2u8) };
if b {
    println!("yes");
} else {
    println!("no");
}
```

What can this print?

Answer: anything: "yes", "no", or neither. `bool`'s only valid patterns are 0 and 1, so the transmute is UB at once. A compiler may lower the `if` through a computed jump indexed by the byte, and 2 is past the end of that table. There is no "2 is truthy like JavaScript" story, because there is no value at all, only a broken premise. Miri, two lessons from now, rejects this exact program.
