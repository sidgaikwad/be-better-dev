import type { SectionSeed } from "../types"

// Part 3, section: Confirmation emails. Walks Zero to Production chapter 7:
// the double opt-in flow, EmailClient on reqwest, wiremock as a stand-in
// Postmark, zero-downtime deployments, migrations under that constraint, and
// sqlx transactions. The 7.3 test-suite refactor is covered by Part 1's
// testing section and only referenced here.

export const z2pConfirmationEmails: SectionSeed = {
  slug: "z2p-confirmation-emails",
  title: "Confirmation emails (ch. 7)",
  description: "reqwest, wiremock, test-suite architecture, zero-downtime migrations.",
  badgeIcon: "✉️",
  badgeTitle: "Confirmed",
  units: [
    {
      slug: "confirmation-flow",
      title: "The confirmation flow",
      description: "Consent as a feature: map the journey, build the client, prove it sends.",
      lessons: [
        {
          slug: "conf-double-opt-in",
          title: "Double opt-in: consent as a feature",
          summary:
            "Why POST /subscriptions is not consent, and mapping the whole journey before code.",
          contentFile: "conf-double-opt-in.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "The payload of `POST /subscriptions` contains a syntactically valid email. What does that prove about consent?",
              options: [
                "Consent is implied by submitting the form",
                "Nothing: anyone can submit anyone else's address, which is the abuse double opt-in exists to stop",
                "Consent can be inferred when the domain has valid MX records",
                "Consent only matters for corporate addresses",
              ],
              answer: 1,
              explanation:
                "An address is not a secret, so possessing one proves nothing. The confirmation click is the consent record, and for EU citizens collecting explicit consent is a legal requirement, not a courtesy.",
            },
            {
              kind: "predict",
              prompt:
                "A malicious user submits a victim's address to the finished flow. What ends up in the victim's inbox?",
              options: [
                "Every future newsletter issue",
                "Nothing; the address is rejected outright",
                "One confirmation email, and nothing further unless the victim clicks the link",
                "A confirmation email plus issues until they unsubscribe",
              ],
              answer: 2,
              explanation:
                "The row parks at pending_confirmation and issues go only to confirmed subscribers. The attacker achieves at most one unwanted email, which is exactly the threat model the token's security is sized against.",
            },
            {
              kind: "mcq",
              prompt:
                "Why is a 25-character random alphanumeric string an acceptable subscription token, with no password-style hashing ceremony?",
              options: [
                "HTTPS encrypts the link, so token strength is irrelevant",
                "It is single-use, guards no protected data, and only needs to be unguessable: a CSPRNG string with about 10^45 possibilities clears that bar",
                "Postgres cannot index longer values efficiently",
                "Hashing would break the foreign key to subscriptions",
              ],
              answer: 1,
              explanation:
                "Threat modeling sizes the mechanism: the worst case of a guessed token is an unwanted subscription, not an account takeover. Unguessable is the entire requirement, hence a CSPRNG rather than a clock-seeded generator.",
            },
          ],
        },
        {
          slug: "conf-email-client",
          title: "EmailClient: one reqwest::Client for the app",
          summary:
            "Connection pooling, app-state sharing, secret headers, and a timeout on every outbound call.",
          contentFile: "conf-email-client.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does `Client::clone` on a `reqwest::Client` actually copy?",
              options: [
                "The whole connection pool, doubling open sockets",
                "Nothing; Client does not implement Clone",
                "A pointer to the shared pool, like cloning an Arc",
                "Only idle connections; active ones stay with the original",
              ],
              answer: 2,
              explanation:
                "Client wraps its pool in shared ownership, so clones are pointer copies and every clone reuses the same warm connections. That is what makes handing clones to app state and handlers essentially free.",
            },
            {
              kind: "predict",
              prompt:
                "A `Client::new()` client calls an API that accepts the TCP connection but never sends a response. When does `send` return?",
              options: [
                "After reqwest's default 30-second timeout",
                "Never; reqwest sets no request timeout by default",
                "When the OS TCP keepalive gives up, with Ok",
                "Immediately, with Err",
              ],
              answer: 1,
              explanation:
                "There is no default timeout, which is why the chapter's rule is that every IO operation gets one. EmailClient bakes a Client-wide timeout into its constructor and reads the value from configuration.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does the book wrap `EmailClient` in `web::Data` instead of deriving `Clone` and giving each `App` its own copy?",
              options: [
                "web::Data is mandatory for anything a handler extracts",
                "EmailClient owns base_url and sender strings, and Data (an Arc) shares one allocation across all worker Apps instead of duplicating them per thread",
                "Structs containing a Client cannot derive Clone",
                "Data provides interior mutability across threads",
              ],
              answer: 1,
              explanation:
                "Both options work; the trade-off is per-worker copies of the data fields versus one shared allocation. actix-web builds an App per worker thread, so per-App costs are paid once per core, and the book walks the decision as practice in making the call yourself.",
            },
          ],
        },
        {
          slug: "conf-wiremock",
          title: "wiremock: a stand-in Postmark",
          summary:
            "Matchers, expectations as contract assertions, and reading the confirmation link out of a request body.",
          contentFile: "conf-wiremock.md",
          xp: 25,
          quiz: [
            {
              kind: "mcq",
              prompt:
                "What made it possible to point `EmailClient` at wiremock's server without changing any client code?",
              options: [
                "wiremock patches reqwest's DNS resolution during tests",
                "base_url was constructor-injected configuration from the start, so the test passes mock_server.uri() instead of Postmark's URL",
                "reqwest detects cfg(test) and redirects to localhost",
                "MockServer registers itself as a system-wide HTTP proxy",
              ],
              answer: 1,
              explanation:
                "Nothing magical: the seam was designed in. Injecting the base URL is what turns 'talks to the internet' into 'talks to whatever the test hands it', and it is why the mock server slots in with one argument.",
            },
            {
              kind: "predict",
              prompt:
                "A mock responds with `ResponseTemplate::new(500)`. `send_email` calls `.send().await?` with no `error_for_status`, and the test asserts the outcome is an Err. What happens?",
              options: [
                "The test passes; 500 is an error status",
                "The test fails: send returns Ok because a response was delivered, and only transport failures are Err",
                "reqwest panics on 5xx responses",
                "The test hangs until the client timeout",
              ],
              answer: 1,
              explanation:
                "reqwest separates transport from semantics: a delivered 500 is a successful exchange at the protocol level. error_for_status is the explicit opt-in that maps 4xx and 5xx onto Err, and this red test is what forces you to find it.",
            },
            {
              kind: "mcq",
              prompt:
                "A request reaches the MockServer but matches none of the mounted mocks. What does the server do?",
              options: [
                "Returns 404, its default for unmatched requests",
                "Panics on the spot",
                "Forwards the request to the real base URL",
                "Returns 200 with an empty body",
              ],
              answer: 0,
              explanation:
                "Unmatched requests get a 404 now and count toward no mock, so an .expect(1) fails verification later, when the server drops. That two-phase behavior is exactly how the PascalCase serialization bug surfaced.",
            },
          ],
        },
      ],
    },
    {
      slug: "shipping-without-stopping",
      title: "Shipping without stopping",
      description: "Rolling updates, and the schema changes that survive them.",
      lessons: [
        {
          slug: "conf-zero-downtime",
          title: "Zero-downtime deployments",
          summary:
            "Load balancers, health checks, rolling updates, and why N and N+1 always run together.",
          contentFile: "conf-zero-downtime.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "An SLA promises 99.99% availability. Roughly how much total downtime does that allow per year?",
              options: ["About 9 hours", "About 52 minutes", "About 5 minutes", "About 4 days"],
              answer: 1,
              explanation:
                "Four nines is about 52 minutes a year; 99.9% would be closer to 9 hours and 99.999% to 5 minutes. Every naive deploy spends irreplaceable minutes of that budget, which is what makes zero-downtime rollouts mandatory.",
            },
            {
              kind: "mcq",
              prompt:
                "Mid-rollout the load balancer has three registered replicas of version A and one of version B. Who is serving production traffic?",
              options: [
                "Only the A replicas, until B is manually promoted",
                "Only B; A replicas drain instantly",
                "All four; live requests land on old and new versions side by side",
                "None; the balancer buffers requests during rollouts",
              ],
              answer: 2,
              explanation:
                "Running both versions on real traffic is the mechanism of a rolling update, not a glitch. It is why the migrations lesson insists every schema change stay legible to N and N+1 at the same time.",
            },
            {
              kind: "mcq",
              prompt:
                "With active health checking, what must happen before a new replica receives its first user request?",
              options: [
                "It must answer scheduled health-check requests successfully, and only then is it registered as a backend",
                "Its logs must stay clean for five minutes",
                "An operator must approve the promotion",
                "The old replicas must be shut down first",
              ],
              answer: 0,
              explanation:
                "Health checks gate traffic: a backend serves only after the platform has verified it responds. The humble /health_check endpoint exists for this machine-to-machine conversation, and the same signal drives self-healing eviction.",
            },
          ],
        },
        {
          slug: "conf-migrations",
          title: "Migrations while the app is running",
          summary: "The three-step dance for a mandatory column, and the one-step for a new table.",
          contentFile: "conf-migrations.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "You add `status` as NOT NULL in one migration, run it, and then start the rolling deploy of the code that writes it. What do users see mid-rollout?",
              options: [
                "Nothing unusual; the balancer routes around the problem",
                "Signups fail on every old-version replica: its INSERT omits status, which now violates NOT NULL",
                "Signups fail only on the new version",
                "Postgres queues the inserts until the deploy finishes",
              ],
              answer: 1,
              explanation:
                "Version N still serves traffic during the rollout and knows nothing about the column, so the constraint rejects its inserts for the whole window. That outage window is precisely what add-nullable, deploy, backfill-and-tighten removes.",
            },
            {
              kind: "mcq",
              prompt: "Why does the new `subscription_tokens` table skip the three-step dance?",
              options: [
                "CREATE TABLE is instantaneous in Postgres",
                "Its foreign key makes it safe by construction",
                "It is purely additive: every running version ignores it until the code that uses it deploys later",
                "New tables are invisible until the next deploy",
              ],
              answer: 2,
              explanation:
                "The rule is compatibility, not size: adding something nobody reads cannot break N or N+1. Only tightening what running code relies on, a NOT NULL, a drop, a rename, demands the choreography.",
            },
            {
              kind: "mcq",
              prompt:
                "The step-3 migration wraps the backfill UPDATE and `ALTER COLUMN status SET NOT NULL` in BEGIN/COMMIT. What does that buy?",
              options: [
                "A single network round trip, so it runs faster",
                "Atomicity: both statements apply or neither does, so a failure cannot leave the migration half-applied; sqlx adds no transaction for you",
                "It hides the table from readers while migrating",
                "BEGIN is required syntax before any ALTER TABLE",
              ],
              answer: 1,
              explanation:
                "If the ALTER failed after an unwrapped backfill had committed, the migration would be half-done and its recorded state ambiguous. The transaction makes the pair all-or-nothing, the same tool the next lesson turns on application writes.",
            },
          ],
        },
      ],
    },
    {
      slug: "all-or-nothing",
      title: "All or nothing",
      description: "Transactions make the subscriber-plus-token write a single unit of work.",
      lessons: [
        {
          slug: "conf-transactions",
          title: "Transactions: all or nothing",
          summary:
            "sqlx Transaction, the poisonous half-written state, and rollback queued in Drop.",
          contentFile: "conf-transactions.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Without a transaction, how many distinct end states can the database be in after one `POST /subscriptions` (two inserts)? And with one?",
              options: [
                "Two without, one with",
                "Three without (both rows, subscriber only, nothing); two with (everything or nothing)",
                "Four without, two with",
                "Three either way; transactions only change performance",
              ],
              answer: 1,
              explanation:
                "The transaction deletes the poisonous middle state: a subscriber with no token, unreachable by any confirmation link and unrepairable by normal flows. 'Nothing happened' is recoverable with a retry; 'half happened' is not.",
            },
            {
              kind: "mcq",
              prompt:
                "`insert_subscriber` used to take `&PgPool` and now takes `&mut Transaction<'_, Postgres>`. Why does query execution still work?",
              options: [
                "Transaction derefs to PgPool",
                "sqlx macros accept any argument type at compile time",
                "Both satisfy sqlx's Executor abstraction; queries run through the transaction ride its one checked-out connection, which is what joins them to the transaction",
                "The function silently opens a second connection",
              ],
              answer: 2,
              explanation:
                "Executor is the seam: a pool executes on any free connection, a transaction on the connection BEGIN was issued on. In the book's sqlx 0.6 the impl sits on &mut Transaction; since 0.7 you pass the dereferenced connection, &mut *transaction.",
            },
            {
              kind: "mcq",
              prompt:
                "A sqlx `Transaction` goes out of scope with neither `commit` nor `rollback` called. What happens?",
              options: [
                "The transaction stays open until the server times it out",
                "Drop queues a rollback that executes on the connection's next use or return to the pool, because Rust destructors cannot await",
                "Drop blocks the thread and rolls back synchronously",
                "The changes commit, since every statement already succeeded",
              ],
              answer: 1,
              explanation:
                "Rust has no async Drop, so sqlx cannot await a ROLLBACK inside the destructor; it marks the connection and defers the work. That is why a missing commit shows up as silently vanished writes, the failing-test surprise in the chapter.",
            },
          ],
        },
      ],
    },
  ],
}
