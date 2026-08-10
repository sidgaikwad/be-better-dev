import type { SectionSeed } from "../types"

export const z2pAxumPort: SectionSeed = {
  slug: "z2p-axum-port",
  title: "The axum port",
  description: "Migrate the finished service; learn what was actix and what was Rust.",
  badgeIcon: "🔄",
  badgeTitle: "Ported",
  units: [
    {
      slug: "the-mechanical-map",
      title: "The mechanical map",
      description:
        "Why port a working service at all, then the framework surface translated: server, state, extractors, responses.",
      lessons: [
        {
          slug: "axum-why-port",
          title: "Why port a working service",
          summary:
            "The migration as a controlled experiment, and where axum sits in the tower ecosystem.",
          contentFile: "axum-why-port.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is the port designed to measure?",
              options: [
                "Whether choosing actix-web for the book was a mistake",
                "Which parts of the build were framework knowledge, which were Rust, and which were architecture, by seeing what survives unchanged",
                "Whether axum serves more requests per second than actix-web",
                "How much test coverage the project really has",
              ],
              answer: 1,
              explanation:
                "The three kinds of knowledge are indistinguishable from inside one framework; the diff pulls them apart. Whatever ports untouched was never framework knowledge, whichever chapter taught it.",
            },
            {
              kind: "predict",
              prompt:
                "You delete actix-web from `Cargo.toml` and run `cargo check` before writing a line of axum. Where do the errors cluster?",
              options: [
                "Evenly across every module, since the framework touches everything",
                "In `startup.rs` and `routes/`, while `domain/` and the delivery worker stay silent",
                "Only in `main.rs`",
                "Only in the test suite",
              ],
              answer: 1,
              explanation:
                "Framework density falls as you approach the domain: server construction and handler signatures name actix types constantly, while the newtypes and the worker loop are pure Rust, sqlx, and tokio. The error map is the section's thesis drawn by the compiler.",
            },
            {
              kind: "mcq",
              prompt: "In tower's `Service` trait, what job does `poll_ready` do?",
              options: [
                "It lets a service signal backpressure: refuse new work until it is ready to accept it",
                "It answers load-balancer health checks over HTTP",
                "It verifies the service's future is Send before spawning",
                "It lazily initializes the service on first request",
              ],
              answer: 0,
              explanation:
                "It is the valve from the backpressure lesson: callers must see readiness before handing over a request. That contract, not any HTTP detail, is what lets middleware compose across hyper, axum, and tonic.",
            },
          ],
        },
        {
          slug: "axum-router-and-state",
          title: "Router, State, and one shared app",
          summary:
            "The factory closure retires, and application state moves from a runtime type-map into the type system.",
          contentFile: "axum-router-and-state.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why does `HttpServer::new` take a closure that builds an `App`, while `axum::serve` takes a `Router` value directly?",
              options: [
                "Each actix worker thread builds its own App on its own single-threaded runtime, so actix needs a recipe; axum shares one cloneable Router across a work-stealing runtime",
                "Closures are faster to construct than plain values",
                "actix predates Rust's support for passing structs to functions",
                "Router cannot hold more than one route, so it must be rebuilt per request",
              ],
              answer: 0,
              explanation:
                "The closure is the per-worker recipe from the application-state lesson. axum inverts the model: one value, cheap clones, and any worker may poll any request, which is also why axum handlers must be Send.",
            },
            {
              kind: "predict",
              prompt:
                "A handler needs state that was never provided. When does each framework tell you: actix with a missing `.app_data`, axum with a missing field in `AppState`?",
              options: [
                "Both fail at runtime with a 500",
                "actix fails per request at runtime with a 500; axum fails at compile time, at the route registration",
                "Both fail at compile time",
                "axum panics at startup; actix fails at compile time",
              ],
              answer: 1,
              explanation:
                "web::Data is a TypeId lookup in a runtime map, so the miss surfaces in production. Router<AppState> carries the state type, so an unsatisfiable `FromRef` bound stops `cargo check` instead.",
            },
            {
              kind: "mcq",
              prompt:
                "`AppState` derives `FromRef` and has two `String` fields, `base_url` and `hmac_secret`. What happens?",
              options: [
                "Handlers extracting `State<String>` get the first field in declaration order",
                "The derive generates two conflicting `impl FromRef<AppState> for String` and compilation fails; the fix is newtypes",
                "It compiles, but extraction panics at runtime",
                "The derive silently skips the second field",
              ],
              answer: 1,
              explanation:
                "Substate lookup is by type, exactly like the actix type-map, so distinct roles need distinct types. The book's ApplicationBaseUrl newtype solved this once and the solution ports verbatim.",
            },
          ],
        },
        {
          slug: "axum-extractors-responses",
          title: "Extractors and responses",
          summary:
            "Form, Query, and Path cross over; the body rule and IntoResponse are the new grammar.",
          contentFile: "axum-extractors-responses.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A client POSTs to `/subscriptions` with `Content-Type: application/json` and a valid JSON body containing both fields. The handler takes `Form<FormData>`. What status comes back?",
              options: [
                "400 Bad Request",
                "415 Unsupported Media Type",
                "422 Unprocessable Entity",
                "200 OK, since the data is complete",
              ],
              answer: 1,
              explanation:
                "Form checks the declared content type before reading a byte, so deserializability never enters into it. 422 is reserved for the right content type failing serde, and 400 for our own domain validation.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does axum require a body-consuming extractor like `Form` to be the last handler argument?",
              options: [
                "The body is a stream read once off the socket, so at most one extractor may consume it; encoding that in FromRequest versus FromRequestParts makes the mistake a compile error",
                "Later arguments are extracted first, so the body must come last to be extracted first",
                "It is an arbitrary limitation scheduled for removal",
                "Body extractors are slower, and putting them last improves latency",
              ],
              answer: 0,
              explanation:
                "Metadata extractors read cheap, repeatable parts; the body exists once. actix enforces the same physics per request at runtime, while axum moves the rule into the trait system.",
            },
            {
              kind: "mcq",
              prompt:
                'After a successful admin form POST, the handler returns `Redirect::to("/admin/dashboard")`. Which status does it send, and why does that fit?',
              options: [
                "301 Moved Permanently, so browsers cache the new location",
                "302 Found, the default for all redirects",
                "303 See Other: the browser follows with a GET, so refreshing the landing page cannot repeat the POST",
                "307 Temporary Redirect, preserving the POST method and body",
              ],
              answer: 2,
              explanation:
                "303 is the POST-redirect-GET status the book selected by hand with its see_other helper; axum's Redirect::to bakes it in. 307 would re-send the POST, exactly what the pattern exists to prevent.",
            },
          ],
        },
      ],
    },
    {
      slug: "the-verdict",
      title: "The verdict",
      description:
        "Errors and middleware cross into tower, then the diff and the black-box suite measure what was framework all along.",
      lessons: [
        {
          slug: "axum-errors-and-layers",
          title: "Errors and middleware cross to tower",
          summary:
            "ResponseError's job moves into IntoResponse; wrap becomes layer; tower-sessions takes the admin flow.",
          contentFile: "axum-errors-and-layers.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "In the ported service, why can't `TraceLayer` log `SubscribeError`'s `Caused by:` chain the way `tracing-actix-web` recorded `exception.details`?",
              options: [
                "By the time any layer runs, into_response has consumed the error and produced a plain response, so the layer can classify the 500 but never held the error value",
                "TraceLayer only supports gRPC failures",
                "tower layers cannot emit tracing events",
                "It can, but only when the macros feature is enabled",
              ],
              answer: 0,
              explanation:
                "The rich error's last moment alive is inside into_response, which is why the operator log record is emitted there (or the error is stashed in response extensions for a layer). Middleware sees effects, not causes.",
            },
            {
              kind: "predict",
              prompt:
                "A ported handler is declared as `async fn login(session: Session, Form(form): Form<FormData>)`. Does it compile?",
              options: [
                "No: axum allows only one extractor per handler",
                "Yes: Session extracts from request parts, so it may appear anywhere before the single body-consuming extractor",
                "No: Session must always be the last argument",
                "Only if wrapped in `#[axum::debug_handler]`",
              ],
              answer: 1,
              explanation:
                "Session reads request extensions populated by SessionManagerLayer, making it a metadata extractor under the ordering rule from the extractors lesson. Form still holds the one body slot, still last.",
            },
            {
              kind: "mcq",
              prompt:
                "Which tower-sessions call replaces `session.renew()` after a successful login, and what attack does it blunt?",
              options: [
                "`session.flush().await`, which prevents replay attacks",
                "`session.cycle_id().await`, which issues a fresh session id so an id planted before login cannot be reused: session fixation",
                "`session.save().await`, which prevents CSRF",
                "`session.get().await`, which rotates the signing key",
              ],
              answer: 1,
              explanation:
                "Crossing a privilege boundary demands a new id while keeping the data, which is exactly what cycle_id does. flush is the logout move, the purge() equivalent that deletes the session outright.",
            },
          ],
        },
        {
          slug: "axum-what-survived",
          title: "The diff is the verdict",
          summary:
            "An honest inventory of what never changed, the test suite as referee, and how to choose a framework now.",
          xp: 25,
          contentFile: "axum-what-survived.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "The EmailClient tests from the confirmation-emails section, the ones asserting against a wiremock `MockServer`, run against the ported codebase without editing a character. Why?",
              options: [
                "axum re-exports actix types for compatibility",
                "They drive EmailClient directly against the mock server; no router, actix or axum, was ever in that loop",
                "wiremock automatically translates between frameworks",
                "reqwest retries until the assertion passes",
              ],
              answer: 1,
              explanation:
                "Those tests exercise a reqwest client against a fake Postmark, an interaction the web framework never mediated. Code with no framework in the loop cannot be broken by swapping the framework.",
            },
            {
              kind: "mcq",
              prompt:
                "After the port, exactly one test fails: `subscribe_returns_a_400_when_data_is_missing`, seeing 422. What does that failure demonstrate?",
              options: [
                "The suite tests the observable HTTP contract, so it caught the one visible behavior change (the extractor's rejection status) while ignoring every internal rewrite",
                "The test suite was broken all along",
                "axum is not production-ready",
                "Black-box tests should never assert on status codes",
              ],
              answer: 0,
              explanation:
                "The assertion had encoded actix's rejection opinion rather than the service's own validation. One red test out of the whole suite is the measurement working: everything else about the contract genuinely did not change.",
            },
            {
              kind: "mcq",
              prompt:
                "Per this lesson, what should weigh most when choosing between axum and actix-web for a new I/O-bound service today?",
              options: [
                "Requests-per-second benchmarks between the two frameworks",
                "Team experience and ecosystem fit, like tower middleware reuse or an existing codebase, since raw performance is a wash next to the database round-trip",
                "Always axum, because newer is better",
                "Always actix-web, because it is older",
              ],
              answer: 1,
              explanation:
                "Both are mature and fast enough that the database dominates. The durable win is the architecture that made this port small: framework at the edge, domain in the middle, contract pinned by black-box tests.",
            },
          ],
        },
      ],
    },
  ],
}
