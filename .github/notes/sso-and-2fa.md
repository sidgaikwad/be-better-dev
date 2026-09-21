# SSO and two-factor auth: implementation spec

Status: **plan only, nothing built.** Written 2026-09-21 against the code as it stands on `canary`
(`06cd092`).
Reference read: `~/work/carbon` on `main` (`4634b460f0`, 2026-09-20). **Not `~/sidd-oss/carbon`**,
which is a stale branch from 2026-08-14 and predates both features by two months.

## Answer up front

Yes to both, but they are two very different pieces of work and they should not share a PR chain.

| Feature        | Shipping vehicle                               | New dependency          | Version bump               | Rough size |
| -------------- | ---------------------------------------------- | ----------------------- | -------------------------- | ---------- |
| 2FA (TOTP)     | `twoFactor` plugin, already inside better-auth | none                    | none                       | ~2 days    |
| SSO (OIDC)     | `@better-auth/sso`                             | samlify, tldts, jose... | 1.6.25 -> 1.6.31+ required | ~2-3 days  |
| SSO (SAML 2.0) | same package                                   | same                    | same                       | +1-2 days  |

Do **2FA first**. It needs no dependency and no version bump, so it can land while the SSO
prerequisite (the better-auth upgrade) is still being argued about.

---

## Next action

Stand up Keycloak or Dex in Docker and complete one real OIDC sign-in. **Nothing has been through
this end to end**: registration is verified only as far as the discovery fetch, which fails against
a fake issuer because the host does not resolve. `docker-compose.yml` already exists to extend. Do
it before the console UI, so the UI is built against a flow known to work.

Then chain B steps 6 and 7: the console screen for registering a provider, and the email-first
sign-in fork.

---

## The one thing to understand first

**Carbon has shipped both, and they are worth reading closely.** Two feature sets, four PRs, about
4,000 lines:

| Feature                                    | PRs                                                       | Where                                                                                                                                                                               |
| ------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TOTP two-factor with org-level enforcement | `#1399`, hardened by `#1414` (NIST SP 800-171 audit)      | `packages/auth/src/services/mfa.server.ts`, `apps/erp/app/routes/api+/mfa.{enroll,verify,unenroll}.ts`, `_public+/mfa.tsx`, `components/{TotpEnrollment,MfaEnrollmentRequired}.tsx` |
| Enterprise SAML SSO                        | `#1455`, then `#1508` (provider-agnostic account linking) | `packages/ee/src/sso/` (9 files, ~2,000 lines), `x+/settings+/sso.tsx`, `api+/sso.check.ts`, 3 migrations                                                                           |

Both have authored reference docs worth reading before anything else:
`apps/erp/app/modules/agent/kb/docs/reference/two-factor.md` and `.../single-sign-on.md`.

**But we still cannot port the code**, for the same reason as passkeys. Carbon's SSO is a thin
app-side layer over **GoTrue's own admin SAML API** (`POST {SUPABASE_URL}/auth/v1/admin/sso/providers`
with the service-role key, `type: "saml"`), and its 2FA is a thin layer over **GoTrue's native MFA**
(`auth.admin.mfa.listFactors`, `auth.mfa.enroll/challenge/verify`). We are on Better Auth. The
plugins do the protocol work; carbon's value here is entirely in its **decisions**, and this time
those decisions are worth a great deal.

### What carries over, and it is a lot

1. **Every sign-in method gets challenged. SSO is the only exemption.** Carbon challenges magic
   link, Google, Outlook and **passkey** alike, and exempts only a SAML session, because the IdP
   already enforced its own MFA. Their doc states the reasoning for passkeys directly: a passkey
   resolves into an ordinary session like any other method, so exempting it leaves a way around the
   requirement. **This overturns the step-up recommendation in the first draft of this spec.**
2. **No backup codes. Recovery is an admin action.** People go to Employee accounts and pick
   "Reset Two-Factor Auth", which keeps recovery auditable and removes a whole class of
   "screenshot of the backup codes in Slack" problem. The documented cost: keep user-management
   permission on at least two people, because there is no self-service way back in.
3. **The requirement belongs to the company; the authenticator belongs to the user.** One boolean
   (`companySettings.requireMfa`), and a user in two companies is held to the strictest one. Once
   enrolled, they are challenged at every sign-in to either company.
4. **Enforcement applies on next page load, not retroactively.** It is a check in the layout
   loader, plus an active re-check in `requireAuthSession` for sessions minted before the user
   enrolled. Sessions that already passed a challenge carry `mfaVerified` and skip the lookup.
5. **Fail open normally, fail closed in a controlled environment.** A Redis or GoTrue blip must not
   lock out every enrolled user, so the default is open. Under `CONTROLLED_ENVIRONMENT` (ITAR/CUI,
   NIST 800-171 3.5.3) it flips closed, because a lookup blip must not let an enrolled user skip
   the challenge.
6. **SSO is invite-first.** No self-serve signup through SSO. A member signs straight in, a pending
   invite is accepted by the first SSO sign-in with exactly the invite's role, and anyone else is
   rejected by name with nothing provisioned.
7. **Domains are claimed by DNS TXT, and exclusivity attaches to verification, not the claim.**
   Pending rows may coexist across companies (a free pending row must never block the rightful
   owner); a partial unique index makes first-to-verify-wins race-free. Verification is one-shot,
   with no periodic re-check.
8. **Set up, prove a sign-in works, then enforce.** The "Require SSO" switch only exists on an
   active connection, and there is a documented SQL break-glass for when the IdP goes dark:
   `UPDATE "ssoConnection" SET "requireSso" = false WHERE "companyId" = '<id>';`
9. **"That domain is taken" is deliberately generic**, so the Verify button cannot be used to probe
   which domains are registered to which company.

### The trap carbon documented, which we would otherwise walk into

Session classification must read the **session's own `amr` claim**, not the user's identity list.
Once an account is linked, its `sso:` identity is permanent, so every later login, including Google
and magic link, looks like SSO through that lens. Carbon's `session.server.ts` carries a warning
comment and two separate functions, `getSsoProviderIdFromUser` (does this user HAVE an SSO
identity) and `getSsoProviderIdFromSession` (did THIS session authenticate via SAML). Get this
wrong and a linked user's magic-link login silently skips the 2FA challenge and bypasses Require
SSO. Both classification failures fail closed toward the non-SSO path.

The Better Auth equivalent of the `amr` claim is not a claim at all. We would have to record the
method on the session ourselves at sign-in.

### What does not carry over

- Carbon is **multi-tenant with a company per row and RLS policies on every table**. We have the
  organization plugin registered but almost no organization UI. Their per-company model does not
  transplant; see Part 3.
- Carbon gates both behind **Enterprise edition and a paid entitlement** (`packages/ee/`,
  `requireEntitlement(client, companyId, "TWO_FACTOR")`, `CARBON_EDITION=enterprise`). We have no
  edition split and no billing.
- Carbon's SSO is **SAML only**, because that is what GoTrue's admin API offers. Better Auth gives
  us OIDC too, which is the easier and safer half. See Part 3.

## Part 1: what better-auth actually gives us, verified

Read from the installed tree and the npm registry on 2026-09-21, not from docs.

### We are on better-auth 1.6.25

`bun.lock` resolves `better-auth` to **1.6.25** and `@better-auth/passkey` to **1.6.25**. The root
catalog says `"better-auth": "^1.6.23"`. (`node_modules/.bun` also holds 1.6.33 and 1.7.5 trees,
but those belong to `.claude/worktrees/*`. Do not read a version off `.bun`.)

### `twoFactor` is already installed

It ships inside the core package: `node_modules/.bun/better-auth@1.6.25*/.../dist/plugins/two-factor/`,
exported as `better-auth/plugins/two-factor` and re-exported from `better-auth/plugins`. Nothing to
install, nothing to bump.

Eight endpoints, mounted under the existing `/api/auth` catch-all in
`api/hono/src/routers/auth.ts` with zero router code:

```
/two-factor/enable                /two-factor/get-totp-uri
/two-factor/disable               /two-factor/verify-totp
/two-factor/generate-backup-codes /two-factor/verify-backup-code
/two-factor/send-otp              /two-factor/verify-otp
```

Schema it wants:

- `user.twoFactorEnabled` boolean, default false, `input: false`
- `twoFactor` table: `secret` (indexed, `returned: false`), `backupCodes` (`returned: false`),
  `userId` (FK to user, indexed), `verified` boolean default true

`TwoFactorOptions` in 1.6.25 includes, verified in `types.d.mts`:
`issuer`, `twoFactorTable`, `totpOptions`, `otpOptions`, `backupCodeOptions`,
`skipVerificationOnEnable`, **`allowPasswordless`**, `schema`, `twoFactorCookieMaxAge` (default
600s), `trustDeviceMaxAge` (default 2592000s), and `accountLockout` (enabled by default,
10 consecutive failures, 900s lock).

### `sso` is NOT in core, and needs a version bump

There is no `sso` directory in 1.6.25's `dist/plugins`. It is the separate `@better-auth/sso`
package, whose **earliest published version is 1.6.31**, peering on `better-auth ^1.6.31`.

That is the whole problem: **SSO cannot be installed without moving off 1.6.25.**

Its dependencies at 1.6.33: `samlify ^2.13.1`, `fast-xml-parser ^5.8.0`, `jose ^6.1.3`,
`tldts ^6.1.0`, `zod ^4.3.6`. (1.7.x adds `@xmldom/xmldom`.)

Fifteen endpoints, again all under the existing catch-all:

```
/sign-in/sso                      /sso/register
/sso/callback                     /sso/get-provider
/sso/callback/:providerId         /sso/providers
/sso/saml2/callback/:providerId   /sso/update-provider
/sso/saml2/sp/acs/:providerId     /sso/delete-provider
/sso/saml2/sp/metadata            /sso/request-domain-verification
/sso/saml2/logout/:providerId     /sso/verify-domain
/sso/saml2/sp/slo/:providerId
```

One new table, `ssoProvider`: `issuer` (required), `oidcConfig` (json-as-text), `samlConfig`
(json-as-text), `userId` (FK to user), `providerId` (required, **unique**), `organizationId`,
`domain` (required), plus `domainVerified` when `domainVerification.enabled`.

`SSOOptions` carries `provisionUser`, `provisionUserOnEveryLogin`, `organizationProvisioning`
(`{ disabled, defaultRole, getRole }`), `defaultSSO` (config-file providers that beat the DB ones),
`defaultOverrideUserInfo`, `disableImplicitSignUp`, `modelName`, `fields`, a provider-count cap,
and domain verification.

---

## Part 2: 2FA

### The gap that decides everything

The plugin's sign-in interceptor is one `after` hook with this matcher, read straight out of
`dist/plugins/two-factor/index.mjs`:

```js
matcher(context) {
  return context.path === "/sign-in/email"
    || context.path === "/sign-in/username"
    || context.path === "/sign-in/phone-number";
}
```

**This app has none of those paths.** There is no `emailAndPassword` config in
`packages/auth/src/index.ts`, no username plugin, no phone-number plugin. Sign-in today
is GitHub OAuth, Google OAuth, passkey, and the agent path. Magic link is registered on the
_client_ but its server plugin is not in the plugin array, so it is not live either.

Register `twoFactor()` as-is and **it gates nothing**. Every endpoint works, `/settings/two-factor`
would let people enrol an authenticator, `twoFactorEnabled` would flip to true, and sign-in would
never once ask for a code. That is worse than not shipping it: it is a security control that
reports itself as on.

Three honest ways out. Pick one before writing code.

1. **Widen the matcher ourselves.** Add our own `after` hook matching `/callback/:id` (the OAuth
   return) and `/sign-in/passkey`, replicating what the plugin's handler does: delete the session
   the sign-in just created, null `newSession`, write the `2fa-<random>` verification row and the
   `2fa-attempts-*` counter, set the signed two-factor cookie, and return `twoFactorRedirect`.
   Roughly 80 lines against internal APIs (`ctx.context.internalAdapter`,
   `ctx.context.createAuthCookie`, `deleteSessionCookie`) that carry no compatibility promise.
   Honest, and the thing that breaks first on every upgrade.

2. **Scope 2FA to step-up, not sign-in.** Leave sign-in alone. Require a fresh TOTP verification
   before a named set of sensitive actions: console role changes, bans, allowlist edits, passkey
   removal, account deletion. This fits the repo's actual shape, since the console already has a
   role ladder in `packages/auth/src/access.ts` with `refuseRoleChange` and `refuseBan`
   as the chokepoints. Uses only public endpoints (`/two-factor/verify-totp`).

3. **Ship magic link first, then gate that.** The matcher still would not fire on
   `/magic-link/verify`, so this only helps if combined with 1. Mentioned to be dismissed.

Recommendation: **1, widen the matcher.** The first draft of this spec recommended 2 (step-up on
console actions) on the theory that OAuth and passkey already carry a second factor. Carbon shipped
the opposite and documented why, and they are right: a passkey resolves into an ordinary session
like every other method, so exempting it leaves a way around the requirement. A 2FA setting that
silently does not apply to the method a given user happens to sign in with is not a security
control, it is a checkbox.

So: challenge every method, and carry forward carbon's one exemption when we eventually have SSO,
because an IdP-authenticated session already had MFA applied by the IdP.

Two consequences to accept up front:

- **We take on ~80 lines against internal APIs** (`ctx.context.internalAdapter`,
  `ctx.context.createAuthCookie`, `deleteSessionCookie`, `ctx.context.setNewSession`) that carry no
  compatibility promise. This is the thing that breaks on every better-auth upgrade. Put it in one
  file with the upstream matcher quoted in a comment, so the next upgrade has a diff to read.
- **Sign-in method has to be recorded on the session ourselves.** Better Auth has no `amr` claim.
  Without it we cannot build carbon's SSO exemption later, and we cannot tell a linked account's
  magic-link login from a real SSO login. Add the field when the gate is built, not after.

Step-up on console actions (option 2) is still worth having, but as a **second** piece of work on
top, not instead. Carbon has no equivalent and it is the gap they left: an admin with an unlocked
laptop can change roles and ban owners with no re-check.

### Passwordless enable/disable

`/two-factor/enable` and `/disable` normally demand the user's password. Nobody here has one. Pass
`allowPasswordless: true`, which is present in 1.6.25 and documented as: password is still required
when a credential account exists, skipped when it does not. Without it, enable returns
`BAD_REQUEST / INVALID_PASSWORD` for every user in the database.

### No email sender, so no OTP factor

Nothing in `api/`, `web/`, or `packages/` sends mail. There is no Resend, nodemailer, Postmark or
react-email dependency. (The only hits are Rust course _lesson content_ under
`packages/scripts/src/course/`.) Carbon has Resend; we do not.

Consequence: `otpOptions` and `/two-factor/send-otp` are unusable. **TOTP plus backup codes only.**

Settled while registering the plugin, and it needs no work: the OTP endpoints mount unconditionally
(`const otp = otp2fa(options?.otpOptions)`), but the plugin handles a missing sender properly rather
than half-working. `/two-factor/send-otp` refuses with `BAD_REQUEST / OTP_NOT_CONFIGURED`, and the
`twoFactorMethods` array a challenge returns only names `"otp"` when `sendOTP` is configured, so the
UI is never offered a method it cannot complete. Leave `otpOptions` absent.

### Storage

`secret` and `backupCodes` both have `returned: false`, so the plugin never serialises them, and
both are encrypted at rest with no configuration: `backupCodeOptions` defaults to
`storeBackupCodes: "encrypted"`, and the TOTP secret goes through `symmetricDecrypt` against
`ctx.context.secretConfig` on every verify. An earlier draft of this spec called the secret
plaintext, from reading the schema rather than the verify path. It is not.

The schema has two more columns than the plugin's declared shape suggests at a glance, and they are
the ones that make a challenge worth anything: `failedVerificationCount` and `lockedUntil` carry the
account lockout. **Without them the 10-failure cap silently does not exist** and a six-digit code
can be guessed without limit. They were missed in `#57` and added in `#61`. Treat the `twoFactor` table as credential material: no console read surface, no logging,
no inclusion in any admin user dump.

### Recovery: backup codes, admin reset, or both

Better Auth gives backup codes for free and carbon deliberately has none, on the grounds that an
admin reset is auditable and a printed code in someone's Notes app is not. Their cost is stated in
their own doc: if the only admin loses their phone, there is no way back in.

We are better placed than carbon here, because we already have a console with a role ladder and an
activity page. Recommendation: **ship both.** Backup codes because the plugin gives them and a
single-admin deployment needs a self-service path, plus a console "Reset two-factor" action on the
user row, guarded at `ACCESS_ROLE` through the existing `refuseRoleChange`-style guards and written
to the activity log. That is carbon's auditable path without carbon's lockout cliff.

`accountLockout` is on by default at 10 failures per 900s. Leave it on. Note it interacts with the
existing rate limiter (see `redis.md`) and is account-scoped, not IP-scoped, which is the right
shape for this.

---

## Part 3: SSO

### The prerequisite nobody will enjoy

`@better-auth/sso@1.6.31` peers on `better-auth ^1.6.31`. We are on 1.6.25. There is no version of
the SSO package that works with what is installed.

Two routes:

- **Pin exact on the 1.6.x line.** Catalog `better-auth`, `@better-auth/passkey` and
  `@better-auth/sso` all to `1.6.33` with no caret. A caret on `^1.6.31` resolves to 1.7.5 today,
  which is the thing we are trying to avoid.
- **Do the 1.7 upgrade properly first.** `passkeys.md` already flags what that costs: 1.7 keys
  accounts on `(issuer, accountId)` and requires an `Account.issuer` backfill. Its own piece of
  work, its own PR, its own migration.

Recommendation: **pin exact to 1.6.33** so SSO is not held hostage by the 1.7 migration, and treat
1.7 as a separate scheduled upgrade. Accept that this creates a stale pin that `bun audit` will
eventually complain about, and record it in `dependencies.md` the way the other stale pins are.

Two repo-specific traps apply to that manifest edit, both already learned the hard way:

- **Do not run `bun update`.** It rewrites `package.json` incorrectly here. Hand-edit the catalog,
  then plain `bun i`.
- **Watch zod.** Any manifest edit in this repo can split the zod version and break the fumadocs
  types and the auth dts build. `@better-auth/sso` deps `zod ^4.3.6`; the catalog is `^4.4.3`.
  Check `bun pm ls | grep zod` resolves to one version before opening a PR.

### samlify

SAML support is `samlify`. Its advisory history is the reason to think before enabling SAML:

| Advisory            | Severity | What                                      | Patched   |
| ------------------- | -------- | ----------------------------------------- | --------- |
| GHSA-r683-v43c-6xqv | critical | SAML signature wrapping                   | 2.10.0    |
| GHSA-34r5-q4jw-r36m | high     | XML injection in AttributeValue, priv-esc | 2.13.0    |
| GHSA-8jjf-w7j6-323c | high     | auth bypass, token reuse across usernames | 2.4.0-rc5 |

The required `^2.13.1` is clear of all three **as of today**, and latest is 2.13.1. But three
advisories, two of them authentication-bypass class, in one XML signature library is a pattern.
The canary pre-push `bun audit` hook will be the thing that tells us when the fourth lands, and at
that point a pinned better-auth makes the patch harder to take.

**Therefore: ship OIDC first, SAML only on a named customer's written request.** OIDC covers
Okta, Entra ID, Google Workspace, Auth0, Keycloak and JumpCloud. SAML adds samlify, XML
canonicalisation, SP metadata hosting, certificate rotation and SLO. It is a different order of
maintenance for a smaller set of buyers.

### Who registers a provider, and how it is scoped

The plugin's model is domain-scoped: a user types an email, the domain matches an `ssoProvider`
row, they are redirected to that IdP. Registration goes through `/sso/register`.

The problem: `organizationPlugin` is registered server-side with teams enabled, but **there is
almost no organization UI**. The only references to `organization` in `web/next/src` are the client
plugin in `web/next/src/lib/auth/client.ts` and a column in the console user table. There
is no org creation, no org settings, no member management screen.

So do not build SSO as a self-serve org feature. Build it as a **console feature**, which is the
surface that already exists:

- A new `web/next/src/app/(console)/console/(access)/sso/` page, alongside `users/` and
  `allowlist/`, guarded at `ACCESS_ROLE` (`admin`) like the rest of `(access)`.
- Provider registration, edit and delete from there, calling `/sso/register`, `/sso/update-provider`,
  `/sso/delete-provider`.
- `organizationProvisioning.disabled: true` at first. Turn it on when org UI exists.
- Set the provider cap low (a handful) rather than leaving it unbounded.

Be careful with `/sso/register` itself: it is reachable through the catch-all for any authenticated
user. Confirm what authorization the plugin puts on it in 1.6.33 and, if it is weaker than
`ACCESS_ROLE`, refuse it at the router the way `06cd092` refused the dev-only disclosure. This
repo has already been bitten once by a plugin mounting endpoints whose own authorization was
weaker than the ladder: see the long `adminPlugin` comment in
`packages/auth/src/index.ts`.

### What to take from carbon's SSO, concretely

Their schema is the part worth copying almost as-is, adapted from company-scoped to whatever we
scope to:

- **Two tables, not one.** `ssoConnection` (the IdP binding) and `ssoDomain` (the claims), with the
  domain rows cascading off the connection. Better Auth's `ssoProvider` collapses both into one
  `domain` column, which cannot express "three verified domains and one pending".
- **`CHECK (num_nonnulls("metadataUrl", "metadataXml") = 1)`**, so exactly one metadata source is
  stored. Their UI error is worth stealing verbatim in spirit: reject both-or-neither explicitly.
- **A partial unique index for first-to-verify-wins**:
  `CREATE UNIQUE INDEX ... ON "ssoDomain" ("domain") WHERE "status" = 'verified'`. This is what
  makes the race safe without a lock, and it is why pending claims can coexist.
- **A partial unique index for one active connection**:
  `... ON "ssoConnection" ("companyId") WHERE "active" = TRUE`, because two concurrent upserts can
  both pass an app-side check.
- **Domain hygiene rules**: lowercased bare hostnames, punycode for IDNs, and public email
  providers (`gmail.com`, `outlook.com`) refused outright.
- **`requireSso` as a separate boolean from `active`**, so the path is always set up, prove a
  sign-in works, then enforce. Plus a documented SQL break-glass in the runbook.
- **Invite-first provisioning.** Better Auth's `disableImplicitSignUp: true` plus a `provisionUser`
  that refuses anyone without an invite is the direct equivalent, and it is the right default.

Better Auth's domain verification endpoints (`/sso/request-domain-verification`, `/sso/verify-domain`)
cover the DNS TXT dance, so unlike carbon we do not write `verification.server.ts` ourselves. Check
what challenge format it uses before designing the UI copy.

### Domain verification

`domainVerification.enabled` adds a `domainVerified` column plus `/sso/request-domain-verification`
and `/sso/verify-domain`. Anyone who can register a provider for `domain` can capture every future
sign-in for that domain. With registration locked behind the console this is less urgent, but turn
it on anyway before the feature is ever self-serve.

### The origin trap nobody mentions

Registering a provider fetches its OIDC discovery document, and the plugin will only fetch from an
origin in Better Auth's **single** `trustedOrigins` list. It has none of its own. That list is also
handed to the passkey plugin as its expected origins, and pinning those is the whole reason a
ceremony means anything, so widening it for an IdP would quietly widen what a passkey accepts.

Hence `BETTER_AUTH_SSO_ORIGINS`, merged into the plugin option and nowhere else. Two lists, two
meanings: browsers we serve, and servers we call.

A related trap, and the reason this took a while to see: **turbo strips any env var not named in
`globalEnv`**, so the schema reads `undefined` and the symptom is a trust failure under correct
configuration. `BETTER_AUTH_RP_ID` had the same gap since passkeys shipped, so that escape hatch
has never actually been reachable through a turbo build.

### Origins, again

Everything the passkey work learned about origins applies to SSO callbacks. `baseURL` is the **web**
origin on a public hosting suffix and the api origin otherwise, per the block at the top of
`packages/auth/src/index.ts`. The redirect URI handed to an IdP, and the SP ACS URL and
entity ID in SAML metadata, must be built from the same resolved origin the browser actually
loads, not from `HONO_APP_URL`. Expect this to be the part that costs a day when it is wrong,
because an IdP gives no useful error for a redirect-URI mismatch.

Every registered provider redirect URI is an external configuration living in someone else's
console. Changing a hostname means updating the IdP too. That makes SSO the **fifth** place a
hostname change has to land.

---

## Part 4: build order

### Chain A: 2FA (no dependency on chain B)

1. ~~**Schema and migration**~~ (done, `#57`, completed by `#61`). `twoFactor` table plus `user.twoFactorEnabled` in
   `packages/db/src/schema/auth.ts`, exported from `schema/index.ts`, added to the
   `drizzleAdapter` schema map in `packages/auth/src/index.ts`. Generate `0008_two_factor.sql`.
   Follow `0007_passkey.sql` for shape: FK with `ON DELETE cascade`, `twoFactor_userId_idx`.
   Add a `signInMethod` column to `session` in the same migration (see step 3).
2. ~~**Server plugin**~~ (done). Registered with `issuer: site.name` and `allowPasswordless: true`,
   the table wired into the `drizzleAdapter` map, and a `twoFactorAvailable` export. Named that way
   and not `twoFactorEnabled`, which is the per-user column and means something else entirely.
3. ~~**Record the sign-in method on the session**~~ (done). `@/sign-in-method` resolves it from the
   endpoint that mints the session, and the create hook merges it in. The social callback names its
   provider from the route parameter, so a fork adding a provider is covered without an edit;
   impersonation is named as itself so no exemption can match it; the agent route passes it
   explicitly, having no endpoint context at all. SSO's paths are deliberately absent until the
   plugin exists.
4. ~~**The gate**~~ (done). `@/two-factor-gate`, matching `/callback/:id` and
   `/passkey/verify-authentication`. Shaped as a plugin, because that is the only extension point
   taking a matcher: the top-level `hooks` option is one middleware run on every request.
   Trust-this-device is deliberately not replicated, so the UI never offers it: doing it correctly
   means reproducing an HMAC and its rotation, and doing it subtly wrong means silently skipping
   challenges.
5. ~~**Client plugin**~~ (done). `twoFactorClient({ onTwoFactorRedirect })`, which routes a passkey
   sign-in; a social callback is a browser navigation and is redirected server-side instead.
6. ~~**Enrolment UI**~~ (done). `/settings/two-factor`. QR on a white plate in both themes, since an
   inverted one does not scan, and the secret in full beneath it, since it is the fallback for
   exactly the people who cannot scan.
7. ~~**Challenge screen**~~ (done). `/two-factor`, outside `(protected)` because it is reached with
   no session, and chromeless so the navbar offers no way around it. `redirectTo` is not preserved:
   the original destination lives in the OAuth state, and everyone lands on the dashboard.
8. ~~**Console reset action**~~ (done). "Reset two-factor" on the console user row, guarded by
   `refuseTwoFactorReset` (the ban rank rule, and self is refused because settings is where you do
   that with your own code in hand), written to the activity log. The `twoFactor` row is deleted
   rather than the flag cleared, so re-enabling cannot resurrect a factor whose codes are on a
   phone nobody has.
9. **Enforcement, if wanted** (~2 h). A `requireTwoFactor` flag plus a full-screen enrol prompt.
   Carbon's `MfaEnrollmentRequired.tsx` is 242 lines and shows what "no way past it" looks like.
   Fail open on lookup errors. Defer unless decision 4 says yes.
10. **Docs** (~45 min). `web/next/content/docs/` still has no two-factor page: this file and the
    PR bodies are the record so far. Worth writing when enforcement is decided, so the user-facing
    page does not have to be rewritten a week later.

Total: roughly 12-15 h through step 8, plus 2 h for enforcement.

**What is verified and what is not.** Enrolment, the challenge screen and the verify round trip were
driven end to end in a browser against a disposable database: a real QR, a real TOTP computed from
the secret, backup codes, disable, re-enrol. The gate's handler is covered by `tests/`, pointed at
an endpoint an in-memory instance can reach. **Nobody has been through the gate on a real social
callback or passkey sign-in**, because neither can be driven locally without the account owner's
credentials. It is safe to ship unproven only because the gate does nothing for a user whose
`twoFactorEnabled` is false, and that is every user until someone enrols.

### Chain B: SSO

1. ~~**Upgrade or pin**~~ (done, `#64`, and it cost far more than the 2 h estimated here).
   Went to **1.7.5, not the recommended exact 1.6.33**, for two reasons. Exact pinning in the
   catalog is impossible: `deps-manager.ts` rewrites a plain version to a caret on every install,
   and `^1.6.33` floats to 1.7.5 anyway. And 1.6.33 leaks `better-call`'s middleware types into the
   auth dts with no dependency able to name them, a list that grew as each was satisfied; 1.7.5
   leaks only zod, which one exact override fixes. That override forced a fumadocs bump with it.
   No migration: the `Account.issuer` backfill the passkeys note anticipated does not exist in
   1.7.5. Follow-up `#66` added two organization columns 1.7 wants that `#64`'s own diff missed,
   because the team fields are built inline rather than in the plugin's `schema:` block.
2. ~~**Add `@better-auth/sso`**~~ (done, `#65`). samlify lands at 2.13.1, clear of all three of its
   advisories; `bun audit` clean.
3. ~~**Schema and migration**~~ (done, `#65`). `0010_sso_provider.sql`. `userId` is `set null`
   rather than cascade, so deleting the admin who set SSO up cannot delete the connection and lock
   out the domain.
4. ~~**Server plugin, OIDC only**~~ (done). `disableImplicitSignUp: true` is the load-bearing
   choice: the plugin's own `validateEmailDomain` gates only whether an assertion may LINK to an
   existing account, not whether the sign-in proceeds, so without it a provider registered for one
   domain could mint an account for another.
5. ~~**Router guard**~~ (done). Confirmed necessary rather than precautionary: the plugin guards
   all three management endpoints with `sessionMiddleware` alone, so any signed-in user could
   register a provider for any domain.
6. **Console UI** (~1 day). `console/(access)/sso/`: list, register, edit, delete, plus the
   domain-verification flow.
7. **Sign-in UI** (~3 h). "Sign in with SSO", email typed first, domain looked up, redirect.
8. **Docs** (~1 h). Including an operator runbook: what to give an IdP admin (redirect URI,
   issuer), what to get back (client id, secret, discovery URL), and that its origin must go in
   `BETTER_AUTH_SSO_ORIGINS`.

Total: roughly 2-3 days for OIDC. SAML adds 1-2 days and the samlify maintenance burden.

---

## Part 5: decide before you start

1. **~~2FA gate: sign-in or step-up?~~ Settled by carbon: gate sign-in, every method.** See Part 2.
   What is still open is whether step-up on console actions ships as a follow-up.
2. **Backup codes, admin reset, or both?** Recommendation: both. Carbon chose admin-reset-only and
   documented the lockout cliff it creates.
3. **Pin exact 1.6.33, or do the 1.7 migration first?** Part 3. Recommendation: pin.
4. **Is 2FA mandatory, and scoped to what?** Carbon scopes the requirement to a company and holds a
   multi-company user to the strictest one. We have no org UI, so the only coherent scopes here are
   "everyone" or "console roles at `ACCESS_ROLE` and above". Recommendation: console roles, once
   the reset action exists.
5. **OIDC only, or SAML too?** Recommendation: OIDC now, SAML on a named request. Note carbon
   shipped SAML only, because GoTrue gave them no choice. We do have a choice.
6. **Do we ship an email sender?** It unblocks magic link, OTP as a second factor, and the receipt
   emails carbon sends on every 2FA change (`MfaEnabledEmail`, `MfaRequiredEmail`). Not in scope
   here, but every path above gets easier with one.

## Part 6: how to test

The repo's `test` script (`bun test tests`) was wired but inert, because `tests/` did not exist. It
does now, so **CI runs it**: `bun run test` in `auto-check-build.yml` is no longer a no-op. Root has
no better-auth dependency and adding one would be a manifest edit, which splits zod here, so the
integration test imports better-auth by path from `packages/auth/node_modules`.

- **TOTP** is fully testable headlessly, unlike passkeys. Generate the secret, compute the code
  with any TOTP implementation, post it to `/two-factor/verify-totp`. There is no biometric
  prompt in the way, so unlike `passkeys.md` this feature can actually be proven before it ships.
- **Backup codes**, if we keep them: verify one, verify single-use, verify regeneration invalidates the old set.
- **Admin reset**: confirm it clears the factor, that the next sign-in is unchallenged, and that it lands in the activity log.
- **Lockout**: 10 bad codes, confirm the account locks and that a good code afterwards still fails
  until the window passes.
- **OIDC**: run Keycloak or Dex in Docker as the IdP. `docker-compose.yml` already exists to extend.
  Do not test against a real Okta tenant first.
- **SAML**, if it happens: `samltest.id` or a local SimpleSAMLphp. Verify signature validation
  actually rejects a tampered assertion. That is the whole point of the library and the thing its
  advisories were about.
- **Origins**: test all three deployment shapes, the same three `passkeys.md` lists, before
  believing any callback works.

## Known traps

1. **The matcher gap.** Registering `twoFactor()` and calling it done ships a control that gates
   nothing on this codebase. This is the trap, above all others.
2. **Session classification.** Once an SSO account is linked, its identity is permanent. Asking
   "does this user have an SSO identity" instead of "did this session authenticate via SSO" lets a
   linked user's magic-link login skip the challenge and bypass Require SSO. Carbon hit this and
   split it into two functions with a warning comment. Better Auth has no `amr` claim, so we must
   record the method ourselves.
3. **`allowPasswordless`.** Without it, nobody in this database can enable 2FA at all.
4. **Fail open or closed.** Carbon fails open on a factor-lookup error so a Redis blip cannot lock
   out every enrolled user, and closed only in a controlled environment. Pick one deliberately and
   write down which.
5. **`bun update`** corrupts `package.json` here. Hand-edit the catalog, then `bun i`.
6. **zod splitting** on any manifest edit, breaking fumadocs types and the auth dts build.
7. **A caret on `^1.6.31` resolves to 1.7.5**, which is the upgrade we are deferring. Pin exact.
8. **Reading the wrong carbon.** `~/sidd-oss/carbon` is a stale branch two months behind and has
   neither feature. Use `~/work/carbon` on `main`.
