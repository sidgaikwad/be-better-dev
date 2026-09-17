The first lesson made a point of what wasm cannot do: no files, no sockets, no clock, no ambient anything. In a browser that is fine, JS is the host. Run wasm on a server and the question becomes unavoidable: a program that cannot open a file is not much of a program. WASI is the answer, and it answers carefully.

## Capabilities, not syscalls

WASI (the WebAssembly System Interface) is a standardized set of imports for system resources: clocks, randomness, stdio, filesystem, sockets. Not POSIX compiled in, but a contract the runtime implements, and every capability is granted explicitly. Rust ships it as, no surprise by now, another target:

```bash
rustup target add wasm32-wasip2
cargo build --release --target wasm32-wasip2
```

An ordinary `main` with `println!` and `std::fs` compiles. Run it under Wasmtime, the reference runtime:

```bash
wasmtime run target/wasm32-wasip2/release/renderer.wasm
```

Now the interesting part. If that program opens `./templates/issue.html`, the run above fails: the module has no preopened directories, so there is no capability through which the path can resolve. Grant one and it works:

```bash
wasmtime run --dir=./templates renderer.wasm
```

The sandbox never opened. You handed a directory in, and that directory is the module's whole filesystem. Compare the container world, where isolation is something you configure around a process that could otherwise see everything; here it is the starting point. (Two targets exist: `wasm32-wasip1` is the frozen 2019-era snapshot; `wasm32-wasip2` tracks WASI 0.2, which is built on the component model.)

## The component model, one pass

Core wasm interoperates through numbers and a shared linear memory, which works but is low-level and unsafe to compose. The component model is the ecosystem's answer, in three moves:

- Interfaces are declared in WIT, a small IDL with real types: records, strings, lists, results.
- A component wraps a core module and talks only through those typed interfaces. Values are copied across via a canonical ABI; components never share memory.
- Components compose regardless of source language. A Rust component can call one written in Go, Python, or JavaScript, each carrying its own allocator and its own linear memory.

```wit
interface renderer {
  render: func(issue-json: string) -> result<string, string>;
}
```

WASI 0.2 itself is defined as WIT interfaces (`wasi:filesystem`, `wasi:http`, ...), and the `wasm32-wasip2` target emits a component directly. For servers the flagship is `wasi:http`: your component exports a handler, the platform owns the listening socket, and the unit of deployment shrinks from "service" to "function with typed imports".

## Why edge platforms care

Here is the production argument. A wasm instance is a linear memory plus some tables and a bit of context: no guest kernel, no userland, no image to pull. Wasmtime can instantiate a precompiled module in microseconds by mapping a copy-on-write memory image. A container cold start is hundreds of milliseconds to seconds; a V8 isolate is single-digit milliseconds; a wasm instance is orders of magnitude below that.

At microseconds per instance, per-request instantiation becomes affordable: every request gets a fresh, perfectly isolated world, and state cannot bleed between requests or tenants. Density follows from the same math: an idle instance holds only the memory it actually uses, so one host packs thousands of tenants where containers pack dozens. This is the model behind Fastly Compute, Fermyon Spin, and Shopify Functions, and it is why "wasm isolates" keep appearing wherever untrusted code meets multi-tenancy.

## Predict, then verify

A component built from Rust and a component built from Python are composed into one application. The Rust side passes a 2 MB string to the Python side. Is the string shared by reference, like passing `&str` between Rust functions?

Answer: no. Components do not share linear memory; that isolation is the point of the model. The canonical ABI copies the string from the Rust component's memory into the Python component's memory at the call boundary. Same tradeoff as wasm-bindgen at the JS boundary, and the same design pressure follows: typed interfaces make composition safe, and coarse interfaces make it fast.
