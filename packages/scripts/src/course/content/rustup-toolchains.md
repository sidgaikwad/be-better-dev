A Rust installation is not one compiler. It is a set of _toolchains_ managed by `rustup`, and knowing what a toolchain is explains most of the version questions you will ever have.

A toolchain is the combination of two things:

- a **release channel**: `stable`, `beta`, or `nightly`
- a **compilation target**: the platform the produced binary runs on, like `aarch64-apple-darwin` or `x86_64-unknown-linux-gnu`

## Channels

A new stable compiler ships every six weeks. The Rust project's promise is _stability without stagnation_: upgrading stable should never break your code, and should still bring new features, fewer bugs, and faster compiles.

- `stable` is what you build, test, and ship with. _Zero to Production_ uses it for the entire book.
- `beta` is the candidate for the next release, mostly useful for catching regressions early.
- `nightly` is built from the compiler's `master` branch every night. It exists so unfinished features can be tried before they are stabilised. It is called unstable for a reason; think twice before running production software on it.

```bash
rustup show            # what is installed, and which toolchain is active
rustup update          # update every installed toolchain
rustup toolchain list
```

## Targets

The compiler turns Rust into machine code for one specific platform at a time. Your machine's own platform is the _host_ target, installed by default. Cross-compiling means asking for another one:

```bash
rustup target add x86_64-unknown-linux-musl
```

You will meet exactly this target again in the Docker section: `musl` builds produce a statically linked binary that runs in a `FROM scratch` container with nothing else in it.

The book skips cross-compiling entirely, and for a good reason worth remembering: its production workloads run in containers, so the build happens _inside_ a Linux image and the host toolchain there is already the right one.

## Which component does what

`rustup` also installs the pieces around the compiler:

- `rustc`: the compiler itself. You will almost never call it by hand.
- `cargo`: the build tool and the interface you actually use all day.
- `clippy`: the linter, a large collection of "you probably meant" checks.
- `rustfmt`: the formatter, so diffs argue about logic instead of style.
- `rust-analyzer`: the language server your editor talks to.

One habit to build now: when something version-related surprises you, run `rustup show` before anything else. Most "it works on my machine" stories in Rust end with two machines on different toolchains.
