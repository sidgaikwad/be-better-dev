This pipeline should work, and its failure mode is the whole lesson:

```bash
bbd stats --json | jq .xp
```

If `bbd` prints `Fetching stats...` on stdout, `jq` receives `Fetching stats...{"xp":480,...}` and dies on invalid JSON. Nothing enforces the difference between output and commentary except convention. Those conventions, exit codes, the two streams, machine output, respect for pipes, are a CLI's interface contract, as real as an HTTP API's status codes and just as visible to scripts.

## Exit codes and the two streams

`0` means success; anything else means failure, and `&&`, `if`, and `set -e` branch on it. You get this by returning from `main`: an `anyhow::Result<()>` main prints the error chain to stderr and exits 1 on `Err`. clap already claimed 2 for usage errors, a Unix convention worth keeping: 1 for "the operation failed", 2 for "you called me wrong".

stdout carries the result; stderr carries words for humans: progress, warnings, hints. `println!` versus `eprintln!` is an architectural decision made one character at a time. Redirect the result with `bbd review --json > due.json` and the progress messages still reach your terminal, because they were never in the data stream.

## --json is a contract

Humans get aligned columns and color; scripts get JSON. The human format is yours to change on a whim. The JSON is an interface: scripts parse it, so a field rename is a breaking change, exactly like renaming a response field in the newsletter API. Serialize the same struct you display, print it to stdout, and print nothing else there.

## Noticing where output goes

A well-behaved tool checks where its output is headed:

```rust
use std::io::IsTerminal;

let no_color = std::env::var_os("NO_COLOR").is_some_and(|v| !v.is_empty());
let color = std::io::stdout().is_terminal() && !no_color;
```

`is_terminal()` is false when stdout is a pipe or a file, so ANSI color codes, which would arrive in `grep`'s input as literal `\x1b[32m` garbage, switch off automatically. `NO_COLOR` is the ecosystem-wide opt-out (no-color.org): set to any non-empty value, it wins even on a real terminal. The TTY check asks "can color render here"; the variable asks "does this human want it".

Progress bars follow the same logic, and indicatif ships the right defaults:

```rust
let bar = indicatif::ProgressBar::new(items.len() as u64);
for item in &items {
    grade(item);
    bar.inc(1);
}
bar.finish_and_clear();
```

The bar draws to stderr, never contaminating the data stream. And when stderr is not a terminal, indicatif hides the bar entirely, so `bbd sync 2> sync.log` does not fill the log with a thousand carriage-return frames.

## What a pipe actually is

One level down, the reason detection works per stream. When the shell runs `a | b`, it creates a kernel pipe, a byte buffer of 64 KiB by default on Linux, points `a`'s file descriptor 1 at the write end and `b`'s descriptor 0 at the read end. Descriptor 2 is untouched: it still points at the terminal. `is_terminal()` is the `isatty` system call asking "is this descriptor a terminal device", and it is asked of one descriptor, not of the process. Piped stdout with a live TTY on stderr is the normal shape of a pipeline, and it is exactly what lets data flow to the next program while the human still watches the progress bar.

## Predict, then verify

`bbd stats --json | jq .xp` runs while a spinner is active on stderr. What does `jq` receive, and what does the human at the terminal see?

Answer: `jq` receives only the JSON, because the pipe carries stdout alone. The human still sees the spinner animating, because stderr still passes `isatty`. Swap one `eprintln!` for `println!`, or point the bar at stdout, and the pipeline breaks: this contract is maintained by discipline, not by the compiler, which is why the stream choice deserves the same care as a public function signature.
