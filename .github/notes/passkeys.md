# Passkey login: implementation spec

Status: **shipped to canary 2026-09-19** in six PRs (#46, #48, #49, #50, #51, #52).
Reference read: `~/sidd-oss/carbon` (hand-rolled WebAuthn on Supabase Auth).

## What shipped

| PR  | What                                                                                      |
| --- | ----------------------------------------------------------------------------------------- |
| #48 | `@better-auth/passkey` pinned exact to `1.6.25`, matching the installed `better-auth`     |
| #49 | the `passkey` table, migration `0007_passkey.sql`, `credential_id` UNIQUE                 |
| #50 | the plugin registered, rpID derived from the web origin, `BETTER_AUTH_RP_ID` escape hatch |
| #51 | `passkeyClient()` and the "Sign in with a passkey" button                                 |
| #52 | `/settings/passkeys`: list, add, rename, remove                                           |

(#46 was the unrelated rate-limiter fix found on the way; see `redis.md`.)

## The one thing still outstanding

**Nobody has completed a real ceremony.** Everything up to the biometric prompt is verified:
endpoints return 200, `rp.id` resolves to the web host in all three deployment shapes, options
carry `residentKey: "required"` and `userVerification: "preferred"`. But Touch ID cannot be driven
headlessly without a virtual authenticator, which is exactly what stalled upstream's own attempt
(their issue #594).

Someone on a Mac needs to: sign in, user menu, Passkeys, Add a passkey, approve with Touch ID,
sign out, then "Sign in with a passkey". Until that happens the feature is shipped but unproven.

## Deferred deliberately

- **Conditional UI** (browser autofill on the email field). The nicest part and the fiddliest:
  needs `autoComplete="email webauthn"`, an `AbortController` torn down on unmount, and an
  `isConditionalMediationAvailable` probe. Its own PR when someone wants it.
- **`lastUsedAt`.** The plugin has no such column. Would need an extra field plus a hook.
- **better-auth 1.7.** `^1.6.33` resolves to 1.7.5, whose breaking changes include keying accounts
  on `(issuer, accountId)` with a required `Account.issuer` backfill. Its own piece of work.

## Deviations from the plan below, and why

The spec that follows was written before the code and is kept for its reasoning. Three of its
calls were overridden during implementation:

1. **`userVerification`**: spec said `"required"` (carbon's choice), shipped `"preferred"`, so a
   device with no biometric or PIN is not locked out.
2. **`authenticatorAttachment: "platform"`**: spec proposed it, shipped without, so hardware
   security keys work too.
3. **`HONO_WEB_URL` becoming required**: spec said so, shipped with `BETTER_AUTH_RP_ID` as an
   optional override instead, falling back to the first non-api trusted origin.

Upstream `nrjdalal/zerostarter` has an abandoned WIP branch, `feat/passkey` (closed PR #574,
closed issue #594). It reached the same conclusions and its choices informed 1 and 2 above. It
could not be merged: this repo shares no git history with upstream.

---

## Next action

Bump `better-auth` in the root `package.json` catalog from `^1.6.23` to `^1.6.33`
and add `@better-auth/passkey: ^1.6.33`. Hand-edit, then plain `bun i`.
Everything else is blocked on that. ~15 min.

---

## The one thing to understand first

Carbon wrote ~600 lines of WebAuthn by hand because Supabase Auth has no passkey support.
**We are on Better Auth, which has an official passkey package.** We do not port carbon's code.
We port carbon's _decisions_ and let the plugin do the crypto.

| Carbon file                                                | What replaces it here                                    |
| ---------------------------------------------------------- | -------------------------------------------------------- |
| `packages/auth/src/services/passkey.server.ts` (232 lines) | `passkey()` plugin, ~15 lines of config                  |
| 4 hand-written routes in `apps/erp/app/routes/api+/`       | plugin mounts 7 endpoints itself                         |
| `passkeyCredential` SQL table + RLS policies               | `passkey` Drizzle table, no RLS (we do not use Supabase) |
| Redis challenge store (`passkey:reg:challenge:*`)          | existing `verification` table + a signed cookie          |
| `signInWithPasskey` (magic-link forgery hack)              | plugin issues a real session directly                    |
| AAGUID name map                                            | plugin ships `getAuthenticatorName()`                    |
| `startAuthentication()` wiring in `login.tsx`              | `authClient.signIn.passkey()`                            |

Net: carbon is a _worked example of the protocol_, useful for understanding. It is not a source of code.

---

## Part 1: what is stored where

### 1. The private key: the user's device. Never ours.

Secure Enclave (Mac/iPhone), TPM + Windows Hello, Android StrongBox, or a hardware key.
Synced by iCloud Keychain / Google Password Manager / 1Password if the user's platform does that.
We cannot read it, export it, or back it up. If every device is lost, the passkey is gone and the
user falls back to magic link.

### 2. The public key and metadata: new `passkey` table in Postgres

Lands in `packages/db/src/schema/auth.ts` (that file holds the Better Auth tables).
Column shape is dictated by the plugin, do not improvise it:

| Column          | Type                                   | What it is                                                                        |
| --------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| `id`            | text PK                                | our row id                                                                        |
| `user_id`       | text FK to `user.id`, cascade, indexed | owner                                                                             |
| `credential_id` | text, indexed                          | the browser's handle for this passkey. Looked up on every sign-in                 |
| `public_key`    | text                                   | base64url. Verifies the signature. Public, not a secret                           |
| `counter`       | integer                                | signature counter, clone detection                                                |
| `device_type`   | text                                   | `singleDevice` or `multiDevice` (is it synced?)                                   |
| `backed_up`     | boolean                                | is it in iCloud/Google sync? Drives "this passkey is only on one device" warnings |
| `transports`    | text, nullable                         | comma list: `internal`, `hybrid`, `usb`                                           |
| `aaguid`        | text, nullable                         | authenticator _model_ id. Turns into "iCloud Keychain" in the UI                  |
| `name`          | text, nullable                         | user-editable label                                                               |
| `created_at`    | timestamp                              |                                                                                   |

Note: the plugin has no `lastUsedAt`, which carbon had. If you want "last used 2 days ago" in the
manage UI, add it as an extra field via the plugin's `schema` option. Decide in Part 5.

### 3. The challenge: existing `verification` table + a signed cookie

A challenge is a one-time random string. The browser signs it, we check the signature against what
we stored. This is what stops replay attacks.

Carbon put these in Redis. **We have no Redis, and passkeys do not require one.** The plugin writes
the challenge to the `verification` table (already exists, already migrated) and hands the browser a
signed cookie (`better-auth-passkey`) holding the row's token. On verify it consumes the row: read
once, delete.

No schema change for this. Nothing to configure.

If Redis is added later as Better Auth's `secondaryStorage`, challenges move there automatically
(`createVerificationValue` / `consumeVerificationValue` in the internal adapter route through it
unless `verification.storeInDatabase` is set). So this is not a decision that locks anything in:
passkeys work on Postgres today and follow Redis for free the day it exists.

### 4. The session: unchanged

After a verified passkey, the plugin creates a normal row in `session` and sets the normal
Better Auth cookie. Every existing gate (`requireConsoleRole`, the `(protected)` layout,
`auth.api.getSession`) keeps working with zero changes. Passkey is just another way in.

### 5. Nothing new in the browser

No localStorage, no token juggling. The cookie is the same one magic link and OAuth already set.

---

## Part 2: the routes

### Zero router code to write

`api/hono/src/routers/auth.ts` already ends with:

```ts
.on(["GET", "POST"], "/*", (c) => auth.handler(c.req.raw))
```

That catch-all forwards everything to Better Auth. Registering the plugin mounts these, and Hono
serves them the moment the plugin exists. **Do not add routes for passkeys.**

| Method | Path                                              | Auth needed | What it does                                |
| ------ | ------------------------------------------------- | ----------- | ------------------------------------------- |
| GET    | `/api/auth/passkey/generate-register-options`     | session     | mints a challenge, returns creation options |
| POST   | `/api/auth/passkey/verify-registration`           | session     | verifies, writes the `passkey` row          |
| GET    | `/api/auth/passkey/generate-authenticate-options` | none        | mints a challenge for sign-in               |
| POST   | `/api/auth/passkey/verify-authentication`         | none        | verifies, creates the session               |
| GET    | `/api/auth/passkey/list-user-passkeys`            | session     | the manage UI's list                        |
| POST   | `/api/auth/passkey/update-passkey`                | session     | rename                                      |
| POST   | `/api/auth/passkey/delete-passkey`                | session     | revoke                                      |

### One route you DO change

`GET /api/auth/providers` in the same file. It returns the list the sign-in dialog renders from.
Add `"passkey"` when the plugin is registered, mirroring how `magicLinkEnabled` is derived today
in `packages/auth/src/index.ts`.

### The two flows end to end

**Register** (user already signed in, adding a passkey):

```
browser                          api                        postgres
  |-- GET generate-register-options -->|
  |                                    |-- write challenge ----> verification
  |<-- options + signed cookie --------|
  |
  [ Touch ID / Windows Hello prompt ]
  [ device makes a keypair, keeps the private half ]
  |
  |-- POST verify-registration ------->|
  |                                    |-- consume challenge --> verification
  |                                    |-- INSERT -------------> passkey
  |<-- { passkey } --------------------|
```

**Sign in** (no session yet):

```
browser                          api                        postgres
  |-- GET generate-authenticate-options -->|
  |                                        |-- write challenge --> verification
  |<-- options + signed cookie ------------|
  |
  [ browser shows the passkey picker, no email typed ]
  [ device signs the challenge ]
  |
  |-- POST verify-authentication --------->|
  |                                        |-- find by credential_id --> passkey
  |                                        |-- verify signature (server-side)
  |                                        |-- bump counter ----------> passkey
  |                                        |-- INSERT ----------------> session
  |<-- session cookie ---------------------|
```

The picker with no email typed is the payoff, and it needs `residentKey: "required"`. See Part 5.

---

## Part 3: rpID and origin. Read this before writing any config.

This is the part that will cost you an afternoon if you skip it.

WebAuthn binds a passkey to a **Relying Party ID**: a bare hostname, no protocol, no port. A passkey
minted for `foo.com` cannot be used on `bar.com`, by design. Two rules:

1. `rpID` must equal the page's hostname, or be a registrable-domain suffix of it.
2. `origin` must be the **full origin of the page the user is looking at**, which here is the _web_
   app, never the API.

### The trap

The plugin defaults `rpID` to `new URL(baseURL).hostname`. Our `baseURL` in
`packages/auth/src/index.ts` is `webOrigin ?? env.HONO_APP_URL`, and `webOrigin` is only set when
`isPrivate` is true. So in portless dev `baseURL` is the **API** host and the default `rpID` comes
out as `api.be-better-dev.localhost`. The page is at `be-better-dev.localhost`. Every ceremony fails.

Worse: `origin` defaults to `ctx.headers.get("origin")`, which is to say "trust whatever the caller
claims". Pinning it is a security requirement, not a nicety.

**Conclusion: pass both explicitly. Derive them from the web origin.**

### Per environment

| Environment      | Page origin (where the user is)         | `rpID`                          | `origin`                |
| ---------------- | --------------------------------------- | ------------------------------- | ----------------------- |
| portless dev     | `https://be-better-dev.localhost`       | `be-better-dev.localhost`       | same                    |
| `PORTLESS=0` dev | `http://localhost:3000`                 | `localhost`                     | `http://localhost:3000` |
| production today | `https://be-better-dev-next.vercel.app` | `be-better-dev-next.vercel.app` | same                    |

The rule reduces to: **rpID = hostname of the web origin; origin = the web origin.**
Simpler than carbon, which had to span two subdomains (ERP + MES) and therefore passed an array.

### Where the web origin comes from

Already solved for cookies in `packages/auth/src/index.ts`:

- `isPrivate` true (vercel.app): `webOrigin` = `HONO_WEB_URL`, or the first non-api trusted origin.
- `isPrivate` false (custom domain, portless): `webOrigin` is `undefined` today, so add a fallback.
  `HONO_WEB_URL` is already an optional env var. Use it, and fall back to the first non-api entry
  in `HONO_TRUSTED_ORIGINS`.

Practical effect: **`HONO_WEB_URL` stops being optional once passkeys ship.** Set it in
`.env.example`, in the api Vercel project, and in the worktree `.env` files.

### The cost nobody mentions until it bites

`vercel.app` is a public suffix. `rpID` cannot be shortened to it, so it must be the full host
`be-better-dev-next.vercel.app`. **The day you move to a custom domain, every passkey ever
registered stops working** and every user has to enrol again. Magic link is the escape hatch, so
this is survivable, but do not ship passkeys and then rename the host casually.

If a custom domain is on the roadmap at all, do that first. It is a one-line env change now and a
user-visible breakage later.

---

## Part 4: build order

Eight steps, roughly 4 to 5 hours if nothing fights back.

### 1. Dependencies (15 min)

Root `package.json` catalog: `better-auth` `^1.6.23` -> `^1.6.33`
(`@better-auth/passkey@1.6.33` peers `better-auth ^1.6.33` and `better-call 1.4.0`; 1.6.25 ships
`better-call 1.3.7`, so the bump is mandatory, not cosmetic).

Add to the catalog and to `packages/auth/package.json` deps:
`"@better-auth/passkey": "catalog:"`.
Add to `web/next/package.json` too (the client half).

Hand-edit the catalog. **Never `bun update <pkg>`**: it rewrites `catalog:` references into literal
versions and invents new direct dependencies. Then plain `bun i`.

Verify: `bun run check-types && bun run build`.

### 2. Schema and migration (30 min)

Add the `passkey` table to `packages/db/src/schema/auth.ts` (column shape in Part 1).
Follow the `db-migration` skill, and honour its step 0: **show the table and wait for a go before
generating**, because canary and production share one database.

```bash
bun run db:generate        # review the SQL and the snapshot
bunx pglaunch -k           # disposable postgres, put its URL in the worktree .env
bun run db:migrate
bunx turbo run build --filter=@packages/db
```

### 3. Server plugin (45 min, the hard one)

`packages/auth/src/index.ts`:

- Compute `webOrigin` unconditionally (Part 3), not just when `isPrivate`.
- Register `passkey({ rpID, rpName, origin, authenticatorSelection })` in the `plugins` array.
- Add `"passkey"` to the `AuthProvider` union and to `enabledProviders`, matching the existing
  `magicLinkEnabled` pattern.

Config, carrying carbon's choices forward:

```ts
authenticatorSelection: {
  authenticatorAttachment: "platform",  // Touch ID / Hello only, no USB keys
  residentKey: "required",              // discoverable: sign in with no email typed
  userVerification: "required",         // biometric or PIN, not just presence
}
```

`rpName` should read from `@packages/config/site` so a fork rebrands in one place.

### 4. Provider list (10 min)

`api/hono/src/routers/auth.ts`: `GET /api/auth/providers` already spreads `enabledProviders`,
so step 3 may cover this for free. Confirm `"passkey"` appears in the response.

### 5. Client plugin (5 min)

`web/next/src/lib/auth/client.ts`: add `passkeyClient()` to `plugins`.

### 6. Sign-in UI (45 min)

`web/next/src/components/common/access.tsx`:

- `passkeyEnabled = data?.providers.includes("passkey")`, alongside `githubEnabled` etc.
- Add `"passkey"` to the `loader` state union.
- Render the button only when the browser supports WebAuthn. Feature-detect in a `useEffect`, do not
  assume, or Firefox-on-Linux users get a button that does nothing.
- Call `authClient.signIn.passkey()`, then route to `/dashboard`.
- Swallow `NotAllowedError` and `AbortError`: those mean "user closed the sheet", not a failure.
  Carbon's `login.tsx` gets this right, copy the shape.

**Conditional UI (browser autofill) is a stretch goal.** `authClient.signIn.passkey({ autoFill: true })`
on mount makes the email field offer passkeys in its dropdown. It is the nicest part of the feature
and the fiddliest: it needs `autoComplete="email webauthn"` on the input, an `AbortController` torn
down on unmount, and it silently no-ops on browsers without `isConditionalMediationAvailable`.
Ship the button first, land autofill as a follow-up.

### 7. Manage UI (1.5 h)

There is no settings page in `web/next/src/app/(protected)/` today. So this step creates one:
`(protected)/settings/security/`, linked from `components/shell/sidebar-user-menu.tsx`.

Contents: list passkeys (`authClient.passkey.listUserPasskeys()`), show `getAuthenticatorName(aaguid)`
plus created date, allow rename and delete, and an "Add a passkey" button calling
`authClient.passkey.addPasskey()`. Follow the `design` skill.

Two details worth getting right: warn when `backedUp` is false (single-device passkey, lost with the
device), and refuse to delete the last passkey without confirming, since the user may not remember
their magic-link email still works.

### 8. Docs (20 min)

`AGENTS.md` rule: docs stay in sync with every change. Run the `doc-sync` skill. At minimum:
`.env.example` gains `HONO_WEB_URL` with a comment explaining the passkey dependency, and this note
moves from "not started" to a record of what shipped.

---

## Part 5: decide before you start

1. **`lastUsedAt`?** The plugin has no such column; carbon had one. Adding it means an extra field
   via the plugin's `schema` option plus a hook to write it. Skip for vBeta, or add now while the
   migration is being written anyway (cheaper than a second migration later).
2. **Platform-only, or allow hardware keys?** Carbon chose `authenticatorAttachment: "platform"`,
   which excludes YubiKeys. Dropping the line allows both. Platform-only is the lower-friction
   default and matches what a Rust-course user will actually have.
3. **Custom domain first?** See the end of Part 3. If a domain is coming, move it before passkeys,
   not after.
4. **Passkey as a sign-_up_ path?** The plugin registers passkeys for users who already have a
   session. First contact is still magic link or OAuth. That is the right call for vBeta; note it
   so nobody files it as a bug.
5. **`requireUserVerification`.** The plugin hardcodes `false` at registration verify while we ask
   for `"required"` in the options. Carbon required it on both sides. Low risk, but worth a look at
   whether the plugin exposes an override before assuming parity with carbon.

---

## Part 6: how to test

Passkeys need a secure context, so `PORTLESS=0` on plain `http://localhost:3000` works (localhost is
exempt), and portless `https://*.localhost` works. Nothing else does.

1. Sign in with magic link, go to settings, add a passkey, approve with Touch ID.
2. Check the `passkey` table has one row with a sane `credential_id` and `aaguid`.
3. Sign out. Sign in with the passkey button. Should land on `/dashboard` with no email typed.
4. Check `counter` moved and a new `session` row exists.
5. Delete the passkey, confirm sign-in falls back to magic link cleanly.

Then repeat step 3 in a second browser profile to prove the `rpID` is right rather than accidentally
working off a warm cache.

---

## Known traps

- **`bun update` corrupts `package.json`.** Hand-edit the catalog, then `bun i`.
- **Never `pkill -f "turbo run dev"`.** It kills every worktree. Match on your own worktree name.
- **Never migrate against the root `.env` `POSTGRES_URL`.** That is the shared Neon database that
  production reads. `bunx pglaunch -k` first.
- **A bare `PORT` makes the API steal the web port.** Give the API `HONO_PORT` only.
- **`rpID` defaults are wrong here.** Part 3. This is the one that actually costs you the afternoon.
