import type { SectionSeed } from "../types"

export const z2pTelemetry: SectionSeed = {
  slug: "z2p-telemetry",
  title: "Telemetry (ch. 4)",
  description: "Logging versus tracing, spans, instrumenting futures, request ids.",
  badgeIcon: "🔭",
  badgeTitle: "Telemetry",
  units: [
    {
      slug: "flying-blind",
      title: "Flying blind",
      description: "Why an uninstrumented service cannot be operated, and how far plain logs go.",
      lessons: [
        {
          slug: "tel-unknown-unknowns",
          title: "Unknown unknowns",
          summary:
            "Tests cover the questions you thought to ask; telemetry is collected before you know the question.",
          contentFile: "tel-unknown-unknowns.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What separates an unknown unknown from a known unknown?",
              options: [
                "A known unknown is always more severe in production",
                "A known unknown is a question you know to ask but have not investigated; an unknown unknown is a failure mode you never imagined",
                "Unknown unknowns only occur in distributed systems",
                "A known unknown always has a test covering it",
              ],
              answer: 1,
              explanation:
                "Known unknowns sit on a list you could work through, given time. Unknown unknowns are on no list at all, which is why only data collected in advance can help you diagnose one.",
            },
            {
              kind: "predict",
              prompt:
                "Your integration suite is green and coverage is high. What does that establish about production behavior?",
              options: [
                "The application is proven correct",
                "All known unknowns are resolved",
                "Only that the scenarios you thought to encode behave as specified",
                "Unknown unknowns are now impossible",
              ],
              answer: 2,
              explanation:
                "A test suite is evidence about the cases you wrote down, not proof of correctness; proving correctness takes different machinery entirely, and unknown unknowns are by definition absent from the suite.",
            },
            {
              kind: "mcq",
              prompt:
                'Why does the chapter rule out "attach a debugger when it breaks" as a production strategy?',
              options: [
                "Failures strike when no one is watching, may span several processes, and often cannot be reproduced outside the live environment",
                "Debuggers do not work on optimized binaries",
                "Rust programs cannot be debugged after deployment",
                "Debuggers change the runtime's scheduling behavior",
              ],
              answer: 0,
              explanation:
                "You must assume you will not be present, may not know which process to inspect, and cannot replay the failure elsewhere. Telemetry collected automatically is the substitute for being there.",
            },
          ],
        },
        {
          slug: "tel-log-correlation",
          title: "The log crate and the correlation wall",
          summary:
            "The facade pattern gets records flowing; concurrent requests interleave them into mush.",
          contentFile: "tel-log-correlation.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "After adding `log::info!` calls, running the app prints nothing. Why?",
              options: [
                "The compiler strips log macros from debug builds",
                "log's macros hand records to a registered Log implementation; with none registered, records are discarded",
                "stdout is buffered until the process exits",
                "RUST_LOG defaults to off, which suppresses the macros",
              ],
              answer: 1,
              explanation:
                "The facade pattern splits emitting (a local decision, usable inside libraries) from processing (a global decision the application makes once). env_logger's init is what registers a processor.",
            },
            {
              kind: "predict",
              prompt:
                "Two concurrent POST /subscriptions are in flight and one insert fails. From the interleaved log records, can you tell whose data was lost?",
              options: [
                "Yes, records appear in strict per-request order",
                "Yes, the error record names the email address",
                "No, nothing links the error record to either request",
                "Only if RUST_LOG is set to trace",
              ],
              answer: 2,
              explanation:
                "Async workers interleave tasks at await points, so adjacency between records proves nothing. A shared identifier across all of a request's records is exactly what is missing: the correlation problem.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does hand-threading a request_id through the code fail as a general fix?",
              options: [
                "It covers only records you emit yourself: upstream middleware and dependency crates never see the id, and every downstream signature must change",
                "Generating a UUID per request is too slow",
                "UUIDs collide under concurrent load",
                "actix-web forbids custom fields in log records",
              ],
              answer: 0,
              explanation:
                "The id lives in a local variable, so actix's Logger record (the one with the status code) lacks it, and propagating it means rewriting signatures everywhere. The book's verdict: this approach cannot scale.",
            },
          ],
        },
      ],
    },
    {
      slug: "the-tracing-model",
      title: "The tracing model",
      description:
        "Spans give work a beginning, an end, and structured context; futures need them attached with care.",
      lessons: [
        {
          slug: "tel-spans-and-events",
          title: "Spans: events with a lifetime",
          summary:
            "Structured fields, the Entered guard, and why exiting a span is not closing it.",
          contentFile: "tel-spans-and-events.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is the difference between exiting and closing a span?",
              options: [
                "They are synonyms in tracing's vocabulary",
                "Closing happens at every await point automatically",
                "Exit happens each time an Entered guard is dropped and can occur many times; close happens once, when the span itself is dropped",
                "Exit is only recorded at trace level, close at info level",
              ],
              answer: 2,
              explanation:
                "Entering and exiting model a unit of work pausing and resuming; the close marks the end of its life, the point where its total duration can be computed.",
            },
            {
              kind: "predict",
              prompt:
                'In `info_span!("Adding a new subscriber.", subscriber_email = %form.email)`, what does the `%` sigil choose?',
              options: [
                "Capture the field using its Display implementation",
                "Capture the field using its Debug implementation",
                "Redact the field from the output",
                "Interpolate the value into the span's message string",
              ],
              answer: 0,
              explanation:
                "% means Display and ? means Debug. Either way the value is stored as a structured key-value pair on the span, not spliced into a message string.",
            },
            {
              kind: "mcq",
              prompt:
                "After replacing `log::` with `tracing::`, the console output is unchanged. Why?",
              options: [
                "env_logger natively understands spans and events",
                'tracing\'s "log" feature emits a matching log record for every tracing event, and env_logger processes those',
                "The compiler rewrites tracing calls back into log calls",
                "Nothing is emitted at all; the output comes from actix-web",
              ],
              answer: 1,
              explanation:
                "The feature flag bridges tracing into the log facade, so existing Log implementations keep working. It is what makes the migration incremental: instrumentation first, processing later.",
            },
          ],
        },
        {
          slug: "tel-instrumenting-futures",
          title: "Instrumenting futures",
          summary:
            "A guard across .await lies about the thread; .instrument() enters on poll and exits on park.",
          contentFile: "tel-instrumenting-futures.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A span guard is held across an .await on a multi-threaded runtime, and the future resumes on a different worker. What goes wrong?",
              options: [
                "Events after the resume land outside the span, and the original thread stays wrongly marked as inside it until the guard drops",
                "The executor detects the guard and panics",
                "tracing re-enters the span automatically on the new thread",
                "Nothing: the current span is tracked per-process, not per-thread",
              ],
              answer: 0,
              explanation:
                "Entering a span sets a thread-local, so the mark stays behind on the parked thread while the resumed future runs unmarked elsewhere. Both attribution directions break at once.",
            },
            {
              kind: "mcq",
              prompt: "What exactly does `Instrument::instrument(span)` do to a future?",
              options: [
                "Enters the span once and closes it at the first park",
                "Moves the future onto a dedicated instrumentation thread",
                "Upgrades all events inside the future to trace level",
                "Enters the span every time the future is polled and exits it whenever the future parks; the span closes after the future completes and is dropped",
              ],
              answer: 3,
              explanation:
                "It mimics the future's real lifecycle, which is why the trace output shows one ->/<- pair per poll: the executor's scheduling becomes visible, countable data.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does #[tracing::instrument] remove the async footgun rather than merely hiding it?",
              options: [
                "It rejects async functions at compile time",
                "The generated code wraps the function's future with Instrument::instrument, entering and exiting per poll instead of holding a guard",
                "It forces the function to run synchronously to completion",
                "It strips spans from release builds",
              ],
              answer: 1,
              explanation:
                "Applied to an async fn, the macro uses the poll-aware mechanism for you, so the correct pattern is also the effortless one: the pit of success.",
            },
          ],
        },
      ],
    },
    {
      slug: "production-telemetry",
      title: "Production-grade telemetry",
      description:
        "A layered subscriber emitting queryable JSON, secrets kept out, one request id, tests included.",
      lessons: [
        {
          slug: "tel-subscriber-stack",
          title: "Building the subscriber stack",
          summary:
            "Registry plus layers: EnvFilter, bunyan JSON with inherited context, and a bridge for log-only crates.",
          xp: 25,
          contentFile: "tel-subscriber-stack.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does Registry itself do in the layered subscriber stack?",
              options: [
                "Formats span data as bunyan JSON",
                "Filters spans and events according to RUST_LOG",
                "Ships span data to a remote system over HTTP",
                "Stores span metadata and field data and tracks relationships and active spans, so layers on top can focus on filtering and formatting",
              ],
              answer: 3,
              explanation:
                "Registry implements Subscriber and does the bookkeeping without recording anything itself; small single-purpose layers piggyback on it, which is what keeps the ecosystem composable.",
            },
            {
              kind: "predict",
              prompt:
                'RUST_LOG is unset and the stack falls back to EnvFilter::new("info"). A `tracing::debug!` event fires inside subscribe. Is it emitted?',
              options: [
                "Yes, debug is above the info threshold",
                "No, debug sits below info in the severity order, so the filter discards it",
                "Only in debug builds of the application",
                "It panics: RUST_LOG must be set when EnvFilter is used",
              ],
              answer: 1,
              explanation:
                "Severity ascends trace, debug, info, warn, error. An info filter keeps info and above, so debug records are dropped; setting RUST_LOG=debug would let them through.",
            },
            {
              kind: "mcq",
              prompt:
                'The tracing "log" feature is enabled, yet actix-web\'s records bypass the new subscriber until LogTracer is installed. Why?',
              options: [
                "The feature only bridges tracing events into log records, not log records into tracing events; LogTracer provides the reverse direction",
                "actix-web logs exclusively at trace level, which the filter drops",
                "BunyanFormattingLayer ignores records from foreign crates",
                "LogTracer raises the maximum log level at compile time",
              ],
              answer: 0,
              explanation:
                "The bridges are one-directional. LogTracer registers itself as the log crate's logger and re-emits each record as a tracing event, so dependencies never need to know the app switched.",
            },
          ],
        },
        {
          slug: "tel-hygiene-and-tests",
          title: "Secrets, request ids, and tests",
          summary:
            "Secret<T> redacts by construction, TracingLogger owns the request id, once_cell initialises tests exactly once.",
          xp: 25,
          contentFile: "tel-hygiene-and-tests.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why is it a feature that secrecy's Secret<String> does not implement Display?",
              options: [
                "It makes the wrapper zero-cost at runtime",
                "It lets serde skip the field during deserialization",
                "Formatting a secret becomes a compile error, so every exposure must be an explicit, greppable expose_secret() call",
                "It prevents the value from ever being held in memory",
              ],
              answer: 2,
              explanation:
                "The masked Debug output guards against instrument's capture-everything default; the missing Display turns accidental interpolation into a compiler error that walks you to each use site, like the connection string.",
            },
            {
              kind: "predict",
              prompt:
                "Months later someone adds `card_number: String` to an instrumented function and forgets skip. What happens?",
              options: [
                "tracing refuses to compile without an explicit capture list",
                "The value is captured into the span and appears on every log record for that function: capture is opt-out",
                "The value is redacted automatically because it looks sensitive",
                "Nothing, String arguments are never captured",
              ],
              answer: 1,
              explanation:
                "Opt-out capture is the danger the book flags: forgetting skip once is a security incident. Wrapping the value in Secret<T> is the systematic defence, because its Debug output is redacted.",
            },
            {
              kind: "mcq",
              prompt:
                "Why do the integration tests wrap telemetry initialisation in once_cell's Lazy?",
              options: [
                "Tests run in separate processes and need shared memory to coordinate",
                "Lazy statics are required by cargo test for any setup code",
                "Lazy defers the cost so unrelated tests start faster",
                "init_subscriber sets process-global state and every test calls spawn_app, so only the first initialisation may run; Lazy::force gives exactly-once semantics",
              ],
              answer: 3,
              explanation:
                "All tests in a binary share one process across parallel threads, and setting the global logger twice panics with SetLoggerError. The first force runs the closure; the rest return immediately. std's LazyLock now covers the same need.",
            },
          ],
        },
      ],
    },
  ],
}
