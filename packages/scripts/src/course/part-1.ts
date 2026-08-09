import { collectionsLayouts } from "./sections/collections-layouts"
import { errorHandling } from "./sections/error-handling"
import { iteratorsClosures } from "./sections/iterators-closures"
import { macrosSection } from "./sections/macros"
import { modulesApiDesign } from "./sections/modules-api-design"
import { smartPointers } from "./sections/smart-pointers"
import { testingSection } from "./sections/testing"
import { traitsAndGenerics } from "./sections/traits-and-generics"
import { unsafeAndFfi } from "./sections/unsafe-and-ffi"
import type { PartSeed } from "./types"

// Part 1: the language. Sections 1 and 2 ship with full lessons; the rest are
// on the map as upcoming and gain units as they are written.

export const part1: PartSeed = {
  slug: "part-1",
  title: "The language",
  description:
    "The Rust foundation: toolchain, ownership, borrowing, types, traits, collections, and errors, each grounded in what actually happens in memory.",
  sections: [
    {
      slug: "toolchain-and-cargo",
      title: "Toolchain and cargo",
      description:
        "rustup, cargo, crates, editions, workspaces, and a CI pipeline before any application code, the same order the book uses.",
      badgeIcon: "📦",
      badgeTitle: "Toolchain",
      units: [
        {
          slug: "the-toolchain",
          title: "The toolchain",
          description: "What rustup manages, what cargo does, and a fast inner loop.",
          lessons: [
            {
              slug: "rustup-toolchains",
              title: "What rustup actually manages",
              summary: "Channels, targets, and the components around the compiler.",
              contentFile: "rustup-toolchains.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "A toolchain, in rustup's vocabulary, is the combination of:",
                  options: [
                    "A compiler version and an IDE",
                    "A release channel and a compilation target",
                    "cargo and rustc",
                    "A Rust edition and a package registry",
                  ],
                  answer: 1,
                  explanation:
                    "A toolchain is channel + target: for example `stable` for `aarch64-apple-darwin`. Editions belong to crates, not toolchains.",
                },
                {
                  kind: "mcq",
                  prompt:
                    "Your service must run in a `FROM scratch` container. Which target family will you meet for that?",
                  options: [
                    "aarch64-apple-darwin",
                    "wasm32-unknown-unknown",
                    "x86_64-unknown-linux-musl",
                    "x86_64-pc-windows-msvc",
                  ],
                  answer: 2,
                  explanation:
                    "musl targets produce statically linked binaries that need no system libc, so they can run in an empty image. The Docker section builds exactly this.",
                },
                {
                  kind: "predict",
                  prompt:
                    "A teammate's build fails with an error your machine does not produce, on identical code. Per the lesson, what is the first command to compare?",
                  options: ["cargo tree", "rustup show", "cargo clean", "cargo update"],
                  answer: 1,
                  explanation:
                    "Different active toolchains explain most cross-machine differences; `rustup show` answers it in one line before you reach for anything heavier.",
                },
              ],
            },
            {
              slug: "cargo-front-door",
              title: "cargo, the front door",
              summary: "Cargo.toml, crates, semver, the lock file, and the everyday commands.",
              contentFile: "cargo-front-door.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "Why does `cargo check` exist when `cargo build` already reports errors?",
                  options: [
                    "It also runs clippy lints",
                    "It skips code generation and linking, answering 'is this valid' much faster",
                    "It checks Cargo.toml syntax only",
                    "It verifies dependencies against the registry",
                  ],
                  answer: 1,
                  explanation:
                    "check runs the whole front end (everything that can reject a program) and stops before the expensive codegen and link phases.",
                },
                {
                  kind: "mcq",
                  prompt: "What pins the exact resolved version of every dependency?",
                  options: ["Cargo.toml", "Cargo.lock", "the target/ directory", "rustup"],
                  answer: 1,
                  explanation:
                    'Cargo.toml declares ranges like `tokio = "1"`; Cargo.lock records the exact resolution so every machine builds the same graph. Commit it for applications.',
                },
                {
                  kind: "predict",
                  prompt: "You run `cargo build` twice with no changes in between. The second run:",
                  options: [
                    "Recompiles everything to be safe",
                    "Recompiles only your crate, not dependencies",
                    "Does almost nothing; all fingerprints are fresh",
                    "Fails, because the binary already exists",
                  ],
                  answer: 2,
                  explanation:
                    "Cargo fingerprints every crate's inputs; nothing changed, so nothing rebuilds and the command returns in milliseconds.",
                },
              ],
            },
            {
              slug: "inner-dev-loop",
              title: "The inner development loop",
              summary: "Where compile time goes, and tightening save-check-test-run.",
              contentFile: "inner-dev-loop.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt:
                    "For an incremental change in a large project, which phase often dominates the rebuild?",
                  options: ["Parsing", "Borrow checking", "Linking", "Downloading dependencies"],
                  answer: 2,
                  explanation:
                    "Linking stitches every object into one binary at the end of every build, even when only one crate changed, which is why faster linkers like mold help so much.",
                },
                {
                  kind: "mcq",
                  prompt: "A benchmark run on a debug build is:",
                  options: [
                    "Fine, debug is at most 10% slower",
                    "Meaningless; debug builds are routinely 10-50x slower than release",
                    "More accurate, because optimisations distort measurements",
                    "Impossible, cargo refuses to run benchmarks in debug",
                  ],
                  answer: 1,
                  explanation:
                    "Debug builds skip optimisation and add debug assertions. Any Rust performance number worth repeating comes from --release.",
                },
                {
                  kind: "predict",
                  prompt:
                    "You edit only a comment in your crate and run `cargo check`. What happens to your dependency graph?",
                  options: [
                    "Everything is re-checked",
                    "Your crate is re-checked; every dependency stays cached",
                    "Nothing at all is re-checked",
                    "Only the comment's file is re-parsed, not the crate",
                  ],
                  answer: 1,
                  explanation:
                    "The crate is the unit of recompilation. Your crate's fingerprint changed, so it is re-checked; upstream crates are untouched.",
                },
              ],
            },
          ],
        },
        {
          slug: "projects-and-ci",
          title: "Projects and CI",
          description: "Crates, editions, features, workspaces, and the five CI checks.",
          lessons: [
            {
              slug: "crates-editions-workspaces",
              title: "Crates, editions, workspaces",
              summary: "The units of compilation, compatibility, and organisation.",
              contentFile: "crates-editions-workspaces.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt:
                    "Why does the book move almost all code into src/lib.rs, leaving main.rs as a thin entry point?",
                  options: [
                    "lib.rs compiles faster than main.rs",
                    "Integration tests link against the library crate, so testable code must live there",
                    "Binary crates cannot contain modules",
                    "It is required for publishing to crates.io",
                  ],
                  answer: 1,
                  explanation:
                    "Integration tests and the binary both consume the library. Code stuck in main.rs is unreachable from tests.",
                },
                {
                  kind: "mcq",
                  prompt: "What does a Rust edition change?",
                  options: [
                    "The standard library's runtime behavior",
                    "Surface syntax and defaults, per crate, without breaking other crates",
                    "The minimum supported compiler version",
                    "The ABI of compiled binaries",
                  ],
                  answer: 1,
                  explanation:
                    "Editions let the language make breaking syntax changes (like new keywords) per crate; crates on different editions link together freely.",
                },
                {
                  kind: "predict",
                  prompt:
                    "Two workspace members require serde 1.0.190 and 1.0.200. How many serde compilations occur?",
                  options: [
                    "Two, one per member",
                    "One; compatible semver ranges unify to a single version",
                    "Zero; serde is precompiled",
                    "It fails to resolve",
                  ],
                  answer: 1,
                  explanation:
                    "Semver-compatible requirements resolve to one version. Incompatible majors would genuinely compile twice; `cargo tree -d` lists such duplicates.",
                },
              ],
            },
            {
              slug: "ci-from-day-one",
              title: "CI from day one",
              summary: "Tests, clippy, fmt, audit, coverage, and why they come first.",
              contentFile: "ci-from-day-one.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "Why does CI run clippy with `-D warnings`?",
                  options: [
                    "Warnings slow down compilation",
                    "A warning that cannot fail the build is a warning everyone learns to ignore",
                    "clippy cannot run without it",
                    "It enables additional lints",
                  ],
                  answer: 1,
                  explanation:
                    "Promoting warnings to errors keeps the count at zero permanently. Retrofitting that policy onto an old codebase means arguing with hundreds of accumulated warnings.",
                },
                {
                  kind: "mcq",
                  prompt:
                    "`cargo audit` protects against a failure mode the other checks cannot see. Which?",
                  options: [
                    "Unformatted code in a PR",
                    "A known vulnerability in a dependency three levels down",
                    "A test that panics",
                    "An unused import",
                  ],
                  answer: 1,
                  explanation:
                    "audit checks the resolved dependency tree against the RustSec advisory database; your own code never enters into it.",
                },
                {
                  kind: "predict",
                  prompt: "`cargo check` passes locally. Can clippy still fail the build in CI?",
                  options: [
                    "No, clippy only re-runs the compiler",
                    "Yes; clippy runs additional analysis passes with their own findings",
                    "Only if the toolchains differ",
                    "Only on nightly",
                  ],
                  answer: 1,
                  explanation:
                    "A program can be perfectly valid Rust and still trip a lint like redundant_clone. The compiler answers 'is it well-formed'; clippy answers 'does it avoid known mistakes'.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: "ownership-and-moves",
      title: "Ownership and moves",
      description:
        "The one-owner rule taught from memory upward: stack frames, heap buffers, moves as cheap copies with compile-time consequences, and Drop as the free.",
      badgeIcon: "🧠",
      badgeTitle: "Ownership",
      units: [
        {
          slug: "memory-first",
          title: "Memory first",
          description: "Stack, heap, and what an allocation physically costs.",
          lessons: [
            {
              slug: "stack-and-heap",
              title: "Stack and heap, for real",
              summary: "Frames, buffers, and the three-word shape of a String.",
              contentFile: "stack-and-heap.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: '`let s = String::from("hello")` puts what on the stack?',
                  options: [
                    "The five bytes of text",
                    "Three words: pointer, length, capacity",
                    "Nothing; Strings live entirely on the heap",
                    "A reference-count header",
                  ],
                  answer: 1,
                  explanation:
                    "The String value itself is a three-word header on the stack; the text bytes live in the heap buffer it points to.",
                },
                {
                  kind: "predict",
                  prompt: 'Does `let s = "hello";` allocate on the heap?',
                  options: [
                    "Yes, all strings are heap-allocated",
                    "No; the bytes are baked into the executable and s is a pointer-and-length pair",
                    "Only if s is later mutated",
                    "Only in debug builds",
                  ],
                  answer: 1,
                  explanation:
                    "A string literal lives in the executable's static data; `&str` borrows it. No allocator involved, nothing to free.",
                },
                {
                  kind: "mcq",
                  prompt:
                    "Why can't a function return a pointer to one of its own local variables?",
                  options: [
                    "Locals are read-only",
                    "The frame is popped on return and that memory is reused by the next call",
                    "Pointers cannot cross function boundaries",
                    "It can, and Rust allows it",
                  ],
                  answer: 1,
                  explanation:
                    "Stack memory dies with the frame. Rust turns this classic dangling-pointer bug into a compile error you will meet in the borrowing section.",
                },
              ],
            },
            {
              slug: "cost-of-allocation",
              title: "What an allocation costs",
              summary: "Allocator, mmap, page faults, and why Vec::push is amortised cheap.",
              contentFile: "cost-of-allocation.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "Most allocations are fast because:",
                  options: [
                    "The kernel pre-allocates memory per process",
                    "The allocator satisfies them from memory it already manages, no syscall",
                    "Rust pools all Strings",
                    "The heap is faster than the stack",
                  ],
                  answer: 1,
                  explanation:
                    "The allocator only asks the kernel (mmap/brk) when it runs out. The syscall path is orders of magnitude slower, which is where allocation tail latency comes from.",
                },
                {
                  kind: "mcq",
                  prompt:
                    "Why won't the borrow checker let you hold a reference into a Vec across a push?",
                  options: [
                    "Style: it encourages iterators",
                    "A grow step may reallocate the buffer, leaving the reference dangling into freed memory",
                    "push needs exclusive CPU access",
                    "References to heap data are always forbidden",
                  ],
                  answer: 1,
                  explanation:
                    "When capacity runs out, push allocates a new buffer, copies, and frees the old one. Your reference would point into the freed buffer: use-after-free, prevented at compile time.",
                },
                {
                  kind: "predict",
                  prompt: "You will push exactly 1000 elements. What is the idiomatic move?",
                  options: [
                    "Vec::new(), push in a loop",
                    "Vec::with_capacity(1000), then push",
                    "A fixed array [i32; 1000]",
                    "A LinkedList",
                  ],
                  answer: 1,
                  explanation:
                    "with_capacity performs the single allocation up front, so no grow-and-copy steps happen at all.",
                },
              ],
            },
          ],
        },
        {
          slug: "ownership-rules",
          title: "Ownership",
          description: "Moves, Copy, and Drop: the rule and both consequences.",
          lessons: [
            {
              slug: "one-owner",
              title: "One owner per value",
              summary: "What a move physically is, and what the compiler kills.",
              contentFile: "one-owner.md",
              quiz: [
                {
                  kind: "predict",
                  prompt:
                    "`a` holds a 10 MB String and you write `let b = a;`. How much data is copied?",
                  options: [
                    "10 MB",
                    "About 24 bytes: the pointer/length/capacity header",
                    "Nothing at all",
                    "10 MB, but lazily on first use",
                  ],
                  answer: 1,
                  explanation:
                    "A move copies the stack header and declares the source dead at compile time. The heap buffer is never touched, which is why moves stay cheap at any size.",
                },
                {
                  kind: "mcq",
                  prompt: "What disaster does the 'source binding dies' rule prevent?",
                  options: [
                    "Memory leaks",
                    "Two owners freeing one heap buffer: a double free",
                    "Stack overflow",
                    "Integer overflow",
                  ],
                  answer: 1,
                  explanation:
                    "After the bitwise copy, two headers point at one buffer. If both dropped it, the allocator would free it twice: memory corruption. Rust prevents it by refusing to compile reads of the moved-from binding.",
                },
                {
                  kind: "mcq",
                  prompt: "What is the runtime cost of the move rule's enforcement?",
                  options: [
                    "A flag check per variable access",
                    "Reference counting",
                    "Zero; enforcement is entirely at compile time",
                    "A garbage-collection pass",
                  ],
                  answer: 2,
                  explanation:
                    "The moved-from binding simply stops being a usable name during compilation. Nothing exists at runtime to check.",
                },
              ],
            },
            {
              slug: "copy-vs-move",
              title: "Copy or move",
              summary: "Why i32 copies while String moves, and when to derive Copy.",
              contentFile: "copy-vs-move.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "A type can be Copy when:",
                  options: [
                    "It is smaller than 32 bytes",
                    "Duplicating its bits yields two independent valid values (no owned resources inside)",
                    "It derives Clone",
                    "It contains no methods",
                  ],
                  answer: 1,
                  explanation:
                    "Plain data copies honestly; anything holding a pointer to an owned resource cannot, or two owners would share one resource. That is why String, Vec, Box and File all move.",
                },
                {
                  kind: "predict",
                  prompt:
                    'let t = (String::from("hi"), 5); let u = t; println!("{}", t.1); Does it compile?',
                  options: [
                    "Yes; t.1 is i32, which is Copy",
                    "No; the tuple is not Copy, so the whole of t moved",
                    "Yes; tuples always copy",
                    "No; tuples cannot be assigned",
                  ],
                  answer: 1,
                  explanation:
                    "A tuple with a non-Copy field is not Copy, and assignment moves the whole binding. Destructuring (let (s, n) = t) is the idiomatic way to split one up.",
                },
                {
                  kind: "mcq",
                  prompt: "Why is `&mut T` not Copy while `&T` is?",
                  options: [
                    "&mut T is bigger",
                    "Copying &mut T would create two live mutable references to one place, the aliasing bug Rust exists to prevent",
                    "&mut T is heap-allocated",
                    "It is Copy",
                  ],
                  answer: 1,
                  explanation:
                    "Shared references can alias freely. Exclusive references are exclusive by definition, so duplicating one is meaningless.",
                },
              ],
            },
            {
              slug: "drop-cleanup",
              title: "Drop: deterministic cleanup",
              summary: "Scope end as the free, and Drop as the universal resource hook.",
              contentFile: "drop-cleanup.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "Within one scope, values drop in:",
                  options: [
                    "Declaration order",
                    "Reverse declaration order",
                    "Unspecified order",
                    "Alphabetical order",
                  ],
                  answer: 1,
                  explanation:
                    "Last in, first out, mirroring the stack. The Noisy example in the lesson prints 'dropping b' before 'dropping a'.",
                },
                {
                  kind: "predict",
                  prompt:
                    "A MutexGuard is bound at the top of a function that then does something slow. When does the lock release?",
                  options: [
                    "Immediately after the last use of the guarded data",
                    "At the guard's scope end, so the lock is held through the slow work",
                    "When the mutex is next requested",
                    "After a timeout",
                  ],
                  answer: 1,
                  explanation:
                    "Drop runs at scope end, not last use. Ending the scope early (a block or drop(guard)) is the fix, and holding guards across slow or async work is a classic real-world Rust bug.",
                },
                {
                  kind: "mcq",
                  prompt: "Why do Rust functions rarely need an equivalent of finally or defer?",
                  options: [
                    "Errors abort the process, so cleanup is moot",
                    "Destructors run at scope end on every path, including early returns and error paths",
                    "The garbage collector handles it",
                    "They do; drop(x) is Rust's defer",
                  ],
                  answer: 1,
                  explanation:
                    "Acquire in the constructor, release in Drop: files close, locks release, sockets shut down wherever ownership ends, on all control-flow paths.",
                },
              ],
            },
          ],
        },
        {
          slug: "functions-and-ownership",
          title: "Functions and ownership",
          description: "Signatures as ownership contracts, and calibrated clone judgment.",
          lessons: [
            {
              slug: "functions-take-ownership",
              title: "Passing values into functions",
              summary: "Moves across call boundaries, and what a signature promises.",
              contentFile: "functions-take-ownership.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "A parameter declared `s: String` (by value) tells the caller:",
                  options: [
                    "The function will only read s",
                    "The function consumes s; the caller is done with it",
                    "The function will mutate the caller's s in place",
                    "Nothing about ownership",
                  ],
                  answer: 1,
                  explanation:
                    "By-value parameters take ownership. `&str` promises read-only borrowing, `&mut String` in-place mutation: the signature is the ownership contract.",
                },
                {
                  kind: "predict",
                  prompt: "takes(v); takes(v); with v: Vec<i32>. The compiler:",
                  options: [
                    "Accepts it; Vec is Copy",
                    "Rejects the second call as use of a moved value, and suggests cloning",
                    "Accepts it but the second call gets an empty Vec",
                    "Rejects both calls",
                  ],
                  answer: 1,
                  explanation:
                    "The first call moved v. The error names the move site and suggests a fix; whether cloning or borrowing is the right fix is a design decision.",
                },
                {
                  kind: "mcq",
                  prompt:
                    "A constructor stores the passed string in its struct. Which parameter type states that honestly?",
                  options: ["&str", "String", "&String", "&'static str"],
                  answer: 1,
                  explanation:
                    "Taking String by value makes the handover visible at the call site and avoids a hidden clone inside. Take &str only when you genuinely just look at the text.",
                },
              ],
            },
            {
              slug: "clone-judgment",
              title: "Clone: when copying is correct",
              summary: "Cost, legitimate uses, smells, and the cheap-clone types.",
              contentFile: "clone-judgment.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "Cloning an Arc<Config> costs:",
                  options: [
                    "A deep copy of the Config",
                    "An atomic reference-count increment",
                    "A syscall",
                    "Nothing; it is optimised away",
                  ],
                  answer: 1,
                  explanation:
                    "Arc's Clone bumps a counter and copies a pointer. 'Is clone expensive' always means 'for this type'; Arc, Rc and Bytes are the standard cheap-clone family.",
                },
                {
                  kind: "mcq",
                  prompt:
                    "A function takes `String` but only reads it, and every caller clones to feed it. The fix is:",
                  options: [
                    "Faster clones via Arc<String>",
                    "Change the signature to &str; the clones were compensating for it",
                    "Accept it; clones are idiomatic",
                    "Make the String static",
                  ],
                  answer: 1,
                  explanation:
                    "A clone that patches a wrong signature leaves the real problem in place. Fix the signature and the call sites simplify themselves.",
                },
                {
                  kind: "predict",
                  prompt:
                    "The compiler suggests cloning config.name to fix a borrow-after-move error. Is the suggestion always the right fix?",
                  options: [
                    "Yes, compiler suggestions are authoritative",
                    "No; it proposes the smallest change that compiles, which may paper over a design problem like a wrong ordering",
                    "Yes, unless the clone is over 1 KB",
                    "No; cloning is never correct",
                  ],
                  answer: 1,
                  explanation:
                    "In the lesson's example, reordering the print before the move removes the need for any clone. The compiler fixes errors; you fix designs.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: "borrowing-and-lifetimes",
      title: "Borrowing and lifetimes",
      description:
        "Shared and exclusive references, what the borrow checker proves, and what lifetime annotations actually say.",
      badgeIcon: "🔗",
      badgeTitle: "Borrowing",
      units: [
        {
          slug: "references",
          title: "References",
          description: "Shared and exclusive borrows, and the prover that checks them.",
          lessons: [
            {
              slug: "shared-references",
              title: "&T: look, don't touch",
              summary: "References as pointers with rules, and why readers block writers.",
              contentFile: "shared-references.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "What does a `&T` reference cost at runtime compared to a raw pointer?",
                  options: [
                    "One extra word for the borrow flag",
                    "A reference-count increment",
                    "Nothing; the rules are checked at compile time and erased",
                    "A bounds check per dereference",
                  ],
                  answer: 2,
                  explanation:
                    "No metadata exists at runtime. The no-dangling and no-mutation rules are proven during compilation, then the reference is just a pointer.",
                },
                {
                  kind: "predict",
                  prompt:
                    'let mut s = String::from("hi"); let r = &s; s.push_str("!"); println!("{r}"); What happens?',
                  options: [
                    "Prints hi!",
                    "Rejected: cannot mutate s while a shared borrow is live",
                    "Prints hi",
                    "Panics at runtime",
                  ],
                  answer: 1,
                  explanation:
                    "r is still used after the push, so the shared borrow is live and push_str's &mut self is refused. push may reallocate, which would dangle r.",
                },
                {
                  kind: "mcq",
                  prompt: "Why is `&str` the idiomatic parameter type instead of `&String`?",
                  options: [
                    "&str is faster to dereference",
                    "Deref coercion lets &String, literals, and slices all call it at zero cost",
                    "&String cannot be passed to functions",
                    "&str allows mutation",
                  ],
                  answer: 1,
                  explanation:
                    "A &String coerces to &str automatically, and literals and slices already are &str, so the &str signature accepts strictly more callers.",
                },
              ],
            },
            {
              slug: "exclusive-references",
              title: "&mut T: one writer, no readers",
              summary: "Aliasing XOR mutation, and why the rule powers both safety and speed.",
              contentFile: "exclusive-references.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "State the borrowing rule in one line.",
                  options: [
                    "One reader or many writers, never both",
                    "Any number of readers, or exactly one writer, never both",
                    "Readers and writers may coexist within one scope",
                    "One reader and one writer maximum",
                  ],
                  answer: 1,
                  explanation:
                    "Aliasing XOR mutation: shared access and exclusive access are mutually exclusive states.",
                },
                {
                  kind: "predict",
                  prompt:
                    "for x in &v { v.push(*x); } What does Rust do with this iterator-invalidation classic?",
                  options: [
                    "Compiles; the iterator sees a snapshot",
                    "Compiles but may skip or repeat elements",
                    "Rejected: the loop holds a shared borrow, push needs an exclusive one",
                    "Panics at the first push",
                  ],
                  answer: 2,
                  explanation:
                    "The iterator borrows v for the whole loop, so the &mut self that push requires cannot be granted. The C++/JS corruption bug becomes a compile error.",
                },
                {
                  kind: "mcq",
                  prompt: "How does `&mut T` help the optimizer?",
                  options: [
                    "It does not; it is purely a safety feature",
                    "Exclusive access is a checked fact, so values can stay in registers and loads can be skipped",
                    "It pins the value in cache",
                    "It disables bounds checks",
                  ],
                  answer: 1,
                  explanation:
                    "C compilers must assume pointers may alias; Rust knows a &mut has no aliases, which licenses optimizations C can only get with restrict annotations.",
                },
              ],
            },
            {
              slug: "borrow-checker-proofs",
              title: "What the borrow checker proves",
              summary: "Non-lexical lifetimes, signature-level reasoning, and the restructures.",
              contentFile: "borrow-checker-proofs.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "When does a borrow end?",
                  options: [
                    "At the closing brace of its scope",
                    "At its last use",
                    "When the referent is dropped",
                    "At the next semicolon",
                  ],
                  answer: 1,
                  explanation:
                    "Since non-lexical lifetimes (2018), a borrow ends where it is last used, which is why reordering statements often fixes borrow errors.",
                },
                {
                  kind: "mcq",
                  prompt:
                    "Reading one field while calling `self.add_log(...)` (a &mut self method touching a different field) is rejected. Why?",
                  options: [
                    "The checker is buggy",
                    "Methods are judged by signature, and &mut self claims all of self",
                    "Field borrows always conflict",
                    "Logging requires exclusive access globally",
                  ],
                  answer: 1,
                  explanation:
                    "Across call boundaries only the signature is visible, so &mut self must be assumed to touch every field. Inline field access or a narrower method fixes it.",
                },
                {
                  kind: "predict",
                  prompt:
                    'let last = v.last(); if let Some(x) = last { println!("{x}") } v.clear(); Compiles?',
                  options: [
                    "No: last borrows v until the end of scope",
                    "Yes: the borrow ends at its last use inside the if let, before clear",
                    "No: Option<&T> cannot cross an if let",
                    "Only if v is not mutable",
                  ],
                  answer: 1,
                  explanation:
                    "The borrow's last use is inside the if let, so clear() runs with no live borrows. Move clear() above the if let and it is rejected.",
                },
              ],
            },
          ],
        },
        {
          slug: "lifetimes",
          title: "Lifetimes",
          description: "Regions, annotations as promises, and structs that borrow.",
          lessons: [
            {
              slug: "dangling-references",
              title: "No dangling: why lifetimes exist",
              summary: "E0106 and E0597, and the region model behind them.",
              contentFile: "dangling-references.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "What is a lifetime, mechanically?",
                  options: [
                    "A timer attached to each reference",
                    "The region of code where a borrow is valid, computed by the compiler",
                    "The scope block a variable is declared in",
                    "A runtime tag on heap allocations",
                  ],
                  answer: 1,
                  explanation:
                    "Lifetimes are regions computed during compilation. Annotations only name and relate them; the regions exist regardless.",
                },
                {
                  kind: "predict",
                  prompt:
                    'fn dangle() -> &String { let s = String::from("hi"); &s } What does the compiler report?',
                  options: [
                    "E0597: s does not live long enough",
                    "E0106: missing lifetime specifier, nothing to borrow from",
                    "A warning; it works until called twice",
                    "Nothing; the String is promoted to the heap",
                  ],
                  answer: 1,
                  explanation:
                    "The signature promises a borrow but has no reference inputs to borrow from, so the signature itself is unfulfillable. Returning the owned String is the fix.",
                },
                {
                  kind: "mcq",
                  prompt: "Why are lifetimes checked at function boundaries rather than globally?",
                  options: [
                    "Global analysis would be more precise but too slow to ship",
                    "Each function is verified against signatures alone, so checking scales and dependencies cannot silently break callers",
                    "Function boundaries are where memory is allocated",
                    "They are checked globally",
                  ],
                  answer: 1,
                  explanation:
                    "Local reasoning from signatures means a million call sites each get checked without reading other bodies, at zero runtime cost.",
                },
              ],
            },
            {
              slug: "lifetime-annotations",
              title: "What 'a actually says",
              summary: "Annotations relate regions; elision writes most of them for you.",
              contentFile: "lifetime-annotations.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt:
                    "What does writing `<'a>` on a function change about how long values live?",
                  options: [
                    "It extends the referenced values' lives to match",
                    "Nothing; it only states a checkable relationship between existing regions",
                    "It moves the values to static memory",
                    "It defers drops until the function returns",
                  ],
                  answer: 1,
                  explanation:
                    "Annotations never change lifetimes. They let a signature promise how outputs relate to inputs so both sides can be verified independently.",
                },
                {
                  kind: "mcq",
                  prompt: "Why does `fn first_word(s: &str) -> &str` need no annotations?",
                  options: [
                    "Lifetimes do not apply to &str",
                    "Elision: with exactly one input lifetime, the output borrows from it",
                    "The compiler runs the body to find out",
                    "It does need them; this is an error",
                  ],
                  answer: 1,
                  explanation:
                    "Elision rule 2 fills in fn first_word<'a>(s: &'a str) -> &'a str. Annotations are only requested when no elision rule applies, like two reference inputs.",
                },
                {
                  kind: "predict",
                  prompt:
                    "result = longest(&s1, &s2) where s2 lives in an inner block, and result is printed after the block. What happens?",
                  options: [
                    "Compiles; result borrowed from s1 anyway",
                    "Rejected: 'a is the overlap of both inputs, and result outlives it",
                    "Panics when result is printed",
                    "Compiles only in release mode",
                  ],
                  answer: 1,
                  explanation:
                    "The signature says the output lives at most as long as both inputs. The compiler cannot know which one was returned, so it must reject uses beyond the shorter.",
                },
              ],
            },
            {
              slug: "lifetimes-in-structs",
              title: "Structs that borrow",
              summary: "What <'a> on a struct commits you to, and the own-versus-borrow default.",
              contentFile: "lifetimes-in-structs.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt:
                    "What does `struct Excerpt<'a> { text: &'a str }` commit every Excerpt to?",
                  options: [
                    "Being allocated on the stack",
                    "Never outliving the text it borrows from",
                    "Immutability",
                    "Having static text only",
                  ],
                  answer: 1,
                  explanation:
                    "A borrowing struct is tied to its referent's region, and everything containing the struct inherits that constraint.",
                },
                {
                  kind: "mcq",
                  prompt: "The practical default from the lesson:",
                  options: [
                    "Borrow everywhere; owning is a smell",
                    "Functions borrow, structs own; borrowing structs are for proven view/parser cases",
                    "Structs borrow, functions own",
                    "Always clone at boundaries",
                  ],
                  answer: 1,
                  explanation:
                    "Parameters live for one call, so borrowing is free. Structs live indefinitely and get stored and sent around, so owning (String over &'a str) buys freedom for one allocation.",
                },
                {
                  kind: "predict",
                  prompt:
                    'fn make_parser() -> Parser<\'static> { let s = String::from("data"); Parser { input: &s, position: 0 } } What happens and what is the fix?',
                  options: [
                    "Works; 'static extends s's life",
                    "E0597; fix by owning (input: String) or taking &str from the caller",
                    "Works in release builds",
                    "E0106; add <'a> to the function",
                  ],
                  answer: 1,
                  explanation:
                    "s dies at return, so no borrow from it can be 'static. Either the parser owns its input or the caller owns the data and lends it; 'static was the wrong promise.",
                },
              ],
            },
          ],
        },
        {
          slug: "applied-borrowing",
          title: "Applying it",
          description: "Slices: the borrow that views part of a collection.",
          lessons: [
            {
              slug: "slices",
              title: "Slices: borrowing a view",
              summary: "Fat pointers, &[T] and &str, and the widest possible API front door.",
              contentFile: "slices.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "What is `&[i32]` in memory?",
                  options: [
                    "A copy of the viewed elements",
                    "Two words: a pointer to the first element and a length",
                    "Three words: pointer, length, capacity",
                    "A boxed array",
                  ],
                  answer: 1,
                  explanation:
                    "A slice is a fat pointer, ptr + len. Capacity belongs to the owner (Vec/String); a view does not need it, which is also why slicing costs nothing.",
                },
                {
                  kind: "mcq",
                  prompt: "Why prefer `fn sum(v: &[i32])` over `fn sum(v: &Vec<i32>)`?",
                  options: [
                    "It avoids a bounds check",
                    "It accepts Vecs, arrays, and sub-slices alike via deref coercion, at zero cost",
                    "&Vec<i32> would move the Vec",
                    "Slices are mutable by default",
                  ],
                  answer: 1,
                  explanation:
                    "&Vec coerces to &[T], and arrays and other slices already are slices, so the slice signature is the widest front door with no runtime penalty.",
                },
                {
                  kind: "predict",
                  prompt:
                    'let word = first_word(&sentence); sentence.clear(); println!("{word}"); What happens?',
                  options: [
                    "Prints the word; word copied the text",
                    "Rejected: word is a slice borrowing sentence, and clear needs &mut",
                    "Prints an empty string",
                    "Panics: use after free",
                  ],
                  answer: 1,
                  explanation:
                    "Elision tied word's lifetime to sentence, a slice is a shared borrow, and clear's &mut self cannot coexist with it while word is still used.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: "structs-enums-matching",
      title: "Structs, enums, pattern matching",
      description:
        "Modelling with data: product and sum types, Option and Result, and exhaustive matching.",
      badgeIcon: "🧬",
      badgeTitle: "Data modelling",
      units: [
        {
          slug: "shaping-data",
          title: "Shaping data",
          description: "Structs with impl blocks, and enums as one-of-several types.",
          lessons: [
            {
              slug: "structs-and-impl",
              title: "Structs and impl blocks",
              summary: "Fields, methods, and the three receivers as ownership contracts.",
              contentFile: "structs-and-impl.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "What do the three method receivers promise?",
                  options: [
                    "&self reads, &mut self mutates in place, self consumes the value",
                    "They differ only in performance",
                    "self borrows, &self copies, &mut self locks",
                    "All three move the value",
                  ],
                  answer: 0,
                  explanation:
                    "Receivers are the ownership contract from the functions lesson as method syntax; into_-prefixed methods conventionally take self and consume.",
                },
                {
                  kind: "predict",
                  prompt:
                    'let email = sub.into_email(); println!("{}", sub.name); What does the compiler say?',
                  options: [
                    "Prints the name; into_email only borrowed",
                    "Borrow of moved value: into_email takes self, consuming sub",
                    "Prints an empty name",
                    "Rejected: methods cannot take self",
                  ],
                  answer: 1,
                  explanation:
                    "A self receiver moves the whole struct into the method, exactly like a by-value parameter. A &self getter returning &str would have left sub alive.",
                },
                {
                  kind: "mcq",
                  prompt: "A struct containing a String can derive which of these?",
                  options: [
                    "Clone but not Copy",
                    "Copy but not Clone",
                    "Both Clone and Copy",
                    "Neither",
                  ],
                  answer: 0,
                  explanation:
                    "Derives are checked structurally: String is Clone, so the struct can be. Copy requires every field to be Copy, and String owns a heap buffer, so never.",
                },
              ],
            },
            {
              slug: "enums-sum-types",
              title: "Enums: one of several shapes",
              summary: "Tagged unions, impossible states, and the niche optimization.",
              contentFile: "enums-sum-types.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "What is an enum value in memory?",
                  options: [
                    "A pointer to the active variant on the heap",
                    "A discriminant tag plus space for the largest variant's payload",
                    "All variants' fields concatenated",
                    "A vtable pointer",
                  ],
                  answer: 1,
                  explanation:
                    "A C tagged union with the compiler guaranteeing you can never read the wrong arm; every value is sized for the biggest case.",
                },
                {
                  kind: "predict",
                  prompt: "size_of::<Option<u8>>() and size_of::<Option<&u8>>() print what?",
                  options: ["1 and 8", "2 and 16", "2 and 8", "16 and 16"],
                  answer: 2,
                  explanation:
                    "All 256 u8 patterns are legal so Option<u8> needs a real tag byte (2 total). References are never null, so None hides in the null pattern: Option<&u8> stays 8.",
                },
                {
                  kind: "mcq",
                  prompt: "What design problem do enums solve that optional-fields objects cannot?",
                  options: [
                    "Faster serialization",
                    "Making invalid combinations of fields unrepresentable",
                    "Smaller JSON payloads",
                    "Avoiding heap allocation",
                  ],
                  answer: 1,
                  explanation:
                    'A type: string plus optional fields permits { type: "cash", iban } nonsense. One-variant-at-a-time makes such states structurally impossible, the heart of the book\'s chapter 6.',
                },
              ],
            },
          ],
        },
        {
          slug: "option-and-result",
          title: "Option and Result",
          description: "Absence and failure as ordinary values.",
          lessons: [
            {
              slug: "option-basics",
              title: "Option: absence made visible",
              summary: "No null; map/and_then/unwrap_or, and where unwrap is honest.",
              contentFile: "option-basics.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "How does Option improve on null?",
                  options: [
                    "It is faster to check",
                    "Absence lives in the type, so code touching the value will not compile until None is handled",
                    "It cannot be nested",
                    "It logs when absent",
                  ],
                  answer: 1,
                  explanation:
                    "You cannot reach the payload of an Option<T> without going through Some/None, so the forgotten null check becomes a compile error at the decision point.",
                },
                {
                  kind: "predict",
                  prompt: "Vec::<i32>::new().first().map(|n| n * 2) evaluates to what?",
                  options: ["0", "Some(0)", "None", "A panic"],
                  answer: 2,
                  explanation:
                    "first() on an empty Vec is None, and map passes None through untouched; the closure never runs.",
                },
                {
                  kind: "mcq",
                  prompt: "When is unwrap/expect the honest choice?",
                  options: [
                    "Whenever the code is on the happy path",
                    "In tests and where an earlier check proves presence, with expect stating why",
                    "Never; always match",
                    "Only on Copy types",
                  ],
                  answer: 1,
                  explanation:
                    "Panics are for bugs: impossible states you want loud. Expected absence is handled with the combinators or a match; an unexplained unwrap in app code is a smell.",
                },
              ],
            },
            {
              slug: "result-basics",
              title: "Result: failure as a value",
              summary: "Errors in return types, and ? with its From conversions.",
              contentFile: "result-basics.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt: "What does `?` do on a Result?",
                  options: [
                    "Panics on Err",
                    "Unwraps Ok, or returns the Err (converted via From) to the caller",
                    "Retries the operation once",
                    "Logs the error and continues",
                  ],
                  answer: 1,
                  explanation:
                    "? is early-return propagation with a built-in From::from conversion hook, which is what lets one error enum absorb io::Error, ParseError, and friends.",
                },
                {
                  kind: "mcq",
                  prompt: "How does Result differ from exceptions at the signature level?",
                  options: [
                    "It does not; both are invisible",
                    "Fallibility is part of the return type, so callers are type-checked against it",
                    "Result is only for I/O",
                    "Exceptions are faster",
                  ],
                  answer: 1,
                  explanation:
                    "A throwing function looks identical to a pure one in TS/Java signatures. Result makes failure part of the API, so forgetting it is a compile error, not a 500.",
                },
                {
                  kind: "predict",
                  prompt:
                    'double_port parses "40000" into u16 with ?, then returns port * 2. What happens in a debug build?',
                  options: [
                    "Ok(80000)",
                    "Err from the parse",
                    "A panic: attempt to multiply with overflow",
                    "Ok(14464), silently wrapped",
                  ],
                  answer: 2,
                  explanation:
                    "The parse succeeds; 80000 exceeds u16::MAX. Overflow is a bug-class panic under debug assertions (and a silent wrap in release), not a Result: validate with checked_mul.",
                },
              ],
            },
          ],
        },
        {
          slug: "matching",
          title: "Pattern matching",
          description: "Exhaustive match, and patterns in let, if, while, and for.",
          lessons: [
            {
              slug: "match-exhaustive",
              title: "match and exhaustiveness",
              summary: "Proof-obligation matching, and the refactoring worklist it buys.",
              contentFile: "match-exhaustive.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt:
                    "You add a new variant to a widely used enum. What happens on the next build?",
                  options: [
                    "Nothing until runtime",
                    "Every non-wildcard match on it fails to compile, forming a complete worklist",
                    "Matches fall through to their first arm",
                    "A lint warns once",
                  ],
                  answer: 1,
                  explanation:
                    "Exhaustiveness turns a requirements change into a compiler-generated list of every site that must consider the new state, which default-arm switches cannot provide.",
                },
                {
                  kind: "mcq",
                  prompt: "When is a `_` wildcard arm a trap?",
                  options: [
                    "Always; it is forbidden in idiomatic code",
                    "When it exists to silence the compiler, because it also silences future variants",
                    "When matching integers",
                    "When the match returns a value",
                  ],
                  answer: 1,
                  explanation:
                    "A wildcard that swallows unlisted cases also swallows every variant added later, deleting the refactoring worklist. Use it when unlisted cases genuinely share behavior.",
                },
                {
                  kind: "predict",
                  prompt:
                    'match n { Some(x) if x > 0 => "positive", Some(_) => "zero or negative" } over Option<i32>: what does the compiler say?',
                  options: [
                    "Compiles; guards complete the coverage",
                    "non-exhaustive patterns: None not covered",
                    "unreachable pattern on the second arm",
                    "Compiles with a warning",
                  ],
                  answer: 1,
                  explanation:
                    "Guards do not count toward exhaustiveness, and nothing covers None. The prover only credits what it can verify.",
                },
              ],
            },
            {
              slug: "patterns-everywhere",
              title: "if let, let-else, destructuring",
              summary: "The pattern grammar outside match, and flat happy paths.",
              contentFile: "patterns-everywhere.md",
              quiz: [
                {
                  kind: "mcq",
                  prompt:
                    "What does `let Some(id) = parse_id(input) else { return Err(e) };` require of the else block?",
                  options: [
                    "That it returns the same type as id",
                    "That it diverges: return, break, continue, or panic",
                    "That it is empty",
                    "That it logs the failure",
                  ],
                  answer: 1,
                  explanation:
                    "let-else binds the success case in the outer scope, so the else block must never fall through; the compiler enforces divergence.",
                },
                {
                  kind: "mcq",
                  prompt: "When should stacked if let / else if let become a match again?",
                  options: [
                    "Beyond two branches, for style",
                    "When every case of the value must be routed somewhere, because if let gives up exhaustiveness",
                    "Never; if let is always preferred",
                    "When the payload is non-Copy",
                  ],
                  answer: 1,
                  explanation:
                    "if let trades the completeness proof for brevity. Fine for one interesting case; wrong when a missing case should be a compile error.",
                },
                {
                  kind: "predict",
                  prompt:
                    'for (_, n) in &pairs { total += n } println!("{}", pairs.len()); Compiles? And with `in pairs` instead?',
                  options: [
                    "Both compile",
                    "&pairs compiles; in pairs moves the Vec and the len() call becomes a borrow-of-moved error",
                    "Neither compiles",
                    "in pairs compiles; &pairs does not",
                  ],
                  answer: 1,
                  explanation:
                    "Iterating a reference destructures through it, moving nothing. Iterating by value consumes the Vec, so using it afterward is the standard moved-value error.",
                },
              ],
            },
          ],
        },
      ],
    },
    traitsAndGenerics,
    collectionsLayouts,
    smartPointers,
    iteratorsClosures,
    errorHandling,
    modulesApiDesign,
    testingSection,
    macrosSection,
    unsafeAndFfi,
  ],
}
