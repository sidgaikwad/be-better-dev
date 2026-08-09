import type { SectionSeed } from "../types"

export const errorHandling: SectionSeed = {
  slug: "error-handling",
  title: "Error handling in depth",
  description: "Designing error types, propagation, and boundaries.",
  badgeIcon: "🚨",
  badgeTitle: "Errors",
  units: [
    {
      slug: "what-errors-are-for",
      title: "What errors are for",
      description: "Two audiences, two representations, and the chain of causes.",
      lessons: [
        {
          slug: "err-two-audiences",
          title: "What errors are for: two audiences",
          summary: "Callers react, operators troubleshoot, and users see the edge.",
          contentFile: "err-two-audiences.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Per this lesson, the two purposes an error serves are:",
              options: [
                "Panicking and recovering",
                "Control flow for the caller and reporting for a human",
                "Validation and serialization",
                "Retrying and alerting",
              ],
              answer: 1,
              explanation:
                "Control flow is scripted, so it needs machine-readable structure like enum variants; reports are read by humans after the fact and need as much context as possible.",
            },
            {
              kind: "mcq",
              prompt: "Why should the body of a 500 response be empty?",
              options: [
                "HTTP forbids bodies on 5xx responses",
                "The user cannot act on internal details, and leaking them helps attackers",
                "Empty bodies make responses faster",
                "So the framework can reuse the allocation",
              ],
              answer: 1,
              explanation:
                "Internal detail belongs in the logs, for the operator. The status code alone gives the client its machine-readable signal; the user has no mental model of your internals to act on.",
            },
            {
              kind: "predict",
              prompt: "In the location-by-purpose table, status codes occupy which cell?",
              options: [
                "Internal control flow",
                "Internal reporting",
                "Control flow at the edge",
                "Reporting at the edge",
              ],
              answer: 2,
              explanation:
                "A status code is the machine-parsable signal a client scripts against, playing the role enum variants play internally. The response body is the edge's report channel.",
            },
          ],
        },
        {
          slug: "err-error-trait",
          title: "The Error trait and the source chain",
          summary: "Debug, Display, and source(): reports that keep their root cause.",
          contentFile: "err-error-trait.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "For an error type, Debug and Display split their duties how?",
              options: [
                "Debug is for debug builds, Display for release builds",
                "Debug is the faithful programmer-facing structure; Display is a brief human-facing description",
                "Debug is required by Result, Display is optional",
                "They must produce identical output for consistency",
              ],
              answer: 1,
              explanation:
                "They serve the two audiences: Debug gives the operator as much structure as possible, Display gives a concise account of what failed. The Error trait requires both.",
            },
            {
              kind: "mcq",
              prompt: "What does implementing source() buy you?",
              options: [
                "Automatic retries for transient failures",
                "Generic code can walk the chain of causes without knowing any concrete types",
                "Faster error formatting",
                "Automatic conversion at ? sites",
              ],
              answer: 1,
              explanation:
                "source returns &dyn Error, so formatters and telemetry iterate causes through the trait alone. Conversion at ? is From's job, a separate mechanism entirely.",
            },
            {
              kind: "predict",
              prompt: "A `&(dyn Error + 'static)` reference is how large in memory, and why?",
              options: [
                "One word: a plain pointer",
                "Two words: a data pointer plus a vtable pointer",
                "Three words: pointer, length, capacity",
                "It depends on the concrete error's size",
              ],
              answer: 1,
              explanation:
                "A trait-object reference is a fat pointer; the vtable half is what makes runtime dispatch on an unknown type possible. Three words is the String header from the ownership section, a different animal.",
            },
          ],
        },
      ],
    },
    {
      slug: "designing-error-types",
      title: "Designing error types",
      description: "Per-layer enums with From at the edges, and thiserror generating them.",
      lessons: [
        {
          slug: "err-layered-enums",
          title: "One error type per layer",
          summary: "Enums with From at the edges, so ? composes the stack.",
          contentFile: "err-layered-enums.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does `?` start compiling in subscribe once the From impls exist?",
              options: [
                "? calls From::from on the error before returning it",
                "From impls change the function's signature",
                "The compiler special-cases error enums",
                "? retries the operation with the converted error",
              ],
              answer: 0,
              explanation:
                "From the Result lesson: ? unwraps Ok or returns Err(From::from(e)). A conversion path from each underlying error type into the layer's enum is all it needs.",
            },
            {
              kind: "predict",
              prompt:
                "You write From<sqlx::Error> for SubscribeError twice, targeting the PoolError and InsertSubscriberError variants. The compiler:",
              options: [
                "Uses the first impl it finds",
                "Picks the variant matching the call site",
                "Rejects it: conflicting implementations of the same trait for the same type",
                "Accepts it and dispatches at runtime",
              ],
              answer: 2,
              explanation:
                "Coherence allows one impl per trait-and-type pair, and From sees types, not intentions. That is exactly why the ambiguous sqlx cases use map_err with an explicit variant constructor.",
            },
            {
              kind: "mcq",
              prompt: "Why not implement ResponseError for sqlx::Error directly?",
              options: [
                "It would compile but slow down queries",
                "The orphan rule forbids it, and the status-code choice belongs to the handler layer anyway",
                "sqlx::Error is a struct, not an enum",
                "ResponseError requires Clone, which sqlx::Error lacks",
              ],
              answer: 1,
              explanation:
                "Foreign trait for foreign type is rejected so dependencies can never install competing impls. And even via a wrapper, hard-coding HTTP semantics into storage errors leaks the boundary decision into the wrong layer.",
            },
          ],
        },
        {
          slug: "err-thiserror",
          title: "thiserror: the boilerplate, generated",
          summary: "#[error], #[source], #[from]: the hand-written impls, derived.",
          contentFile: "err-thiserror.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "#[from] on a variant's field generates what?",
              options: [
                "Only the Display arm for that variant",
                "A From impl for the wrapped type, and marks the field as the source",
                "A Clone impl for the enum",
                "A runtime conversion table",
              ],
              answer: 1,
              explanation:
                "from implies source: that one attribute replaces a hand-written From impl plus a source match arm. Display still comes from the #[error] attribute.",
            },
            {
              kind: "mcq",
              prompt: "Why can ValidationError(String) not take #[source]?",
              options: [
                "Tuple variants cannot carry sources",
                "String does not implement Error, so it cannot appear in a source chain",
                '#[error("{0}")] conflicts with #[source]',
                "Validation errors are always root causes by convention",
              ],
              answer: 1,
              explanation:
                "source() returns &dyn Error, and String is a message, not an error value. The variant is its own root cause, the same reason the hand-written source match returned None for it.",
            },
            {
              kind: "predict",
              prompt:
                "You put #[from] on both PoolError(sqlx::Error) and InsertSubscriberError(sqlx::Error). What happens?",
              options: [
                "The macro picks the first variant for conversions",
                "Compile error: the derive generates two conflicting From<sqlx::Error> impls",
                "A runtime panic on the first conversion",
                "It works; thiserror disambiguates by error message",
              ],
              answer: 1,
              explanation:
                "The derive emits ordinary impls that obey ordinary coherence rules, so it hits exactly the conflict the layering lesson demonstrated by hand. Those variants keep #[source] and map_err.",
            },
          ],
        },
      ],
    },
    {
      slug: "applications-and-boundaries",
      title: "Applications and boundaries",
      description: "Opaque errors with anyhow, status codes at the edge, and logging once.",
      lessons: [
        {
          slug: "err-anyhow-opaque",
          title: "anyhow: opaque errors with context",
          summary: "When callers only report, stop enumerating: anyhow::Error and .context().",
          contentFile: "err-anyhow-opaque.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "The ball-of-mud error enum problem is:",
              options: [
                "Too few variants to match on",
                "Variants mirror the function's fallible calls, leaking implementation details callers cannot use",
                "Enums cannot implement the Error trait",
                "Enum errors are slower than boxed errors",
              ],
              answer: 1,
              explanation:
                "The abstraction test: callers of subscribe only need invalid-input versus unexpected. A variant per internal call changes with every refactor and empowers no one.",
            },
            {
              kind: "mcq",
              prompt: 'What two things does .context("...") do?',
              options: [
                "Logs the error and retries once",
                "Converts the error into anyhow::Error and layers a message on top, keeping the original as source",
                "Catches panics and formats them as errors",
                "Attaches a backtrace and drops the original cause",
              ],
              answer: 1,
              explanation:
                "Conversion plus enrichment in one call. The Caused by chain stays intact for the operator's report while the type stops enumerating the function's insides.",
            },
            {
              kind: "predict",
              prompt:
                "A function returns anyhow::Result, and one failure mode becomes something callers must react to. The right move is:",
              options: [
                "Document which type to downcast to",
                "Match on the Display string",
                "Promote that mode into an enumerated error type",
                "Wrap the anyhow::Error in another anyhow::Error",
              ],
              answer: 2,
              explanation:
                "Reacting means control flow, and control flow lives in types. Routine downcasting is the signal that the opaque choice no longer matches the caller's intent.",
            },
          ],
        },
        {
          slug: "err-web-boundary",
          title: "The web boundary: 400, 500, and logging once",
          summary: "Status codes per variant, and exactly one log record per failure.",
          contentFile: "err-web-boundary.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which failures should map to a 400?",
              options: [
                "All database failures",
                "Failures the user caused and can fix by changing their request",
                "Any error that carries a source chain",
                "Transient failures worth retrying",
              ],
              answer: 1,
              explanation:
                "4xx says the problem is the caller's to fix, so the body should help them fix it. Everything they cannot act on is a 500 with an empty body, details reserved for the log.",
            },
            {
              kind: "predict",
              prompt:
                "A RateLimited variant is added to SubscribeError. What happens on the next cargo check?",
              options: [
                "Nothing until a request is rate limited",
                "The status_code match fails to compile until the new variant gets a status decision",
                "The variant silently defaults to 500",
                "actix-web rejects the route at startup",
              ],
              answer: 1,
              explanation:
                "The exhaustive match turns the new failure mode into a compile-time worklist item, the property the match lesson bought. A _ arm would have defaulted silently instead.",
            },
            {
              kind: "mcq",
              prompt: "Your function propagates an error with ?. Its logging duty is:",
              options: [
                "Log at error level before returning",
                "Log at debug level so the record is cheap",
                "None: add context to the error instead, and let the handler-of-record log once",
                "Log only if the error has no source",
              ],
              answer: 2,
              explanation:
                "Errors are logged when they are handled. Propagating layers contribute by enriching the chain; the telemetry middleware at the boundary emits the single authoritative record, keeping one incident at one event.",
            },
          ],
        },
      ],
    },
  ],
}
