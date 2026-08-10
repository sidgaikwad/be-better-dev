A feature request for the newsletter service: when an admin drafts an issue, show the rendered email next to the editor, live. Three designs present themselves. Round-trip to the server per edit: correct, but every keystroke rides the network. Reimplement the renderer in TypeScript: fast, and now two renderers drift until the preview looks fine and the sent email is broken. Or: compile the server's actual renderer to wasm and run it in the admin's browser.

Before building the third, earn it. Wasm is not "make the frontend fast"; it wins some workloads and loses others, on the mechanics you already know.

## When wasm wins, when it loses

Wasm wins on compute-dense inner loops over data it already holds: parsing, diffing, compression, cryptography, image transforms, template rendering. No GC pauses, no JIT warmup or deopt cliffs, real SIMD; performance is flat and predictable in a way JS engines cannot promise.

It loses wherever the boundary lesson said it would. DOM-heavy features cross into the browser per touch. Chatty APIs spend their winnings on copies and transcoding. Tiny workloads never amortize the crossing, and a JIT running monomorphic numeric JS is closer to wasm than folklore suggests. And Amdahl arbitrates everything: make rendering 4x faster when rendering is 8 percent of the interaction, and you have improved the interaction by 6 percent. Profile first; count crossings per unit of work; speed up something that dominates.

The preview renderer passes: pure compute (string in, string out), one crossing per render, no DOM work inside, and fidelity, not speed, is the motive. The wasm build exists so that the preview cannot lie.

## The project: one renderer, two hosts

The delivery lessons sent `content.html` built by the API. Extract that logic into a pure crate, the workspace trick from the crates-and-workspaces lesson:

```
crates/email-template/        # pure logic: no tokio, no sqlx, no IO
crates/email-template-wasm/   # cdylib wrapper, wasm-bindgen
```

```rust
// email-template/src/lib.rs
pub struct RenderedEmail { pub html: String, pub text: String }

pub fn render(issue: &Issue) -> RenderedEmail {
    // escaping, layout, inlined styles; a pure function of its input
}
```

The API's delivery worker calls `render` natively, exactly as before. The wrapper exports it across the boundary, coarse by design:

```rust
// email-template-wasm/src/lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn render_preview(issue_json: &str) -> Result<String, JsError> {
    let issue: email_template::Issue = serde_json::from_str(issue_json)?;
    Ok(email_template::render(&issue).html)
}
```

JSON in, HTML out, one crossing per preview. The admin page lazy-loads the module with the previous lesson's `import()` pattern and renders into a sandboxed iframe:

```js
const wasm = await getRenderer()
editor.addEventListener(
  "input",
  debounce(() => {
    preview.srcdoc = wasm.render_preview(JSON.stringify(issueFromForm()))
  }, 150),
)
```

Every preview is produced by the same compiled crate, same commit, that the server will run at send time. There is no second implementation to drift.

## What the split buys beyond the preview

The extraction earns its keep twice more. First, the wasm build in CI is a portability tripwire: the moment someone leaks `tokio`, `sqlx`, or filesystem access into `email-template`, the `wasm32-unknown-unknown` build breaks, which is the compiler enforcing "rendering is pure" as a structural property. Second, purity makes the renderer trivially testable: no wiremock, no database, just inputs and expected HTML, the cheapest tests in the whole workspace. One caution from the boundary lessons: keep host-dependent behavior (clocks, locales, randomness) out of `render`, or pass it in as data; the preview and the worker should be handed identical inputs, because identical inputs are the whole guarantee.

## Predict, then verify

A month later an admin reports: the preview showed a subscriber's name, but the delivered email showed a blank. Two renderer implementations would be the prime suspect. Under this architecture, where do you look?

Answer: at the inputs, not the renderer. Both hosts run the same crate, so divergence means they were handed different `Issue` data: the preview built its JSON from unsaved form state while the worker rendered what was actually stored, or the deployed wasm bundle is stale relative to the server build. Check the JSON the preview passed against the row the worker read, then check bundle versions. A single implementation converts "which renderer is wrong" into "which input is wrong", a strictly easier bug, which was the point of compiling the truth instead of copying it.
