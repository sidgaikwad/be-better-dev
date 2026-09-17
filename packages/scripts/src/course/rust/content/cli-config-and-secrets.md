`bbd` needs two persistent values: the API's address and a session token. The obvious design is flags:

```bash
bbd --api-url http://localhost:4100 --token 9f3ab0c1 stats
```

The obvious design leaks. On a shared machine, `ps aux` shows every process's full argument list to every user; on Linux that is `/proc/<pid>/cmdline`, world-readable by design, because that is how `ps` works. And your shell wrote the token into `~/.zsh_history` before the program even started. Argv is public. Where values live is part of interface design, and there is a well-worn hierarchy.

## Where files go

Tools no longer scatter dotfiles across `$HOME`. Linux follows the XDG spec: per-user config under `$XDG_CONFIG_HOME`, defaulting to `~/.config/bbd/`. macOS uses `~/Library/Application Support`, Windows `%APPDATA%`. The `dirs` crate answers per platform:

```rust
let path = dirs::config_dir() // ~/.config on Linux
    .expect("no config directory on this platform")
    .join("bbd/config.toml");
```

Config is what the user edits; state and caches are what the tool writes, and XDG gives them separate homes so a "reset my settings" never deletes data and a cache purge never deletes settings.

## Reading the file

TOML plus serde, with one important match on the error:

```rust
#[derive(serde::Deserialize, Default)]
struct FileConfig {
    api_url: Option<String>,
    token: Option<String>,
}

let cfg = match std::fs::read_to_string(&path) {
    Ok(text) => toml::from_str::<FileConfig>(&text)?,
    Err(e) if e.kind() == std::io::ErrorKind::NotFound => FileConfig::default(),
    Err(e) => return Err(e.into()),
};
```

A missing file is not an error, it is a fresh install: use defaults. An unreadable or malformed file is a real error and propagates. That distinction, absent versus broken, is the error-handling section's two-audiences idea compressed into a two-line match on `ErrorKind`.

## Precedence

When a value can come from several places, specific beats broad:

```rust
let api_url = cli.api_url                              // 1. flag: this invocation
    .or_else(|| std::env::var("BBD_API_URL").ok())     // 2. env: this shell or CI job
    .or(cfg.api_url)                                   // 3. file: this machine
    .unwrap_or_else(|| "http://localhost:4100".into()); // 4. built-in default
```

Flag, then environment, then file, then default. The order encodes blast radius: a flag affects one command, an env var one session, the file every future run. Get it backwards, a config file overriding an explicit flag, and you have built a tool people learn to distrust.

## Secrets specifically

Argv is out. Environment variables are better but not private: `/proc/<pid>/environ` is readable by your other same-user processes, crash reporters snapshot it, and CI systems love printing `env` into logs. The workable floor is the config file with owner-only permissions:

```rust
#[cfg(unix)]
{
    use std::os::unix::fs::PermissionsExt;
    std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600))?;
}
```

The step above that is the operating system's credential store, macOS Keychain, Windows Credential Manager, the Secret Service API on Linux, reachable uniformly through the `keyring` crate. `bbd` settles for the `0600` file, a local tool with a local threat model, but adds a `login` subcommand that prompts for the token without echoing and writes the file itself, so the secret never touches argv or history at all.

## Predict, then verify

The config file says `api_url = "http://localhost:4100"`, the shell has `BBD_API_URL=https://staging.example.com` exported, and the user runs plain `bbd stats` with no flag. Which URL is hit?

Answer: staging. Env outranks file because it is more specific: someone set that variable in this session on purpose, probably to test against staging, and would be baffled if a config line written weeks ago silently won. The file's value resumes the moment the variable is unset, which is exactly the ergonomics you want from a temporary override.
