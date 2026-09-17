Parsing arguments by hand starts innocently. You have done it in TypeScript: walk `process.argv`, compare strings, hope. It survives two flags, then dies at the first subcommand, the first `--limit=abc`, the first user who types `--help` and gets nothing. Rust's ecosystem answer is clap, and its derive API inverts the job: you do not write a parser, you declare the interface as types and the parser is generated.

```toml
[dependencies]
clap = { version = "4", features = ["derive"] }
```

The tool this section builds is `bbd`, a terminal client for this course's own API. Its whole interface is a struct:

```rust
use clap::{Parser, Subcommand};

/// A terminal client for the be-better-dev course API.
#[derive(Parser)]
#[command(version, about)]
struct Cli {
    /// Print machine-readable JSON instead of text
    #[arg(long, global = true)]
    json: bool,

    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Show XP, level, and streak
    Stats,
    /// Answer due review questions
    Review {
        /// How many items to fetch
        #[arg(long, default_value_t = 20, value_parser = clap::value_parser!(u8).range(1..=20))]
        limit: u8,
    },
}

fn main() {
    let cli = Cli::parse();
    match cli.command {
        Command::Stats => todo!(),
        Command::Review { limit } => todo!(),
    }
}
```

## Fields are flags, variants are subcommands

Every field is a piece of interface. `bool` becomes a flag (`--json`), `Option<T>` an optional value, plain `T` a required one, `Vec<T>` a repeatable one. Doc comments are not decoration: clap lifts them into `--help`, the struct's as the about line, each field's as that argument's help text.

Subcommands are an enum, and that connects straight back to the sum-types lesson. `Review { limit }` carries its own typed payload; `Stats` carries none; impossible combinations are unrepresentable. Add a `Leaderboard` variant next week and the `match` in `main` stops compiling until you handle it, the same exhaustiveness that has been catching forgotten cases since the pattern-matching lessons. A stringly-typed dispatch table fails at runtime; the enum fails the build.

## What parse() actually does

`Cli::parse()` reads `std::env::args_os()`, not `args()`: on Unix an argument is arbitrary bytes with no UTF-8 guarantee, so clap stays in `OsString` until it must convert. Tokens are matched against the generated grammar, each value runs through its parser (`u8`, then the range check), and only if everything passes do you receive a `Cli`. On any failure clap prints to stderr and exits with code 2 without returning to your code. This is "parse, don't validate" from the type-driven section, applied at the process boundary: past `parse()`, `limit` is not a string that probably holds a small number, it is a `u8` proven to be in range. When you would rather receive the failure yourself, `try_parse()` returns a `Result` instead of exiting.

## --help is documentation you design

The help screen is generated, but generated from text you wrote: doc comments, the about line, value names. For most users `bbd review --help` is the only documentation they will ever read, and because it lives in the same file as the types, it cannot drift the way a README does. Naming flags, picking defaults, writing those one-line descriptions: that is API design with the same stakes the module-design lessons gave it, except your callers are people typing in a hurry.

## Predict, then verify

A user runs `bbd review --limit 40` against the declaration above. What does your `match` see, and what does the user see?

Answer: your `match` never runs. clap rejects the value during `parse()`, prints `error: invalid value '40' for '--limit <LIMIT>': 40 is not in 1..=20` plus a usage hint to stderr, and exits with code 2. The invalid state dies at the boundary, exactly where the subscriber-name lessons put theirs: past the constructor, only valid values exist.
