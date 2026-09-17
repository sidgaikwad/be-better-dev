The previous lesson left a gap. Core wasm functions accept and return numbers, nothing else. This signature is unexpressible at the boundary:

```rust
pub fn greet(name: &str) -> String
```

You could hand-roll it: export your allocator, have JS copy UTF-8 bytes into linear memory, pass a pointer and a length, return another pointer and length, decode on the way out, free both sides at the right moments. Nobody wants to maintain that. `wasm-bindgen` generates it:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {name}")
}
```

```js
import init, { greet } from "./pkg/hello.js"
await init() // fetch and instantiate the .wasm
greet("wasm") // "Hello, wasm"
```

`wasm-pack build --target web` runs the compiler and the bindgen step and emits a `pkg/` directory: the `.wasm`, a JS glue module, TypeScript definitions, a `package.json`. From the outside it looks like an ordinary npm package.

## What a call actually costs

The glue is worth reading once, because it prices every call you will ever make. For `greet("wasm")`:

1. JS encodes the UTF-16 string to UTF-8 with `TextEncoder`.
2. It calls an exported allocator function to reserve space in linear memory and copies the bytes in.
3. It calls `greet(ptr, len)`. Rust sees a `&str` pointing into its own memory.
4. Rust builds the result `String` in linear memory and returns its pointer and length.
5. JS copies those bytes out, decodes them with `TextDecoder` into a brand-new JS string, and calls the exported free.

Two copies, two transcodings, an allocation on each side, per call. Numbers cross for free because they are wasm's native types; strings pay every time, in both directions, because JS strings and Rust strings cannot share representation. Numeric slices sit in between: a `&[f64]` argument crosses as one block copy, vastly cheaper than a million one-number calls but not zero. Arbitrary JS values cross as `JsValue`, an opaque handle you can hold and pass back but not look inside without calling back into JS.

## js-sys and web-sys

Two crates extend the bridge to everything the browser has. `js-sys` binds the JS standard library (`Array`, `Date`, `Promise`); `web-sys` binds the Web APIs (DOM, fetch, canvas, WebSocket), each interface behind a cargo feature so you compile only what you use.

Read one line of it honestly and a misconception dies:

```rust
let document = web_sys::window().unwrap().document().unwrap();
```

This is not Rust "doing DOM natively". Every one of those calls crosses the boundary into the same browser internals JavaScript uses, plus the crossing overhead. Rust cannot out-run JS at DOM work, because DOM work was never JS-the-language; it is host calls either way, and wasm stands one door further away.

## Design the boundary like a network API

The consequence is an architecture rule: few crossings, big payloads. A chatty interface (one call per list item, per pixel, per keystroke) drowns the compute advantage in copies and transitions. A coarse interface crosses once with the whole input and once with the whole output, and lets Rust run uninterrupted in between.

This is exactly how the section project will treat the newsletter's email renderer: one JSON string in, one rendered HTML string out, a single round trip per preview. The delivery lessons' `content.html` gets produced by the same code on both sides of the wire.

## Predict, then verify

Two exported functions, called from JS in a hot loop:

```rust
#[wasm_bindgen]
pub fn scale(x: f64, factor: f64) -> f64 { x * factor }

#[wasm_bindgen]
pub fn shout(s: &str) -> String { s.to_uppercase() }
```

Which one pays allocation and copying costs on every call?

Answer: only `shout`. Both `f64` arguments and the `f64` return map directly onto a core wasm value type, so `scale` crosses with no allocation, no copy, no encoding. `shout` pays the full string toll both ways: encode and copy in, copy and decode out, plus an allocation on each side. If a loop calls `shout` per element, the boundary will cost more than the uppercasing; passing one big string once is the shape that wins.
