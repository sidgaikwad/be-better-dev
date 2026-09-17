Chapter 4's stack writes each process's story to its own stdout. But "why did subscriber 8412 get their issue 40 minutes late?" is one question spanning two processes: the API that enqueued the delivery task and the worker that sent the email. Grepping two JSON files and eyeballing timestamps is not an answer. OpenTelemetry's answer is a trace: one id minted at the edge, carried across every boundary, so a backend can reassemble the whole request tree.

## From layer to collector

The wiring is a fourth crate family alongside `tracing`: `opentelemetry` (API), `opentelemetry_sdk`, `opentelemetry-otlp` (exporter), and `tracing-opentelemetry` (the bridge layer). Pin them as a matched set; they release in lockstep several times a year and the bridge's README maintains the compatibility matrix.

```rust
use opentelemetry::{global, trace::TracerProvider as _};
use opentelemetry_sdk::{propagation::TraceContextPropagator, trace::SdkTracerProvider, Resource};

global::set_text_map_propagator(TraceContextPropagator::new());

let exporter = opentelemetry_otlp::SpanExporter::builder()
    .with_tonic() // OTLP over gRPC to localhost:4317; with_http() targets 4318
    .build()?;

let provider = SdkTracerProvider::builder()
    .with_batch_exporter(exporter)
    .with_resource(Resource::builder().with_service_name("newsletter-api").build())
    .build();

let otel_layer = tracing_opentelemetry::layer().with_tracer(provider.tracer("newsletter"));
// registry().with(env_filter).with(bunyan_layers).with(otel_layer).init();
```

The layer does what you built last lesson: accumulate span data in extensions, convert on close. Finished spans go to a batch processor, which buffers and ships them as OTLP (protobuf over gRPC or HTTP) to a collector, which fans out to whatever backend you run. Two operational consequences of batching: a crash loses the buffer, and a clean exit must call `provider.shutdown()` or the final batch, usually the interesting one, never leaves the process.

## Context across the queue

Inside one process, span parentage is automatic. Between processes, someone must carry the link. The W3C `traceparent` header is the agreed envelope:

```text
00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
```

Version, 16-byte trace id, 8-byte parent span id, flags (`01` = sampled). For HTTP hops there is middleware to inject and extract it. But our API-to-worker crossing is not HTTP: it is a row in `issue_delivery_queue`, from Part 3's delivery queue lesson. Propagation does not care. A carrier is anything that holds strings, so add a `traceparent` column:

```rust
use tracing_opentelemetry::OpenTelemetrySpanExt;

// API, inside the span that enqueues the task:
let mut carrier = std::collections::HashMap::new();
let cx = tracing::Span::current().context();
global::get_text_map_propagator(|prop| prop.inject_context(&cx, &mut carrier));
// write carrier["traceparent"] into the queue row

// worker, after claiming the row:
let parent = global::get_text_map_propagator(|prop| prop.extract(&carrier));
let span = tracing::info_span!("deliver_issue", subscriber_email = %email);
span.set_parent(parent);
```

Now the worker's send span is a child of the API's publish span, hours later if need be, and the backend renders one tree: publish, enqueue, a gap, claim, send.

## Sampling and its bill

Tracing everything at scale is a real invoice: spans per request, times requests per second, in collector CPU and backend storage. The samplers:

- `TraceIdRatioBased(0.1)`: head sampling. The decision is a deterministic function of the trace id, made at the root before anything has happened. Cheap, but blind: it cannot prefer errors or slow requests, because it decides before the outcome exists.
- `ParentBased(...)`: children obey the flags bit that `traceparent` carried in. This is what keeps traces whole. Without it, the worker re-rolls the dice and you store orphan fragments.
- Tail sampling: decide at the collector after the trace completes, keeping every error and everything over 2s. The catch is cost and statefulness: the collector must buffer whole traces in memory and route every span of a trace to the same instance.

One subtlety: head sampling saves export and storage, not instrumentation. Unsampled requests still create `tracing` spans in-process, because your JSON logs still need them.

## Predict, then verify

The API samples at 10% with `ParentBased(TraceIdRatioBased(0.1))`. A delivery task arrives at the worker with `traceparent` ending in `-00`. The send fails with an error. Does the worker export its spans?

Answer: no. Flags `00` means the root decided not to sample, and `ParentBased` honors that decision, error or not; the failure still reaches your JSON logs and error metrics, just not the trace backend. That is head sampling's blindness made concrete. If "keep every failed trace" is a requirement, the decision must move after the outcome: tail sampling at the collector, paid for in buffering.
