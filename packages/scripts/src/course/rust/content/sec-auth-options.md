`POST /newsletters` went live in the last section with no lock on the door: anyone who discovers the endpoint can email your entire subscriber list. Before fixing that, chapter 10 makes us choose _how_ to verify who is calling, and the options deserve an honest look.

## Know, have, are

Every authentication scheme asks the caller for something only they can provide. There are three families:

- **Something they know**: passwords, PINs, security questions. People cannot remember hundreds of long, unique secrets, so they reuse them, and one breached site unlocks the rest. The average person has 100 or more online accounts.
- **Something they have**: a phone with an authenticator app, a U2F key. Devices get lost and stolen, and a stolen device is a window for impersonation.
- **Something they are**: fingerprints, face geometry. Biometrics cannot be rotated. You can change a leaked password; you cannot change your fingerprint, and forging one is easier than most people assume.

Multi-factor authentication is the standard answer to "each family is weak": require two factors from _different_ families.

The book picks passwords anyway, with eyes open. The newsletter's admins are humans in browsers; a password-plus-session flow is what that interaction type calls for, and building it properly teaches hashing, storage, and cookies, machinery that transfers to every other scheme.

## Basic auth on the wire

The 'Basic' Authentication Scheme (RFC 7617) is the simplest way to attach credentials to a request:

```
Authorization: Basic <base64({username}:{password})>
```

If the header is missing or invalid, the server must answer `401 Unauthorized` and name its challenge:

```
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Basic realm="publish"
```

A realm is a named protection space; ours contains a single endpoint. Extraction is plain header work:

```rust
fn basic_authentication(headers: &HeaderMap) -> Result<Credentials, anyhow::Error> {
    let header_value = headers
        .get("Authorization")
        .context("The 'Authorization' header was missing")?
        .to_str()
        .context("The 'Authorization' header was not a valid UTF8 string.")?;
    let encoded = header_value
        .strip_prefix("Basic ")
        .context("The authorization scheme was not 'Basic'.")?;
    let decoded = base64::decode_config(encoded, base64::STANDARD)
        .context("Failed to base64-decode 'Basic' credentials.")?;
    // ...then String::from_utf8, then splitn(2, ':') into username and password
}
```

(The book pins `base64 0.13`; since 0.21 the same call is `general_purpose::STANDARD.decode(...)` with the `Engine` trait in scope.) Returning the right failure takes a custom `ResponseError::error_response` on the handler's error enum, because the `WWW-Authenticate` challenge must ride along with the 401; overriding `status_code` alone cannot attach a header.

Note that base64 _encodes_, it does not encrypt: decoding needs no secret. Anyone who can read the request can read the password, which is why this scheme is only tolerable over TLS.

## Where Basic auth stops

The first working version validates credentials with `SELECT user_id FROM users WHERE username = $1 AND password = $2`: cleartext passwords in Postgres, compared inside SQL. The next lesson tears that down rung by rung.

Even with storage fixed, a structural limit remains: Basic auth carries credentials on **every request**. For one machine-to-machine endpoint that can be acceptable, though real deployments there reach for mTLS or the OAuth2 client credentials flow, and JWT validation is riddled with dangerous edge cases. For a person in a browser it is simply wrong: with five admin pages, the browser would demand the password on each one and the server would re-verify it every time. What we want is to authenticate once and be _remembered_: a session, which is where this section is headed.

## Predict, then verify

A request arrives at `POST /newsletters` with no `Authorization` header at all. What exactly must a spec-compliant response contain?

Answer: status `401 Unauthorized` plus a `WWW-Authenticate: Basic realm="publish"` header carrying the challenge. The book's integration test asserts both, and the header is the part that forces the bespoke `error_response` implementation. It is also a small lesson in reading RFCs: the status code says "you failed", the challenge says "here is how to try again".
