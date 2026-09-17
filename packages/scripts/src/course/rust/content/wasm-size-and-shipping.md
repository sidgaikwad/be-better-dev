On a server, binary size is a rounding error: the 5 MB newsletter API ships once to machines you own. A wasm module ships over the network to every visitor, on whatever connection they have, and nothing renders faster because of it. Size is now a feature you maintain.

The baseline is sobering. A debug build of last lesson's `greet` module lands over a megabyte; the same crate in release drops to tens of kilobytes. The gap is debug info and unoptimized code, and closing the rest is deliberate work.

## The release profile

```toml
[profile.release]
opt-level = "z"      # optimize for size, not speed
lto = true           # whole-program view lets dead code die
codegen-units = 1    # slower builds, better optimization
panic = "abort"
```

`lto` and `codegen-units = 1` matter more here than on native targets: monomorphized generics and inlined std code are duplicated per codegen unit, and link-time optimization is what deletes the copies nothing calls.

## Panics are a size story

On `wasm32-unknown-unknown` a panic already aborts (traps) rather than unwinding, so `panic = "abort"` mostly ratifies reality. The real weight is elsewhere: formatting the panic message. One `panic!("bad id: {id}")`, or the hidden panic inside every `unwrap` and array index, pulls in `core::fmt`, the formatting machinery, which can be tens of kilobytes. On native, that vanishes next to everything else; in a 30 KB module it can be half the file. The discipline is the one Part 1 taught for different reasons: return `Result` across the boundary instead of panicking, and keep rich formatting out of code paths that exist only to fail.

When a module is mysteriously fat, ask it directly:

```bash
twiggy top pkg/email_template_wasm_bg.wasm
```

`twiggy` attributes bytes to functions; the usual suspects are `core::fmt`, a JSON deserializer monomorphized for many types, or a dependency you forgot you had.

## wasm-opt

LLVM is not the last word. Binaryen's `wasm-opt` rewrites the finished `.wasm` with wasm-specific transformations and typically shaves another 10 to 20 percent:

```bash
wasm-opt -Oz input.wasm -o output.wasm
```

`wasm-pack` runs it for you on release builds; flags are configurable in `Cargo.toml` metadata. After that, serve the file with compression: wasm bytecode gzips roughly in half, and Brotli does better.

## Loading without blocking

However small the module, keep it off the critical path. The glue's `init()` uses `WebAssembly.instantiateStreaming`, which compiles the module while the bytes are still downloading (this is why the server must send `Content-Type: application/wasm`). Your job is deciding when that download starts. For a feature like the admin's email preview, the answer is: when it is first used, via dynamic import:

```js
let renderer
async function getRenderer() {
  if (!renderer) {
    renderer = await import("./pkg/email_template_wasm.js")
    await renderer.default() // fetch + streaming-compile the .wasm
  }
  return renderer
}
```

First paint never waits for wasm; the editor pays a one-time cost on first preview; every later call is instant. Bundlers cooperate: with `--target bundler` output, Vite and webpack treat the package as an ordinary module and emit the `.wasm` as a content-hashed asset, cached independently of your JS, so shipping new JS does not re-download an unchanged module.

## Predict, then verify

A teammate deletes the only `format!` and replaces every `unwrap` with returned `Result`s in a small module, changing no other code. The release `.wasm` shrinks by 25 KB. Where did the bytes go?

Answer: the formatting machinery left. Panicking paths and `format!` were the only users of `core::fmt`; once nothing formats, LTO proves the whole apparatus dead and removes it, along with the panic-message plumbing behind each `unwrap`. The lesson generalizes: in a small module, size lives in what your code makes reachable, not in what it executes, and `twiggy` is how you find out which innocent-looking line is holding the door open for 25 KB of guests.
