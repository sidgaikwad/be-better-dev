# Dependencies

Canonical record of every entry in the root `overrides`. Add a block when an override goes in,
delete it when the override goes. See the `audit` skill for the procedure.

## Active overrides

### js-yaml → ^4.3.1

- **Advisory**: [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj), high.
  Quadratic CPU consumption resolving `!!omap`. Affects `>=4.0.0 <4.3.1`.
- **Why an override**: the only consumer is `cosmiconfig@9`, reached through `@commitlint/cli`
  and `shadcn`. Neither parent has published a release that moves off the affected range, and
  `4.3.1` sits inside the `^4.1.0` range cosmiconfig already declares, so this is a lockfile lift
  rather than a version the parent rejects.
- **Risk**: low. Both consumers are dev-only tooling (commit linting, component sync) and neither
  parses attacker-supplied YAML; nothing here ships to production.
- **Exit criteria**: remove once `@commitlint/cli` and `shadcn` resolve `js-yaml >= 4.3.1` on
  their own.

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

### brace-expansion → ^5.0.9, fast-uri → ^3.1.5, sharp → ^0.35.3

- **Advisory**: not recorded.
- **Why an override**: inherited from the ZeroStarter scaffold; the upstream rationale was not
  carried over when this repository was re-baselined.
- **Risk**: unknown, presumed low. All three resolve clean under `bun audit --audit-level high`.
- **Exit criteria**: drop each one, reinstall, and delete it here if the audit stays clean.
