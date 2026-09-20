---
name: ui-verify
description: Verify a frontend or UI change in a real browser. Use after any change to web/next pages, components, or styles, before opening or updating a PR, or when an end-to-end flow needs checking.
source: https://github.com/nrjdalal/zerostarter
---

> [!CAUTION]
> Synced from https://github.com/nrjdalal/zerostarter. Customize this skill or remove this note to stop syncing.

# UI Verify

A green type-check and a clean lint prove the code compiles, not that the page renders. Drive it in a real browser before the PR.

## 1. Run the stack

Start the dev servers (`dev` skill). Under the default portless dev the base URLs are named and branch-prefixed, so resolve them once: `WEB=$(bunx portless get be-better-dev)` and `API=$(bunx portless get api.be-better-dev)` (or `PORTLESS=0 bun run dev` for the fixed `http://localhost:3000` / `http://localhost:4000`). Done when `$WEB/` returns 200 and `$API/api/health` responds ok.

## 2. Drive the affected route

Load the `agent-browser` skill, then open the route you changed and act on it:

```bash
agent-browser open "$WEB/<route>"
agent-browser snapshot   # read the page, then click/type/verify
```

Behind auth, sign in first with the **Login (agents)** button (shown once `AGENT_SIGNIN_ENABLED=true`) or the local sign-in (`dev` skill). For an end-to-end change, or whenever asked, drive the whole flow, not just the screen you touched. Done when you have watched the change render and behave, not merely that the route loaded.

## 3. Check it holds up

- **Visual:** capture before and after at the same viewport (the 1782×972 default, `agent-browser set viewport 1782 972`; see the `agent-browser` skill). The "before" is the pre-change state: `git stash` (or check out the pre-change commit), `agent-browser screenshot before.png`, then restore your change and `agent-browser screenshot after.png`.
- **Responsive:** check mobile, tablet, and desktop with `agent-browser set viewport <w> <h>`, and confirm no horizontal overflow: `agent-browser eval 'document.documentElement.scrollWidth <= document.documentElement.clientWidth'`.
- **Theme:** toggle the app's theme control and check light and dark whenever the change touches either.

Done when Visual, Responsive, and Theme are each exercised (or consciously marked N/A) for the surfaces this change touches.

## 4. Attach evidence to the PR

Drag each screenshot into the PR description or a comment box on github.com. GitHub uploads it, hosts it on its own CDN, and writes the `![](...)` markdown for you. Never commit a binary screenshot.

This is the one step an agent cannot finish. The upload endpoint authenticates with the browser session, not a token, so `gh` cannot reach it: an agent writes the body, says where the files are, and leaves the drag to a human. Put them somewhere easy to drag from and name them for where they go (`before-leaderboard.png`, `after-leaderboard.png`).

Do not reach for a public paste host instead. The old instruction here was litterbox, which now answers 403 to everything including a plain homepage GET; 0x0.st has turned uploads off entirely. Both were temporary by design, so the links rotted out of merged PRs anyway, while a GitHub-hosted image lives as long as the PR. Shopping for another host also means publishing the screenshots somewhere the maintainer never chose, so ask first if GitHub is genuinely unavailable.

Done when every screenshot (before+after pairs for a visual change) is embedded in the PR, or the PR says which files are still to be attached and where they are.
