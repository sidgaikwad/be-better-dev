Everything in Rust's ownership story is a statement about memory. So before ownership: what memory actually is to a running program.

A process sees a flat range of _virtual_ addresses. Two regions of it matter here.

## The stack

Every thread gets one stack. Calling a function pushes a _frame_ holding its locals; returning pops the frame. Allocation on the stack is one instruction, moving the stack pointer, and "freeing" is moving it back. Nothing is searched, nothing is bookkept.

The price of that speed is a rule: the compiler must know every local's size at compile time, and a frame dies when its function returns. You cannot return a pointer to your own frame; that memory is reused by the next call.

```rust
fn frame_demo() {
    let x: i64 = 42;        // 8 bytes in this frame
    let pair = (1u32, 2u32); // 8 more bytes, still this frame
} // frame popped; x and pair cease to exist
```

## The heap

The heap is for data whose size is unknown at compile time or that must outlive the current function. Heap memory comes from the _allocator_ (the `malloc` family), which hands back a pointer to a block that stays valid until explicitly freed. Every language with dynamic data uses a heap; they differ only in who is responsible for the freeing. In C, you are. In JavaScript, a garbage collector is. In Rust, the _ownership system_ is: the compiler inserts the free at a point it can prove correct.

## What a String really is

This one picture explains half of Rust:

```rust
let s = String::from("hello");
```

```
stack (frame of current fn)        heap
+----------+
| ptr      | ────────────────────▶ | h | e | l | l | o |
| len: 5   |
| cap: 5   |
+----------+
```

`s` itself is three machine words _on the stack_: a pointer, a length, a capacity. The text lives in a heap buffer. `Vec<T>` is the same three words. Box<T> is one word. This is why "how big is this type" and "where does its data live" are different questions, and Rust makes you fluent in both.

## Predict, then verify

Does the following allocate on the heap?

```rust
let s = "hello";
```

Answer: no. A string literal's bytes are baked into the executable itself (a third region: static data), and `s` is a `&str`, a pointer-and-length pair on the stack referring to them. No allocator involved, nothing to free, which is also why `&str` and `String` are different types: one borrows text living somewhere else, the other owns a heap buffer it must eventually free.
