import type { SectionSeed } from "../types"

export const z2pNewsletterDelivery: SectionSeed = {
  slug: "z2p-newsletter-delivery",
  title: "Newsletter delivery (ch. 9)",
  description: "The naive delivery loop, and why it is naive.",
  badgeIcon: "📰",
  badgeTitle: "Delivery",
  units: [
    {
      slug: "story-and-tests",
      title: "The story and the tests",
      description: "One word amends the user story; two black-box tests pin both sides of it.",
      lessons: [
        {
          slug: "del-user-story",
          title: "User stories are not set in stone",
          summary: "Chapter 2's story breaks on one word, and the naive slice is a strategy.",
          contentFile: "del-user-story.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why can the chapter 2 user story no longer guide the implementation of newsletter delivery?",
              options: [
                "It never specified an email provider",
                'It says "all my subscribers", written before confirmed and unconfirmed subscribers existed, so it cannot say which population receives the issue',
                "It lacks acceptance criteria and story points",
                "Postmark changed its API since chapter 7",
              ],
              answer: 1,
              explanation:
                "Working on the domain sharpened the vocabulary: the schema now distinguishes status = 'confirmed' from 'pending_confirmation', and the old story predates the distinction. Folding the sharper language back in, all my confirmed subscribers, is the amendment.",
            },
            {
              kind: "predict",
              prompt:
                "Suppose the team implements the original story as written and sends issues to every row in subscriptions. What is the concrete failure mode?",
              options: [
                "The query returns zero rows because status is never null",
                "A compile error: pending rows have no email column",
                "Issues reach addresses that never clicked their confirmation link, the exact spam the double-opt-in machinery was built to prevent",
                "Confirmation tokens expire and block the send",
              ],
              answer: 2,
              explanation:
                "Unconfirmed rows hold addresses whose owners never proved they wanted mail: typos, pranks, other people's addresses. Emailing them invites spam complaints and burns sender reputation, which is why one word in the story is not cosmetic.",
            },
            {
              kind: "mcq",
              prompt: "What separates the chapter's naive implementation from plain negligence?",
              options: [
                "It is faster to write, so more time remains for polish",
                "Its shortcomings are cataloged by name at the end and become the agenda for the following chapters, in priority order",
                "Naive code has fewer dependencies to audit",
                "Integration tests make the naivety harmless in production",
              ],
              answer: 1,
              explanation:
                "The slice is shipped with its exclusions stated out loud. A running naive version turns hardening questions from speculation into observation, so each later chapter starts from working code plus one named defect.",
            },
          ],
        },
        {
          slug: "del-test-first-api",
          title: "Test-first through the public API",
          summary:
            "expect(0) pins do-not-spam; state is seeded via POST /subscriptions with scoped mocks.",
          contentFile: "del-test-first-api.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                'The first test must prove a negative: no email reached an unconfirmed subscriber. How does a black-box test observe "nothing was sent"?',
              options: [
                "It queries the database for an empty outbox table",
                "It mounts Mock::given(any()) with .expect(0) on the fake Postmark server; verification at drop fails if any request arrived",
                "It parses the application logs for send events",
                "It waits five seconds and asserts a timeout",
              ],
              answer: 1,
              explanation:
                "Every outgoing email is an HTTP call from EmailClient to the configured base_url, which tests point at wiremock. No request at the mock means no email left the application, so the absence becomes a checkable expectation with no assert in the test body.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does create_unconfirmed_subscriber call POST /subscriptions instead of running INSERT INTO subscriptions directly?",
              options: [
                "sqlx connections are unavailable inside test helpers",
                "Raw inserts are slower than HTTP calls",
                "The API call exercises the real write path, so tests survive schema and logic changes or fail for honest reasons, instead of freezing today's column layout into every test",
                "wiremock rejects tests that touch the database",
              ],
              answer: 2,
              explanation:
                "Black-box discipline: drive application state through the public API when possible. A hand-written INSERT quietly bypasses the code that actually creates subscribers and breaks silently when the subscribe flow changes shape.",
            },
            {
              kind: "predict",
              prompt:
                "A regression stops the app from sending confirmation emails, though subscribe still returns 200. What happens the next time create_unconfirmed_subscriber runs?",
              options: [
                "Nothing: helper mocks are advisory and never fail a test",
                "The MockGuard's drop eagerly verifies the scoped mock, and its .expect(1) fails right there, pointing at the helper",
                "The newsletter test passes because no spam was sent",
                "The mock returns 404 and post_subscriptions retries forever",
              ],
              answer: 1,
              explanation:
                "mount_as_scoped returns a MockGuard whose Drop both withdraws the behavior and checks expectations eagerly. The helper fails loudly the moment its assumption about the app stops holding, instead of rotting into dead scaffolding.",
            },
          ],
        },
      ],
    },
    {
      slug: "the-naive-loop",
      title: "The naive loop and its debts",
      description:
        "Fetch, iterate, send; re-prove stored data; write the shortcomings down by name.",
      lessons: [
        {
          slug: "del-naive-loop",
          title: "The naive implementation",
          summary: "JSON body in, confirmed subscribers out, one send_email per row.",
          contentFile: "del-naive-loop.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                'The handler is still a dummy that ignores _body: web::Json<BodyData>. A test posts {"title": "Newsletter!"} with no content field. What status comes back?',
              options: [
                "200: the handler ignores the body and returns Ok",
                "400: the Json extractor fails to deserialize the payload and rejects it before the handler runs",
                "500: serde panics inside the handler",
                "404: the route only matches complete bodies",
              ],
              answer: 1,
              explanation:
                "actix-web runs extractors first; the missing content field fails Deserialize and the framework answers 400 on its own. By the time any handler holds a BodyData, the shape is already proven, which is why the invalid-data test passes against a do-nothing handler.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does the send loop use .with_context(|| format!(...)) rather than .context(format!(...))?",
              options: [
                "context cannot attach messages to reqwest errors",
                "with_context is required for the ? operator to compile",
                "with_context takes a closure invoked only on the error path, so the format! heap allocation is skipped on every successful send",
                "context is deprecated in current anyhow",
              ],
              answer: 2,
              explanation:
                "Both convert the error into anyhow::Error with a message layered on top; the difference is eager versus lazy. context would build the string once per subscriber regardless of outcome; with_context pays for the allocation only when a send actually fails.",
            },
            {
              kind: "mcq",
              prompt:
                "Adding get_confirmed_subscribers(&pool).await? to the handler stopped compilation. Why did the handler's return type have to change?",
              options: [
                "async functions cannot call other async functions without Box::pin",
                "? propagates the error by returning it, so the function must return Result or Option; bare HttpResponse is neither, hence Result<HttpResponse, PublishError>",
                "sqlx queries may only be awaited inside functions returning anyhow::Result",
                "actix-web requires every handler to name an error type",
              ],
              answer: 1,
              explanation:
                "The compiler says it directly: this function should return Result or Option to accept ?. Naming the error type meant minting PublishError with the chapter 8 recipe: thiserror, a transparent anyhow variant, chain-walking Debug, and ResponseError mapping to 500.",
            },
          ],
        },
        {
          slug: "del-stored-data",
          title: "Validation of stored data",
          summary:
            "Old rows, new invariants: re-parse at the read boundary and follow the compiler.",
          xp: 25,
          contentFile: "del-stored-data.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Every email in the database passed SubscriberEmail::parse on the way in. Why is SubscriberEmail::parse(r.email).unwrap() on the way out still unsound?",
              options: [
                "parse is not deterministic across calls",
                "Rows were declared valid by whichever version of the app wrote them; a later deploy with stricter validation panics on old rows, taking delivery down entirely",
                "unwrap adds unacceptable overhead per row",
                "sqlx may return emails from other tables",
              ],
              answer: 1,
              explanation:
                "Stored data creates temporal coupling between old and new versions of the application. With frequent deploys, the reader and the writer of a row are rarely the same binary, so the write-side proof cannot be assumed on the read side.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does the refactor change get_confirmed_subscribers to return Result<Vec<Result<ConfirmedSubscriber, anyhow::Error>>, anyhow::Error> instead of keeping the filter_map that skips invalid rows?",
              options: [
                "filter_map does not work on async iterators",
                "Skip-or-abort on an invalid address is a business decision that belongs to publish_newsletter, the driving routine; the storage adapter should map rows, report per-row failures, and let the caller decide",
                "tracing::warn! cannot be called from database code",
                "The outer Result was removed to simplify the signature",
              ],
              answer: 1,
              explanation:
                "The adapter translates between storage and domain; the workflow owns policy. The nested signature makes both failure modes explicit: the outer Result for the query, one inner Result per row, and the compiler forces the caller to handle each.",
            },
            {
              kind: "predict",
              prompt:
                "email is now a SubscriberEmail with Display implemented. The loop calls send_email(subscriber.email, ...) and the with_context closure formats subscriber.email. What does cargo check report?",
              options: [
                "Success: Display satisfies every bound",
                "E0308 again: expected SubscriberEmail, found String",
                "E0382, borrow of partially moved value: send_email moves the email out, then the closure uses it; fixed by cloning, or better, by changing send_email to take &SubscriberEmail since it only calls as_ref",
                "E0597: the closure outlives the subscriber binding",
              ],
              answer: 2,
              explanation:
                "The by-value argument moves email out of subscriber, and the error-path closure needs it afterward. The book asks whether the callee needed ownership at all: it did not, so the signature takes a reference and every call site just adds an &.",
            },
          ],
        },
        {
          slug: "del-limitations",
          title: "The limitations catalog",
          summary:
            "Five named debts, best-effort semantics, and the agenda for chapters 10 and 11.",
          contentFile: "del-limitations.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "5,000 confirmed subscribers; Postmark fails on number 2,317 and send_email returns Err. What is the state of the world after the ? fires?",
              options: [
                "No emails were sent: the loop rolls back on error",
                "Subscribers 1 to 2,316 have the issue, 2,317 to 5,000 have nothing, the author sees a 500, and nothing durable records where the loop stopped",
                "All 5,000 received it: errors are logged and skipped",
                "Only 2,317 is missing; the loop continues past the failure",
              ],
              answer: 1,
              explanation:
                "Sends are sequential and the ? aborts the loop at the first failure, so everyone before the failure point is delivered and everyone after is not. With no delivery record, a retry restarts from the top and double-sends to the first 2,316.",
            },
            {
              kind: "mcq",
              prompt: "What delivery guarantee does the naive POST /newsletters actually provide?",
              options: [
                "Exactly-once: each confirmed subscriber receives the issue once",
                "At-least-once: failures are retried until delivery succeeds",
                "Best-effort: a mid-loop failure drops the rest of the list, nothing is retried or recorded, and retrying the request duplicates sends",
                "At-most-once with a durable checkpoint of progress",
              ],
              answer: 2,
              explanation:
                "Not exactly-once, because retries duplicate; not at-least-once, because the tail of the list is silently dropped on failure. Naming the semantics precisely is what turns vague unease into the work items chapters 10 and 11 pick up.",
            },
            {
              kind: "mcq",
              prompt:
                "Per the book's triage of the five limitations, which one is non-negotiable before the API can be released at all?",
              options: [
                "Performance: sequential sends are too slow",
                "The unprotected endpoint: anyone can broadcast to the entire mailing list, so authentication must come first, in chapter 10",
                "The missing draft-and-review step",
                "Retry safety: consumers cannot safely retry",
              ],
              answer: 1,
              explanation:
                "One-shot publishing and slow sends are annoying but livable; fault tolerance and retry safety are serious with visible audience impact; the open endpoint is the one the book flags as a must before release, which is why securing the API is the very next chapter.",
            },
          ],
        },
      ],
    },
  ],
}
