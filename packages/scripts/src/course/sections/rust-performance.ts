import type { SectionSeed } from "../types"

export const rustPerformance: SectionSeed = {
  slug: "rust-performance",
  title: "Performance engineering",
  description: "criterion, flamegraphs, allocation profiling, LTO, SIMD basics.",
  badgeIcon: "🏎️",
  badgeTitle: "Performance × Rust",
  units: [
    {
      slug: "measure-first",
      title: "Measure first",
      description:
        "Benchmarks and profiles before opinions: criterion, black_box, and flamegraphs.",
      lessons: [
        {
          slug: "perf-benchmarking-criterion",
          title: "Benchmarking without fooling yourself",
          summary:
            "criterion, black_box, and the classic ways a benchmark lies: debug builds, dead code, noise read as signal.",
          contentFile: "perf-benchmarking-criterion.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "You time a function with Instant in a binary from plain `cargo build`, and it runs 40x slower than `cargo bench` reports. What explains the gap?",
              options: [
                "criterion subtracts its own harness overhead from the numbers",
                "The debug profile: opt-level 0, debug assertions, and overflow checks, with almost no inlining",
                "cargo bench warms the CPU caches and Instant does not",
                "Instant has millisecond resolution, so it rounds up",
              ],
              answer: 1,
              explanation:
                "cargo bench builds with the bench profile, which inherits release; plain cargo build compiles at opt-level 0 with checks left in, and iterator-heavy code pays 10x to 100x for it. Every serious measurement starts with an optimized build.",
            },
            {
              kind: "predict",
              prompt:
                "In release mode you benchmark `b.iter(|| { xs.iter().sum::<u64>(); })`: the sum is computed, discarded with a semicolon, and nothing is black_boxed. What does criterion report as xs grows from 1,000 to 1,000,000 elements?",
              options: [
                "Time grows roughly linearly with length",
                "A near-constant time of a few nanoseconds, regardless of length",
                "criterion detects the dead code and refuses to run",
                "Time grows, but only logarithmically",
              ],
              answer: 1,
              explanation:
                "The result is never observed, so the optimizer deletes the sum and you time an empty closure. Routing the value out of the closure or through std::hint::black_box makes the work un-deletable; a duration that ignores input size is the tell.",
            },
            {
              kind: "mcq",
              prompt:
                "After a change, criterion prints `change: [-4.81% -2.10% +0.92%] (p = 0.19 > 0.05)`. What is the honest conclusion?",
              options: [
                "The change made the code 2.1% faster; keep it",
                "The change made the code 4.81% faster in the best case; keep it",
                "No evidence of a performance change: the interval straddles zero and p is high",
                "The change is a regression, because +0.92% appears in the interval",
              ],
              answer: 2,
              explanation:
                "The confidence interval includes zero and the significance test says the difference is indistinguishable from run-to-run noise. Banking a 2% 'win' at p = 0.19 is how next week's identical noise becomes a reported regression.",
            },
          ],
        },
        {
          slug: "perf-flamegraphs",
          title: "Flamegraphs: width is time",
          summary:
            "Sampling profilers, cargo-flamegraph and samply, and why an async service's flamegraph misses the waiting.",
          contentFile: "perf-flamegraphs.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In a flamegraph, what does a frame's width represent?",
              options: [
                "The duration of the single slowest call to that function",
                "Its share of samples: time on CPU in that function and everything it called",
                "How long ago it ran: the x-axis reads left to right in time",
                "Its stack depth: wider frames sit closer to main",
              ],
              answer: 1,
              explanation:
                "Identical stacks are merged and sorted alphabetically, so width is aggregate inclusive time and position carries no chronology. Height is only call depth; the wide plateaus at the top edge are where the CPU actually was.",
            },
            {
              kind: "predict",
              prompt:
                "An async handler awaits one Postgres query (p50 300 ms), then spends 2 ms serializing the response. You profile the loaded service with cargo flamegraph. What dominates the handler's part of the graph?",
              options: [
                "The query wait, as a 300 ms wide frame in the driver",
                "The 2 ms of serialization plus runtime poll machinery; the wait is nearly invisible",
                "An epoll_wait frame 150x wider than the serialization",
                "Nothing: async functions cannot appear in flamegraphs",
              ],
              answer: 1,
              explanation:
                "perf samples threads that are on a CPU, and a task parked awaiting IO is not running, so blocked time accumulates no samples. On-CPU profiles answer 'where does CPU go', not 'where does latency go'; span durations from the telemetry section answer the second.",
            },
            {
              kind: "mcq",
              prompt:
                "Why can a sampling profiler run against production-shaped load with negligible overhead?",
              options: [
                "It only activates on functions the compiler marked hot",
                "Its cost scales with the sampling rate, about 1,000 stack captures per second, not with how many calls your code makes",
                "It profiles a statistical model of the binary rather than the binary",
                "It needs a special instrumented rebuild that is faster than release",
              ],
              answer: 1,
              explanation:
                "Interrupting ~997 times a second costs the same whether the program makes a thousand calls or a billion, unlike instrumentation that pays per call and can distort the timings it reports. The trade is resolution: very cheap functions fall below the sampling floor and vanish.",
            },
          ],
        },
      ],
    },
    {
      slug: "memory-and-the-build",
      title: "Memory and the build",
      description:
        "Counting allocations, arenas and allocator swaps, and compiler knobs priced honestly.",
      lessons: [
        {
          slug: "perf-allocation-profiling",
          title: "The allocations you did not write",
          summary:
            "dhat and heaptrack count what malloc really did; arenas and allocator swaps for when the count is the problem.",
          contentFile: "perf-allocation-profiling.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "You swap the global allocator to mimalloc in a single-threaded, compute-bound benchmark that allocates a few dozen times total. What does criterion report?",
              options: [
                "A large win: mimalloc is faster at everything",
                "No measurable change: allocator swaps pay off under heavy concurrent allocation or a slow bundled allocator like musl's",
                "A regression: mimalloc only works with async code",
                "A compile error: mimalloc requires nightly",
              ],
              answer: 1,
              explanation:
                "The swap changes step 2 of the allocation chain, the allocator's own bookkeeping, so it needs allocation pressure to matter: many threads contending, or musl's weak allocator in static images. With a few dozen allocations there is nothing for a better allocator to improve.",
            },
            {
              kind: "mcq",
              prompt: "Which statement about a bumpalo arena is true?",
              options: [
                "Each allocation searches a free list, but frees are batched",
                "Allocation is a pointer bump, freeing is the whole arena at once, and Drop does not run for arena contents by default",
                "It runs Drop for every allocated value when the arena resets",
                "Values allocated in the arena can outlive it if moved out as references",
              ],
              answer: 1,
              explanation:
                "Bump allocation is a few instructions and reset() reclaims everything in one step, which is the speed; skipped Drop (unless you use bumpalo::boxed::Box) is the cost. Lifetimes tie every borrow to the arena, so the borrow checker enforces that nothing escapes.",
            },
            {
              kind: "mcq",
              prompt: "What does dhat's testing mode add beyond profiling a run by hand?",
              options: [
                "It makes allocations faster in CI",
                "It samples allocations statistically to lower overhead",
                "A test can assert an allocation budget, so a regression like a new clone in the render loop fails CI",
                "It replaces heaptrack on Linux",
              ],
              answer: 2,
              explanation:
                "HeapStats::get() plus dhat::assert! freezes a measured fact, such as 'rendering one email allocates at most 4 blocks', into the test suite. The profiler finds the win once; the test keeps strangers from quietly undoing it.",
            },
          ],
        },
        {
          slug: "perf-build-knobs",
          title: "Build knobs, priced",
          summary:
            "release, codegen-units, LTO thin and fat, target-cpu, PGO: what each buys, what each costs, measured per app.",
          contentFile: "perf-build-knobs.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which single build change reliably delivers the largest speedup?",
              options: [
                'lto = "fat" with codegen-units = 1',
                "-C target-cpu=native",
                "Debug build to release build",
                'panic = "abort"',
              ],
              answer: 2,
              explanation:
                "Release turns on real optimization and drops debug assertions and overflow checks, worth 10x to 100x; every other knob adjusts single-digit percentages on top and must be measured to justify its cost. Order of magnitude first, fractions after.",
            },
            {
              kind: "predict",
              prompt:
                'The delivery worker ships with panic = "abort" for binary size. A malformed job makes one tokio task panic. What happens, compared to the default unwinding build?',
              options: [
                "The same as before: the task dies, JoinError reports a panic, other sends continue",
                "The panic becomes a recoverable error automatically",
                "The whole worker process aborts, taking every in-flight send with it",
                "tokio restarts the task transparently",
              ],
              answer: 2,
              explanation:
                "Task isolation relies on unwinding: the runtime catches the unwind and hands the supervisor a JoinError. With abort there is nothing to catch, so one poison job kills the process, which is the fault-tolerance section's failure model rewritten by a build flag.",
            },
            {
              kind: "mcq",
              prompt:
                "A binary built with -C target-cpu=native on new CI hardware crashes with SIGILL on an older fleet node. What is the correct fix?",
              options: [
                "Give the container more memory",
                "Pin an explicit level like -C target-cpu=x86-64-v3, chosen from the oldest CPU the fleet must support",
                "Ship the debug build to that node, since it targets baseline",
                "Catch the signal and fall back to slower code at runtime",
              ],
              answer: 1,
              explanation:
                "native encodes the build machine's instruction set into the binary, so any older CPU faults on the first unsupported instruction. Named microarchitecture levels state the requirement explicitly instead of inheriting whatever hardware CI happened to run on.",
            },
          ],
        },
      ],
    },
    {
      slug: "the-last-mile",
      title: "The last mile",
      description: "SIMD verified in the asm, then the delivery worker optimized end to end.",
      lessons: [
        {
          slug: "perf-simd",
          title: "SIMD: eight adds per instruction",
          summary:
            "Auto-vectorization first, verified on Godbolt; std::simd's status and the narrow case for writing lanes by hand.",
          contentFile: "perf-simd.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "At opt-level=3, `xs.iter().sum()` compiles for a &[i32] and for a &[f32]. Which vectorizes?",
              options: [
                "Both: sum is sum",
                "Neither: iterators block vectorization",
                "Only the i32 version: vectorizing the f32 reduction would reorder non-associative additions and change the result",
                "Only the f32 version: floats have wider SIMD support",
              ],
              answer: 2,
              explanation:
                "Integer addition can be regrouped freely, so LLVM turns the loop into packed adds; float addition is not associative and rustc will not change your program's answer for speed. Accept the reordering explicitly, with chunked accumulators or explicit SIMD, and the floats vectorize too.",
            },
            {
              kind: "mcq",
              prompt: "What is the status of SIMD in Rust today?",
              options: [
                "std::simd is stable, so portable SIMD is the default choice",
                "std::simd is nightly-only; stable code uses auto-vectorization, core::arch intrinsics with runtime feature detection, or crates like memchr that package the pattern",
                "SIMD requires dropping to C via FFI",
                "Auto-vectorization only happens with -C target-cpu=native",
              ],
              answer: 1,
              explanation:
                "Portable SIMD remains unstable as of early 2026, so stable programs lean on the compiler plus the is_x86_feature_detected! dispatch pattern when they need explicit lanes. Baseline x86-64 already vectorizes with SSE2; target-cpu just widens the registers available.",
            },
            {
              kind: "mcq",
              prompt: "In what order do you justify hand-written SIMD intrinsics for a loop?",
              options: [
                "Write intrinsics first, since they are always fastest, then benchmark",
                "Profiler shows the loop is hot, the asm shows the compiler did not vectorize it, the data layout offers lanes, then intrinsics, then re-measure",
                "Enable target-cpu=native and skip intrinsics forever",
                "Check the asm on Godbolt, then optimize whichever function looks longest",
              ],
              answer: 1,
              explanation:
                "Each step can end the project early: an unprofiled loop may not matter, the compiler may have already vectorized it, and a memory-bound loop gains little from wider math. Intrinsics are the last resort precisely because they carry unsafe, per-platform code you must now maintain.",
            },
          ],
        },
        {
          slug: "perf-delivery-capstone",
          title: "Capstone: the worker, measured",
          summary:
            "Measure, one hypothesis, one change, re-measure: the delivery worker before and after, and the course's first question answered.",
          xp: 25,
          contentFile: "perf-delivery-capstone.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "The render fix made render_email 42x faster but cut wall time only 23%. Why?",
              options: [
                "criterion overstated the 42x",
                "The worker is wait-bound: 50,000 sends at ~5.8 ms across 16 permits put an ~18 s floor under the run that no CPU fix can lower",
                "The allocator absorbed the difference",
                "LTO was still disabled, hiding the gain",
              ],
              answer: 1,
              explanation:
                "The flamegraph only ever explained the on-CPU 6 of 26 seconds; the rest is off-CPU waiting on the provider, governed by latency and concurrency, not rendering. Optimizing a component helps wall time only up to that component's share of it.",
            },
            {
              kind: "predict",
              prompt:
                "Before the render fix, the worker made ~1.9 million allocations per run; mimalloc was a plausible win. Measured after the render fix, the swap shows wall 20.3 s to 20.1 s at p = 0.31. What is the right call, and why?",
              options: [
                "Keep it: 0.2 s is 0.2 s",
                "Keep it: allocator swaps always pay off eventually",
                "Revert it: the change is statistically noise, because the allocation-heavy workload that justified the swap was already deleted by the previous fix",
                "Re-run until p drops below 0.05, then keep it",
              ],
              answer: 2,
              explanation:
                "Each fix changes the workload the next fix would act on: removing 1.9 million allocations removed the contention mimalloc exists to relieve. p = 0.31 means the residual difference is indistinguishable from noise, and rerunning until significance appears is how noise gets laundered into a result.",
            },
            {
              kind: "mcq",
              prompt: "Why does the method insist on changing one thing between measurements?",
              options: [
                "Because criterion can only track one benchmark at a time",
                "Attribution: with two changes in one run, a net +5% cannot be split into which change helped, which hurt, and which to revert",
                "Because git commits should be small",
                "To keep CI runs short",
              ],
              answer: 1,
              explanation:
                "Keep-or-revert decisions need a delta with exactly one cause; bundle a render fix with an allocator swap and a good number may be hiding a regression you just shipped. The discipline is the point of the section: evidence per change, written down, kept honest by re-measurement.",
            },
          ],
        },
      ],
    },
  ],
}
