The newsletter's delivery worker contains a function like this:

```rust
async fn deliver(issue: String) {
    let body = format!("Newsletter: {issue}");
    let excerpt = &body;          // a reference to a local
    send(&excerpt).await;         // held across an await
    println!("delivered: {excerpt}");
}
```

Nothing here looks exotic. But in the state-machine lesson of Async from scratch you watched the compiler turn an `async fn` into a struct: every local that is still alive across an `.await` becomes a field, so the function can suspend and resume. `excerpt` is used after the `await`, so it must survive the suspension, and so must `body`, because `excerpt` borrows it. Both become fields:

```rust
// A simplified sketch of what rustc generates
struct DeliverMachine {
    state: State,           // which await we are parked at
    body: String,           // three words inline: ptr, len, cap
    excerpt: *const String, // holds the address of the `body` field above
    send_fut: SendFuture,   // the child future, stored inline too
}
```

Look at `excerpt`. It stores the address of `body`, and `body` lives inside the same struct. This is a self-referential struct: a value containing a pointer into itself. You cannot write one in safe Rust; there is no lifetime you could name for that field. The compiler builds one anyway, because that is literally what your code means.

## Now recall what a move is

From One owner per value: a move is a cheap bitwise copy plus a compile-time death sentence for the source. A memcpy. Nothing scans the bytes, nothing rewrites them. Watch what that does here:

```
machine at 0x1000                     after memcpy to 0x2000
┌───────────────────────┐             ┌───────────────────────┐
│ state:   AfterSend    │             │ state:   AfterSend    │
│ body:    ptr len cap  │◀──┐         │ body:    ptr len cap  │
│ excerpt: 0x1008 ──────┼───┘         │ excerpt: 0x1008 ──────┼──▶ still aims at
│ send_fut: ...         │             │ send_fut: ...         │    the OLD body
└───────────────────────┘             └───────────────────────┘    field
```

A pointer is just bytes, so the memcpy copies `0x1008` verbatim. The new machine's `excerpt` points into the old machine's memory. Resume the copy at `0x2000` and it reads whatever now lives at the old address: a stale value, some other variable's bytes, freed memory.

## Why the compiler cannot just fix the pointer

C++ met this problem and answered with move constructors: user code that runs on every move and can patch things up. Rust deliberately refused. A Rust move is a memcpy for every type, always, with no hooks. That is exactly why moving a 10 MB `String` cost 24 bytes in One owner per value, and why moves never show up in a profile. Cheap, uniform moves and self-patching moves cannot coexist; Rust keeps the cheap ones.

That leaves one door: if the pointer cannot be fixed during a move, the move itself must become impossible to write. The type that closes the door is the next lesson's subject, `Pin`.

One timing detail matters first. In its start state the machine holds only `issue`; `body` and `excerpt` do not exist until `poll` has run the body up to the `await`. A never-polled future contains no self-references and is perfectly safe to move, which is why you can return futures from functions and hand them to `tokio::spawn` without ceremony. The danger window opens at the first poll.

## Predict, then verify

The machine is memcpy'd from `0x1000` to `0x2000`, and the memory at `0x1000` is reused by other locals. The program resumes the machine at `0x2000`, which reads `excerpt`. What happens?

Answer: it dereferences `0x1008` and reads whatever bytes the new locals put there: garbage output at best, a crash or silent corruption at worst. This is a use-after-free, the exact class of memory bug Rust exists to rule out. Which is why the language's answer is not "patch pointers during moves" but "make this move a compile error".
