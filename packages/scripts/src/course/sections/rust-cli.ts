import type { SectionSeed } from "../types"

export const rustCli: SectionSeed = {
  slug: "rust-cli",
  title: "Rust CLI and TUI tools",
  description: "clap, ratatui, and a real tool for this course's own API.",
  badgeIcon: "⌨️",
  badgeTitle: "CLI × Rust",
  units: [
    {
      slug: "arguments-and-contracts",
      title: "Arguments and contracts",
      description: "clap's derive API, and the conventions that make a tool script-friendly.",
      lessons: [
        {
          slug: "cli-clap-derive",
          title: "clap: the interface is a struct",
          summary:
            "Declare args, flags, and subcommands as types; parsing, validation, and --help are generated.",
          contentFile: "cli-clap-derive.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "In clap's derive API, where does the text `--help` shows for a field come from?",
              options: [
                "A separate help file compiled into the binary",
                "The doc comment written above that field",
                "A builder method called at startup",
                "clap generates it from the field's type",
              ],
              answer: 1,
              explanation:
                "Doc comments are lifted into the generated parser: the struct's becomes the about line and each field's becomes that argument's help text, so the help screen lives next to the types it describes and cannot drift.",
            },
            {
              kind: "predict",
              prompt:
                "The `Cli` struct declares a required subcommand and a user runs bare `bbd` with no arguments. What happens?",
              options: [
                "clap picks the first variant as a default",
                "parse() returns an error value for main to handle",
                "Usage and an error print to stderr and the process exits with code 2",
                "The program panics with a backtrace",
              ],
              answer: 2,
              explanation:
                "parse() never returns on failure: it prints the message and exits with 2, the Unix code for a usage error. If you want the failure as a value, try_parse() is the variant that returns a Result.",
            },
            {
              kind: "mcq",
              prompt: "What does modeling subcommands as an enum buy over dispatching on a string?",
              options: [
                "Faster argument parsing at runtime",
                "Each variant carries its own typed arguments, and adding a variant breaks every non-exhaustive match until it is handled",
                "clap requires an enum to generate --help",
                "Enums let users abbreviate subcommand names",
              ],
              answer: 1,
              explanation:
                "It is the sum-types payoff again: payloads live on the variant that needs them, and exhaustive matching turns 'forgot to handle the new command' from a runtime bug into a compile error.",
            },
          ],
        },
        {
          slug: "cli-interface-contract",
          title: "The CLI contract: streams, exit codes, pipes",
          summary:
            "stdout for data, stderr for humans, JSON for scripts, and progress bars that respect pipes.",
          contentFile: "cli-interface-contract.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "A script runs `bbd export && upload out.json`. What decides whether `upload` executes?",
              options: [
                "Whether bbd printed anything to stderr",
                "bbd's exit code: zero runs upload, nonzero stops the chain",
                "Whether out.json already exists",
                "Whether the shell has set -e enabled",
              ],
              answer: 1,
              explanation:
                "`&&` tests the exit status and nothing else. Text on either stream is invisible to it, which is why the code, not the wording of an error message, is the machine-readable success signal.",
            },
            {
              kind: "predict",
              prompt:
                "`bbd sync 2> sync.log` runs with an indicatif progress bar active. What ends up in sync.log?",
              options: [
                "Every animation frame, separated by carriage returns",
                "Only the bar's final rendered state",
                "Nothing from the bar: indicatif hides it when stderr is not a terminal",
                "The bar, converted to plain percentage lines",
              ],
              answer: 2,
              explanation:
                "The bar draws to stderr, and its draw target checks isatty: redirected to a file, it goes hidden entirely, so logs stay clean without any code change on your side.",
            },
            {
              kind: "mcq",
              prompt:
                "Your tool colors its output. `NO_COLOR=1` is set and stdout is a real terminal. What should print?",
              options: [
                "Colored output, since stdout passes the TTY check",
                "Plain output: a non-empty NO_COLOR disables color even on a terminal",
                "Colored output, but only for warnings",
                "Nothing: NO_COLOR suppresses stdout entirely",
              ],
              answer: 1,
              explanation:
                "TTY detection answers 'could color render here'; NO_COLOR answers 'does this human want it'. The no-color.org convention is that any non-empty value wins over the TTY check.",
            },
          ],
        },
      ],
    },
    {
      slug: "state-and-screens",
      title: "State and screens",
      description: "Where config and tokens live, and terminal UIs with ratatui.",
      lessons: [
        {
          slug: "cli-config-and-secrets",
          title: "Config, state, and secrets",
          summary:
            "The dirs conventions, flag over env over file precedence, and why tokens never belong in argv.",
          contentFile: "cli-config-and-secrets.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is `bbd --token abc123 stats` a leak on a shared machine?",
              options: [
                "clap logs every parsed value",
                "Arguments are visible to other users via ps (/proc/<pid>/cmdline) and recorded in shell history",
                "The token is sent unencrypted over the network",
                "Environment variables are world-readable",
              ],
              answer: 1,
              explanation:
                "argv is public by design, which is how ps works, and the shell wrote the line into history before the process even started. Neither leak has anything to do with the network.",
            },
            {
              kind: "predict",
              prompt:
                "Fresh machine, no config file yet. The loader matches on `read_to_string`'s error kind. What does `bbd stats` do?",
              options: [
                "Exits 1 with 'config file not found'",
                "Creates the file, then exits asking the user to fill it in",
                "Continues with defaults: NotFound is matched as the normal fresh-install case",
                "Panics unwrapping the io::Error",
              ],
              answer: 2,
              explanation:
                "The match sends ErrorKind::NotFound to FileConfig::default() and propagates every other error. Absent is normal; unreadable or malformed is real, the error-handling section's distinction in a two-line match.",
            },
            {
              kind: "mcq",
              prompt: "Under the XDG convention on Linux, where does bbd's config file belong?",
              options: [
                "~/.bbdrc",
                "$XDG_CONFIG_HOME/bbd/, defaulting to ~/.config/bbd/",
                "/etc/bbd/config.toml",
                "Next to the installed binary",
              ],
              answer: 1,
              explanation:
                "Per-user config goes under $XDG_CONFIG_HOME with ~/.config as the default; /etc is system-wide, and dotfiles loose in $HOME are the clutter XDG exists to end. The dirs crate returns the right directory per platform.",
            },
          ],
        },
        {
          slug: "cli-ratatui-dashboard",
          title: "ratatui: redraw everything, every frame",
          summary:
            "Immediate-mode rendering, the draw loop, and key events in a small stats dashboard.",
          contentFile: "cli-ratatui-dashboard.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In ratatui's immediate-mode model, what does your code do on every frame?",
              options: [
                "Mutates only the widgets whose state changed",
                "Rebuilds the whole screen description from state; the library diffs it and writes only changed cells",
                "Clears the terminal and reprints everything with println!",
                "Runs callbacks registered on each widget",
              ],
              answer: 1,
              explanation:
                "Widgets are throwaway values constructed fresh in each draw call. The double-buffer diff keeps terminal writes small, so rebuilding the description is cheap where it matters.",
            },
            {
              kind: "predict",
              prompt:
                "You delete the `ratatui::restore()` call and quit the dashboard normally with `q`. What is the terminal like afterwards?",
              options: [
                "Normal: the OS resets terminal state when a process exits",
                "Still in raw mode on the alternate screen: keystrokes behave strangely until the user runs reset",
                "Frozen until the user presses Ctrl+C",
                "Fine, but with the scrollback erased",
              ],
              answer: 1,
              explanation:
                "Raw mode and the alternate screen are terminal state, not process state, so exiting does not undo them. That is also why init() installs a panic hook covering the failure path.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does the event loop call `poll` with a 250ms timeout instead of blocking on `read()`?",
              options: [
                "read() cannot see the q key while in raw mode",
                "A blocked read would freeze the loop between keypresses; the timeout gives a steady tick for redraws and data refresh",
                "The crossterm API requires poll before every read",
                "Polling uses less CPU than a blocking read",
              ],
              answer: 1,
              explanation:
                "A blocked read draws nothing until input arrives. The timeout turns the loop into a ticker, four frames per second at worst, which is a refresh opportunity rather than a busy-wait.",
            },
          ],
        },
      ],
    },
    {
      slug: "shipping",
      title: "Shipping",
      description: "Distribute the binary, and build the course's own terminal client.",
      lessons: [
        {
          slug: "cli-ship-course-client",
          title: "Ship it: a terminal client for this course",
          summary:
            "cargo install, prebuilt binaries, and bbd: streak, stats, and reviews from the terminal.",
          xp: 25,
          contentFile: "cli-ship-course-client.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why call `.error_for_status()` before deserializing the response body?",
              options: [
                "It retries failed requests once before giving up",
                "So an expired token surfaces as a 401 error instead of a baffling 'missing field' deserialize failure",
                "reqwest requires it before a body can be read",
                "It upgrades the connection to HTTPS",
              ],
              answer: 1,
              explanation:
                "A 401 body is not a Stats payload. Checking status first makes the real failure the reported failure, which the CLI can map to advice: token expired, run bbd login again.",
            },
            {
              kind: "predict",
              prompt:
                "A teammate with no Rust toolchain installed wants bbd today. Which distribution works as-is?",
              options: [
                "cargo install bbd from crates.io",
                "cargo install --path . from a git clone",
                "Downloading the prebuilt binary for their platform from the release page",
                "Copying the src/ directory to their machine",
              ],
              answer: 2,
              explanation:
                "Both cargo install forms compile from source, which needs the toolchain they do not have. A prebuilt binary for their target triple is one download and a chmod +x: the static-binary deployment story.",
            },
            {
              kind: "mcq",
              prompt:
                "Following chapter 7's discipline, the CLI builds one reqwest Client with an explicit timeout. What does that timeout decide?",
              options: [
                "How long the whole program may run",
                "The upper bound on how long any single request can hang before failing",
                "How many times the client retries",
                "How long pooled connections stay alive",
              ],
              answer: 1,
              explanation:
                "A timeout is a ceiling on waiting, not a retry policy. An explicit 10 seconds beats the blocking client's default 30 because an interactive tool hanging half a minute feels broken, and the number should be a decision.",
            },
          ],
        },
      ],
    },
  ],
}
