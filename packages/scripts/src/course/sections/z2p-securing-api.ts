import type { SectionSeed } from "../types"

export const z2pSecuringApi: SectionSeed = {
  slug: "z2p-securing-api",
  title: "Securing the API (ch. 10)",
  description: "argon2, cookies for real, sessions with Redis, middleware.",
  badgeIcon: "🔐",
  badgeTitle: "Secured",
  units: [
    {
      slug: "proving-identity",
      title: "Proving identity",
      description: "The auth options weighed honestly; password storage rebuilt rung by rung.",
      lessons: [
        {
          slug: "sec-auth-options",
          title: "Who is calling? Know, have, are",
          summary: "Three factor families, why the book picks passwords, and Basic auth's limits.",
          contentFile: "sec-auth-options.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Each authentication family (know, have, are) has real weaknesses. Why does the chapter still commit to passwords?",
              options: [
                "Passwords are the strongest of the three factor families",
                "The admins are people in browsers, and the password-plus-session machinery (hashing, storage, cookies) transfers to every other scheme",
                "Multi-factor authentication cannot be implemented in Rust",
                "OAuth2 would require a paid third-party provider",
              ],
              answer: 1,
              explanation:
                "The interaction type drives the choice: a person in a browser calls for a password-plus-session flow. The weaknesses are real and acknowledged, which is why the chapter builds storage and verification with so much care.",
            },
            {
              kind: "predict",
              prompt:
                "Basic auth sends `Authorization: Basic <base64 of username:password>` over plain HTTP (no TLS). An attacker reading traffic on the path learns what?",
              options: [
                "Nothing: base64 hides the credentials",
                "Only the username",
                "Both username and password: base64 decodes without any secret",
                "Only the realm name",
              ],
              answer: 2,
              explanation:
                "Base64 is an encoding, not encryption: it exists so the header is clean ASCII, and decoding needs no key. TLS is the only thing keeping Basic credentials confidential, which is why the scheme is tolerable solely over HTTPS.",
            },
            {
              kind: "mcq",
              prompt:
                'The 401 test still failed with `no entry found for key "WWW-Authenticate"` even after status_code returned 401. What fixed it?',
              options: [
                "Returning 403 instead of 401",
                "A bespoke ResponseError::error_response that builds the response with the challenge header attached",
                "Registering a global middleware to inject the header",
                "Base64-encoding the realm value",
              ],
              answer: 1,
              explanation:
                "status_code can only pick a number; the challenge is a header, so the error type must assemble its own response. The default error_response is what calls status_code, so overriding the former makes the latter redundant.",
            },
          ],
        },
        {
          slug: "sec-password-storage",
          title: "Password storage: the failure ladder",
          summary: "Cleartext to fast hashes to salted argon2id, PHC strings, and the timing leak.",
          contentFile: "sec-password-storage.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Two users both pick the password `hunter2`. With per-user salting in place, what do the stored values look like?",
              options: [
                "Identical hashes, since the input password is identical",
                "Unrelated hashes, because each user's random salt is mixed in before hashing",
                "Identical hashes stored next to different salt columns",
                "The second signup fails a uniqueness constraint on the hash",
              ],
              answer: 1,
              explanation:
                "Salt plus password is the real hash input, and the avalanche effect makes the outputs unrelated. That is exactly what kills precomputed tables: nothing hashed before the breach matches any particular user.",
            },
            {
              kind: "mcq",
              prompt: "What does the PHC string format store, and what does that buy?",
              options: [
                "Only the hash bytes, to keep the column small",
                "Algorithm, version, load parameters, and salt next to the hash, so verification replays the exact configuration and old hashes survive parameter migrations",
                "The password, encrypted with a server-side pepper",
                "A checksum that protects the users table from corruption",
              ],
              answer: 1,
              explanation:
                "Hardware improves and costs get raised, so parameters must travel with each hash: old users keep verifying under their original settings and can be transparently rehashed at next login. Ad hoc parameter columns collapse the first time the algorithm changes.",
            },
            {
              kind: "mcq",
              prompt:
                "Failed logins took ~1ms for unknown usernames and ~10ms for wrong passwords. How does the chapter close this user-enumeration leak?",
              options: [
                "Sleep 9ms whenever the username is unknown",
                "Cache argon2 verdicts per username",
                "Always verify against a fallback PHC hash so both paths do the same work, returning a user id only for genuine matches",
                "Return 404 instead of 401 for unknown users",
              ],
              answer: 2,
              explanation:
                "The principle is same-work-on-both-paths: a compensating sleep drifts the moment load parameters or hardware change. Rate limiting failed attempts is the complementary defense, but it needs state the app does not have yet.",
            },
          ],
        },
      ],
    },
    {
      slug: "the-login-flow",
      title: "The login flow",
      description: "argon2 moved off the executor; the failure message that teaches cookies.",
      lessons: [
        {
          slug: "sec-spawn-blocking",
          title: "Do not block the executor (argon2 edition)",
          summary:
            "spawn_blocking for CPU-bound verification, and the tracing span that crosses threads.",
          contentFile: "sec-spawn-blocking.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Argon2 verification (~10ms of pure CPU) runs inline in the async login handler. During a burst of logins, what happens to unrelated in-flight requests?",
              options: [
                "Nothing: tokio preempts tasks that run too long",
                "They stall: a task inside poll cannot be preempted, so every worker grinding a hash delivers nothing else until it finishes",
                "They fail fast with 503 responses",
                "tokio grows the async worker pool until latency recovers",
              ],
              answer: 1,
              explanation:
                "Scheduling is cooperative, the contract from Part 2's tokio section: tasks hand control back only at .await, and argon2 has no await inside. Ten milliseconds is 100x the 10-to-100-microsecond poll guideline.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does spawn_blocking reject a closure that borrows expected_password_hash from the handler?",
              options: [
                "Closures cannot capture Secret values",
                "The pool thread may outlive the async task, so the closure must be 'static: no borrows of the caller's stack, and PasswordHash<'a> is itself a borrow of the PHC string",
                "spawn_blocking requires all captures to be Copy",
                "The borrow checker cannot reason across crate boundaries",
              ],
              answer: 1,
              explanation:
                "It is the same rule as thread::spawn back in the threads section, because under the sugar this is a thread handoff: move the owned Secret<String> values in and parse the PHC string on the worker side.",
            },
            {
              kind: "mcq",
              prompt:
                "With plain spawn_blocking, the 'verify password hash' span appeared in logs without request_id or http.route. Why?",
              options: [
                "tracing is disabled on blocking threads",
                "The current span is thread-local state, and no span was ever entered on the pool thread, so the new span became an orphaned root",
                "The bunyan formatter drops inherited fields off the main thread",
                "The span exceeded its maximum field count",
              ],
              answer: 1,
              explanation:
                "spawn_blocking_with_tracing fixes it by capturing Span::current() before the hop and entering it with in_scope on the worker, so child spans link back into the request tree. Correctness was never broken; only the investigation trail was.",
            },
          ],
        },
        {
          slug: "sec-cookie-anatomy",
          title: "What a cookie actually is",
          summary:
            "Set-Cookie anatomy, the browser's jar, HttpOnly/Secure/SameSite, flash done twice.",
          xp: 25,
          contentFile: "sec-cookie-anatomy.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "The HMAC tag made query-parameter flash messages tamper-proof. Why does the chapter discard the approach anyway?",
              options: [
                "Computing HMAC-SHA256 per redirect is too slow",
                "URLs land in browser history and autocomplete, so the 'ephemeral' error resurfaces days later: the storage location is wrong, and no signature fixes that",
                "Query strings cannot carry percent-encoded text reliably",
                "actix-web cannot read query parameters after a 303 redirect",
              ],
              answer: 1,
              explanation:
                "Integrity was solved; ephemerality was not. URLs are records the browser keeps and suggests back, so the message needed a side channel invisible to history: cookies.",
            },
            {
              kind: "predict",
              prompt:
                "A response sets `Set-Cookie: _flash=Authentication failed` with no attributes. Where does the browser keep it, and for how long?",
              options: [
                "On disk, expiring after an implicit 24-hour default",
                "In memory as a session cookie: it is gone when the browser closes",
                "On disk indefinitely, until the site deletes it",
                "Nowhere: cookies without the Secure attribute are rejected",
              ],
              answer: 1,
              explanation:
                "Persistence is opt-in via Max-Age or Expires; without them the cookie never touches the jar's on-disk store. Max-Age=0 expires one immediately, which is the deletion idiom actix-web wraps as add_removal_cookie.",
            },
            {
              kind: "mcq",
              prompt: "What does marking a cookie HttpOnly change?",
              options: [
                "The browser only sends it over HTTPS connections",
                "The browser still stores and sends it, but hides it from client-side JavaScript (document.cookie)",
                "The value is encrypted before being written to disk",
                "The user can no longer edit it in devtools",
              ],
              answer: 1,
              explanation:
                "HTTPS-only transmission is Secure's job, and nothing stops users editing their own jar. That last gap is why the value travels with an HMAC tag, a signed cookie the backend verifies before trusting.",
            },
          ],
        },
      ],
    },
    {
      slug: "sessions-and-admin",
      title: "Sessions and the admin",
      description:
        "Redis-backed sessions, then password change, logout, and middleware assemble the panel.",
      lessons: [
        {
          slug: "sec-sessions",
          title: "Sessions: a token in the jar, state on the server",
          summary:
            "Redis via actix-session, the middleware's write-back, rotation against fixation.",
          contentFile: "sec-sessions.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does the chapter pick Redis over Postgres as the session store?",
              options: [
                "Redis supports richer queries across many sessions at once",
                "Sessions are single-key CRUD with a required expiry, and Redis TTLs handle disposal natively where Postgres has no row expiration",
                "Postgres cannot store JSON values",
                "Redis offers stronger durability guarantees than Postgres",
              ],
              answer: 1,
              explanation:
                "The durability trade actually runs the other way, and that is fine: sessions are designed to be disposable, so losing a RAM-backed store logs users out and nothing more. Postgres would need an expires_at column plus a scheduled sweeper.",
            },
            {
              kind: "predict",
              prompt:
                'The login handler calls session.insert("user_id", user_id) and then returns a redirect. When does Redis get written and the session cookie get set?',
              options: [
                "Synchronously, inside the insert call",
                "After the handler returns: SessionMiddleware diffs the in-memory state, persists the change, and sets the cookie if the client lacks one",
                "When the browser follows the redirect to the dashboard",
                "Lazily, on the next request that reads the session",
              ],
              answer: 1,
              explanation:
                "Session is an in-memory handle; the middleware owns the storage round trip on the response path. Values serialize to JSON on the way through, which is why insert returns a Result and uuid needs its serde feature.",
            },
            {
              kind: "mcq",
              prompt: "What attack does session.renew() at login disrupt, and how?",
              options: [
                "Replay of expired cookies, by re-signing them with a fresh key",
                "Session fixation: rotating the token at login means a pre-planted token never becomes privileged",
                "Timing attacks against token comparison",
                "Cross-site scripting through the cookie value",
              ],
              answer: 1,
              explanation:
                "Anonymous sessions get upgraded to privileged ones at login, so an attacker seeds a victim's browser with a token they know and waits. Rotation stores the privileged state under a fresh token, leaving the planted one pointing at nothing.",
            },
          ],
        },
        {
          slug: "sec-admin-middleware",
          title: "The admin panel, assembled",
          summary:
            "Seed users, password change, logout, and a from_fn middleware guarding /admin/*.",
          xp: 25,
          contentFile: "sec-admin-middleware.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why must the change-password form include the current password when the user is already authenticated?",
              options: [
                "To re-derive the argon2 salt for the new hash",
                "So an attacker holding only a hijacked session cookie cannot rotate the credentials and lock the real owner out",
                "Because the Form extractor requires at least three fields",
                "To keep the session from expiring during the request",
              ],
              answer: 1,
              explanation:
                "A session token is not the password: requiring the stronger secret for credential rotation caps what a stolen session is worth. The check reuses validate_credentials, the exact routine that powers login.",
            },
            {
              kind: "predict",
              prompt:
                "A user logs out, then presses Back and re-requests /admin/dashboard. What happens?",
              options: [
                "The dashboard renders from the browser's cached session",
                "A redirect to /login: purge() deleted the Redis state and unset the cookie, so the middleware finds no user_id",
                "A 500, because the session state no longer deserializes",
                "The dashboard renders with a stale username",
              ],
              answer: 1,
              explanation:
                "Logged-in is nothing but a valid user_id in session state. purge destroyed the server-side entry and attached a removal cookie, so reject_anonymous_users takes its None branch on the next request.",
            },
            {
              kind: "mcq",
              prompt:
                'A handler inside web::scope("/admin") declares web::ReqData<UserId>, but the scope is missing .wrap(from_fn(reject_anonymous_users)). What happens?',
              options: [
                "A compile error: ReqData requires a registered middleware",
                "A runtime error, 'Missing expected request extension data': extensions are a per-request type map that only the middleware fills",
                "UserId falls back to a nil UUID",
                "actix-web reads the session directly as a fallback",
              ],
              answer: 1,
              explanation:
                "The extensions map is checked per request, not at compile time, which is the cost of smuggling data past the type system. UserId is a newtype precisely so the type-keyed map cannot collide with anyone else's Uuid.",
            },
          ],
        },
      ],
    },
  ],
}
