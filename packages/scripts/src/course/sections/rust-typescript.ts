import type { SectionSeed } from "../types"

// Part 4: Rust from TypeScript. The learner's day job is a Bun monorepo
// (this very platform), so the section treats native modules as an
// engineering decision: what the JS-to-native boundary costs, what napi-rs
// automates, how to benchmark against the JS baseline without lying, and
// when wasm's portability beats native speed.

export const rustTypescript: SectionSeed = {
  slug: "rust-typescript",
  title: "Rust with TypeScript and Node",
  description: "napi-rs native modules, wasm-pack, benchmarked against the JS baseline.",
  badgeIcon: "🧩",
  badgeTitle: "TS × Rust",
  units: [
    {
      slug: "crossing-the-boundary",
      title: "Crossing the boundary",
      description: "What native code buys, what the crossing bills, and the napi-rs machinery.",
      lessons: [
        {
          slug: "napi-when-native-wins",
          title: "When a native module earns its complexity",
          summary:
            "CPU-bound hot paths qualify; the boundary bills per call and per byte; the build matrix is the tax.",
          contentFile: "napi-when-native-wins.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which workload is the strongest candidate for a Rust native module?",
              options: [
                "Streaming subscriber rows from Postgres",
                "Hashing passwords with argon2 on signup",
                "Formatting dates for the dashboard",
                "Uploading newsletter assets to S3",
              ],
              answer: 1,
              explanation:
                "argon2 is deliberately CPU-hard and batch-shaped: one crossing, heavy compute, which is why @node-rs/argon2 exists. The I/O options already run native async under the hood, and Rust cannot await faster; date formatting is too small to out-earn the crossing.",
            },
            {
              kind: "predict",
              prompt:
                "A native function receives a 10 MB JS string and returns its length. What dominates the call's runtime?",
              options: [
                "Computing the length",
                "The re-encoding copy converting the engine string to UTF-8 at the boundary",
                "Garbage collector pauses triggered by the call",
                "Loading the .node file from disk",
              ],
              answer: 1,
              explanation:
                "Strings are copied and transcoded on every crossing, a per-byte cost, after which the length is nearly free. The .node file loads once at require time, not per call.",
            },
            {
              kind: "mcq",
              prompt:
                "Why can native code borrow a Buffer's bytes without copying, when strings must be copied?",
              options: [
                "Buffers are always smaller than strings",
                "Buffer bytes live in plain contiguous memory outside the moving GC heap, so a raw pointer to them stays valid during the call",
                "Buffers are Rust Vecs under the hood",
                "The engine pauses garbage collection whenever native code runs",
              ],
              answer: 1,
              explanation:
                "Engine values sit in a heap the collector may move, so pointers into them are unsafe to hand out; buffer storage is external and stays put. That is why fast native APIs are designed around buffers.",
            },
          ],
        },
        {
          slug: "napi-rs-exports",
          title: "napi-rs: #[napi] from function to Promise",
          summary:
            "Exported functions and structs, async as Promises, threadsafe callbacks, errors as exceptions, prebuilt binaries.",
          contentFile: "napi-rs-exports.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                'A sync #[napi] function returns Err(Error::from_reason("row 47: invalid email")). What does the Bun caller observe?',
              options: [
                "The process aborts with the message on stderr",
                "The function returns an { error } object",
                "A JS exception is thrown, catchable with try/catch, carrying the reason as its message",
                "undefined is returned and a warning is logged",
              ],
              answer: 2,
              explanation:
                "napi-rs maps Result onto JS's native error channel: a throw from sync functions, a rejected Promise from async ones. The Result type itself never appears in the generated .d.ts; only the runtime behavior carries it.",
            },
            {
              kind: "mcq",
              prompt: "Where does the body of a #[napi] async fn execute?",
              options: [
                "On the JS event loop thread, blocking it until the future completes",
                "On a tokio runtime that napi-rs manages, with the result marshalled back to the JS thread",
                "In a forked child process",
                "On a random OS thread with no runtime",
              ],
              answer: 1,
              explanation:
                "The future runs on napi-rs's tokio runtime, so a slow parse never stalls other requests; the resolution hops back to the JS thread because JS values may only be touched there.",
            },
            {
              kind: "mcq",
              prompt: "What problem does ThreadsafeFunction solve?",
              options: [
                "It makes Rust closures implement Send",
                "JS callbacks can only run on the JS thread, so it queues invocations onto the event loop from any Rust thread",
                "It prevents data races on Buffers shared with JS",
                "It retries callbacks that throw",
              ],
              answer: 1,
              explanation:
                "It is a channel into the event loop: workers push calls, the JS thread drains them. NonBlocking mode drops calls when that queue is full, the same bounded-queue tradeoff as Part 2's channels.",
            },
          ],
        },
      ],
    },
    {
      slug: "measuring-and-choosing",
      title: "Measuring and choosing",
      description:
        "Honest benchmarks against the JS baseline, and wasm as the portable alternative.",
      lessons: [
        {
          slug: "napi-honest-benchmarks",
          title: "Benchmarks that include the boundary",
          summary:
            "Measure the JS baseline first, time from the caller's side, and know when V8 wins outright.",
          contentFile: "napi-honest-benchmarks.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "You change the CSV module to return an array of 100,000 row objects instead of the summary. What happens to the benchmark?",
              options: [
                "Slightly slower, still well ahead of the TS version",
                "Roughly unchanged: parsing dominates either way",
                "Slower than the pure TS version: materializing the objects costs more than the parsing win",
                "Faster: Rust builds objects faster than JS does",
              ],
              answer: 2,
              explanation:
                "Every object is built through per-property calls back into the engine; in the worked table that turns 45 ms into 205 ms against a 180 ms TS baseline. Result shape is part of the API, and part of the price.",
            },
            {
              kind: "mcq",
              prompt: "Why must the JS baseline be measured after warmup iterations?",
              options: [
                "To fill the OS page cache with the input file",
                "The JIT tiers hot functions up over early iterations; cold numbers understate steady-state JS",
                "To give the garbage collector time to settle",
                "Because mitata refuses to run without warmup",
              ],
              answer: 1,
              explanation:
                "V8 and JavaScriptCore compile hot code progressively, so the first iterations run interpreted or barely optimized. Benchmarking cold JS against warm Rust manufactures a speedup that production will never see.",
            },
            {
              kind: "mcq",
              prompt: "Which is the honest Rust number to publish?",
              options: [
                "Instant::now() around the core parsing loop",
                "The exported function timed from the JS side, conversion and result materialization included",
                "The core number minus estimated boundary overhead",
                "cargo bench output for the crate",
              ],
              answer: 1,
              explanation:
                "The caller can only ever invoke the exported function, so the crossing is part of the product. Inner-loop timings answer a different question than 'should we ship this'.",
            },
          ],
        },
        {
          slug: "napi-or-wasm",
          title: "wasm-pack: one artifact instead of eight",
          summary:
            "The portable alternative: same crate, browser reach, a real performance gap, a decision framework.",
          contentFile: "napi-or-wasm.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Which single requirement rules out napi entirely, rather than being a tradeoff?",
              options: [
                "The workload is CPU-bound",
                "The module must run in the browser's upload preview",
                "The team wants to avoid a CI matrix",
                "Inputs are larger than 10 MB",
              ],
              answer: 1,
              explanation:
                "Native addons do not exist in browsers, so wasm is the only Rust route there. Avoiding the CI matrix is a reason to prefer wasm, but napi remains possible; the browser makes it impossible.",
            },
            {
              kind: "predict",
              prompt:
                'A wasm module built for the browser calls std::fs::read("subscribers.csv"). What happens?',
              options: [
                "A compile error: fs does not exist for wasm32-unknown-unknown",
                "The browser prompts the user to pick a file",
                "It compiles, and the call returns an Err at runtime: the target has no filesystem",
                "The tab crashes with a segfault",
              ],
              answer: 2,
              explanation:
                "std compiles for the target with stub implementations that fail at runtime, so the mistake surfaces late. The sandbox is capability-based: the host must pass data in; the module cannot reach out for it.",
            },
            {
              kind: "mcq",
              prompt: "You must ship both napi and wasm builds of the CSV logic. The right layout?",
              options: [
                "Two copies of the parsing code, kept in sync by code review",
                "One crate with cfg blocks around every function",
                "A workspace: a pure core crate, plus thin napi and wasm wrapper crates",
                "Ship only the napi crate and let bundlers convert it",
              ],
              answer: 2,
              explanation:
                "The core stays free of boundary types, testable with plain cargo test, and each wrapper stays a page of glue. This is the layout real dual-target tools use, napi-rs 3's wasm fallback notwithstanding.",
            },
          ],
        },
      ],
    },
    {
      slug: "one-source-of-truth",
      title: "One source of truth",
      description: "Types generated from Rust, and the CSV import capstone benchmarked from Bun.",
      lessons: [
        {
          slug: "napi-csv-capstone",
          title: "Project: the subscriber import, twice",
          summary:
            "Generated .d.ts and ts-rs keep types in Rust; then build the native CSV importer and benchmark it from Bun.",
          xp: 25,
          contentFile: "napi-csv-capstone.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Where does the module's index.d.ts come from?",
              options: [
                "You write it by hand next to index.js",
                "The napi CLI generates it from the #[napi] items at build time; hand edits are overwritten",
                "tsc infers it from the compiled binary",
                "ts-rs generates it from the serde derives",
              ],
              answer: 1,
              explanation:
                "The exported surface is derived from the macros, so the Rust signatures are the single source of truth for it. ts-rs covers a different boundary: plain data types that leave the module as JSON.",
            },
            {
              kind: "predict",
              prompt:
                "You remove the 20-error cap and benchmark a fixture where all 100,000 rows are invalid. What do you observe?",
              options: [
                "The same numbers: error objects are cheap",
                "The native version slows dramatically: 100,000 error objects must be materialized across the boundary",
                "The native version gets faster: there are no valid rows to count",
                "A panic: Vec cannot hold that many elements",
              ],
              answer: 1,
              explanation:
                "Worst-case return shape is part of the API: a hostile file turns the small report into the expensive array-of-objects case from the benchmarking lesson. Cap the list, or return counts plus a sample.",
            },
            {
              kind: "mcq",
              prompt: "The generated .d.ts covers the module surface. What is ts-rs for?",
              options: [
                "Generating the .d.ts faster than the napi CLI",
                "Generating TypeScript for plain data types that travel beyond the module as JSON, like the queued report",
                "Validating JSON payloads at runtime",
                "Converting existing TypeScript types into Rust",
              ],
              answer: 1,
              explanation:
                "ts-rs derives .ts declarations from the same Rust structs serde serializes, so a report that is queued or stored as JSON keeps one definition. Both tools point the same direction: Rust defines, TypeScript is generated.",
            },
          ],
        },
      ],
    },
  ],
}
