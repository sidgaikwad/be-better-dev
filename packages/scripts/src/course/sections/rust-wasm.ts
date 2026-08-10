import type { SectionSeed } from "../types"

export const rustWasm: SectionSeed = {
  slug: "rust-wasm",
  title: "Rust with WebAssembly",
  description: "wasm-bindgen in the browser, WASI on the server and edge.",
  badgeIcon: "🕸️",
  badgeTitle: "wasm × Rust",
  units: [
    {
      slug: "the-machine",
      title: "The machine",
      description: "What a .wasm file actually is, and how rich types cross into JavaScript.",
      lessons: [
        {
          slug: "wasm-what-it-is",
          title: "WebAssembly: a stack machine with linear memory",
          summary:
            "Portable bytecode, one flat memory, a sandbox with no syscalls; wasm32 is just another target.",
          contentFile: "wasm-what-it-is.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Core WebAssembly functions can accept and return which types?",
              options: [
                "Any JSON-serializable value",
                "i32, i64, f32, f64, and SIMD vectors; nothing else",
                "Numbers and UTF-8 strings",
                "Whatever types the host language registers first",
              ],
              answer: 1,
              explanation:
                "The instruction set speaks only in numbers. Strings, structs, and everything richer are conventions over bytes in linear memory, which is exactly why a bridge like wasm-bindgen has to exist.",
            },
            {
              kind: "predict",
              prompt:
                'Rust compiled to wasm32-unknown-unknown runs `let s = String::from("hello");`. Where do the five text bytes end up?',
              options: [
                "In the browser's JavaScript heap, managed by the GC",
                "On the wasm operand stack",
                "In a heap region inside the module's linear memory, placed there by the allocator compiled into the module",
                "They stay only in the executable and are never copied anywhere",
              ],
              answer: 2,
              explanation:
                "The module ships its own allocator (a dlmalloc port by default) that hands out addresses inside linear memory. The literal's bytes live in the module's data and String::from copies them into that heap; the browser's GC never sees any of it.",
            },
            {
              kind: "mcq",
              prompt: "A wasm module needs the current time. What has to happen?",
              options: [
                "It executes the clock syscall, like any native binary",
                "The host must provide a clock function as an import; without one there is no way to get the time",
                "It reads the time from a well-known address in linear memory",
                "It cannot access time under any circumstances",
              ],
              answer: 1,
              explanation:
                "There is no syscall instruction; every effect flows through imports the host chooses to grant. A host can absolutely provide a clock (WASI standardizes one), which is why 'never' overshoots: the point is deny by default, not deny forever.",
            },
          ],
        },
        {
          slug: "wasm-bindgen-boundary",
          title: "wasm-bindgen: crossing the boundary",
          summary:
            "How strings and structs move between Rust and JS, what each crossing costs, and js-sys/web-sys.",
          contentFile: "wasm-bindgen-boundary.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "JS calls an exported `greet(name: &str) -> String`. What actually crosses the boundary?",
              options: [
                "A reference to the JS string, shared zero-copy with Rust",
                "Nothing: wasm-bindgen compiles the Rust body into JavaScript",
                "The name is encoded to UTF-8 and copied into linear memory; the result's bytes are copied back out and decoded into a new JS string",
                "Only a pointer; JS reads Rust's memory lazily when the string is used",
              ],
              answer: 2,
              explanation:
                "JS strings and Rust strings cannot share a representation, so every string crossing pays encode, copy, and decode, in both directions. Numbers cross free because they map onto core wasm types; strings never do.",
            },
            {
              kind: "predict",
              prompt:
                "You port a DOM-heavy list-reordering feature to Rust with web-sys, touching the DOM exactly as often as the JS version did. What happens to performance?",
              options: [
                "Faster: Rust manipulates the DOM natively",
                "About the same at best, likely a bit slower: each DOM call is still a call into the browser, now with boundary overhead added",
                "Faster, but only after JIT warmup",
                "It cannot compile: web-sys has no DOM types",
              ],
              answer: 1,
              explanation:
                "DOM work was never JS-the-language; it is host calls either way, and wasm stands one door further from them. If the number of DOM touches is unchanged, the port adds crossing cost and removes nothing.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does the section project expose one `render_preview(json) -> html` function instead of `render_header`, `render_body`, and `render_footer` called separately?",
              options: [
                "JSON parses faster inside wasm than function arguments",
                "Fewer, bigger crossings: boundary costs are paid per call and per string, so a coarse API keeps copies from dominating the compute",
                "wasm-bindgen only supports one exported function per module",
                "It makes the .wasm file smaller",
              ],
              answer: 1,
              explanation:
                "Design the boundary like a network API. Each call pays transition and string-copy costs, so crossing once with the whole input and once with the whole output lets the compute advantage survive.",
            },
          ],
        },
      ],
    },
    {
      slug: "shipping-to-browsers",
      title: "Shipping to browsers",
      description: "The module is a download now: size discipline and loading strategy.",
      lessons: [
        {
          slug: "wasm-size-and-shipping",
          title: "Size discipline and loading",
          summary:
            "Release profiles, wasm-opt, why panic formatting bloats modules, and lazy loading off the critical path.",
          contentFile: "wasm-size-and-shipping.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is wasm-opt?",
              options: [
                "A cargo profile setting that enables size optimization",
                "Binaryen's post-compiler optimizer: it rewrites the finished .wasm and typically shaves another 10 to 20 percent beyond LLVM's output",
                "A rustup component that caches wasm builds",
                "A browser flag that speeds up module compilation",
              ],
              answer: 1,
              explanation:
                "LLVM is not the last word on a .wasm file. wasm-opt applies wasm-specific transformations to the compiled binary, which is why wasm-pack runs it automatically on release builds.",
            },
            {
              kind: "predict",
              prompt:
                'You add one `panic!("bad id: {id}")` to a previously panic-free tiny module. The release .wasm grows by tens of kilobytes. Why?',
              options: [
                "Panics require the unwinding runtime, which wasm implements in software",
                "The panic message string is stored uncompressed",
                "Formatting the message pulls in core::fmt machinery, which is large relative to a small module",
                "wasm-bindgen generates a JS shim for every panic site",
              ],
              answer: 2,
              explanation:
                "Panics on this target already abort rather than unwind, so unwinding is not the cost. The formatting apparatus is: nothing else needed core::fmt, and one interpolated panic message makes all of it reachable. twiggy is how you catch this.",
            },
            {
              kind: "mcq",
              prompt:
                "Why load the preview module with a dynamic `import()` on first use instead of a top-level import?",
              options: [
                "Top-level imports cannot load wasm modules",
                "It keeps the module off the critical path: first paint never waits for it, and the download plus streaming compilation happen only when the feature is actually used",
                "Dynamic imports bypass the HTTP cache",
                "It avoids CORS restrictions on .wasm files",
              ],
              answer: 1,
              explanation:
                "The module is a network download now. Deferring it means users who never open the editor never pay for it, and instantiateStreaming still overlaps compilation with the download when it does happen.",
            },
          ],
        },
      ],
    },
    {
      slug: "beyond-the-browser",
      title: "Beyond the browser",
      description:
        "WASI and wasmtime, the component model, and an honest call on when wasm is worth it.",
      lessons: [
        {
          slug: "wasm-wasi-server-side",
          title: "WASI: wasm on the server",
          summary:
            "Capability-based system access, wasmtime, the component model, and why edge platforms run isolates.",
          contentFile: "wasm-wasi-server-side.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is WASI?",
              options: [
                "A POSIX emulation layer compiled into every wasm module",
                "A standardized set of imports for system resources, granted to a module capability by capability by the runtime",
                "Wasmtime's proprietary extension API",
                "A browser API that gives pages filesystem access",
              ],
              answer: 1,
              explanation:
                "WASI keeps the sandbox and standardizes what may be passed through it: clocks, stdio, filesystem, sockets, each an import the runtime explicitly grants. It is a contract, not POSIX smuggled back in.",
            },
            {
              kind: "predict",
              prompt:
                "`wasmtime run renderer.wasm`, where main reads ./templates/issue.html, is run without `--dir`. What happens?",
              options: [
                "The read succeeds: wasmtime forwards filesystem calls by default",
                "The module traps with an out-of-bounds memory access",
                "The open fails: no preopened directory grants access to that path, so the capability simply does not exist",
                "wasmtime pauses and asks the user for permission",
              ],
              answer: 2,
              explanation:
                "Capabilities are handed in at startup, not requested at runtime. With no preopens there is nothing for the path to resolve against, so the program gets an ordinary open error while the sandbox never opens at all.",
            },
            {
              kind: "mcq",
              prompt:
                "Why can an edge platform afford a fresh wasm instance per request when container platforms cannot do the equivalent?",
              options: [
                "wasm code executes faster than native code",
                "Instantiating a precompiled module is microseconds of work (map a copy-on-write memory image, create a context), while a container cold start takes hundreds of milliseconds or more",
                "Containers cannot run compiled languages safely",
                "Edge platforms run on faster hardware than clouds",
              ],
              answer: 1,
              explanation:
                "An instance is a linear memory plus some tables, with no guest kernel or userland to boot. At microseconds per instance, per-request isolation becomes affordable, and density follows from the same arithmetic.",
            },
          ],
        },
        {
          slug: "wasm-when-and-project",
          title: "Judgment, and the email preview renderer",
          summary:
            "When wasm beats JS and when it loses, plus the newsletter's renderer compiled for the admin preview.",
          xp: 25,
          contentFile: "wasm-when-and-project.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which candidate gains the most from a Rust-to-wasm port?",
              options: [
                "A click handler that increments a counter and updates a badge",
                "Drag-and-drop reordering of a rendered list",
                "Syntax-highlighting a 200 KB markdown document passed in as one string",
                "Fetching JSON from an API and inserting rows into a table",
              ],
              answer: 2,
              explanation:
                "Compute-dense work over one coarse crossing is wasm's home turf. The other three are DOM-bound or IO-bound, where the boundary lesson showed wasm adds cost without removing any.",
            },
            {
              kind: "predict",
              prompt:
                "Rendering takes 4 ms of a 50 ms interaction. wasm makes rendering 4x faster. How much faster is the interaction overall?",
              options: [
                "About 4x faster",
                "About 30 percent faster",
                "About 6 percent faster: 4 ms becomes 1 ms, saving 3 ms of 50",
                "Unchanged: wasm speedups never affect total time",
              ],
              answer: 2,
              explanation:
                "Amdahl's law arbitrates every optimization: the speedup applies only to the fraction of time you touched. Profile first and spend wasm on something that dominates, or accept that the motive is fidelity rather than speed, as in the preview project.",
            },
            {
              kind: "mcq",
              prompt:
                "The admin preview shows different HTML than the delivery worker sent for the same issue. Under the shared-crate architecture, where does the bug live?",
              options: [
                "The preview's copy of the rendering logic has drifted from the server's",
                "In the inputs or the deployment: both hosts run the same crate, so they were handed different issue data, or the shipped wasm bundle is stale relative to the server build",
                "Floating point differs between wasm and native, changing the output",
                "serde_json field ordering differs between the two hosts",
              ],
              answer: 1,
              explanation:
                "A single implementation removes 'which renderer is wrong' from the suspect list by construction. What remains is which input was wrong (unsaved form state versus the stored row) or which artifact is stale, both strictly easier bugs.",
            },
          ],
        },
      ],
    },
  ],
}
