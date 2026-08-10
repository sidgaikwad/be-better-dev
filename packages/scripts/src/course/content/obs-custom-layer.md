Here is a requirement no off-the-shelf layer covers: whenever any span in the newsletter service outlives 500ms, print one line naming it, without touching a single handler. The previous lesson showed that every span's birth and death already flows past every layer. So write a layer.

## Forty lines, two verbs

```rust
use std::time::{Duration, Instant};
use tracing::span::{Attributes, Id};
use tracing::Subscriber;
use tracing_subscriber::layer::{Context, Layer};
use tracing_subscriber::registry::LookupSpan;

pub struct SlowSpans {
    pub threshold: Duration,
}

struct Started(Instant);

impl<S> Layer<S> for SlowSpans
where
    S: Subscriber + for<'a> LookupSpan<'a>,
{
    fn on_new_span(&self, _attrs: &Attributes<'_>, id: &Id, ctx: Context<'_, S>) {
        let span = ctx.span(id).expect("span exists in the registry");
        span.extensions_mut().insert(Started(Instant::now()));
    }

    fn on_close(&self, id: Id, ctx: Context<'_, S>) {
        let span = ctx.span(&id).expect("span exists in the registry");
        let Some(elapsed) = span.extensions().get::<Started>().map(|s| s.0.elapsed()) else {
            return;
        };
        if elapsed > self.threshold {
            eprintln!(
                "slow span: {} took {} ms (target {})",
                span.name(),
                elapsed.as_millis(),
                span.metadata().target()
            );
        }
    }
}
```

Add `.with(SlowSpans { threshold: Duration::from_millis(500) })` to the stack and every request span, claim span, and send span is now on the clock. Every other verb keeps its default no-op implementation, so the layer costs nothing on events, enters, or exits.

The load-bearing piece is `extensions`. Each span stored in `Registry` carries a typed map, and `extensions_mut().insert(...)` files data under its type: that is what the `for<'a> LookupSpan<'a>` bound buys, the ability to reach that storage through `ctx.span(id)`. You are in good company in there. The fmt layer stashes its pre-formatted fields in extensions; tracing-opentelemetry stashes the OpenTelemetry span it is building (`OtelData`) at `on_new_span` and converts it to an exported span at `on_close`. The crate you will wire up next lesson is this exact pattern with a network egress bolted on.

## Wall time, not busy time

We stamped the clock at `on_new_span` and read it at `on_close`, so the measurement is the span's whole life, including every interval where its future sat parked waiting for sqlx or Postmark. That is usually what "slow request" means. Had we instead accumulated time between `on_enter` and `on_exit` pairs (one pair per poll, from the instrumenting futures lesson), we would get busy time: CPU-ish work only. The fmt layer's `FmtSpan::CLOSE` output prints both, `time.busy` and `time.idle`, using this same extensions trick with two accumulators. A span that is slow with tiny busy time is waiting on something; that distinction does half the diagnosis in the capstone.

## The reentrancy trap

Why `eprintln!` and not `tracing::warn!`? An event emitted inside a layer callback goes through the global dispatcher again, meaning every layer sees it, including yours. Emitting from `on_close` is survivable (events are not spans, so no new `on_close` fires), but a layer that emits an event from inside `on_event` calls itself forever and takes the stack with it. Production layers either write to their own sink, set a thread-local reentrancy guard, or emit nothing at all and only mutate state that something else reads. Choose boring.

## Predict, then verify

A handler span wraps `sqlx::query!(...).fetch_one(&pool)` and the query takes 2 seconds while the future is parked. `SlowSpans` has a 500ms threshold. Does it fire, and roughly what would `time.busy` versus `time.idle` show for the same span?

Answer: it fires, reporting about 2000ms, because `on_new_span` to `on_close` spans the future's entire life regardless of which thread polled it or how long it parked. The fmt layer would show `time.idle` near 2 seconds and `time.busy` in the tens of microseconds: a handful of quick polls. The span was slow while doing almost nothing, which points the investigation at the database, not the handler.
