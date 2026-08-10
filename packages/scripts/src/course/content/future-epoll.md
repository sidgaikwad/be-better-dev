`block_on` shipped with a confession: `Delay` hides a thread per pending timer inside poll. Timers are easy to rescue, one thread and a sorted list of deadlines covers any number of them. Sockets are the real problem. The newsletter API might hold ten thousand open connections, each with a future waiting for request bytes; a watcher thread per socket rebuilds the why-async lesson's bonfire with extra steps. Someone has to watch ten thousand sockets at once, cheaply. That someone is the kernel, which was watching all along.

## Ask a different question

A blocking `read` asks: give me bytes from this one socket, and do not return until you have some. The kernel already knows more than that question lets it say: packets arrive and it files them into each socket's receive buffer whether or not anyone is reading. The right syscall asks for that fact instead: here are the sockets I care about; which are ready now, and if none, sleep until one is.

That syscall is `epoll` on Linux and `kqueue` on macOS and the BSDs, both born in the early 2000s as direct answers to C10K. (Windows solves it with IOCP, a completion model: it reports finished I/O rather than readiness. Same problem, different shape.) epoll's whole surface is three calls:

```
epoll_create1()                 make an epoll instance (itself a file descriptor)
epoll_ctl(ep, ADD, fd, READ)    register interest in one socket, once
epoll_wait(ep, events, ...)     sleep until at least one registered fd is ready;
                                return only the ready ones
```

Registration is durable: `ctl` once, `wait` forever after. `epoll_wait` costs in proportion to how many sockets are ready, not how many are registered: the kernel appends to a ready list at packet arrival time instead of scanning on demand. The older `select` and `poll` syscalls rescanned every watched fd on every call, and that scan was the wall C10K actually hit.

One thread, asleep in `epoll_wait`, covers ten thousand sockets. That sentence is the entire trick.

## Reads that never sleep

Readiness reporting only works if reading never blocks, so the sockets are switched to non-blocking mode:

```rust
use std::io::{self, Read};
use std::net::TcpStream;

fn drain(stream: &mut TcpStream, buf: &mut [u8]) -> io::Result<()> {
    stream.set_nonblocking(true)?;
    match stream.read(buf) {
        Ok(n) => println!("{n} bytes were already in the kernel's buffer"),
        Err(e) if e.kind() == io::ErrorKind::WouldBlock => {
            // Nothing buffered right now: register interest and go do other work.
        }
        Err(e) => return Err(e),
    }
    Ok(())
}
```

A non-blocking read returns immediately, either carrying bytes the kernel had buffered or saying `WouldBlock`. It is the `Ready`/`Pending` split, spoken in errno.

## The reactor

Assemble the production shape. Generalize block_on's loop to many tasks: poll the ones that were woken. Beside it, add the component that owns the epoll instance: the reactor. A socket future's poll tries the non-blocking read; on `WouldBlock` it registers the fd with the reactor, files its waker under that fd, and returns `Pending`: the exact lodging step the waker contract demands. The reactor thread sleeps in `epoll_wait`, its version of `thread::park`, except this park watches ten thousand wait sources at once. When readiness arrives it looks up the waker filed under that fd, calls `wake()`, and the executor re-polls exactly that task.

Every part now has a name and a lesson behind it: the value (`Future`), the pause points (the state machine), the doorbell (`Waker`), the loop (the executor), the watcher (the reactor). You have run this machine for years without the names: Node's event loop is libuv wrapping epoll, kqueue, and IOCP around a table of callbacks where Rust keeps wakers. Rust's wrapper is the mio crate, and tokio is mio's reactor plus a work-stealing multi-task executor plus the shared timer: the next section, entered knowing what every piece is for.

## Predict, then verify

A reactor has 10,000 idle connections registered and sleeps in `epoll_wait`. One packet arrives for one connection. Trace the path until user code runs, and account for what the other 9,999 connections cost along the way.

Answer: the kernel files the packet into that socket's receive buffer and moves the fd onto the ready list; `epoll_wait` returns a one-element list; the reactor fires the waker filed under that fd; the executor polls that one task; its non-blocking read drains the bytes and the state machine advances. The other 9,999 connections cost nothing on this path: no thread apiece, no scan (the ready list is handed over, not searched for), no polls (no wakes). An idle connection's steady-state price is a registration entry and a stored waker, a few dozen bytes: C10K's answer, and why one modest process can hold the newsletter's whole connection load.
