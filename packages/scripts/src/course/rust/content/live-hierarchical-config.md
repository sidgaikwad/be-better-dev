At the end of the offline-mode lesson the container was running with `-p 8000:8000`, and the health check still said connection refused. The mapping was fine; the address was not. `main` builds it from configuration as `127.0.0.1:{port}`, and 127.0.0.1 is the loopback interface: accept connections from this machine only. Inside a container, "this machine" is the container. Traffic published by `-p` arrives on the container's external interface, where nobody is listening.

The fix is to bind `0.0.0.0`, all interfaces, inside the container. But binding all interfaces on your laptop widens who can reach your dev server, so you want `127.0.0.1` locally and `0.0.0.0` in the image. One codebase, two values: a configuration problem, and hard-coding either value trades one broken environment for the other.

## Layers of configuration

The single `configuration.yaml` from the first-subscriber section becomes a directory of layers:

```yaml
# configuration/base.yaml, values shared by every environment
application:
  port: 8000
database:
  host: "localhost"
  port: 5432
  database_name: "newsletter"

# configuration/local.yaml
application:
  host: 127.0.0.1

# configuration/production.yaml
application:
  host: 0.0.0.0
```

An `APP_ENVIRONMENT` variable selects the second file (parsed into a tiny `Environment` enum, defaulting to local); the Dockerfile sets it to `production` with `ENV`. The `config` crate assembles the stack:

```rust
let settings = config::Config::builder()
    .add_source(config::File::from(configuration_directory.join("base.yaml")))
    .add_source(config::File::from(
        configuration_directory.join(format!("{}.yaml", environment.as_str())),
    ))
    .add_source(
        config::Environment::with_prefix("APP")
            .prefix_separator("_")
            .separator("__"),
    )
    .build()?;
settings.try_deserialize::<Settings>()
```

Later sources win: base states defaults, the environment file states its deltas. (The book uses the crate's old `Config::default()` plus `.merge()` API; `config` has since replaced it with this builder, same semantics.)

The third source is the interesting one. `APP_APPLICATION__PORT=5001` sets `settings.application.port`: the `APP` prefix scopes which variables belong to us, and the double underscore separates nesting levels, since a single one could not tell `database.name` from a field called `database_name`. One wrinkle: environment variables are strings, so deserializing `"5001"` into a `u16` fails until the port fields go through `serde-aux`'s `deserialize_number_from_string`.

## Why the ceremony

This is the twelve-factor config rule with a type system attached: build one artifact, run it everywhere, and let environments differ only in data supplied from outside. The payoffs stack. Secrets, like a database password, never enter the image or the repository; a platform injects them as variables at runtime. And anything can be reconfigured without recompiling, which lands harder in Rust than in most stacks: a cold `--release` build takes minutes, restarting with a new variable takes seconds. During an incident, that is the difference between flipping a setting and shipping an emergency build.

The precedence order also encodes trust. Files are the reviewed, committed record of intent; environment variables are the operational override that outranks them. Every serious deployment platform assumes this shape, which is exactly why the next lesson's platform can configure our binary without knowing anything about Rust: it just sets strings in an environment.

## Predict, then verify

`base.yaml` sets `application.port: 8000` and `production.yaml` does not mention `port`. The platform sets `APP_APPLICATION__PORT=8080`. Which port does the newsletter bind in production, and what changes if `production.yaml` also set `port: 9000`?

Answer: 8080 both times. The environment source is added last, so it beats every file; `production.yaml`'s 9000 would only shadow `base.yaml`'s 8000 and would matter solely when no variable is set. Layering means each file states only what it needs to change, and the runtime environment always gets the final word.
