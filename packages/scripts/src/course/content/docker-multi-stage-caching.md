The Small images lesson in chapter 5 walked the newsletter image from 2.31GB to 88MB and turned quarter-hour rebuilds into seconds with cargo-chef. Then, some Tuesday, CI is slow again and nobody knows why. This lesson is the machinery: the exact cache rules, so a miss is something you diagnose instead of shrug at.

## What the cache actually keys on

BuildKit reuses a layer when two things hold: the parent chain above it is identical, and the instruction itself is unchanged. For `RUN`, "unchanged" means the command text (Docker cannot see that `apt-get update` would download different bytes today). For `COPY` and `ADD`, it additionally means a content hash of the copied files, contents and permissions, not timestamps. The first miss invalidates everything after it, because every later layer's parent chain now differs. Watch the `=> CACHED` markers in build output; the first step without one is where your problem starts.

Two corollaries. Order instructions by volatility, stable things first, which chapter 5 stated as advice and you can now derive from the rule. And one stray file in a `COPY` set busts the build: an editor swap file, or worse, a `target/` directory not listed in `.dockerignore`, which both uploads gigabytes of context and changes the `COPY . .` hash after every local `cargo` run.

## Why cargo makes this hard

Most ecosystems copy the lockfile, install dependencies into one fat cached layer, then copy source. Cargo has no `install` phase to hijack: dependencies are compiled from source as part of your build, and no `cargo build --only-deps` exists. So the naive `COPY . .` followed by `cargo build --release` puts every source edit upstream of the compile layer, and one changed handler recompiles tokio, actix-web, and sqlx.

The folk fix predates cargo-chef: copy `Cargo.toml` and `Cargo.lock`, write a dummy `fn main() {}`, build, then copy the real source and build again. It works until it does not. Workspaces multiply the manifests to fake. Feature unification shifts what "the dependencies" even are. And there is a nastier failure: `COPY` preserves file metadata, cargo's fingerprinting compares mtimes, and the real `main.rs` can look no newer than the dummy build, so cargo skips the rebuild and the image ships your `fn main() {}`. People have deployed that.

## What prepare and cook really do

`cargo chef prepare` reduces the project to `recipe.json`: the manifests and lockfile, with your actual code stripped out. It is deterministic, so any edit that leaves dependencies alone produces a byte-identical recipe. `cargo chef cook` reconstructs a stub project from the recipe, builds only the dependencies, then scrubs the stub's fingerprints so the later real build cannot be poisoned by the dummy-main trap above.

Now reread chapter 5's Dockerfile as cache design. The planner stage reruns on every edit, but stages cache independently and only what you `COPY --from` matters. The builder copies just `recipe.json`; identical bytes, cache hit, so `cook`, the expensive layer, stays warm, and the final `cargo build` compiles only your crate.

## Where the cache lives

All of this sits in the builder's local layer store, which is the CI trap: an ephemeral runner starts empty, and cargo-chef alone changes nothing. The fix is exporting the layer cache, `--cache-to`/`--cache-from type=registry` (or the GitHub Actions cache backend in buildx), which works precisely because chef shaped the expensive work into ordinary layers. The alternative school is BuildKit cache mounts, `RUN --mount=type=cache` on the cargo registry and `target/`: genuinely incremental compiles, but the mount lives outside layers and cannot be pushed to a registry, so it shines on persistent builders and evaporates on throwaway VMs. Persistent runner: mounts. Ephemeral runners: chef plus registry cache. Both: fine.

## Predict, then verify

You bump the builder base from `rust-1.85` to a newer toolchain tag, changing only the `FROM` lines. Dependencies untouched. Which layers survive?

Answer: effectively none. `FROM` is the root of the parent chain, so every layer in every stage that uses it now has a different ancestry, including the cook layer, and the whole dependency set rebuilds. That is the cache rule working as designed: a new compiler must not serve artifacts built by the old one. Budget a slow build after every toolchain bump, and batch them accordingly.
