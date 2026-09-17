A subscriber submits the signup form; the handler calls the email provider to send the confirmation mail. Tonight the provider's load balancer accepts the TCP connection and then goes silent: no response, no error, no reset. `send_email` awaits a response that will never come, the request handler awaits `send_email`, and the subscriber's browser spins. Nothing crashed, which is the problem: a failure would have taken an error path; a hang just accumulates.

## A deadline wraps any await

```rust
use tokio::time::{timeout, Duration};

let outcome = timeout(
    Duration::from_secs(10),
    email_client.send_email(&new_subscriber, &confirmation_link),
)
.await;
```

`timeout(limit, future)` returns a new future. Awaiting it produces `Result<T, Elapsed>`, and since `send_email` returns its own `Result`, the whole thing nests:

```rust
match outcome {
    Ok(Ok(response)) => { /* provider accepted the email */ }
    Ok(Err(e)) => { /* the call completed, and failed */ }
    Err(_elapsed) => { /* ten seconds passed first */ }
}
```

The outer layer answers "did it finish in time", the inner one "how did it go", and they deserve different handling: an error is information, a timeout is the absence of information.

Nothing restricts this to HTTP. Any await can wear a deadline: a sqlx query, a channel `recv`, an entire `async` block spanning connect, query, and render. To bound a whole unit of work, wrap the block, not each await inside it.

## select in a trench coat

There is no timer thread supervising your call. `timeout` is a race you could now write yourself:

```rust
// schematically, what timeout(limit, future) amounts to:
tokio::select! {
    output = future => Ok(output),
    _ = tokio::time::sleep(limit) => Err(Elapsed),
}
```

That is essentially the implementation: a future holding the inner future and a `Sleep`, completing with whichever finishes first. Reading it as a race explains both edge behaviors. On every poll the inner future is checked before the timer, so work that completed is never misreported as timed out, even when both became ready together. And when the timer does win, the inner future is dropped: a timeout is a cancellation, the select-loser rule from last lesson in a trench coat.

The timer side costs almost nothing: `sleep` is an entry in the runtime's timer wheel (the tokio section), not a parked thread, so a service can hold thousands of live deadlines at once.

## What a timeout does not do

Dropping `send_email` stops the waiting, not the world. The request bytes may already be at the provider; the email may be delivered while your `Err(_elapsed)` arm logs a failure. Timeouts abandon confirmation of an effect; they do not undo the effect. Which is why "timed out, retry" risks a duplicate confirmation email, and why the book spends chapter 11 making delivery idempotent: the Fault-tolerant workflows section picks that up.

## Where deadlines belong

At every await whose other side you do not control: outbound HTTP to the email provider, Postgres queries, anything that crosses a network. The book bakes the first one into the client itself, `Client::builder().timeout(Duration::from_secs(10))` in the email client's constructor, and proves it with a wiremock test whose mock delays its response for three minutes. A client-level timeout is better where it exists: it covers every call site through that client, so none can forget. Reach for `tokio::time::timeout` when the library offers no deadline, or when one deadline must span several awaits. Layer them outward, tighter inside: ten seconds for the HTTP call, thirty for the delivery attempt containing it, so the inner one fires first and names the actual culprit.

## Predict, then verify

```rust
async fn stall() -> u32 {
    tokio::time::sleep(Duration::from_secs(60)).await;
    7
}

let x = timeout(Duration::from_secs(1), stall()).await;
```

What is `x`, and roughly how long does this line take?

Answer: `x` is `Err(Elapsed)` and the line takes about one second. When the timer wins, `stall` is dropped where it sits, its 60 second sleep with it; the `7` is never produced, and the remaining 59 seconds never happen to anyone. The interesting half of that sentence is "dropped where it sits": what dropping a half-finished future runs, and what it skips, is the next lesson.
