import type { SectionSeed } from "../types"

export const z2pErrorHandling: SectionSeed = {
  slug: "z2p-error-handling",
  title: "Error handling (ch. 8)",
  description: "The Error trait, layering, thiserror versus anyhow, who logs.",
  badgeIcon: "🧯",
  badgeTitle: "Error craft",
  units: [
    {
      slug: "the-operator-report",
      title: "The operator's report",
      description: "A sabotage test exposes a blind 500; wrapping the cause fixes the log.",
      lessons: [
        {
          slug: "errh-sabotage-test",
          title: "One failure, two audiences",
          summary: "A sabotage test passes while the 500's log record explains nothing.",
          contentFile: "errh-sabotage-test.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "The sabotage test passes on the very first run, before any refactor. What does that green test establish?",
              options: [
                "That the error handling is already correct",
                "Only the caller-facing contract: a fatal database failure produces a 500",
                "That the log contains the root cause",
                "That sqlx retried the failed insert",
              ],
              answer: 1,
              explanation:
                "The assertion checks the status code, control flow at the edge, and that half was always fine. The operator's half, the report, is what the chapter inspects by reading logs by hand, since asserting on log contents is awkward with current tooling.",
            },
            {
              kind: "predict",
              prompt:
                "One record in the pre-refactor log does contain the PgDatabaseError with code 42703. Which line emitted it?",
              options: [
                "TracingLogger, at the end of the request",
                "The tracing::error! inside store_token's map_err",
                "actix-web's default error handler",
                "sqlx itself, at the connection layer",
              ],
              answer: 1,
              explanation:
                "Only the map_err closure ever sees the error with its context intact. Everything downstream of subscribe's is_err() check sees a bare hand-built 500, which is why the END record's exception fields are empty.",
            },
            {
              kind: "mcq",
              prompt:
                "Why are exception.details and exception.message empty in the END record for the failing request?",
              options: [
                "RUST_LOG filtered them out",
                "The handler discarded the sqlx::Error and hand-built a bodyless 500, so no error value ever reached the middleware",
                "tracing-actix-web only fills them for 4xx responses",
                "The bunyan formatter truncated the fields",
              ],
              answer: 1,
              explanation:
                "TracingLogger reports the error attached to the response, and this response has none: the error died inside the handler at the is_err() check. Wiring the value through to the middleware is the point of the whole refactor.",
            },
          ],
        },
        {
          slug: "errh-store-token-error",
          title: "StoreTokenError: wrap the cause, keep the chain",
          summary: "The orphan rule forces a newtype; Display, Debug, and source() fill the log.",
          contentFile: "errh-store-token-error.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "impl ResponseError for StoreTokenError {} was rejected with E0277. What was missing?",
              options: [
                "A source() implementation",
                "Debug and Display implementations, required by ResponseError's supertraits",
                "A From<sqlx::Error> impl",
                "serde::Serialize for the response body",
              ],
              answer: 1,
              explanation:
                "ResponseError: fmt::Debug + fmt::Display encodes the two audiences as a trait bound: a faithful structural dump for the operator, a brief human account for Display. source() belongs to std's Error trait and is not required by actix-web.",
            },
            {
              kind: "predict",
              prompt:
                "With #[derive(Debug)] on StoreTokenError(sqlx::Error), what does {:?} print when the wrapped error is the 42703 failure?",
              options: [
                "Just the text StoreTokenError",
                'StoreTokenError(Database(PgDatabaseError { code: "42703", ... })): the wrapped error\'s structure, nested',
                "The Display message about storing a subscription token",
                "Nothing: sqlx::Error does not implement Debug",
              ],
              answer: 1,
              explanation:
                "Derived Debug is faithful to structure, so the field's own Debug output appears nested inside the wrapper's. That is why the root cause shows up in the log even before source() exists, just implicitly, as an accident of layout.",
            },
            {
              kind: "mcq",
              prompt:
                "After subscribe returns Result<HttpResponse, actix_web::Error>, what turns a StoreTokenError into an actix_web::Error at the ? site?",
              options: [
                "A hand-written map_err in subscribe",
                "actix-web's blanket impl From<T> for Error where T: ResponseError + 'static, invoked by ?",
                "TracingLogger converts it while logging",
                "The compiler special-cases actix handlers",
              ],
              answer: 1,
              explanation:
                "? calls From::from on the error on its way out, the mechanism from the Result-basics lesson. Implementing ResponseError is exactly what makes the blanket conversion apply to the new type.",
            },
          ],
        },
      ],
    },
    {
      slug: "control-flow-and-crates",
      title: "Control flow and the crates",
      description: "SubscribeError owns the status codes; thiserror and anyhow strip it down.",
      lessons: [
        {
          slug: "errh-subscribe-error",
          title: "SubscribeError: variants as control flow",
          summary: "An enum at the handler maps each outcome to 400 or 500 in one match.",
          contentFile: "errh-subscribe-error.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "subscribe returns Result<HttpResponse, SubscribeError> with impl ResponseError for SubscribeError {} left at the defaults. A payload with an empty name arrives. What status comes back?",
              options: [
                "400, from the validation branch",
                "422",
                "500, because the default status_code answers internal server error for every value",
                "It fails to compile without status_code",
              ],
              answer: 2,
              explanation:
                "The default implementation cannot know which variants are the caller's fault, so it answers 500 for everything: exactly the test regression the chapter hits. Overriding status_code with a per-variant match is the fix.",
            },
            {
              kind: "mcq",
              prompt:
                "Why did DatabaseError(sqlx::Error) have to split into PoolError, InsertSubscriberError, and TransactionCommitError?",
              options: [
                "Three variants make the enum faster to match",
                "The same wrapped type arrives from three operations, and Display had no way to say which one failed",
                "sqlx requires one variant per query",
                "ResponseError needs distinct types per status code",
              ],
              answer: 1,
              explanation:
                'A pool timeout, a failed insert, and a failed commit all arrive as sqlx::Error: the underlying type is not enough. The variant name is where "what were we doing" lives, feeding both Display and the operator\'s log.',
            },
            {
              kind: "mcq",
              prompt:
                "Why delete impl ResponseError for StoreTokenError instead of keeping it alongside SubscribeError's?",
              options: [
                "Two ResponseError impls in one crate conflict",
                "Status codes are the request handler's concern; store_token may serve non-HTTP entry points or endpoints that map this failure differently",
                "StoreTokenError no longer implements Display",
                "actix-web deprecated ResponseError on wrapper types",
              ],
              answer: 1,
              explanation:
                "A storage routine that names its own status code has leaked a boundary decision into the wrong layer. Keeping the mapping in SubscribeError's status_code match puts the endpoint's entire HTTP policy in one place.",
            },
          ],
        },
        {
          slug: "errh-thiserror-rewrite",
          title: "The thiserror rewrite: 90 lines to 21",
          summary: "#[error], #[source], and #[from] derive what the last two lessons hand-wrote.",
          contentFile: "errh-thiserror-rewrite.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which hand-written impl survives the thiserror rewrite of SubscribeError?",
              options: [
                "Display, because macros cannot format",
                "The From impls",
                "The chain-walking Debug that delegates to error_chain_fmt",
                "source(), which thiserror cannot generate",
              ],
              answer: 2,
              explanation:
                "The derive covers Display, source, and From, but the Caused-by report is a bespoke preference the macro cannot guess: a derived Debug would print structure, not walk the chain.",
            },
            {
              kind: "predict",
              prompt:
                'println!("{}", SubscribeError::ValidationError("email is missing an @".into())) prints what?',
              options: [
                'ValidationError("email is missing an @")',
                "email is missing an @",
                "{0}",
                "Failed to create a new subscriber.",
              ],
              answer: 1,
              explanation:
                '#[error("{0}")] builds the Display impl by interpolating field 0, using tuple-struct field syntax. The variant name never appears in Display output; structure is Debug\'s job.',
            },
            {
              kind: "mcq",
              prompt: "What does #[derive(thiserror::Error)] actually produce?",
              options: [
                "A runtime lookup table consulted on each error",
                "Ordinary impl blocks generated at compile time, subject to the usual coherence rules",
                "Compiler-internal magic exempt from the orphan rule",
                "A build script that rewrites the source file",
              ],
              answer: 1,
              explanation:
                "A procedural macro turns the enum's token stream into plain Rust impls before compilation continues. That is why #[from] on all three sqlx-wrapping variants would still be a From coherence conflict: generated code is ordinary code.",
            },
          ],
        },
        {
          slug: "errh-anyhow-split",
          title: "anyhow at the boundary, and who logs",
          summary:
            "Unnameable failures collapse into anyhow::Error with context, logged once where handled.",
          xp: 25,
          contentFile: "errh-anyhow-split.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "UnexpectedError becomes #[error(transparent)] wrapping Box<dyn Error>, and the sabotage test reruns. What happened to exception.details?",
              options: [
                "Unchanged: the chain survives",
                "Richer: transparent adds a backtrace",
                "It collapsed to the raw database error alone: no Caused-by chain, no operator message",
                "It went empty again",
              ],
              answer: 2,
              explanation:
                "transparent forwards Display straight through to the wrapped error, and subscribe no longer attaches what-was-being-attempted context. That regression motivates first the extra String field, then anyhow's context method.",
            },
            {
              kind: "mcq",
              prompt:
                'In the final code, what did .context("Failed to insert new subscriber in the database.") make unnecessary?',
              options: [
                "The status_code match",
                "The extra String field on UnexpectedError and the map_err closures pairing Box::new(e) with a message",
                "The Error impl on SubscribeError",
                "The tracing middleware",
              ],
              answer: 1,
              explanation:
                "context converts the error into anyhow::Error and layers the message on top while keeping the original as source, so one method call replaces the two-field variant and its noisy construction sites.",
            },
            {
              kind: "mcq",
              prompt:
                "Which log statements does the chapter delete to reach one ERROR record per failure, and under what rule?",
              options: [
                "TracingLogger's END record: it duplicates actix-web's",
                "The tracing::error! calls in insert_subscriber and store_token: propagating functions add context, and the handling layer logs once",
                "All INFO records: only errors matter",
                "The sqlx internals filtered by RUST_LOG",
              ],
              answer: 1,
              explanation:
                "Errors should be logged when they are handled. The propagating functions were triple-reporting one incident; the telemetry middleware at the boundary is the handler of record, so its record is the one that stays.",
            },
          ],
        },
      ],
    },
  ],
}
