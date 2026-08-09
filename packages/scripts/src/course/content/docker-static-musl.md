Take chapter 5's release binary, copy it into an empty image, and run it:

```dockerfile
FROM scratch
COPY --from=builder /app/target/release/zero2prod /zero2prod
ENTRYPOINT ["/zero2prod"]
```

```
exec /zero2prod: no such file or directory
```

The file is right there. The one that is missing is `/lib64/ld-linux-x86-64.so.2`: the default `x86_64-unknown-linux-gnu` target links glibc dynamically, so the ELF header names an interpreter, and the kernel's complaint about the absent loader gets reported against your path. `ldd` on the binary shows the dependency list: `libc.so.6` and friends. Fully static glibc is a second-class citizen (name resolution wants to `dlopen` NSS plugins at runtime), which is where musl comes in: a small libc designed to be linked statically.

## Building against musl

```bash
rustup target add x86_64-unknown-linux-musl
sudo apt install musl-tools    # musl-gcc, for crates that compile C
cargo build --release --target x86_64-unknown-linux-musl
ldd target/x86_64-unknown-linux-musl/release/zero2prod
# statically linked
```

For this target, static linking is the default. The catch is C dependencies: anything that builds OpenSSL now needs OpenSSL built against musl, a cross-compilation yak best left unshaved. The escape is pure Rust: the book already chose `rustls-tls` for reqwest in chapter 7 and the sqlx setup pairs with rustls too, so the newsletter's dependency tree is closer to musl-ready than most. What remains is `ring`'s assembly, which is exactly why `musl-tools` is installed.

## The ladder of bases

With a static binary, the runtime stage needs almost nothing:

```dockerfile
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/zero2prod /zero2prod
COPY configuration /configuration
ENV APP_ENVIRONMENT=production
USER nonroot
ENTRYPOINT ["/zero2prod"]
```

The ladder, with realistic sizes: the `rust` build image is about 1.3GB; chapter 5's `debian:bookworm-slim` runtime lands near 88MB; distroless `cc` (glibc, for dynamically linked binaries) is roughly 25MB plus your binary; distroless `static` is about 2MB plus your binary; `scratch` is your binary, full stop. A release build of the newsletter service is a few tens of megabytes, less once stripped (`strip = true` in the release profile), so the whole image lands around 20-30MB: pulled in a couple of seconds on every deploy and scale-up, instead of the naive image's gigabytes.

Why prefer distroless `static` over raw `scratch`? Because `scratch` is truly empty: no CA roots, so verifying Postmark's TLS certificate fails until you `COPY` the bundle from the builder or compile roots in via `webpki-roots` (baked roots mean a rebuild to rotate them); no `/etc/passwd`, so `USER` only works numerically; no timezone data; no `/tmp`. Distroless `static` restores exactly that short list, still with no shell and no package manager.

## The bills

Static-and-tiny is not free; know what you removed.

- DNS: your binary now carries musl's resolver everywhere. It queries all nameservers in parallel, ignores `nsswitch.conf`, and only gained TCP fallback in musl 1.2.4, so on older toolchains large DNS responses are truncated, a bug that has bitten real Kubernetes clusters. `hickory-resolver` is the pure-Rust way out if it bites you.
- Allocator: musl's mallocng optimizes for footprint and hardening, not multithreaded throughput; a busy tokio server can measurably lag its glibc twin. One line fixes it: `#[global_allocator] static A: mimalloc::MiMalloc = mimalloc::MiMalloc;` (or jemalloc).
- Debugging: no shell, no coreutils, `docker exec` has nothing to run. The operating lesson deals with this properly.

## Predict, then verify

You build the musl binary on an Ubuntu builder. Which of these run it successfully: the Ubuntu host directly, an `alpine` container, a `scratch` container, a ten-year-old CentOS image?

Answer: all of them. A static binary carries its libc and asks the outside world for nothing but syscalls, and the kernel is shared and famously backward-compatible, the "one kernel" fact from the first lesson. The fragile one is the glibc-linked gnu build, which needs a libc at least as new as the builder's, giving the classic `GLIBC_2.3x not found` when built on a new distro and run on an old one.
