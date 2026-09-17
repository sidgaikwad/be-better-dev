The queue is not draining. You do what you have always done:

```bash
docker exec -it newsletter-worker bash
# OCI runtime exec failed: exec failed: unable to start container process:
# exec: "bash": executable file not found in $PATH
```

That is the previous lesson's bill arriving. The image is 22MB because it holds one binary and nothing else, and "nothing else" includes every tool you were about to reach for. Operating containers is mostly what you designed in beforehand, plus one trick for when you did not.

## Logs are stdout, and that is the entire contract

Chapter 4's `get_subscriber` took a sink and the book passed `std::io::stdout`. Keep it. A containerized process writes structured lines to fd 1 and 2 and owns nothing else about logging: no file paths, no rotation, no logrotate. Docker's `json-file` driver captures both descriptors into `/var/lib/docker/containers/<id>/<id>-json.log`, and `docker logs` reads that file back.

Three consequences follow. Rotation is the daemon's job: unless you set `max-size` and `max-file` (in `daemon.json`, or per service under `logging:`), that file grows without bound, and a chatty service filling the host disk is a common outage. `docker logs` only works for drivers that keep a local copy, so `fluentd` or `syslog` makes the command fail rather than fall back. And the file dies with the container, which is the argument for shipping logs out as they are written.

Rust helps here: `std::io::Stdout` wraps a `LineWriter`, so output is line-buffered even into a pipe, and the classic "silent until it crashed" mystery familiar from C and from Python without `-u` does not happen. But `tracing_appender::non_blocking` reintroduces a buffer and a writer thread whose guard flushes on drop, so binding it to `_` instead of a named `_guard` discards the last lines before every exit.

## PID 1 is not a normal process

```dockerfile
ENTRYPOINT ["./zero2prod"]      # exec form: the binary is PID 1
ENTRYPOINT ./zero2prod          # shell form: /bin/sh -c is PID 1
```

`docker stop` sends SIGTERM to PID 1, waits ten seconds, then sends SIGKILL. With the exec form, your binary gets the signal and Part 2's graceful shutdown runs. With the shell form, `sh` is PID 1, does not forward signals to its child, and every stop is a ten-second pause ending in a hard kill. Worse, the kernel applies no default signal action to PID 1: a process with no SIGTERM handler installed ignores it. PID 1 also reaps orphaned children, which matters if your container shells out; `docker run --init` inserts a tiny init for that.

## Getting a shell's worth of tools into a shell-less container

The first lesson said a container is a process with a restricted view. Nothing stops a second process from adopting the same view:

```bash
docker run --rm -it \
  --pid=container:newsletter-worker \
  --network=container:newsletter-worker \
  --cap-add=SYS_PTRACE \
  nicolaka/netshoot
```

That container joins the worker's PID and network namespaces while keeping its own filesystem, so `ps`, `ss -tlnp`, `strace -p 1`, and `curl` all see the worker's process table and its ports; its files are reachable at `/proc/1/root`. Docker Desktop wraps this as `docker debug`, and Kubernetes exposes it as `kubectl debug --target=` with ephemeral containers.

## Scanning, briefly

`docker scout cves`, `trivy image`, and `grype` work primarily by reading OS package databases, `dpkg` or `apk` metadata. Scan a distroless Rust image and you see almost nothing, which is half true and half blind: there really is no vulnerable `curl` in there, and none of your crates are visible either. Close the gap from the Rust side with `cargo audit` or `cargo deny` over `Cargo.lock` in CI, and `cargo auditable`, which embeds the dependency tree in a custom ELF section that `trivy` and `syft` can read from the binary. `docker buildx build --sbom=true --provenance=true` attaches that inventory to the pushed image.

## Predict, then verify

The worker's shutdown drains in-flight sends for up to 20 seconds. You run `docker stop newsletter-worker`; it returns after about ten, and the last batch is lost. What happened?

Answer: nothing was misconfigured about signals. `docker stop`'s default timeout is ten seconds, and SIGKILL is uncatchable, so the drain was cut in half. Fix it with `docker stop -t 30`, or `stop_grace_period: 30s` in Compose, which is the same arithmetic as Kubernetes's `terminationGracePeriodSeconds`. One other fault produces the identical ten-second symptom: a shell-form ENTRYPOINT, where the process never receives SIGTERM at all. Read the logs to tell them apart. If shutdown started and was interrupted, raise the timeout; if no shutdown line appeared, fix the ENTRYPOINT.
