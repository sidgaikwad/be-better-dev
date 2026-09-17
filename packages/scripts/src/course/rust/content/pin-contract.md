Here is the `Future` trait as std actually defines it:

```rust
pub trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

You met `poll` and `Context` in Async from scratch. The remaining mystery is the receiver: not `&mut self` but `self: Pin<&mut Self>`. After last lesson you know why plain `&mut self` cannot work: whoever holds a `&mut` to a state machine can move it.

Move it how? You never write "move this struct" on purpose. But safe Rust is full of operations that move a value out of a place, and every one of them needs only `&mut`:

```rust
let mut a = deliver(issue_a);      // imagine both already polled once
let mut b = deliver(issue_b);
std::mem::swap(&mut a, &mut b);    // two memcpys: both machines change address
```

`mem::swap`, `mem::replace`, `mem::take`, `Option::take`, plain overwriting assignment `*slot = new_value`: all safe, all move, all reachable from a `&mut`. So `&mut T` is the permission to move `T`, and that is the permission `poll` must not grant.

**`Pin<&mut T>` is an ordinary `&mut T` wrapped in a promise: the value it points at will never move again, from the moment the pin was created until its `Drop` runs.** The wrapper keeps the promise by refusing, for types that need it, to ever hand the plain `&mut T` back out. `swap` and friends require `&mut T`; you cannot obtain one; therefore no safe code can move the pinnee. `poll` still does its work, because it receives the `Pin` itself and the machine mutates its own fields through it.

## A contract on the pointer, not a property of the value

Pinning changes nothing at runtime. No flag is set, no bytes move, no page is locked; the value does not know it is pinned. `Pin<P>` is `#[repr(transparent)]`: at runtime it is exactly the pointer inside it. What changes is the type you hold, and therefore which programs the compiler accepts. "Pinned" is not a state of the value. It is a promise attached to a pointer, enforced by making every program that would break it fail to type-check.

The promise has a start time, and moves before it are ordinary and legal:

```rust
let fut = deliver(issue);      // movable: start state, no self-references yet
let mut fut = Box::pin(fut);   // one final move, onto the heap; the promise begins
// from here the machine is polled in place, at one address, until dropped
```

`Box::pin` moves the value once on the way in (fine: nothing was promised yet, and a never-polled machine has nothing to break), then never lets it out again. `tokio::spawn` has the same shape internally: your future is moved into a heap-allocated task, pinned there, and polled at that address for its whole life.

## What the runtime builds on this

The async stack leans on the promise everywhere. When the machine awaits a socket, the waker registered with the IO driver leads back to that task's memory, and every later `poll` resumes the machine at the address the previous poll used. The full contract even includes a drop guarantee: pinned memory may not be reused for anything else until `Drop` has run. Executors are sound because the type system lets them assume the future is exactly where they left it, forever.

## Predict, then verify

You hold `fut: Pin<&mut DeliverMachine>` for a machine that has been polled once. You go looking for a safe way to extract a plain `&mut DeliverMachine`, so you can `mem::swap` it. What do you find?

Answer: every safe exit is bolted. The methods that hand back `&mut T` (`Pin::get_mut`, the `DerefMut` impl) exist only under a trait bound you will meet next lesson, and state machines do not satisfy it. The one remaining door is `unsafe { fut.get_unchecked_mut() }`, where the compiler makes you personally countersign the contract. The promise is kept not by runtime checks but by making its violation untypable.
