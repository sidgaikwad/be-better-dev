A PR lands titled "Rust CSV import: 6x faster." The benchmark inside times the Rust parser with `Instant::now()` around the core loop, then compares that against the whole TypeScript function timed from the outside. Those are two different races. This lesson is the honest methodology.

## Four rules

**Measure the JS baseline first, and make it good.** Not a strawman: the platform's primitives (`JSON.parse`, `TextDecoder`, regex) are C++ and fast, so use them the way a competent teammate would. Benchmark with warmup, because V8 and JavaScriptCore tier hot functions up through their JITs over the first hundreds of iterations; a cold measurement understates JS badly. `mitata` handles warmup and runs in both Bun and Node:

```ts
import { bench, run } from "mitata"

const data = Buffer.from(await Bun.file("subscribers.csv").arrayBuffer())

bench("pure TS", () => importCsvTs(data))
bench("napi", () => importCsvNative(data))
await run()
```

**Time the exported function from the JS side.** The Rust number must include argument conversion, the crossing, and materializing the result as JS values. That is the product; the core loop is not.

**Return what the caller needs, then price it.** The result's shape is part of the API, and it shows up in the numbers below.

**Use production-shaped data**, sizes included. Overhead that vanishes at 12 MB dominates at 2 KB.

## A worked example

The section project, previewed: 100,000 subscriber rows, 12 MB, on a laptop. Representative numbers; yours will differ, so run them.

| variant                                 | median |
| --------------------------------------- | ------ |
| pure TS: split lines, regex, Set dedupe | 180 ms |
| Rust core alone, timed inside Rust      | 35 ms  |
| napi: Buffer in, summary object out     | 45 ms  |
| napi: string in, summary object out     | 62 ms  |
| napi: Buffer in, 100k row objects out   | 205 ms |

Read it bottom-up. Returning every row as a JS object costs more than the parsing win and loses to pure TS outright. Passing the input as a string instead of a Buffer adds a 12 MB transcode. The shippable configuration, buffer in and a small summary out, is a real 4x. The "6x" from the inner loop was never on offer.

Why is materializing 100,000 objects so expensive? Node-API has no batch constructor: every object is built property by property, each set a call back into the engine, as the boundary lesson warned. Real tools design around it. swc returns one big output string, not a token tree; another option is keeping a heavy result in native memory as a class handle with accessor methods, so JS pays only for the fields it actually reads.

## When V8 wins outright

Sometimes the honest table says keep the JS. The recurring cases:

- **The baseline is already native.** `JSON.parse` runs in C++ and its output is already JS objects. Rust parses faster with serde_json, then loses everything rebuilding the object graph across the boundary.
- **Tiny inputs.** Fixed crossing overhead dominates microsecond workloads.
- **Monomorphic numeric loops.** A hot loop over a `Float64Array` JIT-compiles to machine code within shouting distance of rustc's output; the boundary then decides against the move.
- **Chatty shapes you cannot batch**, from the first lesson.

Native modules win on compute density per crossing: parsing, hashing, compression, image codecs. The table makes the call, not the language.

## Predict, then verify

A teammate replaces `JSON.parse` with a napi function that parses the same 12 MB payload with serde_json and returns the parsed structure to JS. Faster or slower?

Answer: slower, usually by a lot. serde_json outraces V8's parser on the parsing itself, but the caller needs JS objects, so the module must reconstruct the whole graph through per-property engine calls, the most expensive traffic the boundary carries. `JSON.parse` hands back engine-native objects for free. This flip, Rust wins the compute and loses the materialization, is the single most common way native-module benchmarks go wrong.
