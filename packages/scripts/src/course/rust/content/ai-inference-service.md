Measure the embedding model from the last lesson twice. One sentence: 8 ms. Thirty-two sentences pushed through in one forward pass: about 60 ms, not 256 ms. Same model, same machine, four times the throughput, and the only difference is that the batch dimension was 32 instead of 1.

## Why the batch is nearly free

The model's weights are about 90 MB. A forward pass has to stream all of them from memory through the CPU's cache, or from GPU memory into its compute units, exactly once, no matter how many rows are in the batch. Run 32 sentences separately and you pay that traffic 32 times. Run them together and you pay it once.

There is a second effect on top. One sentence turns each layer into a matrix-vector product, which is memory-bound and leaves the arithmetic units idle waiting for weights. Thirty-two turn the same layer into a matrix-matrix product, which is what BLAS kernels and GPU tensor cores are built for.

On a small CPU model the gain is a few times over. On a GPU it is dramatic: batch size 1 leaves most of the device idle, and throughput rises nearly linearly with batch size until compute saturates. Either way the fix has the same shape. Do not let requests reach the model one at a time.

## A queue, an owner, and a reply channel

This is Part 2's actor pattern with no new ideas in it: a bounded channel of jobs, each carrying a `oneshot::Sender` for its own answer, and one owner that holds the model.

```rust
struct Job {
    text: String,
    reply: oneshot::Sender<Vec<f32>>,
}

let (tx, mut rx) = mpsc::channel::<Job>(1024);

tokio::task::spawn_blocking(move || {
    let model = load_model()?;                       // once, on this thread
    let mut batch: Vec<Job> = Vec::with_capacity(32);

    while let Some(first) = rx.blocking_recv() {     // wait for work
        batch.push(first);
        while batch.len() < 32 {                     // then take what is already queued
            match rx.try_recv() {
                Ok(job) => batch.push(job),
                Err(_) => break,
            }
        }

        let vectors = model.embed(batch.iter().map(|j| j.text.as_str()))?;
        for (job, v) in batch.drain(..).zip(vectors) {
            let _ = job.reply.send(v);               // receiver may be gone; that is fine
        }
    }
    Ok::<_, anyhow::Error>(())
});
```

Two details carry weight. The loop blocks for the first job and then drains without waiting, so an idle service answers a lone request immediately and a busy one forms big batches: batch size follows load instead of a guess. And `let _ = job.reply.send(v)` is not laziness. If the caller disconnected, its `oneshot::Receiver` was dropped and the send fails, which is cancellation propagating by drop, the same mechanism as the abandoned SSE stream in the first lesson.

On the async side, `rx.recv_many(&mut buf, 32)` is the wait-then-drain in one call.

## The bounded channel is the product decision

Capacity is 1024, so when the model is saturated the channel fills. Then `tx.send(job).await` waits, which makes the handler wait, which makes the client wait, and load stops arriving faster than it can be served: the bounded-queue argument from Part 2, now with a GPU at the end of it.

Or use `try_send` and answer `503` with `Retry-After`. The queue is where you choose between slow and no, and for an interactive editor "try again in a second" often beats a twelve-second wait.

Resist adding a fixed wait-to-fill window before running each batch. It looks like free throughput and is mostly a latency tax, as the exercise below shows.

## Why this wants to be its own service

Keeping the model inside the newsletter API is fine until one of these becomes true, and one always does:

- **Different hardware.** The model wants a GPU or many cores and holds gigabytes resident; the API wants a dozen cheap replicas. Scaling them together means paying GPU prices for HTTP handlers.
- **Different deploy cadence.** Swapping a model should not redeploy the subscriber API, and a 30-second load at startup wrecks the readiness-probe timing from the Kubernetes section unless readiness gates on the model being loaded.
- **Isolation.** One caller pasting a 200 MB document should not take the signup endpoint down with it.
- **Bigger batches.** Every caller sharing one queue makes the batches better for everyone.

Cap the intra-op thread count too: four model threads times eight tokio workers on an eight-core box is thrashing, not parallelism.

## Predict, then verify

Someone reads about batching and adds a 50 ms window: collect jobs for 50 ms, then run the batch. Traffic is 5 requests per second. Predict the effect on p99 latency and on throughput.

Answer: at 5 requests per second, 0.25 requests arrive during an average window. Nearly every batch runs with one job in it, after waiting the full 50 ms. You added 50 ms to essentially every request and gained no throughput at all. Batching pays only when arrivals are dense compared to the window, which is why the drain-what-is-there loop above is the safer default: it adds zero latency at low load and forms large batches exactly when the model is the bottleneck.
