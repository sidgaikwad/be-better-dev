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
  parses attacker-supplied YAML; nothing here ships to production. The pin is global, because bun
  does not support nested overrides, but `cosmiconfig` is now the only thing in the tree that
  resolves `js-yaml` at all, so the pin has exactly one target. The root package used to declare
  `js-yaml` as a direct dependency (catalog `^5.2.3`) which this override then dragged onto the 4.x
  line; that dependency was vestigial, since nothing imports it and frontmatter is parsed with
  `Bun.YAML.parse`, so it and its catalog entry were removed rather than left to read as a
  contradiction.
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

### esbuild → ^0.28.1

- **Advisory**: [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99), moderate.
  esbuild's dev server answers requests from any website and lets it read the response. Affects
  `<=0.24.2`; the fix first shipped in `0.25.0`, so there is no patched 0.18.x to move to.
- **Why an override**: the single vulnerable copy was `esbuild@0.18.20` under
  `@esbuild-kit/core-utils@3.3.2`, reached as `@packages/db` → `drizzle-kit` →
  `@esbuild-kit/esm-loader` → `@esbuild-kit/core-utils`. Every rung above it is closed.
  `core-utils` declares `esbuild ~0.18.20`, a tilde ceiling that cannot reach `0.25.0`, and both
  `@esbuild-kit/core-utils@3.3.2` and `@esbuild-kit/esm-loader@2.6.5` are final releases marked
  deprecated ("Merged into tsx"), so no parent bump will ever lift it. `drizzle-kit@0.31.10` is
  already latest and still declares `@esbuild-kit/esm-loader ^2.5.5`. The `^0.28.1` line is chosen
  because it is the only one that stays inside what the healthy consumers already declare
  (`tsx ^0.28.1`, `fumadocs-mdx ~0.28.0`); pinning lower, at `^0.25`, would drag `fumadocs-mdx`
  below its declared floor and put the web build at risk to fix a dev-only CLI.
- **Risk**: low, and measured rather than assumed. The pin forces two consumers off their declared
  ranges, `@esbuild-kit/core-utils` (`~0.18.20`) and `drizzle-kit` (`^0.25.4`), so both were
  exercised directly: `bun run db:generate` loads `drizzle.config.ts` through the core-utils loader
  and read every table before reporting no schema changes, and a forced `bun run build` compiled
  `fumadocs-mdx` and `tsdown` clean. Worth recording that the advisory was never reachable here
  anyway: it concerns esbuild's dev server, and nothing in this repository starts one. esbuild is
  build-time tooling that never reaches a shipped bundle. The pin also collapses two duplicate
  esbuild toolchains into one, which drops 50 packages from the tree.
- **Exit criteria**: remove once `drizzle-kit` drops `@esbuild-kit/esm-loader` for the `tsx`
  dependency it already carries, which would take the last `~0.18.20` pin out of the tree.

### qs → ^6.16.0

- **Advisory**: two moderate advisories against `>=6.14.2 <=6.15.3`:
  [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx) (array-limit bypass via
  bracket-key comma parsing) and
  [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g) (denial of service via
  attacker-controlled `isBuffer`). Both fixed in `6.16.0`.
- **Why an override**: the only copy is reached as `@web/next` → `shadcn` →
  `@modelcontextprotocol/sdk` → `express` → `body-parser` → `qs`. No parent bump raises the floor:
  `body-parser@2.3.0` and `express@5.2.1` are both already the latest releases, and they declare
  `qs ^6.15.2` and `qs ^6.14.0`, ranges that admit the vulnerable and the patched build alike, so
  bun had no reason to move off a `6.15.3` that still satisfied both. `6.16.0` sits inside both
  ranges, so this is a lockfile lift rather than a version a parent rejects. Same trap as the
  `fast-uri` entry above, and the same `@modelcontextprotocol/sdk` stale pin called out under
  `hono`.
- **Risk**: low. Minor-version move inside the range every consumer already declares, and the whole
  chain is dev-only: `shadcn` is component-sync tooling, and the Express server it carries through
  `@modelcontextprotocol/sdk` is never started by anything in this repository, so nothing here
  parses an attacker's query string through it.
- **Exit criteria**: remove once `express` or `body-parser` declares `qs >= 6.16.0`.

## Removed overrides

### hono → ^4.13.7, removed

Pinned to reach the copy under `shadcn › @modelcontextprotocol/sdk`, which the catalog bump to
`^4.13.7` left at `4.12.32`, and carried the exit criteria "remove once `@modelcontextprotocol/sdk`
resolves `hono >= 4.12.34` on its own". It now does. That `4.12.32` was a stale lockfile entry
frozen from when the catalog still sat at `^4.12.31`, not a range the SDK rejects, and nothing in
the tree caps hono below the fix line: every declared range is open-ended upward (`^4`, `^4.10.8`,
`^4.11.2`, `^4.11.4` from the SDK itself, `^4.12.5`, `>=4.11.2`, and the catalog's own `^4.13.7`).
Dropping the pin leaves a single `hono@4.13.7` both against the committed lockfile and on a resolve
from an empty `bun.lock` and `node_modules`, with no hono advisory at any severity rather than only
under the `high` gate. The catalog bump alone lifts the whole tree, so the override sat a rung below
what the job needed. Kept here as the record of why it went rather than why it stayed.

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
