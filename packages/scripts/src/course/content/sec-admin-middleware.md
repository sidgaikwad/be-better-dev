Every gate built so far assumes a logged-in admin exists, and none does: `users` is empty in production, and there is deliberately no sign-up page, because newsletter admins are provisioned, not self-registered. The chapter's last stretch makes the panel real: a seed user, a password-change flow, logout, and one middleware guarding everything under `/admin/`.

## Seed the first admin

A migration inserts the first user directly:

```sql
INSERT INTO users (user_id, username, password_hash)
VALUES (
    'ddf8994f-d522-4659-8d02-c1d479057be6',
    'admin',
    '$argon2id$v=19$m=15000,t=2,p=1$...'
);
```

The password is `everythinghastostartsomewhere`, and its PHC string comes from a cheat: temporarily hardcode that password in the test-user helper, `dbg!(&password_hash)`, run one test, copy, revert. A known credential in a migration is a provisioning hole with a planned exit: the seed admin changes their password at first login.

## Changing a password

`GET /admin/password` serves a three-field form: current password, new password, new password again. Unhappy paths first, each a redirect plus a flash message, the cookie lesson's machinery reused verbatim:

- The two new entries differ: flash "the field values must match". (`Secret<String>` deliberately does not implement `Eq`; the comparison exposes both secrets.)
- The current password is wrong: reuse `validate_credentials` from login and flash on `AuthError::InvalidCredentials`. Demanding the current password means a thief holding only a hijacked session cookie cannot rotate the credentials and lock the owner out.

(OWASP's length rules, longer than 12 and shorter than 128, are left as an exercise.) The happy path computes a replacement hash, and hashing is exactly as CPU-bound as verification, so it rides the helper from the executor lesson:

```rust
let password_hash = spawn_blocking_with_tracing(move || compute_password_hash(password))
    .await?
    .context("Failed to hash password")?;
sqlx::query!(
    "UPDATE users SET password_hash = $1 WHERE user_id = $2",
    password_hash.expose_secret(),
    user_id
)
```

`compute_password_hash` draws a fresh `SaltString` and hashes with Argon2id at the OWASP parameters: a brand-new PHC string overwrites the old one.

## Logout is a deletion

Being "logged in" is nothing but a valid `user_id` in session state, so logging out is destroying that state. `Session::purge()` marks the session; the middleware then deletes the Redis entry and unsets the client cookie, the removal-cookie trick again. Logout mutates state, so it must be a `POST`: the dashboard renders a one-button form, not a link, and the login page confirms with an info-level flash.

## One middleware instead of n copies

Three handlers now open identically: read the session, `None` means redirect to `/login`. Copy-pasted guards drift. A full actix-web middleware means implementing the `Transform` and `Service` traits; `actix_web_lab::from_fn` accepts a plain async function instead:

```rust
pub async fn reject_anonymous_users(
    mut req: ServiceRequest,
    next: Next<impl MessageBody>,
) -> Result<ServiceResponse<impl MessageBody>, actix_web::Error> {
    let session = {
        let (http_request, payload) = req.parts_mut();
        TypedSession::from_request(http_request, payload).await
    }?;
    match session.get_user_id().map_err(e500)? {
        Some(user_id) => {
            req.extensions_mut().insert(UserId(user_id));
            next.call(req).await
        }
        None => {
            let response = see_other("/login");
            let e = anyhow::anyhow!("The user has not logged in");
            Err(InternalError::from_response(e, response).into())
        }
    }
}
```

`ServiceRequest` is a thin wrapper over `HttpRequest` plus `Payload`, so the sessions lesson's typed extractor works unchanged. Downstream handlers still need the user id, and the channel is request extensions, a per-request type map: `UserId` is a newtype over `Uuid` precisely because the map is keyed by type and a bare `Uuid` invites collisions. Handlers declare `web::ReqData<UserId>` and get it injected. Registration is scoped so public routes pay nothing:

```rust
web::scope("/admin")
    .wrap(from_fn(reject_anonymous_users))
    .route("/dashboard", web::get().to(admin_dashboard))
    .route("/password", web::post().to(change_password))
    .route("/logout", web::post().to(log_out))
```

Forget the `wrap` and every `ReqData<UserId>` handler fails at runtime with "Missing expected request extension data": the type map is checked per request, not at compile time. (`from_fn` has since graduated from the lab crate into actix-web proper, as `actix_web::middleware::from_fn`.) The assembled flow gets one six-step integration test: log in, land on the dashboard, change the password, log out, log back in with the new password.

## Predict, then verify

The instant after a successful `POST /admin/password` (the `UPDATE` is committed), the same browser requests `/admin/dashboard`. Logged in or bounced?

Answer: still logged in. Session validity hangs off the token in the cookie and the state in Redis, and neither knows the password hash changed. The book's flow depends on this: the operator lands back on the form with a success flash, still authenticated, and logs out only when they choose to. Many production systems layer a policy on top, revoking every other session for the user on a password change, which the session store makes a targeted delete. That is policy stacked on the same mechanism, not a gap in it.
