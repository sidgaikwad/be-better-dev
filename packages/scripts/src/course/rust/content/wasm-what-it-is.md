In the toolchain lesson, cross-compiling meant adding a target: `x86_64-unknown-linux-musl` produced a static Linux binary that ran in an empty container. WebAssembly enters the course the same way:

```bash
rustup target add wasm32-unknown-unknown
cargo build --release --target wasm32-unknown-unknown
```

The output is not machine code for any CPU. The `.wasm` file is bytecode for a virtual machine that every major browser ships and that standalone runtimes embed on servers. Same compiler, same borrow checker, most of the same crates. One more row in `rustup target list`.

So what is this machine?

## A stack machine

WebAssembly instructions do not name registers. They pop operands from an implicit stack and push results back:

```wat
local.get $a   ;; push a
local.get $b   ;; push b
i32.add        ;; pop both, push a + b
```

The instruction set has exactly four value types: `i32`, `i64`, `f32`, `f64`, plus a 128-bit vector for SIMD. No strings, no structs, no objects. Every richer shape is a convention layered over bytes in memory, which is exactly the world the stack and heap lesson trained you for. Modules are validated before they run (types check, jumps only target legal places), then the engine compiles them to real machine code. "Virtual machine" describes the format, not the speed.

## Linear memory

A module gets one linear memory: a flat, contiguous array of bytes starting at address 0, grown in 64 KiB pages. The whole picture from the memory lessons relocates into it:

- The heap. Your module carries its own allocator (a `dlmalloc` port by default) that manages a region of linear memory. `String::from("hello")` calls it, exactly as before.
- The stack. Simple locals become wasm locals, but any value whose address is taken lives on a shadow stack, a region of linear memory the compiler manages, because wasm's operand stack is not addressable.
- Pointers are plain `i32` offsets into linear memory. On wasm32, `usize` is 4 bytes, so the String header (pointer, length, capacity) costs 12 bytes where x86-64 spent 24.

To the host, linear memory is visible as a single `ArrayBuffer`. To the module, it is the entire universe of addressable data: an out-of-bounds access does not corrupt a neighbor, it traps deterministically and the instance stops.

## No ambient syscalls

The property that makes wasm more than a browser trick: a module starts with no capabilities. There is no syscall instruction. It cannot open a file, read the clock, or touch the network. Every effect flows through imports: functions the module declares it needs and the host chooses to provide, or to withhold.

Compare a native binary: it is born with the whole syscall surface and gets confined after the fact by users, containers, and seccomp. A wasm module is born with nothing and is granted capabilities one import at a time. That inversion, deny by default, is why plugin systems, serverless platforms, and the WASI lesson later in this section take wasm seriously.

For the browser path, the host is JavaScript, the imports are JS functions, and the immediate problem is obvious: your functions traffic in `String` and structs, and the machine only speaks in four kinds of numbers. Bridging that gap is the next lesson.

## Predict, then verify

You compile this for `wasm32-unknown-unknown` and for your own machine. Does `std::mem::size_of::<String>()` report the same number on both?

```rust
fn main() {
    println!("{}", std::mem::size_of::<String>());
}
```

Answer: no. A `String` is always three words (pointer, length, capacity), but a word is the target's pointer size: 8 bytes on a 64-bit host, so 24, and 4 bytes on wasm32, so 12. The text bytes live behind the pointer in heap memory either way, on wasm inside the module's linear memory. Layout questions from Part 1 never went away; a new target just changes the answers.
