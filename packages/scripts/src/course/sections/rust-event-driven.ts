import type { SectionSeed } from "../types"

export const rustEventDriven: SectionSeed = {
  slug: "rust-event-driven",
  title: "Rust with event-driven architecture",
  description:
    "Outbox, idempotent consumers, webhooks; apalis and Restate natively, Temporal for contrast; build a small durable workflow engine.",
  badgeIcon: "⚡",
  badgeTitle: "Events × Rust",
  units: [
    {
      slug: "facts-and-the-outbox",
      title: "Facts on the wire",
      description:
        "Events versus commands, who owns a flow, and getting facts out of Postgres without lying.",
      lessons: [
        {
          slug: "evt-events-vs-commands",
          title: "Events versus commands, and who owns the flow",
          summary:
            "Commands expect answers, events state facts; choreography and orchestration trade coupling for visibility.",
          contentFile: "evt-events-vs-commands.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Billing is down for an hour. In the command version, where the handler awaits `billing.start_trial`, what does a subscriber clicking the confirmation link experience?",
              options: [
                "Confirmation succeeds; the trial silently never starts",
                "Confirmation fails, because the handler's success now includes billing's availability",
                "Confirmation succeeds after the broker buffers the call",
                "Nothing changes; awaited commands are retried by the runtime",
              ],
              answer: 1,
              explanation:
                "Awaiting a command splices the callee's availability into the caller's success. A published fact would let confirmation commit and return while billing catches up whenever it recovers.",
            },
            {
              kind: "predict",
              prompt:
                "A fifth team wants to react to signups. In the event version, what changes in the confirm handler?",
              options: [
                "A new publish call for the new consumer",
                "A new entry in the handler's consumer list",
                "Nothing",
                "A new feature flag guarding the extra call",
              ],
              answer: 2,
              explanation:
                'The producer\'s job ends at "the fact is out"; consumers attach at the broker. Audience growth being invisible to the producer is exactly the coupling reversal that defines an event.',
            },
            {
              kind: "mcq",
              prompt:
                "The signup flow gains a rule: if the welcome email hard-fails, the trial must be cancelled. Which style handles this most directly, and why?",
              options: [
                "Choreography, because the email service can emit a WelcomeFailed event",
                "Orchestration, because compensation needs one place that knows which steps completed and can issue the undo",
                "Either, because the broker guarantees ordering",
                "Neither; compensation requires a distributed transaction",
              ],
              answer: 1,
              explanation:
                "A compensation needs flow-level memory: which steps ran and what undoes each. An orchestrator holds that state by construction; in choreography the undo pairs scatter across services that each see one edge of the flow.",
            },
          ],
        },
        {
          slug: "evt-outbox-pattern",
          title: "The outbox pattern: publish what you committed",
          summary:
            "The dual-write problem, and chapter 11's transactional enqueue generalized into an event pipeline.",
          contentFile: "evt-outbox-pattern.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A team publishes before committing: `publisher.publish(...)` succeeds, then `tx.commit()` fails. What have consumers learned?",
              options: [
                "Nothing; the broker discards messages from uncommitted transactions",
                "A fact about a confirmation that never happened",
                "The event, delayed until the transaction is retried",
                "A duplicate of the previous event",
              ],
              answer: 1,
              explanation:
                "The broker neither knows nor cares about your transaction; the message is out the moment publish returns. Consumers now hold a ghost event, the mirror twin of the lost event in the commit-then-publish order.",
            },
            {
              kind: "mcq",
              prompt: "What single property makes the outbox insert trustworthy?",
              options: [
                "The outbox table is unlogged, so writes are fast",
                "jsonb payloads are validated against a schema",
                "It commits or rolls back atomically with the business row, so the fact exists exactly when the state change does",
                "FOR UPDATE SKIP LOCKED prevents concurrent inserts",
              ],
              answer: 2,
              explanation:
                "Atomicity is the entire mechanism: fact and state change are one commit, so neither a lost event nor a ghost event is expressible. Everything else in the pattern is plumbing around that.",
            },
            {
              kind: "mcq",
              prompt: "Why does the outbox pipeline end up at-least-once rather than exactly-once?",
              options: [
                "Because RabbitMQ cannot deduplicate messages",
                "Because the relay can crash between the broker's ack and marking the row published, and the safe recovery is to send again",
                "Because Postgres transactions can be replayed after a crash",
                "Because NOTIFY can fire twice for one insert",
              ],
              answer: 1,
              explanation:
                "After a crash the relay cannot know whether the ack landed, so it must choose between risking loss and risking duplication. Every serious pipeline chooses duplication and pushes dedup to consumers, the queues section's exactly-once lie again.",
            },
          ],
        },
      ],
    },
    {
      slug: "webhooks-and-jobs",
      title: "Webhooks and background jobs",
      description:
        "Signed events across the public internet, and apalis in place of the hand-rolled worker.",
      lessons: [
        {
          slug: "evt-webhooks",
          title: "Webhooks done right",
          summary:
            "HMAC signing and verification, retries with backoff, and receiver-side dedup with idempotency keys.",
          contentFile: "evt-webhooks.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why must the receiver compare signatures with `mac.verify_slice` instead of `==`?",
              options: [
                "A byte-by-byte `==` returns at the first mismatch, and response timing then leaks how much of a forged signature is correct",
                "`==` allocates a new buffer for the comparison",
                "verify_slice also validates the timestamp header",
                "Constant-time comparison is faster on modern CPUs",
              ],
              answer: 0,
              explanation:
                "Short-circuiting equality fails faster the earlier the first wrong byte is, so an attacker measuring latency can grow a forgery byte by byte. `verify_slice` compares in constant time via the subtle crate, the same reasoning chapter 10 applied to authentication timing.",
            },
            {
              kind: "predict",
              prompt:
                "A receiver verifies signatures but keeps no dedup table, and its handler charges a customer. The sender times out once (the receiver was slow but did the work) and retries. What happens?",
              options: [
                "Nothing; the HMAC signature prevents duplicate deliveries",
                "The customer is charged twice",
                "The retry fails verification because its timestamp changed",
                "The sender's broker deduplicates before resending",
              ],
              answer: 1,
              explanation:
                "A timeout is indistinguishable from failure, so the sender must retry, and the signature authenticates both deliveries because both are genuine. Only an idempotency key on `webhook-id` makes the second one a no-op.",
            },
            {
              kind: "mcq",
              prompt:
                "What attack does binding a timestamp into the signed payload, plus a tolerance window, actually block?",
              options: [
                "Forged payloads signed with a guessed secret",
                "Duplicate deliveries caused by sender retries",
                "Replaying a captured, correctly signed delivery long after it was sent",
                "Clock skew between sender and receiver",
              ],
              answer: 2,
              explanation:
                "The signature proves who sent it; it cannot alone prove when. Binding the timestamp and rejecting stale ones turns a captured delivery into a brick once the window closes; retries within the window are dedup's job, not the clock's.",
            },
          ],
        },
        {
          slug: "evt-apalis-jobs",
          title: "apalis: background jobs as a library",
          summary:
            "Serde jobs, extractor-style workers, Postgres and Redis backends, cron, and the transactional gap push reopens.",
          contentFile: "evt-apalis-jobs.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Which property of the chapter 11 hand-built queue does `storage.push` NOT give you by default?",
              options: [
                "Retries governed by a configurable policy",
                "Claiming, so two workers never run the same job",
                "Enqueueing the job in the same database transaction as the business write",
                "Running jobs on a cron schedule",
              ],
              answer: 2,
              explanation:
                "apalis replaces the loop, the claim, the retries, and the schedule, but push is its own call on its own connection. The one thing the hand-rolled insert got for free, job and business row in one commit, has to be re-earned with an outbox row.",
            },
            {
              kind: "predict",
              prompt:
                "A worker is built with `.retry(RetryPolicy::retries(5))` and its handler returns `Err` every time. What happens to the job?",
              options: [
                "It is dropped after the first failure",
                "It is re-attempted per the policy, then recorded as failed once attempts are exhausted",
                "It is retried forever at a fixed interval",
                "The monitor restarts the whole worker process",
              ],
              answer: 1,
              explanation:
                "The handler's `Err` is the signal the retry layer acts on: re-attempt within the policy, then park the job as failed for inspection instead of looping forever. That is the error policy chapter 11 left as an exercise, productized.",
            },
            {
              kind: "mcq",
              prompt: "Why must apalis job handlers be idempotent?",
              options: [
                "A worker can crash after doing the work but before acknowledging it, so the backend must eventually hand the job to another worker",
                "apalis batches jobs, so one handler call may receive several jobs",
                "Redis loses acknowledged jobs on failover",
                "Cron ticks can overlap when a run takes longer than the interval",
              ],
              answer: 0,
              explanation:
                "The backend cannot know how far a dead worker got, so redelivery is the only safe recovery: at-least-once execution, exactly like chapter 11's worker and the queues section's consumers. Idempotent handlers make redelivery harmless.",
            },
          ],
        },
      ],
    },
    {
      slug: "durable-execution",
      title: "Durable execution",
      description:
        "Journaled steps and durable sleeps: Restate natively, then the trick built by hand.",
      lessons: [
        {
          slug: "evt-restate-durable",
          title: "Restate: durable execution, journaled in Rust",
          summary:
            "Journaled steps, durable sleeps, and replay after a crash, in a young but native Rust SDK.",
          contentFile: "evt-restate-durable.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A handler computes `let id = Uuid::new_v4();` outside any `ctx.run`, uses it in two journaled steps, and crashes between them. What does replay produce?",
              options: [
                "Nothing unusual; the journal records all local variables",
                "A determinism panic on the first execution",
                "A fresh uuid, so the step completed before the crash recorded a different id than the code now holds",
                "ctx.sleep resets and the run starts over cleanly",
              ],
              answer: 2,
              explanation:
                "Only what flows through the journal is pinned; plain code re-executes on every replay and must be deterministic. This is why the SDK routes ids, time, and randomness through journaled steps and deterministic helpers.",
            },
            {
              kind: "mcq",
              prompt: "What does `ctx.sleep(Duration::from_secs(3 * 86_400))` cost your service?",
              options: [
                "A parked tokio task holding memory for three days",
                "Nothing running: a durable timer in the Restate server suspends the invocation and re-drives it when the timer fires",
                "A cron entry written to the host system",
                "A polling loop inside the SDK checking the deadline",
              ],
              answer: 1,
              explanation:
                "The sleep is a timer record in the server, and resumption is just replay. That is why a multi-day pause holds no task, no connection, and survives any number of redeploys in between.",
            },
            {
              kind: "mcq",
              prompt: "What guarantee does a single `ctx.run` step actually have?",
              options: [
                "Exactly-once execution of the closure",
                "At-most-once: a step interrupted by a crash is skipped on replay",
                "The closure executes inside the Restate server, not your process",
                "At-least-once: a crash between the side effect and the journal ack re-runs that step, so steps should be idempotent",
              ],
              answer: 3,
              explanation:
                "The journal records a step only after its closure finishes, so a crash in the gap re-runs it. Durable execution shrinks the idempotency problem to one step at a time; it does not abolish it.",
            },
          ],
        },
        {
          slug: "evt-workflow-engine",
          title: "Capstone: a hundred-line durable workflow engine",
          summary:
            "Extend chapter 11's queue with named steps, recorded results, sleeps, and crash replay; Temporal for scale.",
          xp: 25,
          contentFile: "evt-workflow-engine.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "While a run sleeps after `send-welcome`, you deploy code that renames the next step from `send-tips` to `send-tips-v2`. The run wakes. What happens?",
              options: [
                "The run resumes exactly where it slept; step names are cosmetic",
                "send-welcome re-executes too, since the journal is invalidated",
                "The lookup for the renamed step misses, so the step executes as if new, re-sending the email unless it is idempotent",
                "The engine raises a nondeterminism error and halts the run",
              ],
              answer: 2,
              explanation:
                "A name-keyed journal treats a rename as a brand-new step. Position-keyed engines like Temporal detect the mismatch and refuse instead; either way, changing workflow code under in-flight runs needs a versioning story.",
            },
            {
              kind: "mcq",
              prompt:
                "How does the toy engine resume a woken run at the right place with no saved instruction pointer?",
              options: [
                "The worker stores the index of the last completed step and jumps to it",
                "The function re-executes from the top, and each ctx.step first checks (run_id, step); a hit returns the recorded result without running the closure",
                "tokio snapshots and restores the task's stack",
                "Postgres replays the WAL into the worker process",
              ],
              answer: 1,
              explanation:
                "Replay-by-re-execution is the shared trick of Restate, Temporal, and Inngest: recorded results turn completed side-effecting steps into instant lookups, which is also why every side effect must go through the context.",
            },
            {
              kind: "mcq",
              prompt: "What separates Temporal from the capstone engine?",
              options: [
                "Nothing fundamental at the core; it adds event-sourced histories, nondeterminism detection, versioning, signals, and clustered operation",
                "Exactly-once side effects, which the toy cannot achieve",
                "Temporal avoids replay entirely by checkpointing memory",
                "An official stable Rust SDK for authoring workflows",
              ],
              answer: 0,
              explanation:
                "The journal-and-replay core is identical; the additions are operability at scale. No engine achieves exactly-once side effects, only exactly-once recording of at-least-once attempts, and as of 2026 Temporal's Rust authoring SDK is experimental, not stable.",
            },
          ],
        },
      ],
    },
  ],
}
