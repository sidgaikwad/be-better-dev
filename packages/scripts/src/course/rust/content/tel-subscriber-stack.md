There is a loose end in our logs. For all the care we put into `request_span`'s structured fields, `request_id` still shows up only on the record emitted when the span is created; the events inside do not inherit it. The culprit is the receiving end: we still process everything with `env_logger`, which implements `log`'s `Log` trait. It sees a flat stream of log records and knows nothing about spans, field inheritance, or trees. We migrated instrumentation; we never migrated processing.

## Subscriber: the tracing side of the facade

`tracing`'s counterpart to `Log` is the `Subscriber` trait. It is wider because spans have a lifecycle: an implementation is called on span creation, on every enter and exit, on each event, through to close. `set_global_default` installs one for the whole application. Nobody hand-writes a full subscriber for an app, though; the building blocks live in `tracing-subscriber`:

```toml
[dependencies]
tracing-subscriber = { version = "0.3", features = ["registry", "env-filter"] }
tracing-bunyan-formatter = "0.3"
tracing-log = "0.1"
```

Its key idea is one more trait, `Layer`. Instead of a monolithic do-everything subscriber, you compose a pipeline of small processors. The base of the stack is `Registry`: it implements `Subscriber` and does the hard bookkeeping, storing span metadata and field data, recording parent-child relationships, tracking which spans are active and which are closed. Layers wrap it and each do one job.

```rust
use tracing::subscriber::set_global_default;
use tracing_bunyan_formatter::{BunyanFormattingLayer, JsonStorageLayer};
use tracing_log::LogTracer;
use tracing_subscriber::{layer::SubscriberExt, EnvFilter, Registry};

LogTracer::init().expect("Failed to set logger");

let env_filter = EnvFilter::try_from_default_env()
    .unwrap_or_else(|_| EnvFilter::new("info"));
let formatting_layer = BunyanFormattingLayer::new("zero2prod".into(), std::io::stdout);
let subscriber = Registry::default()
    .with(env_filter)
    .with(JsonStorageLayer)
    .with(formatting_layer);
set_global_default(subscriber).expect("Failed to set subscriber");
```

Three layers. `EnvFilter` reproduces the `RUST_LOG` semantics, discarding spans and events by level and origin, falling back to `info`. `JsonStorageLayer` stores each span's fields as easy-to-consume JSON and, crucially, propagates context from parent spans to their children. `BunyanFormattingLayer` writes one JSON record per event and per span start and end, tagged with the application name. (The book picks this pair over `tracing-subscriber`'s own `fmt` layer precisely because `fmt` does not implement that metadata inheritance.)

Fire a `POST /subscriptions` and every record for the request, down to `[SAVING NEW SUBSCRIBER DETAILS IN THE DATABASE - END]`, now carries `request_id`, `subscriber_email`, and `subscriber_name`. Span-end records add `elapsed_milliseconds`: latency data you did not plan to collect, waiting for the day you need a query's p99. And because the output is JSON, a search engine can ingest it, infer a schema, and index the fields; asking questions stops requiring hand-built regexes over prose.

## Bridging the old world

One regression: actix-web's records vanished. The `log` feature flag we enabled goes one way only, `tracing` events become `log` records. actix-web still speaks plain `log`, and our new subscriber listens only to `tracing`. `tracing-log`'s `LogTracer`, the first line above, closes the loop: it registers itself as the `log` logger and re-emits every log record as a `tracing` event. Dependencies never need to know we switched.

With that, `log` and `env_logger` can leave `Cargo.toml`. Spotting a dependency that quietly became unused is hard by eye; `cargo +nightly udeps` scans for crates you no longer use (it catches `env_logger`; `log` you strike out yourself).

Initialisation is now real logic, so it moves into the library as `src/telemetry.rs`: `get_subscriber(name, env_filter)` builds the stack and returns `impl Subscriber + Send + Sync`; `init_subscriber` installs it and must be called once. The stated motive is not tidiness: the test suite is about to need exactly the same stack.

## Predict, then verify

Comment out the `LogTracer::init()` line and fire a request. Which records disappear from the JSON output, and which survive?

Answer: everything emitted through `tracing` survives, spans, events, and their inherited context. What disappears is every record from crates still using `log`, most visibly actix-web's request records. There is no error either: with no logger registered, `log` falls back to discarding records, the same silent failure as the blank terminal two lessons ago. That silence is why the bridge belongs inside `init_subscriber`: forget it once there and you have forgotten it nowhere else.
