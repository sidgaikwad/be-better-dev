A napi-rs project is an ordinary crate that compiles to a shared library:

```toml
[lib]
crate-type = ["cdylib"]

[dependencies]
napi = { version = "2", features = ["async"] }
napi-derive = "2"
```

`bunx @napi-rs/cli new` scaffolds this, plus a CI workflow we will get to. `napi build --release` produces the `.node` binary, a JS loader, and a generated `index.d.ts`. napi-rs 3 (2025) keeps the same `#[napi]` surface; it reworks the internals and adds a WebAssembly fallback target, which matters two lessons from now.

Everything hangs off one attribute:

```rust
use napi::bindgen_prelude::*;
use napi_derive::napi;

#[napi]
pub fn count_valid(data: Buffer) -> u32 {
  data.split(|&b| b == b'\n')
      .filter(|line| line.contains(&b'@'))
      .count() as u32
}
```

`Buffer` derefs to `&[u8]`, borrowing the JS bytes for the duration of the call: the zero-copy path from last lesson. The macro writes the Node-API glue you would otherwise hand-write in C: argument extraction, type checks, module registration. Names convert to camelCase automatically, so JS calls `countValid`.

Structs cross in two ways. `#[napi(object)]` copies field by field into a plain JS object, right for small results:

```rust
#[napi(object)]
pub struct ImportReport {
  pub total: u32,
  pub valid: u32,
  pub invalid: u32,
}
```

Plain `#[napi]` on a struct with an `impl` block exports a class instead: the Rust value stays in native memory and JS holds a handle. That is the shape for big state you do not want to serialize across the boundary.

## async fn becomes a Promise

```rust
#[napi]
pub async fn import_csv(path: String) -> Result<ImportReport> {
  let data = tokio::fs::read(&path)
    .await
    .map_err(|e| Error::from_reason(format!("read {path}: {e}")))?;
  Ok(parse(&data))
}
```

The generated declaration is `importCsv(path: string): Promise<ImportReport>`. The future runs on a tokio runtime that napi-rs manages, so the JS event loop never blocks, and the resolved value is marshalled back on the JS thread. This is the tokio section's runtime showing up inside someone else's process.

## Errors and panics

`napi::Result<T>` is the error channel. A sync function returning `Err` becomes a thrown, catchable JS exception; an async one becomes a rejected Promise. `Error::from_reason` sets the message JS will see. Panics do not abort the process: napi-rs catches the unwind at the boundary and rethrows it as a JS error. Treat that as a crash report, not error handling; the contract from the error-handling section still applies, recoverable conditions travel as `Result`.

## Calling back: threadsafe functions

JS callbacks can only run on the JS thread, so a Rust worker thread cannot just invoke one. `ThreadsafeFunction` is the queue that fixes this: callable from any thread, it schedules the JS invocation onto the event loop.

```rust
// excerpt: progress reporting from a worker thread
#[napi]
pub fn import_with_progress(
  data: Buffer,
  on_progress: ThreadsafeFunction<u32>,
) -> Result<ImportReport> {
  // every 10k rows, from whichever thread is parsing:
  on_progress.call(Ok(pct), ThreadsafeFunctionCallMode::NonBlocking);
  // ...
}
```

`NonBlocking` says: if the event loop's queue is full, drop the call rather than block the worker. The same bounded-queue judgment as Part 2's channels, applied to callbacks.

## Shipping binaries

Nobody's users compile Rust on `bun install`. The distribution pattern, popularized by esbuild and adopted across the napi-rs world, is one npm package per platform, listed as `optionalDependencies` of the main package: `@swc/core-darwin-arm64`, `@swc/core-linux-x64-gnu`, and so on. The package manager installs only the one matching the current platform, and the loader requires it. swc, oxc, rollup 4, and Prisma's query engine all ship this way, and the CI workflow `napi new` scaffolded builds the whole matrix. Because Node-API is ABI-stable, one binary per platform covers every modern Node and Bun version: no per-runtime rebuilds, which is the improvement over the old V8-API addons.

## Predict, then verify

What does the generated `index.d.ts` say about the error case of `import_csv`, the async function above?

Answer: nothing. The declaration is `importCsv(path: string): Promise<ImportReport>`; rejection is invisible in TypeScript's types, exactly as with any JS Promise. The Rust signature carries `Result`, but the type boundary erases it. Document failure modes and test them from the JS side; the compiler cannot force a caller to handle them over there.
