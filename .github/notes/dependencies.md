# Dependencies

Canonical record of every entry in the root `overrides`. Add a block when an override goes in,
delete it when the override goes. See the `audit` skill for the procedure.

## Active overrides

### js-yaml → ^4.3.2

- **Advisory**: [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh), high.
  `maxTotalMergeKeys` does not limit CPU use for empty merge sources. Affects `>=4.0.0 <4.3.2`.
  Supersedes [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj), the
  `!!omap` advisory this override was originally opened for.
- **Why an override**: the only consumer is `cosmiconfig@9`, reached through `@commitlint/cli`
  and `shadcn`. `cosmiconfig@10.0.1` moved to `js-yaml ^5.4.1` and would lift this on a higher
  rung, but neither parent has adopted it: `@commitlint/load@21.2.2` and `shadcn@4.21.0` both
  still declare `cosmiconfig ^9`. `4.3.2` sits inside the `^4.1.0` range cosmiconfig already
  declares, so this is a lockfile lift rather than a version the parent rejects. `bun update`
  will not perform that lift on its own, because the pinned `4.3.1` already satisfies the range.
- **Risk**: low. Both consumers are dev-only tooling (commit linting, component sync) and neither
  parses attacker-supplied YAML; nothing here ships to production. Note the override is global, so
  it also pins the root's own `js-yaml` dependency, which the catalog puts at `^5.2.3`. Nothing in
  this repository imports `js-yaml`, so that entry is vestigial and the pin costs nothing.
- **Exit criteria**: remove once `@commitlint/cli` and `shadcn` resolve `cosmiconfig >= 10.0.1`,
  or `js-yaml >= 4.3.2`, on their own.

### fast-uri → ^3.1.7

- **Advisory**: four high advisories against `>=3.1.3 <3.1.6`, all reachable through URI parsing:
  [GHSA-5jgf-p345-68v8](https://github.com/advisories/GHSA-5jgf-p345-68v8) (host confusion via
  skipped IDN canonicalization on scheme-relative references),
  [GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc) (SSRF via malformed
  IPv6 normalization), [GHSA-fph4-wmhf-6fwf](https://github.com/advisories/GHSA-fph4-wmhf-6fwf)
  (SSRF via repeated hostname percent-decoding), and
  [GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp) (host confusion via
  percent-encoded scheme normalization).
- **Why an override**: fast-uri is never a direct dependency. It arrives under `shadcn`, and under
  `ajv` by way of `@commitlint/cli` → `@commitlint/load` → `@commitlint/config-validator`. There
  is no catalog entry to bump and no parent release that moves off the affected range, so the pin
  is the only rung available. This override already existed at `^3.1.5`, which the advisories
  later grew to cover; only the floor moved.
- **Risk**: low. Both paths are dev-only tooling and neither resolves URIs from untrusted input.
- **Exit criteria**: remove once `shadcn` and `ajv` resolve `fast-uri >= 3.1.6` unaided.

### hono → ^4.13.7

- **Advisory**: seven advisories against `hono < 4.12.34`, six moderate and one low. The one that
  is actually reachable here is
  [GHSA-8j4g-w8fx-2239](https://github.com/advisories/GHSA-8j4g-w8fx-2239), ReDoS in the CORS
  middleware via `Access-Control-Request-Headers`, which matters because `api/hono/src/index.ts`
  mounts `cors()` on `*`. The rest need entry points this repository does not use: `memo()` and
  `hono/jsx` ([GHSA-f23p-vx2j-j53r](https://github.com/advisories/GHSA-f23p-vx2j-j53r), the
  cross-user SSR disclosure), `toSSG()`, the Proxy Helper, and the Language middleware.
- **Why an override**: the catalog bump to `^4.13.7` lifts every workspace copy, which is what
  fixes the reachable one. It does not reach the copy under
  `shadcn › @modelcontextprotocol/sdk`, which stayed pinned at `4.12.32`. That is a stale lockfile
  pin rather than a version conflict: the SDK declares `hono ^4.11.4` and has done through its
  latest release, so `4.13.7` is inside the range it already accepts and bun simply had no reason
  to move off a version that still satisfied it. Same trap as the js-yaml entry above, and the
  global override is likewise the only rung that moves it.
- **Risk**: low. The pin agrees with the catalog rather than fighting it, so every consumer lands
  on one version, and the only copy it forces is under `shadcn`, dev-only component sync tooling
  that never serves a request.
- **Exit criteria**: remove once `@modelcontextprotocol/sdk` resolves `hono >= 4.12.34` on its own.

### postcss → ^8.5.26

- **Advisory**: [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8), high,
  against `nanoid < 3.3.17` (custom generators loop forever when `size` is 0), not against
  postcss itself.
- **Why an override**: postcss is the only thing pulling the 3.x line of nanoid. `postcss@8.5.26`
  requires `nanoid ^3.3.17`, so bumping the parent lifts the advisory without touching nanoid
  directly. A global `nanoid` override was rejected deliberately: `@scalar/types` wants `^5.1.6`
  and `@web/next` wants `^6.0.0`, and pinning everything to the 3.x line would break both.
  This entry pre-dates the advisory (it was already pinned at `^8.5.23`); only the floor moved.
- **Risk**: low. Patch-level move inside the range every consumer already accepts.
- **Exit criteria**: remove once every parent resolves `postcss >= 8.5.26` unaided.

## Removed overrides

### brace-expansion → ^5.0.9, removed

Inherited from the ZeroStarter scaffold with no advisory or rationale recorded, and its block
carried the exit criteria "drop it, reinstall, and delete this block if the audit stays clean".
Doing exactly that shows the pin was inert: the only requester declares `brace-expansion ^5.0.5`
and already resolves to `5.0.9` unaided, so removing the override left every resolution in
`bun.lock` untouched and `brace-expansion` carrying no advisory at any severity, not just under
the `high` gate. Kept here as the record of why it went rather than why it stayed.

### sharp → ^0.35.3, removed

Held the libheif advisory [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c)
(`sharp < 0.35.4`) off two paths: sharp as a direct dependency of `@web/next`, and sharp as a
dependency of `next` itself. Moving the catalog entry to `^0.35.4` lifts both, because `next`
declares a range that already accepts it, so the pin was doing no work the catalog was not. Kept
here as the record of why it went rather than why it stayed.
