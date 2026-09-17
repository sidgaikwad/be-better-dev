The blank terminal from the last lesson has a specific cause, and it is a design decision, not a bug. Rust's logging story is split in two, and we have only met half of it.

## A facade with no one behind it

The go-to crate is `log`. It provides five macros, one per level of increasing severity: `trace!`, `debug!`, `info!`, `warn!`, `error!`. All of them do the same thing, emit a log record, with `println!`-style interpolation. Trace is firehose detail (think a record per TCP packet); error is for failures with user impact.

What to log at a call site is a local decision: whoever wrote the function knows what is worth capturing, which is why crates deep in your dependency tree can instrument themselves usefully. What to do with the records is a global decision only the application can make: print them? Append to a file? Ship them over HTTP to ElasticSearch? `log` handles the split with the facade pattern. The macros hand each record to a `Log` trait object; the application registers one implementation, once, at startup. If nobody calls `set_logger`, every record is silently dropped. That was our blank screen.

```rust
// main.rs: env_logger implements Log and prints records to the terminal,
// honouring the RUST_LOG environment variable, defaulting to info.
env_logger::Builder::from_env(Env::default().default_filter_or("info")).init();
```

`RUST_LOG=debug cargo run` surfaces everything at debug or above from every crate; `RUST_LOG=zero2prod` keeps only our own records. Add actix-web's `Logger` middleware (`.wrap(Logger::default())` on the `App`) and every request produces a record with method, path, status, and timing. Try `RUST_LOG=trace` once: you will see mio registering sockets with the OS poller and actix spawning one worker per core.

## Instrumenting subscribe

Rule of thumb: any interaction with an external system over the network gets closely watched. So `subscribe` grows records around the insert:

```rust
log::info!("Adding '{}' '{}' as a new subscriber.", form.email, form.name);
log::info!("Saving new subscriber details in the database");
// and on failure:
log::error!("Failed to execute query: {:?}", e);
```

`{:?}` is deliberate: operators are the audience, and `Debug` gives the raw view; `Display` is for messages fit for end users. (Emails and names are personal data; production systems restrict who reads such logs and how long they are retained.)

The payoff test the book stages: a reader, Tom, emails you that he hit "a weird error" while subscribing. Because his email address is in a log line, you can search for it and read what happened next to his request.

## The correlation wall

That works while requests arrive one at a time. Under load they do not, and as the state-machine lesson in Part 2 showed, async tasks yield the thread at every await point, so records from different requests interleave by design:

```text
INFO Adding 'thomas_mann@hotmail.com' 'Tom' as a new subscriber.
INFO Adding 's_erikson@malazan.io' 'Steven' as a new subscriber.
INFO Saving new subscriber details in the database
ERROR Failed to execute query: connection error with the database
```

Whose insert failed, Tom's or Steven's? The records do not say. We need to correlate all records belonging to one request. The standard move is a request id: generate a `Uuid::new_v4()` at the top of the handler and write it into every record. It works, for the records you emit yourself. actix's `Logger` has never heard of your local variable, so the one record carrying the response status has no id. Fixing that everywhere means rewriting upstream middleware, threading `request_id` through the signature of every downstream function, and somehow patching the crates you import. The book's verdict: this approach cannot scale.

The diagnosis underneath is sharper: an HTTP request is a tree of units of work, each with a duration and a shared context. A log line is an isolated event at one instant. Logs are the wrong abstraction for the thing we are trying to describe.

## Predict, then verify

You set `RUST_LOG=zero2prod` and replay the two concurrent subscriptions. Does the `Logger` middleware's status-code record still appear?

Answer: no. That filter keeps records whose target sits in the `zero2prod` crate; the middleware's records come from `actix_web` and are dropped. Filtering by origin is powerful and blunt: it silences noise, and whole components with it. We now hold two problems, correlation and per-request structure, and both point the same way: the structure has to live in the telemetry itself, not in string prefixes. That is what `tracing` builds.
