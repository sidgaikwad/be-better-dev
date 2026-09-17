`POST /login` verifies the password and answers `303 See Other` with `Location: /admin/dashboard`. The dashboard then loads with no idea who just arrived: the password was on the login request, and the next hundred requests will not carry it. Something has to remember, and the cookie lesson built the courier.

## A token in the jar, the state on the server

Session-based authentication: the user proves who they are once, and the server mints a session token, a one-time secret. The token rides back in a cookie, the browser attaches it to every later request, and the server keeps a token-to-state table to look the caller up.

The token must be unpredictable (a cryptographically secure RNG) and unique. Real systems have shipped counters here, where editing the `6` in your cookie to a `7` logs you in as your neighbor.

A valid token is exactly as powerful as the password it replaced, with two graces long-lived credentials lack: it expires on its own, and the server can revoke it right now by deleting one entry of state. Self-contained tokens (JWTs) carry signed claims instead: nothing to look up, but also nothing to delete when one leaks. For a browser talking to its own backend, revocable sessions are the boring, right answer: a suspected hijack costs a forced logout, not a password reset.

## Why Redis, and why not Postgres

The store does CRUD on exactly one key at a time: create at login, read per request, update on change, delete at logout. Plus expiration, or stale sessions outnumber live ones. Postgres has no row expiry; you would bolt on an `expires_at` column and a scheduled sweeper. Redis is an in-memory key-value store with native TTLs: set a time-to-live and disposal is Redis's problem. Trading disk durability for RAM speed is priced correctly for disposable data: lose Redis and everyone is logged out, an annoyance, not a data loss. Token as key, session state as a JSON value.

## actix-session

`SessionMiddleware` wants a storage backend and a key to sign the session cookie:

```rust
let secret_key = Key::from(hmac_secret.expose_secret().as_bytes());
let redis_store = RedisSessionStore::new(redis_uri.expose_secret()).await?;

App::new().wrap(SessionMiddleware::new(redis_store.clone(), secret_key.clone()))
```

(The book pins a git build for this storage API; released versions have long since shipped it, the Redis backend behind a feature flag.) Handlers take `Session` as an extractor, a handle on a string-keyed map:

```rust
session.renew();
session.insert("user_id", user_id)?;
```

Everything done to `Session` happens in memory. After the handler returns, the middleware diffs the state: if it changed, it writes Redis and sets the session cookie on the response if the client lacks one. Devtools shows that cookie holding one opaque signed token, nothing else; the `user_id` never leaves the server. Values are serialized to JSON on the way in, which is why `uuid` needs its `serde` feature and why `session.get::<Uuid>("user_id")` returns a `Result`: deserialization can fail.

`renew()` is the fixation defense. Sessions can exist before login (think guest shopping carts), so login upgrades an anonymous session to a privileged one. An attacker who plants a token they know into a victim's browser is waiting for exactly that upgrade. Rotating the token at login makes the planted one permanently worthless.

## One deeper: a typed interface

String keys at every call site are an outage waiting on a typo, and `session.get::<Uuid>("user_id ")` compiles. Wrap the foreign type once, the newtype move from the modules section:

```rust
pub struct TypedSession(Session);

impl TypedSession {
    const USER_ID_KEY: &'static str = "user_id";

    pub fn get_user_id(&self) -> Result<Option<Uuid>, serde_json::Error> {
        self.0.get(Self::USER_ID_KEY)
    }
}
```

A three-line `FromRequest` impl (returning `Ready`, since no I/O is involved) makes `TypedSession` an extractor, so handlers never see the stringly-typed API at all. The dashboard leans on it: `Some(user_id)` means `SELECT username` and render "Welcome {username}!", `None` means redirect to `/login`, a check the next lesson promotes into middleware.

## Predict, then verify

An attacker plants a session token they know into a victim's cookie jar (shared machine, a subdomain bug). The victim then logs in. Can the attacker's copy of that token now open `/admin/dashboard`? And if `session.renew()` were deleted?

Answer: with `renew()`, no. Login rotates the token, so the privileged `user_id` state lands under a fresh key the attacker never sees, while the planted token keeps pointing at anonymous nothing. Delete `renew()` and the attack works as designed: `user_id` attaches to the very token the attacker already holds, and their copy is a logged-in admin session. One line is the entire defense, which is why serious session libraries ship rotation built in.
