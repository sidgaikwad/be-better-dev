The UB lesson ended on an uncomfortable fact: a program can execute undefined behavior and pass every test, because nothing at runtime checks the rules. Miri is the tool that checks them.

```bash
rustup +nightly component add miri
cargo +nightly miri test
```

Miri is an interpreter. Instead of compiling to machine code, it executes your program's MIR, the compiler's mid-level representation, one operation at a time, and validates each one against the rules: for every byte it knows whether it is initialized, which allocation it belongs to, and whether that allocation is still live; for every pointer it tracks the provenance from the raw-pointers lesson, including the aliasing discipline, via its borrow-tracking models (Stacked Borrows, and the newer Tree Borrows).

Watch it catch the bug from _&mut T: one writer, no readers_, the one the borrow checker cannot see through raw pointers:

```rust
#[test]
fn stale_pointer() {
    let mut v = vec![1, 2, 3];
    let p = v.as_ptr();
    v.push(4);
    let first = unsafe { *p };
    assert_eq!(first, 1);
}
```

`cargo test`: passes, most days. The push reallocated (from _What an allocation costs_, growth moves the buffer), `p` points into freed memory, and the freed memory still holds a 1. `cargo miri test` fails with an error like:

```text
error: Undefined Behavior: out-of-bounds pointer use:
alloc1234 has been freed, so this pointer is dangling
```

Even when capacity would have made the push not reallocate, Miri still flags the program: the `&mut v` that `push` takes invalidates the earlier `p` under the aliasing rules. It checks the rules, not the symptoms, which is the entire point: it fails deterministically on programs that fail in production probabilistically.

The catch list: use-after-free, out-of-bounds access, unaligned access, reads of uninitialized memory, invalid values (the transmuted `bool` from the UB lesson), aliasing violations, data races in threaded tests, and memory leaks at exit.

## What it cannot do

Miri has three hard limits, and knowing them is as important as knowing the tool.

1. **It only checks executed code.** Miri is dynamic: its guarantees are bounded by your test coverage. A path no test reaches is a path Miri never sees, and silence about it means nothing.
2. **It cannot cross FFI.** A call into compiled C cannot be interpreted; beyond some shims for common libc functions, Miri stops at the boundary. The `unsafe` that wraps foreign code is exactly the `unsafe` Miri cannot audit, which is next lesson's problem.
3. **It is slow.** Interpreting costs tens to hundreds of times the native speed. The practice is a small, targeted suite over the modules that contain `unsafe`, run as its own CI job, not your whole integration suite.

There is also model precision: Stacked and Tree Borrows are the working formalization of Rust's aliasing rules, still being refined, so a clean run is strong evidence rather than a theorem. Miri helps itself by randomizing allocation addresses and alignments between runs; multiple seeds shake out more bugs.

The ecosystem treats it as table stakes for `unsafe`-bearing code: std's own tests run under Miri, and foundational crates run it in CI. Your newsletter service can stay at zero `unsafe` of its own; the crates under it earn trust partly this way.

## Predict, then verify

Recall `nth` from the first lesson, with its `# Safety` contract `i < v.len()`:

```rust
#[test]
fn reads_in_bounds() {
    let v = vec![10, 20, 30];
    assert_eq!(unsafe { nth(&v, 2) }, 30);
}
```

`cargo miri test` is green. A teammate concludes the `unsafe` can be dropped from `nth`'s signature, "since Miri proved it fine". Sound?

Answer: no. Miri validated one execution, `i = 2`, and said nothing about `i = 3`. Make `nth` safe and any caller may pass 3: unsound, by the last lesson's definition, with the UB sitting on a path no test executes, exactly where Miri is blind. The two tools compose rather than substitute: your reasoning quantifies over all inputs, Miri mechanically checks the inputs your tests realize.
