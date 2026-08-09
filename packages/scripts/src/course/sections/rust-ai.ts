import type { SectionSeed } from "../types"

// Part 4: Rust with AI. Learners arrive with Part 2's streams, bounded queues
// and cancellation-by-drop, and Part 3's reqwest discipline (one client,
// timeouts, wiremock tests). This section spends that: an SSE relay for a
// hosted model, the tokenizers crate, candle and ort in-process, a batching
// inference service, qdrant against pgvector, then a content-assist endpoint
// for the newsletter and an honest map of where Rust wins in AI.

export const rustAi: SectionSeed = {
  slug: "rust-ai",
  title: "Rust with AI",
  description: "LLM APIs with streaming, candle, ort, tokenizers, qdrant.",
  badgeIcon: "🤖",
  badgeTitle: "AI × Rust",
  units: [
    {
      slug: "models-over-the-wire",
      title: "Models over the wire",
      description: "Streaming a hosted model into your own API, and knowing what it costs first.",
      lessons: [
        {
          slug: "ai-llm-streaming",
          title: "Streaming an LLM response through your API",
          summary:
            "SSE on the wire, parsed with reqwest, forwarded as a Stream that gets backpressure for free, with retry rules that respect the meter.",
          contentFile: "ai-llm-streaming.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Your relay has already forwarded 40 tokens to the browser when the provider's connection drops. What is the correct behaviour?",
              options: [
                "Retry the call and forward the new response after the 40 tokens already sent",
                "Retry with the same request, discarding the first 40 tokens of the new response",
                "Fail the stream visibly: generation is not idempotent and the forwarded half cannot be recalled",
                "Buffer the whole response before forwarding, so every failure is retryable",
              ],
              answer: 2,
              explanation:
                "A retry re-runs a metered, non-deterministic generation, so splicing its output onto what you already sent produces text no model ever wrote. Buffering would make retries safe, but it throws away the entire reason for streaming: the first token in 300 ms instead of the last in twenty seconds.",
            },
            {
              kind: "mcq",
              prompt:
                "Why is a single total request timeout the wrong tool for a streaming completion?",
              options: [
                "Timeouts do not apply once you call bytes_stream",
                "A legitimate response may stream for a minute, so bound the silence between chunks instead (read_timeout, or a timeout around each next())",
                "SSE keep-alive comments already guarantee the connection is alive",
                "reqwest cannot time out a response body, only the request headers",
              ],
              answer: 1,
              explanation:
                "A total timeout large enough for a long generation is too large to catch a hung provider, and one small enough to catch it kills healthy long answers. The useful signal is the gap between chunks: a stream that has said nothing for fifteen seconds is stuck, however long it has been running.",
            },
            {
              kind: "mcq",
              prompt:
                "What supplies backpressure in the relay when the browser is on slow hotel wifi?",
              options: [
                "A bounded channel you insert between the parser and the SSE response",
                "Nothing: SSE is push-based, so the deltas buffer in memory until the client catches up",
                "Streams are pull-based, so axum polls yours only when the socket can take more; you stop reading the provider's body and its send window fills",
                "The keep-alive interval throttles how fast events can be produced",
              ],
              answer: 2,
              explanation:
                "The chain is all pull: a slow socket means fewer polls, fewer polls means fewer reads from the provider's body, and TCP's send window does the rest. It is the bounded-queue argument from Part 2 with TCP standing in for the channel, which is why the relay needs no buffering code at all.",
            },
          ],
        },
        {
          slug: "ai-tokenizers",
          title: "Tokenizers: counting before you pay",
          summary:
            "BPE without the mystique, the tokenizers crate (which Python calls into), and turning a token count into a truncation instead of a 400.",
          contentFile: "ai-tokenizers.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                'Which costs more tokens: "Ship faster on Fridays", or "ShipFasterOnFridays"?',
              options: [
                "The second, even though it is three characters shorter",
                "The first, because it is longer and contains spaces",
                "Identical: tokenizers normalise whitespace away before encoding",
                "It depends only on vocabulary size, not on the text",
              ],
              answer: 0,
              explanation:
                'Merges are learned over ordinary spaced text, so " faster" and " Fridays" exist as single learned symbols while nothing joins "p" to "F" across a case boundary. The concatenated form falls back to smaller fragments. Price tracks tokens, not characters, which is why stripping whitespace to "compress" a prompt can raise the bill.',
            },
            {
              kind: "mcq",
              prompt:
                "You call `encode(text, false)` when building input for the embedding model. What is the consequence?",
              options: [
                "None: special tokens only affect decoding",
                "The model still runs, but returns a subtly different vector, because it was trained with [CLS] and [SEP] present",
                "encode returns an error for models that define special tokens",
                "The ids shift by two and the model panics on an out-of-range index",
              ],
              answer: 1,
              explanation:
                "This is the worst kind of bug: nothing fails, the vectors are merely wrong in a way that quietly degrades similarity scores. Pass true for embedding models, and add a golden test on the first few dimensions so a change like this cannot land silently.",
            },
            {
              kind: "mcq",
              prompt:
                "How much should you trust a locally computed token count for a hosted model?",
              options: [
                "Completely: the encodings are published and deterministic",
                "As an estimate to budget against, reconciled after the fact with the usage numbers in the provider's response",
                "Not at all: local counting is impossible without the provider's weights",
                "Only for output tokens, since input tokens are free",
              ],
              answer: 1,
              explanation:
                "System scaffolding, tool schemas, and images add tokens you cannot see locally, and encodings change between model generations. Local counting is still worth doing because it prevents oversized requests before they cost you a round trip; the response's usage object is the receipt you log and bill against.",
            },
          ],
        },
      ],
    },
    {
      slug: "models-you-run",
      title: "Models you run yourself",
      description: "candle and ort in your own process, and the service shape inference wants.",
      lessons: [
        {
          slug: "ai-local-models",
          title: "candle and ort: two ways to run a model in-process",
          summary:
            "A 384-dimension embedding from a 90 MB model, by porting the forward pass to Rust or by executing an exported ONNX graph.",
          contentFile: "ai-local-models.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is the essential difference between candle and ort?",
              options: [
                "candle runs on GPUs and ort is CPU only",
                "candle implements the model's forward pass in Rust and loads safetensors weights; ort binds ONNX Runtime and executes a graph exported from Python",
                "ort is pure Rust and candle wraps libtorch",
                "They are the same engine with different APIs",
              ],
              answer: 1,
              explanation:
                "The difference decides your constraints. candle gives you one binary with no C++ dependency, but only for architectures somebody ported. ort runs any model you can export to ONNX and brings mature execution providers and quantisation, at the cost of linking a C++ runtime and shipping the graph file.",
            },
            {
              kind: "predict",
              prompt:
                "You put the model load inside the axum handler. It passes a smoke test, then production sends 50 requests per second. Predict.",
              options: [
                "Fine: the OS page cache makes repeated loads nearly free",
                "Each request re-lays-out 90 MB and builds another thread pool, so memory climbs with concurrency and the CPU thrashes instead of multiplying matrices",
                "The second concurrent load fails because the weights file is already mapped",
                "Requests serialise behind an internal lock, so it is slower but stable",
              ],
              answer: 1,
              explanation:
                "Loading is the expensive operation (hundreds of milliseconds) and inference is the cheap one (single-digit milliseconds), so per-request loading inverts the cost of the whole system. Load once at startup into an Arc in app state and let the request path only push tensors through it.",
            },
            {
              kind: "mcq",
              prompt: "Why can a forward pass not simply run on a tokio worker thread?",
              options: [
                "candle tensors are not Send, so they cannot cross await points",
                "It is CPU-bound and blocks that worker for its full duration, starving every other task scheduled on it; use spawn_blocking or a dedicated pool",
                "tokio refuses to run synchronous code and returns an error",
                "It is fine: tokio preempts long-running tasks automatically",
              ],
              answer: 1,
              explanation:
                "tokio's scheduling is cooperative, as Part 2 showed: a task that never yields owns its worker thread until it returns. Inference is dense matrix work with no await points in it, and both candle and ONNX Runtime spin up their own thread pools on top, so it needs to live off the async runtime entirely.",
            },
          ],
        },
        {
          slug: "ai-inference-service",
          title: "Inference wants a queue in front of it",
          summary:
            "Why a batch of 32 costs barely more than a batch of 1, the actor that owns the model, and when the model deserves its own service.",
          contentFile: "ai-inference-service.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Someone adds a 50 ms wait-to-fill window before running each batch. Traffic is 5 requests per second. Predict the effect on p99 latency and throughput.",
              options: [
                "p99 improves, because batches are larger and the model is used efficiently",
                "About 0.25 requests arrive per window, so nearly every request waits the full 50 ms in a batch of one: pure added latency, no throughput gained",
                "No change: the window only takes effect once the queue is non-empty",
                "Throughput rises roughly 32x, matching the batch size",
              ],
              answer: 1,
              explanation:
                "Batching pays only when arrivals are dense relative to the window, and at 5 requests per second they are not. Blocking for the first job and then draining whatever is already queued adds zero latency at low load and forms large batches exactly when the model is the bottleneck.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does one forward pass over 32 texts cost far less than 32 passes over one text?",
              options: [
                "It saves 31 network round trips to the model",
                "The weights stream through cache or GPU memory once per pass regardless of batch size, and matrix-vector work becomes cache-friendly matrix-matrix work",
                "The engine runs each row of the batch on its own thread with no overhead",
                "It does not: batching only smooths latency, throughput is unchanged",
              ],
              answer: 1,
              explanation:
                "Arithmetic intensity is the whole story. A batch of one is memory-bound, with compute units idling while 90 MB of weights is fetched for a single vector; a batch of 32 amortises that traffic and hands BLAS or tensor cores the shape they are built for. On a GPU the effect is far larger than on a small CPU model.",
            },
            {
              kind: "mcq",
              prompt: "The job channel is bounded at 1024. What does the bound actually buy you?",
              options: [
                "It drops the oldest queued job to make room, keeping latency flat",
                "A choice: send().await makes the caller wait (backpressure up to the client's socket), or try_send fails fast so you can answer 503 with Retry-After",
                "It makes the model faster by limiting context switching",
                "Nothing useful; unbounded is better because no request is ever rejected",
              ],
              answer: 1,
              explanation:
                "An unbounded queue does not remove the overload, it converts it into growing memory and latency until something dies. The bound is where a human decides between slow and no, and for an interactive editor a fast 503 is usually the better product than a twelve-second wait.",
            },
          ],
        },
      ],
    },
    {
      slug: "retrieval-and-judgment",
      title: "Retrieval, and judgment",
      description:
        "Search by meaning with qdrant, then build the endpoint and place the bet honestly.",
      lessons: [
        {
          slug: "ai-vector-search",
          title: "qdrant: search by meaning, filtered by facts",
          summary:
            "Collections, upserts, HNSW and its approximation, filters that need a payload index, and when pgvector is still the right answer.",
          contentFile: "ai-vector-search.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                'A million points. You search with limit 5 and a filter on `status = "sent"` matching only 200 of them, with no payload index on `status`. Predict the outcome.',
              options: [
                "Fast and exact: filters are evaluated before the graph walk by default",
                "Slow, with degraded recall: without an index there is no cardinality estimate, so the graph walk burns distance computations on candidates that fail the filter",
                "An error: qdrant rejects filters on unindexed payload fields",
                "The filter is silently ignored and you get the five global nearest",
              ],
              answer: 1,
              explanation:
                "The payload index is what lets the planner see 200 matches out of a million and switch to an exact scan of those 200, which is both faster and exactly correct. Without it, filtered queries degrade quietly, and the degradation usually gets blamed on the embedding model.",
            },
            {
              kind: "mcq",
              prompt: "Why is pgvector still the right choice for this newsletter's 900 issues?",
              options: [
                "pgvector is faster than qdrant at every scale",
                "The embedding is written in the same transaction as the issue row, filters are ordinary SQL the planner has statistics for, and it is one fewer system to run and back up",
                "qdrant cannot filter on metadata",
                "Postgres stores vectors exactly while qdrant is always approximate",
              ],
              answer: 1,
              explanation:
                "Moving vectors to a second store buys distributed indexing and quantisation you do not need yet, and costs you a dual write that has to become an outbox or a reconciliation job. Adopt qdrant when you can name the number that broke Postgres, and it is usually memory: 9 million 384-dimension vectors is roughly 14 GB before the graph.",
            },
            {
              kind: "mcq",
              prompt: "What does approximate mean in approximate nearest neighbour search?",
              options: [
                "Floating point rounding makes distances slightly imprecise",
                "The HNSW walk visits a few hundred points out of millions and can miss a true nearest neighbour; ef trades recall for latency, so recall@k is measured, not assumed",
                "Results come back in arbitrary order and must be re-sorted",
                "The distance metric is estimated from a sample of dimensions",
              ],
              answer: 1,
              explanation:
                "Exactness was traded away deliberately for the speedup, and how much you traded is a knob. Measuring recall against a brute-force baseline on a sample of queries is the only way to know whether your threshold-based duplicate check is missing real duplicates.",
            },
          ],
        },
        {
          slug: "ai-content-assist",
          title: "Capstone: content-assist, and where Rust actually fits",
          summary:
            "Streamed subject lines plus embedding-based duplicate detection in one endpoint, cost discipline, and an honest map of Rust versus Python's gravity.",
          xp: 25,
          contentFile: "ai-content-assist.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why send the duplicate verdict as the first SSE event rather than alongside the finished subject lines?",
              options: [
                "SSE requires the first event to carry metadata",
                "The two have very different latencies: a 30 ms local search should not be hidden behind a 20-second metered generation",
                "The vector query cannot run concurrently with an in-flight reqwest call",
                "Because the browser discards events that arrive after the first token",
              ],
              answer: 1,
              explanation:
                "Composing two capabilities in one endpoint does not mean composing their SLOs. Emitting the cheap, reliable answer immediately and streaming the expensive one after gives the writer a useful screen in under a second, and keeps a provider outage from suppressing the duplicate warning entirely.",
            },
            {
              kind: "predict",
              prompt:
                "The writer clicks regenerate five times in thirty seconds. With no cache and no limits, what happens, and which single change fixes the most of it?",
              options: [
                "Nothing: the provider deduplicates identical requests within a short window",
                "Five generations are billed and four are never read; a cache keyed on a hash of the prompt inputs and model id makes the common case free and idempotent",
                "axum collapses concurrent identical requests to the same handler",
                "The browser cancels the earlier requests, so only one is billed",
              ],
              answer: 1,
              explanation:
                "Abandoned streams do stop the meter once the provider notices the closed socket, but only for work not yet generated, and identical re-requests are billed in full. The content-hash cache is the highest-leverage fix; the per-user rate limit and a max_tokens cap bound what remains.",
            },
            {
              kind: "mcq",
              prompt: "Where does Rust genuinely win in AI work today?",
              options: [
                "Training and fine-tuning new architectures, where its performance matters most",
                "Serving and the data plane: inference runtimes, vector stores, tokenizers, Arrow and Polars pipelines, and gateways moving bytes concurrently, while research and training stay in Python",
                "Everywhere: Python's ecosystem is legacy tooling being replaced",
                "Nowhere in practice; the crates exist but nothing ships on them",
              ],
              answer: 1,
              explanation:
                "The split is about which constraint dominates. Research needs to change the model daily, which is Python's strength; serving needs predictable memory, real concurrency, and a deployable binary, which is Rust's. candle exists because PyTorch's deployment story is heavy, not because training in Rust is a good idea.",
            },
          ],
        },
      ],
    },
  ],
}
