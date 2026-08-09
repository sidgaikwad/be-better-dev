`log` fell short because a request is a stretch of work, not a moment. The `tracing` crate is built around that distinction: unlike a log line, a span has a beginning and an end, may be entered and exited, and may nest inside other spans, forming a tree. That is the shape of a request: parse the form, run the insert, build the response, each a child of the whole.

## Migration step one: nothing changes

```toml
[dependencies]
tracing = { version = "0.1", features = ["log"] }
```

Search-and-replace `log::` with `tracing::` in `subscribe` and run the app: the console output is identical. The `log` feature flag makes `tracing` emit a matching `log` record for every event, so `env_logger` keeps working. Same facade idea, second appearance: instrumentation and processing stay decoupled, which lets us migrate one side at a time.

Calls like `tracing::info!` produce events: point-in-time facts, log lines with a new name. The new vocabulary is the span.

## A span for the request

```rust
let request_id = Uuid::new_v4();
let request_span = tracing::info_span!(
    "Adding a new subscriber.",
    %request_id,
    subscriber_email = %form.email,
    subscriber_name = %form.name
);
let _request_span_guard = request_span.enter();
// dropped at the end of `subscribe`: that is when we exit the span
```

Two things are new. First, no string interpolation: the span carries structured fields, key-value pairs attached to its context. `subscriber_email = %form.email` names a field explicitly; a bare `%request_id` uses the variable name as the key. The `%` sigil means "capture with the `Display` implementation"; `?` would use `Debug`. Structure is what will make telemetry queryable instead of being a string to regex through.

Second, creating a span does not activate it. `.enter()` steps into it and returns `Entered`, a guard: while the guard lives, everything emitted on this thread, events and child spans alike, registers as happening inside this span. This is RAII, from the Drop lesson in Part 1: the compiler inserts the destructor call where the guard goes out of scope, and `Entered`'s `Drop` implementation exits the span. Reading a dependency's source pays off here: that impl also shows `tracing` emits a trace-level record on exit.

Run with `RUST_LOG=trace` and the whole lifecycle is visible:

```text
INFO  Adding a new subscriber.; request_id=f349b0fe.. subscriber_email=..
TRACE -> Adding a new subscriber.
INFO  request_id f349b0fe.. - Saving new subscriber details in the database
TRACE <- Adding a new subscriber.
TRACE -- Adding a new subscriber.
```

Created, entered (`->`), exited (`<-`), closed (`--`). Exiting is not closing: a span can be entered and exited many times, but it closes once, when the span value itself is dropped. A unit of work that pauses and resumes is exactly the use case, and exactly where the next lesson picks up.

## One level down

How does an event know which span it is inside? When you enter a span, the subscriber records its id in a thread-local for the current thread. An event consults that thread-local to find the current span and attaches itself. Entering is cheap, a pointer-sized write, because the field values were captured once at creation. But notice the assumption baked in: whatever this thread does next belongs to this span. A thread running one request at a time satisfies it. An async worker juggling dozens of futures does not, and the guard pattern above quietly becomes a liar. The book's own comment next to that `enter()` says as much: bear with me, but do not do this at home.

## Predict, then verify

At trace level, how many `->`, `<-`, and `--` records does this produce?

```rust
let span = tracing::info_span!("confirmation email batch");
{
    let _g = span.enter();
    tracing::info!("sending confirmation email");
}
let _g2 = span.enter();
drop(_g2);
drop(span);
```

Answer: two `->`, two `<-`, one `--`. Each `enter()` emits an entry record and each guard drop an exit record, so the span is entered and exited twice. The close record appears only on the last line, when `span` itself is dropped. Enter and exit mark activity; close marks the end of the span's life, the point where its total duration is known.
