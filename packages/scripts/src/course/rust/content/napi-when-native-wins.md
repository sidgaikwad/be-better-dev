Your newsletter service grows an import feature: subscribers from the old provider arrive as a 12 MB CSV export. The handler that parses it pins a CPU core for a couple of seconds, and because JavaScript runs on one thread, every other request queues behind it. Someone says the word Rust.

Before you agree, be clear about what a native module buys and what it bills. This lesson is the judgment; the mechanics come next.

## What native buys

Node and Bun are already mostly native code: the engine is C++, `JSON.parse` is C++, TLS and gzip are native libraries. A native module lets your own hot path join that club. You write Rust, compile it to a shared library (a `.node` file), and the runtime loads it like any other addon. You get real machine code, real threads, SIMD, no GC pauses, and every crate from Parts 1-3: `csv`, `regex`, `sha2`, `image`.

The wins in the wild cluster around CPU-dense, batch-shaped work: parsing (swc and oxc parse JavaScript itself in Rust), hashing (`@node-rs/argon2` for passwords), image resizing (sharp wraps native libvips for the same reason), compression. Not I/O: awaiting Postgres or S3 is already native under the hood, and Rust cannot await faster.

## The boundary bills per call and per byte

From the FFI lessons you know a foreign call crosses an ABI. This crossing is pricier than C-to-Rust, because the two sides do not share a memory model. JavaScript values live in a heap the garbage collector is free to move; native code cannot hold pointers into it. So arguments are converted on the way in and results on the way out:

- Numbers: cheap, one machine word.
- Strings: copied and re-encoded. Engine strings are latin-1 or UTF-16; Rust wants UTF-8. A 10 MB string costs a 10 MB transcoding copy before your Rust sees byte one.
- Objects and arrays: walked property by property, each access a call back into the engine.

On top of the per-byte cost, every call carries fixed overhead. Tens to a few hundred nanoseconds sounds free until you multiply it by a loop:

```ts
// chatty: 500k crossings, 500k string conversions
for (const row of rows) if (isValidEmailNative(row.email)) valid++

// batched: one crossing, one borrowed buffer
const report = importCsvNative(csvBuffer)
```

The chatty version can lose to a plain JS regex even when the Rust check itself is instant. The rule: cross once, hand over everything, bring back little.

## Buffers are the escape hatch

`Buffer` and the typed arrays are the exception that makes big payloads workable: their bytes live in plain contiguous memory outside the moving object heap, so Node-API lets native code borrow them in place, no copy. That is why fast native APIs take and return buffers rather than strings and object trees, and why the project at the end of this section reads the CSV as bytes.

## The tax you sign up for

The last cost is organizational. A `.node` binary is compiled for one OS and CPU. Ship to other machines and you owe {x64, arm64} × {linux-gnu, linux-musl, macOS, Windows} at minimum, eight builds, before anyone asks about Android. Either you run that CI matrix and publish prebuilt binaries, as swc does, or every install needs a Rust toolchain on the user's machine. Weigh the boring alternative first: worker threads give you parallelism at JS speed with zero new toolchains. Native is for when the single-threaded algorithm itself is the wall.

## Predict, then verify

You move email validation to Rust as `isValidEmail(email: string): boolean` and call it in a JS loop over 500,000 rows. The Rust check is 10x faster than your JS regex. Does the import get faster?

Answer: almost certainly slower. Each of the 500,000 calls pays the fixed crossing overhead plus a re-encoding copy of the string, and the work saved per call is a few hundred nanoseconds of regex that V8 already ran as native code. The boundary costs more than the compute you removed. Batch instead: one call that takes the whole buffer and returns counts, which is exactly the shape the section project uses.
