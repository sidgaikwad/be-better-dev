The import parser ships, and a week later the dashboard team asks for the same validation in the browser: flag bad rows in the upload preview, before the file ever reaches the API. Your `.node` binary is machine code for one OS; a browser tab will not load it. This is wasm's opening.

## Same crate, different target

`wasm-pack` compiles Rust to WebAssembly and wraps it for JS consumers: it runs the build for `wasm32-unknown-unknown`, then `wasm-bindgen` generates the JS glue and a `.d.ts`.

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn count_valid(data: &[u8]) -> u32 {
    // the same core logic, recompiled
    0
}
```

```bash
wasm-pack build --target web      # browsers, as an ES module
wasm-pack build --target nodejs   # Node and Bun
```

The output is one `.wasm` file plus glue, and that artifact runs in every browser, Node, Bun, Deno, and the edge runtimes (Cloudflare Workers, Vercel edge functions). The napi build matrix from the first lesson, eight-plus binaries and a CI pipeline, becomes: build once. wasm is the platform.

## What the portability costs

**A performance gap.** wasm executes inside the engine's sandbox: bounds-checked linear memory, SIMD capped at 128 bits, and no threads unless the host enables SharedArrayBuffer (browsers demand cross-origin isolation headers for that). The same Rust typically lands 1.5x to 2.5x slower than the native build, workload dependent. That still beats JS decisively on compute-dense work; it is native that it trails.

**The boundary remains, now with copies both ways.** A string or byte slice crossing into wasm is copied into the module's linear memory, and results are copied back out. The chatty-API warning transfers unchanged.

**No operating system.** `wasm32-unknown-unknown` has no files, sockets, or environment. `std::fs::read` compiles, then returns an error at runtime. On servers, WASI fills some of this in; in a browser, the host hands you nothing you did not explicitly import. The WebAssembly section next door goes deep on linear memory, WASI, and shrinking `.wasm` sizes; here we need just enough to choose.

## Choosing: napi or wasm

- **The code must run in a browser or on edge runtimes.** wasm, by elimination: native addons do not exist there.
- **Server-only, and the workload wants everything the machine has**: threads, mmap, full-width SIMD, syscalls. napi, and you pay the build matrix for it.
- **Server-only, but distribution simplicity matters more than the last 2x.** wasm is a legitimate choice: one artifact, no cross-compilation, no platform packages.
- **Untrusted code.** The sandbox is the feature. This is why plugin systems, swc's among them, run plugins as wasm even where the host itself is native.

The mature answer is often both, from one workspace: a core crate holding the pure logic, a thin napi wrapper crate, a thin wasm wrapper crate. The core knows nothing about either boundary, which also keeps it testable with plain `cargo test`. napi-rs 3 blurs the line further: it can emit a wasm fallback build of the same module, loaded automatically on platforms with no prebuilt binary, which is how napi-based tools now run in places like StackBlitz.

## One level deeper: linear memory

A wasm module owns a single growable memory, visible from JS as an ArrayBuffer. Rust's allocator carves allocations out of it, and every Rust pointer is a 32-bit offset into that buffer, not a machine address. The module physically cannot address host memory. That is the sandbox, and it is also why every payload is copied in: your data must exist inside the module's world before wasm code can see it.

## Predict, then verify

The CSV counter: 180 ms in pure TS, 45 ms via napi. You compile the same core with wasm-pack and call it from Bun. Predict the number.

Answer: expect roughly 70 to 100 ms. The compute slows by the sandbox factor, and the input is now copied into linear memory instead of borrowed in place. Still around 2x faster than the TS baseline, and it is the identical artifact you will hand the dashboard team for the browser preview. Whether that beats maintaining the napi matrix is a judgment call, which is precisely the point: the framework above decides it, not a benchmark alone.
