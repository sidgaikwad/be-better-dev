This loop reads length-prefixed frames (four length bytes, then the payload) while flushing metrics on a timer:

```rust
loop {
    tokio::select! {
        res = socket.read_exact(&mut len_buf) => {
            res?;
            let len = u32::from_be_bytes(len_buf) as usize;
            socket.read_exact(&mut payload[..len]).await?;
            handle_frame(&payload[..len]).await?;
        }
        _ = metrics_tick.tick() => flush_metrics().await,
    }
}
```

It passes every test. In production, under load, it reports absurd frame lengths in the millions. What happened: a tick fired while `read_exact` had two of the four length bytes. The losing future was dropped, and with it the only record that two bytes had been consumed; the bytes themselves were already gone from the socket. The next pass starts a fresh `read_exact` that reads the last two length bytes as the first two, and every frame boundary after that is wrong: the stream has desynchronized, permanently. Each branch is individually correct; the composition is the bug, and no compiler pass sees it.

## The named property

An operation is cancellation safe (cancel-safe for short) if dropping its future before completion loses nothing: either no observable progress had been made, or the progress lives somewhere that survives the drop, so re-issuing the call continues cleanly. The previous lesson showed cancellation is always clean for memory, because destructors run. Cancel safety is the stronger, semantic property: cancellation also loses no data and breaks no protocol.

Cancel-safe, and the reason:

- `mpsc::Receiver::recv`: a message leaves the queue at the same instant the future completes with it; a cancelled `recv` has consumed nothing.
- `TcpListener::accept`: a connection is either handed to you or still queued, never half-taken.
- `AsyncReadExt::read`: it completes on the first chunk available; dropped before completion, it has read nothing.
- `Interval::tick`, and `JoinSet::join_next` from the next lesson: the hand-over happens atomically at completion.

Not cancel-safe, and the reason:

- `read_exact`, `read_to_end`, `read_line`: they loop internally; "how far I got" dies with the future while the source's cursor stays advanced.
- `write_all`: some prefix of the buffer may already be on the wire; re-issuing resends it.
- Anything you compose yourself that holds a value across a second await:

```rust
_ = async {
    let job = jobs.recv().await.unwrap();   // cancel-safe alone
    deliver(job).await;                     // the block is not
} => {}
```

If another branch wins while `deliver` is in flight, the block is dropped and `job`, already dequeued, evaporates with it. Cancel safety does not compose: once the first effectful await completes, the future's own state is the value's only home.

## Why select loops demand it

A select loop cancels its losing branches on every pass: not a rare failure mode, but the loop working as designed, possibly thousands of times a second. A future is only fit to be a branch if it is cancel-safe, and the standard discipline follows: one cancel-safe await per branch, with follow-up work in the handler, which runs after the race is decided and is never cancelled by it.

## tokio writes it down, per method

No tool checks this property; it is a semantic contract. tokio therefore documents it method by method: most async methods carry a "Cancel safety" section stating the guarantee or the hazard, and the `tokio::select!` page keeps a list of common cancel-safe and cancel-unsafe operations. Before an await goes into a branch, that section is required reading. When the operation you need is not cancel-safe, three standard fixes:

- Move the progress out of the future. `Lines::next_line` is cancel-safe where `read_line` is not, because the partial line buffers inside the `Lines` value, which outlives every race.
- Split readiness from action: race on `socket.writable()`, then call the synchronous `try_write` in the handler.
- Give fragile work its own task and talk to it over channels; channel ends are cancel-safe by design.

## Predict, then verify

A colleague reworks a sender loop:

```rust
loop {
    tokio::select! {
        res = socket.write_all(&frame) => { res?; break; }
        _ = metrics_tick.tick() => note_tick(),
    }
}
```

Downstream occasionally receives the first bytes of `frame` twice in a row. Trace one bad pass: why?

Answer: a tick won while `write_all` had pushed some prefix, say 300 of 900 bytes, onto the wire. The future dropped, its progress counter with it; the next pass re-ran `write_all(&frame)` from byte zero, so the peer saw bytes 0..300 and then 0..900. Any of the three fixes applies: advance a slice yourself with cancel-safe `write` calls, race on writability only, or move the write out of the race entirely. tokio's docs for `write_all` state this hazard in so many words; the habit to leave with is reading that section before every await that enters a select.
