Chapter 5 ended with `docker run -p 8000:8000 zero2prod` and a working health check. What exactly did that start? The common mental model is "a small virtual machine". Test it. While the container runs, on the Linux host itself:

```bash
ps aux | grep zero2prod
# app  48013  0.1  0.4  ...  ./zero2prod
```

There it is: an ordinary process with an ordinary host PID. No guest kernel booted, no hypervisor in sight. A container is a normal Linux process that has been given a restricted view of the machine and a metered share of its resources. The view is namespaces; the meter is cgroups. Everything else is packaging.

## Namespaces: shrinking the view

The kernel has eight namespace kinds, each virtualizing one global resource: `pid` (process ids), `mnt` (the mount table, hence "its own filesystem"), `net` (interfaces and ports), `uts` (hostname), `ipc`, `user` (uid mappings), `cgroup`, and `time`. Docker creates fresh ones for each container (user namespaces are opt-in for rootful Docker). The same process, seen from two sides:

```bash
docker exec newsletter ps aux     # inside: zero2prod is PID 1
ps aux | grep zero2prod           # outside: PID 48013
readlink /proc/48013/ns/pid       # pid:[4026532871], not the host's namespace
```

One kernel object, two vantage points. This is why two containers can both bind `0.0.0.0:8000` without a conflict: each has its own network namespace, so its own interfaces and port space, and `-p 8000:8000` is Docker punching a deliberate hole between them. You can build the illusion by hand:

```bash
sudo unshare --pid --fork --mount-proc bash
ps aux    # two processes: bash and ps. The rest of the machine is gone.
```

`docker run` is that, plus the other namespaces, plus wiring, orchestrated by `runc` through `clone` and `unshare` syscalls. Run the daemon under `strace` and you can watch it happen. No magic instruction exists; "containerize" is not a syscall.

## cgroups: metering the share

```bash
docker run --memory=256m --cpus=2 zero2prod
```

Those flags write files. On a systemd host, look under `/sys/fs/cgroup/system.slice/docker-<id>.scope/`: `memory.max` now reads `268435456`, `cpu.max` reads `200000 100000` (200ms of CPU per 100ms period). The kernel charges pages to the cgroup as the process touches them; cross `memory.max` and the OOM killer sends SIGKILL, the container dies with exit code 137, and `docker inspect` shows `OOMKilled: true`. Note what does not happen: the allocator almost never returns an error. Linux overcommits, so from the cost-of-allocation lesson's chain, `mmap` succeeds cheerfully and the bill arrives on first write.

The CPU quota has a Rust-specific consequence. Since Rust 1.64, `std::thread::available_parallelism` reads the cgroup quota, and tokio sizes its default worker pool with it: `--cpus=2` on a 64-core host gets you 2 workers, not 64. Runtimes that counted host cores (older JVMs, famously) spawned 64 threads to fight over a 2-CPU budget.

## One kernel, shared

Run `uname -r` inside and outside: identical. Images ship userland, never kernels, and every container syscalls into the host kernel. That is why starting a container costs milliseconds (it is `exec`, not boot), why density is high, and why the isolation boundary is weaker than a VM's: one kernel bug is shared by everyone. It is also a promise this section will cash later: a binary that needs nothing but syscalls runs on any base image at all, including an empty one.

## Predict, then verify

You run a program under `--memory=64m` that does `let v: Vec<u8> = Vec::with_capacity(1 << 30);` (1 GiB) and then sleeps without writing to it. Is it killed?

Answer: no, it idles happily. `with_capacity` reserves virtual address space; the cgroup charges memory as pages are touched, and untouched reservations wire nothing, the same lazy first-write behavior the cost-of-allocation lesson described. Add a loop writing one byte per 4 KiB page and the charge climbs until, around the 64 MiB mark, the OOM killer ends it: exit 137, `OOMKilled: true`. The limit meters use, not ambition.
