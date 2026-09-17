The editor gets one endpoint and two features behind it: five drafted subject lines, streamed as they are generated, and a warning if this draft looks like something the newsletter already sent. Every piece comes from the last five lessons; the interesting work is how they fit together.

## One endpoint, two very different latencies

```
POST /admin/issues/{id}/assist   ->  text/event-stream
```

The duplicate check is a local embedding plus a vector query: roughly 30 ms, and it never fails in a way the writer can act on. The subject lines are a metered generation: 20 seconds, streamed, sometimes a 429. Do not make one wait for the other. Send the verdict as the first SSE event, then stream tokens:

```rust
let stream = async_stream::stream! {
    let verdict = duplicates::check(&state, &draft).await;      // ~30 ms
    yield Ok(Event::default().event("duplicate").json_data(verdict).unwrap());

    let mut tokens = llm::stream_subjects(&state, &prompt).await?;
    while let Some(delta) = tokens.next().await {
        yield Ok(Event::default().event("token").data(delta?));
    }
};
Sse::new(stream).keep_alive(KeepAlive::default())
```

The editor shows "similar to issue #217, sent in March" a moment after the click, while subject lines are still arriving. Named event types keep the client honest about which is which.

## The duplicate half

```rust
let enc = state.tokenizer.encode(draft.body.as_str(), true)?;   // truncate to the model's window
let embedding = state.embed_queue.embed(first_n(&enc, 256)).await?;

let hits = state.vectors.nearest("issues", &embedding, 3, only_sent()).await?;
match hits.first() {
    Some(hit) if hit.score > 0.90 => Verdict::Similar { issue_no: hit.issue_no, score: hit.score },
    _ => Verdict::Fresh,
}
```

Three decisions hide in there. The 0.90 threshold is not a constant you can reason your way to: run it over your archive, look at what it flags, and move it. Because both vectors are unit length, `score` is a cosine, comparable across queries. And the check is advisory: a false positive that blocks publishing is a much worse product than one the writer glances at and ignores.

Backfilling the archive is the batching lesson paying off: 900 issues through the queue in a handful of batched forward passes, not 900 round trips.

## Keeping the cost honest

A regenerate button is a money button, and everything Part 3 taught about outbound calls applies harder here.

- **Count before you send.** The tokenizer budget check turns a pasted transcript into a truncation instead of a 400 after four seconds.
- **Cap the output.** `max_tokens` bounds the worst case, and output tokens usually cost several times input tokens.
- **Cache by content hash** of the prompt inputs and model id, so a page refresh cannot rebill.
- **Rate limit per user**, not just per IP.
- **Log usage.** Put the provider's `usage` numbers on the request span so the observability dashboards show cost per issue beside latency.
- **Do not retry after the first token.** Generation is not idempotent, and the half already streamed cannot be recalled.

Test it with wiremock, as chapter 6 tested the email client: a canned SSE body exercises the parser including a split chunk, a `429` exercises the backoff, a slow response exercises the read timeout. The embedding model is deterministic, so a golden test on the first few dimensions catches the day someone changes the pooling and silently invalidates every stored vector.

Embeddings in Postgres go in the same transaction as the issue row. Embeddings in qdrant are a dual write, which means the outbox pattern from the event-driven section, a reconciliation job, or an accepted window of drift. Choose deliberately rather than discovering it later.

## Where Rust actually fits in AI

Now the honest map, because "Rust for AI" is oversold in both directions.

Rust genuinely wins in **serving and in the data plane**. Inference runtimes, vector databases (qdrant and LanceDB are both Rust), the tokenizers and safetensors libraries Python itself calls into, columnar pipelines (Arrow, DataFusion, Polars), and gateway and agent plumbing whose job is moving bytes concurrently with backpressure and no GIL. Add anything on-device or at the edge, where shipping a Python runtime is not an option. Those are not aspirations, they are shipped, load-bearing systems.

Python's gravity is not moving in **research and training**. New architectures land in PyTorch first, the fine-tuning tooling is Python, the CUDA kernel ecosystem is Python-adjacent, and if your week is twenty model variants, doing it in Rust is a hobby project with a deadline attached. candle exists because PyTorch's deployment story is heavy, not because training in Rust is a good idea.

Most teams land on the same division: Python trains and exports (ONNX or safetensors), Rust serves. The quieter fact is that most of what an AI product does is HTTP, queues, retries, timeouts, and a database, which is Parts 2 and 3 of this course. The AI-specific part is usually the smallest and most stable part.

One caveat to carry out: this corner churns faster than the rest of Rust. candle is pre-1.0, `ort` reshaped its API across release candidates, the qdrant client was rewritten, provider SDKs break regularly. Pin versions, read changelogs, and check the date on any article naming a best crate, including this one.

## Predict, then verify

The writer clicks regenerate five times in thirty seconds while reading. With no cache and no limits, what happens, and which single change fixes the most of it?

Answer: five generations are billed and four are never read. Abandoning a stream mid-flight does stop the meter once the provider notices the closed socket, but only for tokens not yet generated. The content-hash cache is the biggest fix: identical inputs return the stored answer for free, making the button idempotent in the common case. The per-user rate limit and the `max_tokens` cap bound what is left, and cancelling the previous stream before starting a new one keeps you from paying for two at once.
