import type { SectionSeed } from "../types"

export const unsafeAndFfi: SectionSeed = {
  slug: "unsafe-and-ffi",
  title: "Unsafe Rust and FFI",
  description: "What unsafe actually turns off, undefined behavior, Miri, calling C.",
  badgeIcon: "☢️",
  badgeTitle: "Unsafe",
  units: [
    {
      slug: "what-unsafe-means",
      title: "What unsafe means",
      description:
        "The five permissions, everything still checked, and undefined behavior up close.",
      lessons: [
        {
          slug: "unsafe-superpowers",
          title: "unsafe: five permissions, not an off switch",
          summary: "What an unsafe block permits, and the long list of checks it never disables.",
          contentFile: "unsafe-superpowers.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which operation does an `unsafe` block actually make legal?",
              options: [
                "Holding two `&mut` to the same value",
                "Dereferencing a raw pointer",
                "Indexing a Vec out of bounds without a panic",
                "Using a value after it was moved",
              ],
              answer: 1,
              explanation:
                "Only the five permissions change. Double `&mut`, moved values, and bounds checks are governed by checks that run identically inside unsafe blocks.",
            },
            {
              kind: "predict",
              prompt:
                "Inside `unsafe { }` you write `let a = &mut v; let b = &mut v; a.push(1);`. What happens?",
              options: [
                "Compiles; unsafe disables the borrow checker",
                "Compiles, but it is undefined behavior",
                "Rejected with E0499, exactly as in safe code",
                "Compiles only if `b` is never used",
              ],
              answer: 2,
              explanation:
                "The borrow checker runs everywhere, unsafe or not. The block grants five extra operations and stops no analysis.",
            },
            {
              kind: "mcq",
              prompt: "What does marking a function `unsafe fn` communicate?",
              options: [
                "Its body skips borrow checking",
                "It has preconditions the type system cannot express, which callers must uphold",
                "It runs faster than a safe version",
                "It may only be called from other unsafe fns",
              ],
              answer: 1,
              explanation:
                "unsafe fn moves an obligation to the caller, documented under # Safety. The body still gets full checking and, since edition 2024, even needs its own unsafe blocks.",
            },
          ],
        },
        {
          slug: "unsafe-undefined-behavior",
          title: "Undefined behavior: the price of a false proof",
          summary:
            "The four UB families, and what 'the optimizer may assume it never happens' does to real programs.",
          contentFile: "unsafe-undefined-behavior.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which of these is undefined behavior?",
              options: [
                "Creating a raw pointer to a freed local and printing its address",
                "Reading through a raw pointer to a freed local",
                "Integer overflow with `+` in a release build",
                "Indexing a Vec out of bounds with `v[i]`",
              ],
              answer: 1,
              explanation:
                "Holding or printing an address touches no memory; release-mode overflow wraps (defined); v[i] panics (defined). Only the read through the dangling pointer violates validity.",
            },
            {
              kind: "predict",
              prompt:
                "An unsafe block has UB on some input. Your test suite exercises it thousands of times and never fails. What does that establish?",
              options: [
                "The block is sound",
                "Those executions happened to behave; the program is still broken and may miscompile later",
                "UB always crashes, so there is none",
                "The optimizer removed the UB",
              ],
              answer: 1,
              explanation:
                "UB is a property of executions under one compilation. Passing today is compatible with breaking after a toolchain upgrade or a new inlining decision, with no diff to your code.",
            },
            {
              kind: "mcq",
              prompt:
                "Why may a compiler delete a null check that comes after a dereference of the same pointer?",
              options: [
                "Null checks are deprecated",
                "The dereference asserts validity, so for every UB-free program the later check is provably dead",
                "The branch predictor makes it free anyway",
                "It may not; that would be a compiler bug",
              ],
              answer: 1,
              explanation:
                "Optimizations only need to preserve UB-free programs. If p were null, the dereference was already UB, so the compiler may assume non-null everywhere after it, and even before it.",
            },
          ],
        },
      ],
    },
    {
      slug: "raw-pointers-sound-apis",
      title: "Raw pointers, sound APIs",
      description:
        "Hold addresses safely, dereference with proof, hide the proof behind a safe boundary.",
      lessons: [
        {
          slug: "unsafe-raw-pointers",
          title: "Raw pointers: safe to hold, unsafe to follow",
          summary:
            "*const T and *mut T drop every promise references make; only the dereference needs proof.",
          contentFile: "unsafe-raw-pointers.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which of these requires an `unsafe` block?",
              options: [
                "`let p = 0x10 as *const i32;`",
                "Comparing two raw pointers with `==`",
                "Dereferencing a raw pointer with `*p`",
                "Storing a raw pointer in a struct field",
              ],
              answer: 2,
              explanation:
                "Creation, comparison, and storage never touch the pointee. The keyword marks the one operation that reads or writes memory through the address.",
            },
            {
              kind: "predict",
              prompt:
                "`let p = &x as *const i32 as *mut i32; unsafe { *p = 9; }` with no other use of x. Defined behavior?",
              options: [
                "Yes: casting to *mut grants write access",
                "Yes, as long as no reference to x is alive at the write",
                "No: the pointer derives from a shared borrow, which never permits writes",
                "It does not compile",
              ],
              answer: 2,
              explanation:
                "Permissions come from derivation, not from the pointer's type. A *mut cast from &x still carries read-only provenance, so the write is UB. It compiles; that is exactly the danger.",
            },
            {
              kind: "mcq",
              prompt: "What is pointer provenance?",
              options: [
                "The pointer's alignment requirement",
                "A record of which allocation a pointer derives from and what access that grants",
                "The lifetime the borrow checker assigns to raw pointers",
                "The order in which pointers were created",
              ],
              answer: 1,
              explanation:
                "Equal addresses are not interchangeable pointers. A fabricated address has no provenance, so dereferencing it is UB even if an allocation happens to live there; Miri tracks this exactly.",
            },
          ],
        },
        {
          slug: "unsafe-sound-abstractions",
          title: "Sound APIs: unsafe inside, safe outside",
          summary:
            "How split_at_mut and Vec encapsulate their proofs, and why soundness lives at the module boundary.",
          contentFile: "unsafe-sound-abstractions.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "An API is sound when...",
              options: [
                "It contains no unsafe blocks",
                "Every unsafe block in it carries a SAFETY comment",
                "No possible sequence of safe calls can cause undefined behavior through it",
                "It has never crashed in production",
              ],
              answer: 2,
              explanation:
                "Soundness quantifies over all safe callers, including adversarial ones nobody has written yet. Unsafe inside is fine; UB reachable from safe code is not.",
            },
            {
              kind: "predict",
              prompt:
                "Vec's `len` field is made pub. Safe code sets `v.len = 100` on an empty Vec, then reads `v[5]`. Whose bug is the resulting UB?",
              options: [
                "The caller's: they wrote a nonsense value",
                "Vec's: its unsafe relied on an invariant that safe code was allowed to break",
                "The compiler's: it should have rejected the assignment",
                "Nobody's: no unsafe keyword appeared",
              ],
              answer: 1,
              explanation:
                "Soundness is a module-boundary property. Unsafe may only rely on invariants that safe code outside the module cannot violate, which is why field privacy is part of the proof.",
            },
            {
              kind: "mcq",
              prompt: "Why is `assert!(mid <= len)` essential to split_at_mut's soundness?",
              options: [
                "It documents intent for reviewers",
                "It establishes the premise the unsafe proof depends on; without it a safe caller reaches from_raw_parts_mut with an out-of-range length",
                "It hints the optimizer about the range",
                "It converts the UB into a panic after the fact",
              ],
              answer: 1,
              explanation:
                "The disjointness argument only holds for mid <= len. The assert makes every other input panic cleanly before the unsafe runs, which is what keeps the safe signature honest.",
            },
          ],
        },
      ],
    },
    {
      slug: "trust-and-verification",
      title: "Trust and verification",
      description: "Check unsafe mechanically with Miri, then cross into C with open eyes.",
      lessons: [
        {
          slug: "unsafe-miri",
          title: "Miri: an interpreter that catches UB",
          summary:
            "cargo miri test validates every memory operation; know exactly what it sees and what it cannot.",
          contentFile: "unsafe-miri.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is Miri?",
              options: [
                "A static analyzer that scans source for unsafe patterns",
                "An interpreter that executes MIR and validates every memory operation against Rust's rules",
                "A sanitizer compiled into release binaries",
                "A fuzzer that generates adversarial inputs",
              ],
              answer: 1,
              explanation:
                "Miri runs the program itself, tracking allocation liveness, initialization, and provenance per operation, so it fails deterministically where native runs fail probabilistically.",
            },
            {
              kind: "predict",
              prompt:
                "A test grabs `v.as_ptr()`, calls `v.push(...)`, then reads the old pointer. cargo test passes. What does cargo miri test do?",
              options: [
                "Passes: the value read was correct",
                "Fails only if the push reallocated",
                "Reports UB either way: reallocation makes it dangling, and push's &mut invalidates the pointer regardless",
                "Refuses to run tests containing unsafe",
              ],
              answer: 2,
              explanation:
                "Miri checks the rules, not the symptoms. The stale pointer is invalidated by the aliasing discipline even when the buffer happens not to move.",
            },
            {
              kind: "mcq",
              prompt: "Which bug is beyond Miri's reach?",
              options: [
                "A use-after-free in a test it runs",
                "An unaligned read in a test it runs",
                "UB inside a C library called through FFI, or on a path no test executes",
                "A memory leak at program exit",
              ],
              answer: 2,
              explanation:
                "Miri is dynamic and cannot interpret compiled C: its guarantees end at test coverage and the FFI boundary. The other three are exactly what it catches.",
            },
          ],
        },
        {
          slug: "unsafe-ffi",
          title: "FFI: calling C, inheriting its trust",
          summary:
            "Calling C with extern blocks and #[repr(C)], why bindgen exists, and auditing inherited unsafe.",
          xp: 25,
          contentFile: "unsafe-ffi.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "You hand-declare a C function with the wrong argument width (i64 where the real C takes int). What is the failure mode?",
              options: [
                "Compile error: signature mismatch",
                "Link error: symbol not found",
                "Build and link succeed; undefined behavior at run time",
                "A panic when the function is called",
              ],
              answer: 2,
              explanation:
                "Declarations are trusted and C symbols carry a name, not a type, so nothing checks the shape. The mismatch surfaces as silent, input-dependent UB, which is why bindgen generates declarations from the real headers.",
            },
            {
              kind: "mcq",
              prompt: 'What does `extern "C"` actually specify?',
              options: [
                "That the function is written in C",
                "The calling convention: how arguments and returns travel between caller and callee",
                "That the call is exempt from unsafe",
                "A marshaling layer that converts Rust types to C types",
              ],
              answer: 1,
              explanation:
                "It names an ABI, nothing more. There is no bridge or conversion layer; the call compiles to a plain call instruction, and the cost at the boundary is trust, not cycles.",
            },
            {
              kind: "mcq",
              prompt: "What does `#![forbid(unsafe_code)]` at the top of your crate guarantee?",
              options: [
                "Your binary contains no undefined behavior",
                "Your whole dependency tree is free of unsafe",
                "This crate's own code contains no unsafe; dependencies may still carry plenty",
                "Any unsafe in a dependency fails the build",
              ],
              answer: 2,
              explanation:
                "forbid is per-crate and compiler-checked, which makes it a meaningful statement to reviewers. The tree beneath you still contains unsafe, which is what cargo geiger and the review culture are for.",
            },
          ],
        },
      ],
    },
  ],
}
