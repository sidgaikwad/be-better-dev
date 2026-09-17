Time to assemble the tool this section has been circling. The course you are reading right now is served by an API at `http://localhost:4100`, the same one the web app calls, and it speaks a small, regular dialect: every response wraps its payload in `{ "data": ... }`, and three endpoints cover a terminal workflow.

- `GET /api/v1/learn/stats`: XP, level, streak, reviews due
- `GET /api/v1/learn/review`: quiz items due now, oldest first
- `POST /api/v1/learn/review/submit`: grade a batch of answers

Authentication is the session cookie you dissected in chapter 10: log into the web app, copy the session token out of devtools (this app's cookie is named `better-auth.session_token`), and run `bbd login`, which prompts without echoing and writes the `0600` config file from the config lesson.

## The client

The HTTP side is chapter 7's discipline in miniature: build one `Client`, set the timeout at construction, reuse it for every request.

```rust
fn client() -> anyhow::Result<reqwest::blocking::Client> {
    Ok(reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()?)
}
```

Blocking, deliberately: a CLI that makes one request has no concurrency to exploit, and skipping the async runtime keeps the code flatter (Cargo.toml wants `reqwest = { version = "0.12", features = ["blocking", "json"] }`). The blocking client does default to a 30 second timeout, but write your own anyway: how long the tool may hang should be a decision, not a default. The ratatui dashboard is where async would start paying, refreshing stats on the tick without blocking the draw loop.

Deserialization mirrors the envelope:

```rust
#[derive(serde::Deserialize)]
struct Envelope<T> { data: T }

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct Stats { xp: u32, level: u32, streak: u32, reviews_due: u32 }

fn stats(cfg: &Config) -> anyhow::Result<Stats> {
    let res = client()?
        .get(format!("{}/api/v1/learn/stats", cfg.api_url))
        .header("cookie", format!("better-auth.session_token={}", cfg.token))
        .send()?
        .error_for_status()?; // a 401 becomes an error here, not a parse failure later
    Ok(res.json::<Envelope<Stats>>()?.data)
}
```

`error_for_status` earns its line: without it, an expired token's 401 body reaches the JSON step and the user sees `missing field xp` instead of "unauthorized". Map that error to advice, `token expired, run bbd login`, print it to stderr, exit 1. The happy path prints a table on stdout, or the raw JSON under `--json`, per the contract lesson.

The review loop is the payoff. `GET /review` returns items carrying `id`, `prompt`, `options`, and the `lessonTitle` they came from. Print the prompt and numbered options, read a digit from stdin, collect `{ quizItemId, answerIndex }` pairs, POST the batch to `/review/submit`, and report `correct`, `total`, and `xpAwarded`. Your streak, maintained without leaving the terminal.

## Shipping it

`cargo install --path .` compiles a release build and drops the binary into `~/.cargo/bin`, already on your PATH courtesy of rustup. Publish to crates.io and that becomes `cargo install bbd` for anyone, at a cost: every user compiles from source, with a toolchain they may not have.

Real distribution is prebuilt binaries: compile once per target triple, `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, `x86_64-pc-windows-msvc`, and attach them to a release page (tools like cargo-dist generate that CI). From the rustup lesson you know `rustup target add` fetches a target's standard library; the missing piece is usually a linker for that platform, which is why the `cross` tool runs the build inside a container that has one, and why a static musl build produces a Linux binary with no runtime requirements at all. One file, `chmod +x`, done: the deployment story that made Rust CLIs famous.

## Predict, then verify

The API is not running, and someone pipes anyway: `bbd stats --json | jq .xp`. What happens, and how long does it take?

Answer: connection refused surfaces immediately, the timeout being a ceiling rather than a wait. `bbd` prints the error chain to stderr, writes nothing to stdout, and exits 1; `jq` receives empty input, and a script running under `set -e` halts on the nonzero status. Every piece of the contract, streams, exit codes, timeouts, does its job precisely when things go wrong, which is why you designed them.
