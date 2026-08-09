The subscriber stack you built in chapter 4's telemetry section had one `EnvFilter` at the bottom and everything above it obeyed. That shape breaks the moment two consumers disagree. Suppose you want JSON logs at `info` (they cost storage per line) but you want a trace backend to receive `debug` spans (they cost almost nothing until sampled). One global filter cannot say both. `RUST_LOG=debug` floods the logs; `RUST_LOG=info` starves the traces. The fix is per-layer filtering, and to see why it works you need to see what actually flows through the stack.

## The verbs a Subscriber receives

`tracing::info!` and `info_span!` know nothing about layers. They call the global dispatcher, which forwards to whatever implements the `Subscriber` trait. The whole protocol is a short list of verbs:

- `register_callsite` / `enabled`: asked per callsite, "will you ever want this?" The answer is cached.
- `new_span(Attributes) -> Id`: the subscriber assigns the id. The `Span` in your code is a cheap handle wrapping that `Id`; `Registry` hands out indexes into a slab and reuses slots after close.
- `record`: fields added after creation.
- `event(Event)`: a log line, structurally.
- `enter(Id)` / `exit(Id)`: once per poll for an instrumented future, as the instrumenting futures lesson showed.
- `try_close(Id)`: the last handle dropped; total duration is now computable.

`Registry` implements this trait and does only the bookkeeping: store span data, track parents and the current span, record nothing. The `Layer` trait mirrors each verb as an `on_*` method (`on_new_span`, `on_event`, `on_close`, ...) plus a `Context` for looking up what `Registry` stored. One dispatch fans out to every layer in registration order. Layers are a tee, not a pipeline: the fmt layer does not hand the event to the next layer, they each see the original.

## Filters move into the stack

`with_filter` wraps one layer in `Filtered`, so the filter gates that layer alone:

```rust
use tracing_subscriber::{filter, prelude::*};

let json_logs = tracing_subscriber::fmt::layer()
    .json()
    .with_filter(filter::LevelFilter::INFO);

let traces = tracing_opentelemetry::layer()
    .with_tracer(tracer)
    .with_filter(
        filter::Targets::new()
            .with_target("newsletter", filter::LevelFilter::DEBUG)
            .with_target("sqlx", filter::LevelFilter::WARN),
    );

tracing_subscriber::registry().with(json_logs).with(traces).init();
```

Now the two outputs disagree, on purpose: `sqlx`'s chatter reaches neither, your `debug!` events reach the trace backend only. A bare filter added with `.with(...)` (chapter 4's `EnvFilter`) still works as a global gate; the usual arrangement is a permissive global ceiling with per-layer filters refining below it. `Targets` is the cheap static choice; `EnvFilter` also implements the per-layer filter trait when you need its full syntax.

## What disabled costs

The `enabled`/`register_callsite` pair is the performance story. With static filters, a `trace!` in the task-claim loop that no layer wants resolves to `Interest::never`: the macro's guard is a cached atomic load and the event is never even constructed, fields never formatted. That is why leaving instrumentation in hot paths is normal Rust practice. Dynamic filters (reloadable, or per-layer combinations that depend on the current span) downgrade the answer to `Interest::sometimes`, meaning `enabled()` runs on every hit: still cheap, no longer free.

## Predict, then verify

With the stack above (`json_logs` at INFO, `traces` at DEBUG for `newsletter`), a `tracing::debug!` event fires inside the newsletter crate. How many times is the event constructed, and which layers do work? Then the same question for a `trace!` event.

Answer: the `debug!` event is constructed once. Some layer wants it, so `enabled` says yes; the one event is dispatched to both layers, `Filtered` drops it before the JSON formatter runs, and the OpenTelemetry layer records it. The `trace!` event is constructed zero times: every filter rejects that callsite, interest caches as never, and the macro body short-circuits at a single check. Filtering is per-layer at dispatch, but construction is all-or-nothing at the callsite.
