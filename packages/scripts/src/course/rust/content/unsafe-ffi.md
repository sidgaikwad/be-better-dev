The smallest possible foreign function call:

```rust
unsafe extern "C" {
    fn abs(input: i32) -> i32;
}

fn main() {
    println!("{}", unsafe { abs(-3) });   // 3
}
```

`extern "C"` names an ABI, a calling convention: which registers and stack slots carry the arguments, who cleans up. Rust's own ABI is deliberately unstable, so C's is the fixed meeting point, the one every OS and language speaks. The declaration tells Rust a function with this name and shape exists somewhere; the linker later finds the symbol, by name alone, in libc.

Since the 2024 edition the block itself is written `unsafe extern`, because declaring is already a claim the compiler cannot check. You can even mark a declared item `safe fn` to let callers skip the block; doing so is you asserting the C function is harmless for all inputs. `abs` qualifies. Most C functions do not, so most declarations stay `unsafe`.

## The cost is trust, not cycles

Coming from TypeScript you may expect a bridge: Node native addons cross N-API with handle conversion and overhead. Here there is none. That call compiles to the same call instruction C would emit; the boundary costs about a function call, plus a lost inlining opportunity, since the optimizer must treat the call as opaque.

What you actually pay: every guarantee in this course stops at the boundary. The borrow checker cannot see what C does with a pointer you pass. Lifetimes are not communicated. _Drop: deterministic cleanup_ does not manage what C allocates. The compiler verifies nothing about the far side, not even that your declared signature matches reality. Proof ends; trust begins. That is why each call is `unsafe`, and why the previous lesson matters: Miri cannot interpret compiled C, so FFI-wrapping `unsafe` is audited by reading, not by tooling.

Data crossing over needs agreement too:

```rust
#[repr(C)]
struct Span {
    start: u32,
    len: u32,
}
```

Rust's default layout is unspecified: the compiler may reorder fields, the same layout freedom that bought the niche trick in _Enums: one of several shapes_. Across an ABI both sides must agree on offsets, so `#[repr(C)]` opts into C's declaration-order layout. The niche shows up here too, as a guarantee: `Option<&T>` and `Option<extern "C" fn()>` are pointer-sized with `None` as NULL, the blessed way to handle nullable pointers. And `&str` is not NUL-terminated; `CString`/`CStr` exist for the conversion, the first bug everyone writes.

## Why bindgen exists

A real C library is hundreds of functions and types. Transcribing headers by hand invites the worst failure mode: a wrong signature is not a compile error or a link error, it is UB at the call. So bindgen parses the actual headers with libclang and generates the declarations. The ecosystem convention stacks the last lesson on top: generated raw bindings live in a `*-sys` crate (`libsqlite3-sys`), and a safe crate wraps it (`rusqlite`), unsafe at the bottom, proof in the wrapper, safe API on top: the sound-abstraction discipline at ecosystem scale.

## Auditing the unsafe you inherit

Your newsletter service can declare `#![forbid(unsafe_code)]`: the compiler then rejects any `unsafe` in that crate, a real, checkable statement to reviewers. It says nothing about dependencies. Under you, tokio, actix-web, sqlx, and the TLS stack all contain `unsafe`; some build actual C. `cargo geiger` walks the dependency tree and counts `unsafe` per crate: a crude proxy (counts are not danger, and the tool has had maintenance gaps), but it shows where trust concentrates. `cargo audit` checks the RustSec database, which files unsoundness as advisories.

The real backstop is cultural: SAFETY comments, Miri in CI, heavily reviewed foundational crates, vetted `bytemuck` or `zerocopy` instead of a homegrown transmute. Safe Rust's promise, no UB without the keyword, is conditional on every `unsafe` block beneath you being sound. The habits above are what make the condition mostly true, and adopting them is part of writing Rust.

## Predict, then verify

You declare `unsafe extern "C" { fn abs(input: i64) -> i64; }`. The real C signature takes and returns 32-bit `int`. What happens at build time, and at run time?

Answer: it builds and links cleanly. Declarations are trusted, and a C symbol carries a name, not a type. At run time it is UB: on x86-64 the caller places an `i64` in a register whose low half the callee reads, so small values appear to work while others return garbage, and platforms disagree. Silent, input-dependent, invisible to Miri: the exact failure bindgen exists to prevent.
