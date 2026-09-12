---
name: audit
description: Run the dependency security audit and maintain .github/notes/dependencies.md. Use when the canary pre-push audit hook fails, or when `bun audit` flags a high advisory.
source: https://github.com/nrjdalal/zerostarter
---

> [!CAUTION]
> Synced from https://github.com/nrjdalal/zerostarter. Customize this skill or remove this note to stop syncing.

# Dependency Audit

The pre-push hook runs `bun audit --audit-level high`, on `canary` only (`lefthook.yml`). `.github/notes/dependencies.md` is the canonical record of every active override, and it stays in place even when there are none.

## 1. Run

```bash
bun audit --audit-level high
```

Done when the output is clean, or you have the list of high advisories to clear. The hook and CI gate on `--audit-level high`; plain `bun audit` also lists moderate and low, worth a look before calling a tree clean.

## 2. Fix on the highest rung that works

Fix each advisory on the highest rung that lifts the whole tree; drop a rung only when the one above cannot:

1. **Update the vulnerable dependency** (best): bump its `catalog:` entry in the root `package.json`.
2. **Update the parent** that pins the vulnerable transitive dependency.
3. **Override** (last resort): pin the patched version in root `overrides`:

   ```json
   "overrides": { "<vulnerable-package>": "<patched-version>" }
   ```

Then `bun i` and prove nothing broke. Done when `bun run check-types && bun run build` pass and `bun audit --audit-level high` reports no high advisories.

### Bun specifics that decide the rung

- **`bun update <pkg>` corrupts the manifest.** It rewrites root `package.json`, replacing a `catalog:` reference with a literal range and adding the package as a direct dependency, and it still does not lift the nested copy you aimed it at. Hand-edit the `catalog:` entry and run plain `bun i`.
- **There are no nested overrides.** `"overrides": { "<parent>": { "<pkg>": "..." } }` earns `warn: Bun currently does not support nested "overrides"` and is ignored, so a pin cannot be scoped to one parent. Every entry is global, which is how a pin quietly drags an unrelated direct dependency onto an old major.
- **Most advisories are stale lockfile pins, not version conflicts.** When the parent's declared range already admits the patched build (`ajv` asks for `fast-uri ^3.0.1`, `express` for `qs ^6.14.0`), no parent bump raises the floor, and bun keeps the vulnerable version because it still satisfies. Rung 3 is then the only rung that moves it, and it is low risk precisely because the patched version sits inside the range the parent already declares. Put that reasoning in **Why an override**.

Bun's advisory paths name workspace ancestors, not the parent that pins the version, so resolve the real chain before picking a rung:

```bash
grep -oE '"[^"]*<pkg>[^"]*": \["<pkg>@[0-9][^"]*' bun.lock   # every copy, and the version it resolved to
grep -oE '"<pkg>": "[^"]*"' bun.lock                          # every range that asks for it
```

Then check each parent on the registry. A parent already on its latest release whose range still admits the vulnerable build cannot be bumped into a fix, and one pinned by a deprecated final release (`@esbuild-kit/core-utils`, permanently at `esbuild ~0.18.20`) never will be. Where no single version satisfies every declared range, a global pin has to force someone off theirs: take the line that keeps the consumers that matter inside their ranges, and exercise the ones you force rather than assuming they cope.

## 3. Record every override

Every entry in root `overrides` needs a matching block in `.github/notes/dependencies.md`, in the file's existing shape: one `### <package> → <version>` under `## Active overrides`, carrying **Advisory** (link, severity, affected range), **Why an override** (why an update or parent bump can't lift the tree), **Risk**, and **Exit criteria** (when to remove it). Delete a block when its override goes. Done when every override has a block and no block outlives its override.

## 4. Ship

`package.json`, `bun.lock`, and `.github/notes/dependencies.md` go through a normal PR.
