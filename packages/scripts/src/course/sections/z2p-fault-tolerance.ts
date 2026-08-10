import type { SectionSeed } from "../types"

// Part 3, section: Fault-tolerant workflows. Walks Zero to Production
// chapter 11: the failure modes of POST /admin/newsletters, idempotency
// keys and save-and-replay, the Postgres idempotency store (composite
// header_pair type, the MessageBody detour), concurrent duplicates via
// INSERT ... ON CONFLICT inside a transaction plus isolation levels, and
// forward recovery with issue_delivery_queue, SKIP LOCKED workers, and
// tokio::select in main. Ends with the chapter's own list of leftovers.

export const z2pFaultTolerance: SectionSeed = {
  slug: "z2p-fault-tolerance",
  title: "Fault-tolerant workflows (ch. 11)",
  description: "Idempotency, transaction isolation, background delivery workers.",
  badgeIcon: "🧱",
  badgeTitle: "Fault tolerant",
  units: [
    {
      slug: "when-delivery-breaks",
      title: "When delivery breaks",
      description: "Enumerate the endpoint's failure modes, then define retry-safety precisely.",
      lessons: [
        {
          slug: "ft-failure-modes",
          title: "Five failure modes, five blast radii",
          summary:
            "What invalid input, Postgres, Postmark, a crash, and an impatient author each cost.",
          contentFile: "ft-failure-modes.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Postmark returns a 500 while the naive handler is emailing the third of 100 confirmed subscribers. What state does the abort leave behind?",
              options: [
                "No emails sent; the handler validates every send before dispatching any",
                "Two subscribers have the issue; the other 98, including the third, do not",
                "99 subscribers have the issue; only the third is missing",
                "All 100 have it; the 500 refers only to a logging failure",
              ],
              answer: 1,
              explanation:
                "Sends are sequential and `?` aborts at the first failure, so everything before subscriber k succeeded and nothing from k onward was attempted. Blast radius depends entirely on where in the list the failure lands, which is what makes blind retries so costly.",
            },
            {
              kind: "mcq",
              prompt:
                "Which failure mode already has zero blast radius in the chapter-10 implementation?",
              options: [
                "A Postmark error midway through the subscriber list",
                "Malformed form data, rejected by the `web::Form` extractor with a 400",
                "An application crash after the first send",
                "The author double-clicking Submit",
              ],
              answer: 1,
              explanation:
                "The extractor rejects bad input before the handler body runs, and unauthenticated users are redirected to login. Both leave the world untouched, which is exactly what makes them safe to retry without any new machinery.",
            },
            {
              kind: "mcq",
              prompt:
                'The author\'s policy is "resubmit the form until it returns a 303". Which delivery guarantee does the naive endpoint then provide?',
              options: [
                "At-most-once: some subscribers may never receive the issue",
                "At-least-once: every subscriber eventually receives it, some more than once",
                "Exactly-once: the flash message confirms single delivery",
                "None: repeated submissions are rejected",
              ],
              answer: 1,
              explanation:
                "Retrying until success eventually reaches the tail of the list, at the price of re-sending to everyone before each failure point. Exactly-once cannot come from blind retries; it requires deduplication, which is where idempotency enters.",
            },
          ],
        },
        {
          slug: "ft-idempotency-keys",
          title: "Idempotency: retries the caller cannot see",
          summary:
            "Retry-safety defined by observation, idempotency keys, and why the book saves responses instead of deriving keys.",
          contentFile: "ft-idempotency-keys.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why does the book implement stateful save-and-replay instead of stateless deterministic key generation?",
              options: [
                "Save-and-replay is the simpler of the two to implement",
                "Postmark exposes no idempotency mechanism, so deterministic keys would have nowhere to go",
                "Stateless designs cannot work over HTTPS",
                "Deterministic keys would leak subscriber ids to the provider",
              ],
              answer: 1,
              explanation:
                "The stateless scheme outsources deduplication to the downstream provider, which only works if that provider accepts idempotency keys. Postmark does not, so the application must remember outcomes itself; the book notes the stateful build is also the richer lesson.",
            },
            {
              kind: "predict",
              prompt:
                "A new subscriber confirms between an initial request and its retry. Under which strategy do they receive the issue?",
              options: [
                "Both: retries always see current state",
                "Neither: retries never re-read the subscriber list",
                "Stateless only: it re-runs the handler against the current subscriber list",
                "Stateful only: the stored response is regenerated to include them",
              ],
              answer: 2,
              explanation:
                "Save-and-replay short-circuits before any processing, so world-state at retry time is irrelevant. The stateless approach re-executes everything, letting elapsed time leak into the outcome, the discrepancy the book compares to a non-repeatable read.",
            },
            {
              kind: "mcq",
              prompt:
                "A retry of an already-completed request arrives with the same idempotency key. What does a correct save-and-replay implementation return?",
              options: [
                "409 Conflict, so the client knows it retried",
                "The stored response, semantically equivalent to the first success",
                "A fresh 303 after re-running the handler",
                "204 No Content, since the work already happened",
              ],
              answer: 1,
              explanation:
                "Idempotency is defined by unobservability: an error or a re-execution would each let the caller distinguish the retry from the first attempt. Only replaying an equivalent success keeps the two indistinguishable.",
            },
          ],
        },
      ],
    },
    {
      slug: "save-and-replay",
      title: "Save and replay",
      description: "Persist whole HTTP responses and make racing duplicates wait their turn.",
      lessons: [
        {
          slug: "ft-idempotency-store",
          title: "Storing an HTTP response in Postgres",
          summary:
            "A composite header_pair type, and the MessageBody detour that buffering a streamed body forces.",
          contentFile: "ft-idempotency-store.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why do the stored response headers need a Postgres composite type at all?",
              options: [
                "Header names exceed TEXT's maximum length",
                "Headers are repeated (name, value) pairs, and Postgres has arrays of composite types but no arrays of tuples",
                "Composite types compress better than JSONB",
                "sqlx refuses to map more than one column per struct field",
              ],
              answer: 1,
              explanation:
                "A composite type is a named collection of fields, the SQL equivalent of a struct, and `header_pair[]` gives the repetition. The value field is BYTEA rather than TEXT because HTTP header values may carry opaque octets.",
            },
            {
              kind: "predict",
              prompt:
                "`save_response` calls `to_bytes(http_response.body())`, where `.body()` returns `&BoxBody`. What does the compiler say?",
              options: [
                "It compiles; to_bytes clones each chunk as it arrives",
                "It fails: `&BoxBody` does not implement `MessageBody`, because draining a stream requires ownership",
                "It compiles but panics at runtime on streamed bodies",
                "It fails: `to_bytes` cannot be called from an async function",
              ],
              answer: 1,
              explanation:
                "Pulling a chunk mutates the stream and a pulled chunk cannot be replayed, so the trait is deliberately not implemented for shared references. The fix is the `.into_parts()` / `to_bytes` / `.set_body().map_into_boxed_body()` ceremony, which is why save_response takes the response by value.",
            },
            {
              kind: "mcq",
              prompt: "Which parts of the HTTP response does the idempotency table persist?",
              options: [
                "Status code, headers, and body; the version is assumed to be HTTP/1.1",
                "The raw bytes of the response exactly as sent on the wire",
                "Status and body only; headers are regenerated on replay",
                "Only the body; the status is always 303",
              ],
              answer: 0,
              explanation:
                "actix-web offers no serialization for HttpResponse, so the book decomposes it into smallint, header_pair[], and bytea columns and rebuilds with HttpResponse::build plus append_header. Skipping the version is safe because the app speaks HTTP/1.1 exclusively.",
            },
          ],
        },
        {
          slug: "ft-concurrent-duplicates",
          title: "Racing duplicates and row locks",
          summary:
            "INSERT ON CONFLICT inside a transaction makes the loser wait, then replay; isolation levels decide whether that works.",
          xp: 25,
          contentFile: "ft-concurrent-duplicates.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Final scheme, READ COMMITTED. Two identical POSTs arrive concurrently; the first takes three seconds to process, then commits. What does the second caller experience?",
              options: [
                "An immediate 409 Conflict",
                "An immediate 500: duplicate key violation",
                "Roughly three seconds of waiting, then the same status and body the first caller got, with one email sent in total",
                "An immediate identical 303, with the emails dispatched twice",
              ],
              answer: 2,
              explanation:
                "The second request's INSERT blocks on the row the first request's open transaction wrote. On commit it resolves to DO NOTHING, zero rows affected, and the handler fetches and replays the now-committed saved response.",
            },
            {
              kind: "mcq",
              prompt:
                "Why can't a `tokio::sync::Mutex` around the handler provide the deduplication?",
              options: [
                "Its guard cannot be held across an .await point",
                "The API runs as multiple replicated instances, and an in-memory lock only synchronizes one process",
                "actix-web handlers cannot share state across requests",
                "Locking in async code always deadlocks the runtime",
              ],
              answer: 1,
              explanation:
                "The two duplicates may be served by different machines behind the load balancer, so the synchronization must live out of process. The database is the one piece of shared state every instance already agrees on, which is why the row itself becomes the lock.",
            },
            {
              kind: "mcq",
              prompt:
                "What changed when the book set the experiment's transaction to REPEATABLE READ?",
              options: [
                "Nothing; the isolation levels behave identically for INSERTs",
                'The second request errored with "could not serialize access due to concurrent update" instead of waiting and replaying',
                "The second request saw the first request's uncommitted row",
                "Both requests processed the newsletter concurrently",
              ],
              answer: 1,
              explanation:
                "Under snapshot isolation a transaction may not modify or lock rows changed by transactions that committed after its snapshot began, so the blocked INSERT aborts rather than proceeding. The wait-then-replay design is correct at READ COMMITTED specifically, which is why the level is a verified design input.",
            },
          ],
        },
      ],
    },
    {
      slug: "forward-recovery",
      title: "Forward recovery",
      description: "Move delivery into a durable Postgres queue worked by background tasks.",
      lessons: [
        {
          slug: "ft-delivery-queue",
          title: "A task queue in plain Postgres",
          summary:
            "issue_delivery_queue, FOR UPDATE SKIP LOCKED, a blunt worker loop, and tokio::select in main.",
          xp: 25,
          contentFile: "ft-delivery-queue.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is backward recovery rejected for newsletter delivery?",
              options: [
                "Compensating actions require two-phase commit",
                "There is no compensating action for a sent email; it cannot be unsent",
                "Postgres cannot roll back committed DELETEs",
                "It would require storing the issue content twice",
              ],
              answer: 1,
              explanation:
                "Backward recovery works when an inverse operation exists, like refunding a charge. Email has no inverse, so the only sensible direction is forward: drive the workflow to completion, which the book does actively with background workers.",
            },
            {
              kind: "predict",
              prompt:
                "The publish transaction commits, then the whole process crashes before any worker dequeues a task. What happens to the issue?",
              options: [
                "It is lost: the pending tasks lived in process memory",
                "It is delivered after restart: the tasks are durable rows, and a fresh worker drains them",
                "The author must resubmit the form to regenerate the tasks",
                "Postgres re-runs the request handler automatically",
              ],
              answer: 1,
              explanation:
                "The commit made the issue and its full task list durable, so a crash only delays delivery. Contrast with the naive loop, where the in-flight subscriber list died with the process and took the undelivered tail with it.",
            },
            {
              kind: "mcq",
              prompt:
                "After the redesign, what does a success response from POST /admin/newsletters promise?",
              options: [
                "All confirmed subscribers have already received the issue",
                "The issue is validated and stored, and delivery will happen asynchronously",
                "At least one email has already been sent",
                "The delivery workers are currently idle",
              ],
              answer: 1,
              explanation:
                "The endpoint's contract was deliberately narrowed so the handler could become fast and fully transactional. Delivery confidence now rests on the queue's guarantees rather than on work performed inside the request.",
            },
          ],
        },
        {
          slug: "ft-what-remains",
          title: "What this design still owes",
          summary:
            "Retries with backoff, key expiry, queue observability, and where Part 4 takes the pattern.",
          contentFile: "ft-what-remains.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "In the shipped worker code, a task's send fails with a Postmark 500. What happens to its row in issue_delivery_queue?",
              options: [
                "It stays put, and another worker retries it later",
                "It is updated with an incremented retry counter",
                "It is deleted anyway; the failure is logged and the subscriber skipped",
                "The transaction aborts and the worker process exits",
              ],
              answer: 2,
              explanation:
                "try_execute_task logs the failure and falls through to delete_task regardless, so one transient error costs that subscriber the issue. Rescheduling via n_retries and execute_after is the book's suggested exercise, not shipped behavior.",
            },
            {
              kind: "mcq",
              prompt:
                "Which pair of columns does the book suggest adding to make delivery retry-capable?",
              options: [
                "n_retries and execute_after",
                "attempts and locked_by",
                "status and updated_at",
                "priority and expires_at",
              ],
              answer: 0,
              explanation:
                "Failures get rescheduled instead of deleted: n_retries caps the attempts and execute_after spaces them out, ideally with exponential backoff plus jitter. A footnote adds that transient and fatal errors deserve different treatment, since sleeping never fixes an invalid address.",
            },
            {
              kind: "mcq",
              prompt: "What stops the idempotency table from being production-ready as shipped?",
              options: [
                "It cannot store response bodies over one megabyte",
                "Keys never expire: the table grows without bound, and a reused key replays a stale response",
                "It only works at the SERIALIZABLE isolation level",
                "It stores headers as TEXT, corrupting binary values",
              ],
              answer: 1,
              explanation:
                "The chapter's closing box admits exactly this hole; created_at exists so a sweeper can evict old rows. The fix is another background worker loop, the chapter's own pattern applied to its own leftovers.",
            },
          ],
        },
      ],
    },
  ],
}
