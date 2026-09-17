Time to build it. The deliverable: `@newsletter/subscriber-import`, a native module that parses a subscriber CSV export, validates and dedupes it, and returns a report to a Bun script, benchmarked honestly against the TS version it would replace. One topic first: keeping the types from forking.

## One source of truth for types

Two kinds of types cross out of the crate. The module surface, `importCsv` and `ImportReport`, is already covered: `napi build` regenerates `index.d.ts` from the `#[napi]` items on every build. Rust is the source of truth, and hand edits to the `.d.ts` are overwritten, which is the correct fate for hand edits.

Types that travel beyond the module as plain JSON are not covered. Suppose the report is also queued for the dashboard, in the style of Part 2's delivery pipeline. For those, `ts-rs` derives TypeScript from the same Rust definitions:

```rust
#[derive(serde::Serialize, ts_rs::TS)]
#[ts(export)]
pub struct RowError {
    pub line: u32,
    pub reason: String,
}
```

Running `cargo test` writes `bindings/RowError.ts` for the frontend to import. Either way the rule holds: types are defined once, in Rust, and the TypeScript is generated. Run the generation in CI so drift fails the build instead of surfacing as a 3 a.m. type mismatch.

## The project

**1. Scaffold.** `bunx @napi-rs/cli new subscriber-import`, pick your platforms. You get the crate, the loader, and the CI matrix workflow.

**2. The Rust side.** Buffer in, small report out, errors capped:

```rust
#[napi(object)]
pub struct ImportReport {
  pub total: u32,
  pub valid: u32,
  pub invalid: u32,
  pub duplicates: u32,
  pub errors: Vec<RowError>, // first 20 only
}

#[napi]
pub fn import_csv(data: Buffer) -> Result<ImportReport> {
  // csv::Reader over &data[..], validate, dedupe, count
}
```

Parse with the `csv` crate over the borrowed bytes. Validate emails with a contains-`@`-and-a-dot check (real validation was Part 1's newtype lesson; keep the two implementations identical so the comparison is fair). Dedupe with a `HashSet` of lowercased emails; owned `String`s are fine at this size, the allocation lesson priced them. Cap `errors` at 20: an unbounded error list is an unbounded boundary bill, as the benchmarking lesson showed.

**3. The TS baseline.** Write the version you would actually ship without Rust: `TextDecoder`, split on newlines, one regex, a `Set` for dupes. Keep it in the repo; it is the control group and the fallback.

**4. The Bun script.**

```ts
import { importCsv } from "@newsletter/subscriber-import"

const data = Buffer.from(await Bun.file("subscribers.csv").arrayBuffer())
const report = importCsv(data)
console.log(`${report.valid} valid, ${report.duplicates} duplicates`)
```

Bun implements Node-API, so the same `.node` binary serves Node and Bun without changes.

**5. The benchmark.** mitata, both implementations, a generated 100,000-row fixture, plus one deliberately wrong variant (string input, or uncapped errors) so you can watch the boundary move the numbers. Put the table in the README with the machine noted.

Acceptance: both implementations produce identical counts on the same fixture; the README documents a crossing-inclusive speedup; `bun run bench` reproduces it.

**Stretch goals.** A `ThreadsafeFunction<u32>` progress callback firing every 10,000 rows. A wasm-pack build of the same core as a third benchmark column, wired into the dashboard's upload preview from the previous lesson.

## Predict, then verify

Your TS baseline must call `new TextDecoder().decode(data)` before it can split lines, while the Rust side works on the raw bytes. Is including that decode inside the TS timing unfair to JS?

Answer: it is fair, and required. Both sides receive the same input, the bytes on disk, and each pays whatever its approach needs to produce the report: TS needs a string before regex and split can run, Rust does not. Excluding the decode would benchmark an implementation that cannot exist. That is the whole discipline of this section: measure the job, not the flattering slice of it.
