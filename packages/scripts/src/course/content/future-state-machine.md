`.await` looks like a function pausing in mid-body. Threads can pause anywhere because the kernel saves their registers and stack for them; an async fn has no such help. When its poll returns `Pending`, the stack frame pops like any other returning function's, and from Stack and heap, for real you know what that means: every local in the frame is gone. So where does the function's progress live between polls? Inside the future value itself. The compiler rewrites an async fn into a state machine: an enum, plus a `poll` that matches on it.

## One variant per await point

```rust
// fetch_email and send_email are async fns defined elsewhere.
async fn deliver(id: u64) -> Status {
    let email = fetch_email(id).await;      // await point 1
    let receipt = send_email(&email).await; // await point 2
    receipt.status()
}
```

Morally (the real generated type is anonymous), the compiler produces:

```rust
// A sketch of the generated state enum, not literal compiler output.
enum DeliverFuture {
    Start { id: u64 },
    AwaitingFetch { fut: FetchEmailFuture },
    AwaitingSend { email: String, fut: SendEmailFuture }, // fut borrows email
    Done,
}
```

One variant per await point, plus a start and a done. `deliver(7)` constructs `Start { id: 7 }` and returns it; the previous lesson's inertness stops being mysterious, because constructing an enum value runs nothing.

`poll` is a match on the current state, the same exhaustive match from match and exhaustiveness. Each call resumes wherever the machine stopped, runs your code to the next `.await`, and polls that child future. Child ready: keep running. Child pending: store the child in the next variant, return `Pending`, and the whole chain of nested polls unwinds. The next poll re-enters through the match and asks the child again.

## Locals become fields

Look at which locals were captured where. `id` sits in `Start` because building the fetch future needs it. `email` sits in `AwaitingSend` because the send future borrows it for as long as it is pending: `email` must outlive await point 2, and no stack frame will. `receipt` appears in no variant: born after the last await and dead before poll returns, it stays an ordinary stack local. The rule: exactly the locals that are alive across an await become fields; everything else costs nothing.

That rule is your cost model. From Enums: one of several shapes, an enum is a discriminant plus space for its largest variant, so a future's size is its fattest state, computed at compile time. Awaiting an async fn nests that child's whole machine inline as a field: one top-level future is its entire call tree flattened into a single sized value, with no allocation per await. Set that against the 2 MiB a thread reserves in case it ever needs deep stack. You can measure it:

```rust
println!("{} bytes", std::mem::size_of_val(&deliver(7)));
```

One honest wrinkle: `AwaitingSend` holds `email` and a future pointing at `email`, a value containing a pointer into itself. From One owner per value, a move is a bitwise copy to a new address, which would leave that interior pointer dangling. Self-referential states are the reason `poll` takes `Pin<&mut Self>`, and the pinning section exists to explain it; until then, `Box::pin` will keep us out of trouble.

## Predict, then verify

```rust
// checksum, checksum_sync, and finish are defined elsewhere.
async fn with_buf() {
    let buf = [0u8; 4096];
    checksum(&buf).await;
}

async fn without_buf() {
    {
        let buf = [0u8; 4096];
        checksum_sync(&buf);
    }
    finish().await;
}
```

Roughly compare `size_of_val` of the two futures.

Answer: `with_buf`'s future is at least 4096 bytes: `buf` is live across the await, so the whole array becomes a field of the waiting state, in every instance of this future. `without_buf`'s is small, a few dozen bytes, because `buf` dies before any await and never leaves the stack. What you hold across `.await` is what your future weighs. It is also what you hold, full stop: the MutexGuard warning from Drop: deterministic cleanup applies doubly to guards held across await points, a bug the tokio section returns to.
