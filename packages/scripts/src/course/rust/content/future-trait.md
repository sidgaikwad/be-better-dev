In TypeScript, this line starts work:

```ts
const p = sendConfirmation(subscriber) // the request is already in flight
```

By the time you hold a promise, its executor function has run and the request is on the wire, whether or not anything ever awaits it. Carry that intuition to Rust and it fails immediately:

```rust
async fn send_confirmation(email: String) {
    println!("sending to {email}");
    // build the request, write it, await the response...
}

fn main() {
    send_confirmation(String::from("ada@example.com"));
}
```

Nothing prints. No request is sent. The compiler tells you precisely what happened:

```
warning: unused implementer of `Future` that must be used
   note: futures do nothing unless you `.await` or poll them
```

Calling an async fn executes none of its body. It constructs and returns a value.

## The trait

The value implements `Future`, an ordinary trait with one method:

```rust
pub trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

Read `Pin<&mut Self>` as `&mut self` for now; what Pin adds is the pinning section's business. `cx` carries the waker, two lessons ahead. The load-bearing part is the return type:

```rust
pub enum Poll<T> {
    Ready(T),
    Pending,
}
```

Two shapes, one at a time, exactly as in Enums: one of several shapes. A call to `poll` means: make whatever progress you can right now without blocking, then answer. `Ready(value)` means finished; the future is spent, and the contract says never poll it again (doing so may panic). `Pending` means: not done yet, and, crucially, I have arranged for you to be notified when polling again is worthwhile. That arrangement is the waker contract, and it is what will keep async from degenerating into a busy-wait.

## Futures are inert

Until something polls it, a future is only data: the arguments, moved in at the call site (Passing values into functions applies unchanged: `email` moved into the future above), plus a record of where to resume. It occupies no thread and sits in no queue. Every bit of forward motion comes from outside, from something calling `poll` repeatedly. That something is called an executor, and this section ends with you writing one.

Inertness is not a limitation; it is the design, and it buys three things:

- Composition. `join` and `select` (the streams section) are ordinary functions that own several futures and poll them. No runtime hooks required.
- Cheap setup. Constructing ten thousand sends allocates nothing extra and contacts no one. Work starts when an executor does.
- Cancellation is `drop`. Stop polling and drop the value: Drop: deterministic cleanup releases everything it owned, at that line. No cancellation token threaded through every signature, as with JS's AbortController. (Cancelling mid-I/O has sharp edges; the streams and cancellation section gives them a full lesson.)

## Predict, then verify

```rust
async fn confirm(email: String) -> usize {
    println!("confirming {email}");
    email.len()
}

fn main() {
    let fut = confirm(String::from("ada@example.com"));
    println!("constructed");
    drop(fut);
}
```

What prints, and what happens to the String?

Answer: only `constructed`. The body never ran, so its println never fired. The String moved into `fut` when the future was constructed, and `drop(fut)` dropped it along with the rest of the captured state: ownership and Drop treat a future like any other value, because it is one. To see `confirming`, something has to poll: `.await` inside another async context, or the `block_on` executor this section builds two lessons from now.
