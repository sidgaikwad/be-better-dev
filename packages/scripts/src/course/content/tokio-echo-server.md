The section closes by wiring its pieces into a program you can poke with a terminal: a TCP echo server with per-connection idle deadlines and live stats. Three clock tools first, because the server leans on all of them.

`tokio::time::sleep(dur)` parks the task on a timer deadline; from the runtime anatomy lesson, the nearest deadline becomes the timeout argument to `epoll_wait`, so a sleeping program burns zero CPU. `interval(period)` is the repeating version: `tick().await` completes on schedule, first tick immediately, and the cadence does not drift when the work between ticks varies, unlike sleep-in-a-loop. `timeout(dur, fut)` races any future against the clock: `Ok(output)` if the future finishes first, `Err(Elapsed)` if the clock wins, and on expiry the inner future is dropped. Dropping a future is cancellation in async Rust; that sentence carries enough weight that Streams, select, cancellation exists to unpack it. Here it is used the honest way: bounding one IO operation.

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
```

```rust
use std::time::Duration;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use tokio::sync::mpsc;
use tokio::time::{interval, timeout};

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:4000").await?;
    let (stats, mut stats_rx) = mpsc::channel::<usize>(1024);

    // Owns the counter outright: no mutex anywhere in the program.
    tokio::spawn(async move {
        let mut total = 0usize;
        while let Some(n) = stats_rx.recv().await {
            total += n;
            println!("echoed {total} bytes so far");
        }
    });

    // Heartbeat, so silence is distinguishable from death.
    tokio::spawn(async move {
        let mut tick = interval(Duration::from_secs(5));
        loop {
            tick.tick().await;
            println!("alive");
        }
    });

    loop {
        let (mut socket, peer) = listener.accept().await?;
        let stats = stats.clone();
        tokio::spawn(async move {
            let mut buf = vec![0u8; 4096];
            loop {
                let n = match timeout(Duration::from_secs(30), socket.read(&mut buf)).await {
                    Err(_) => break,     // idle 30s: hang up
                    Ok(Err(_)) => break, // socket error
                    Ok(Ok(0)) => break,  // peer closed
                    Ok(Ok(n)) => n,
                };
                if socket.write_all(&buf[..n]).await.is_err() {
                    break;
                }
                let _ = stats.send(n).await;
            }
            println!("closed {peer}");
        });
    }
}
```

Run it, then `nc 127.0.0.1 4000` and type: lines come back, totals print, and a connection left idle dies after 30 seconds.

Read the program as a map of the section. The accept loop awaits readiness from the IO driver, the epoll loop you built in Async from scratch. Each connection is a `tokio::spawn` from the spawn lesson: the task owns `socket` and `buf` outright, so `Send + 'static` is satisfied by moves, no `Arc` in sight. Nothing blocks, per the cardinal sin lesson: reads await, writes await, waiting is timers. The counter follows the channels lesson: one task owns the total, sockets report over a bounded mpsc, and if the stats task ever lags, backpressure slows the echoers instead of growing a queue. The mutex lesson would also have permitted `Arc<Mutex<usize>>` here, a short critical section with no await, but the channel shape keeps working the day "add to a counter" becomes "write a row".

Where would blocking sneak in? Give each chunk a CPU-expensive transform, compression at maximum level, or an argon2 check on a connection token, and that code belongs in `spawn_blocking`, the task awaiting its handle. The structure absorbs it without redesign, which is what an escape hatch is for.

Deliberately missing: graceful shutdown, the accept loop is eternal, and the standard fix is a `watch` channel checked by every task, built properly in Concurrency patterns; and `select!`, which arrives with streams.

## Predict, then verify

Ten thousand clients connect and go silent. Before the 30-second timeouts fire, what do CPU and memory look like, next to a thread-per-connection design?

Answer: CPU is zero: every task is parked on a timer-or-read pair, and the whole runtime is one thread asleep in `epoll_wait` whose timeout is the nearest of ten thousand deadlines. Memory is dominated by the buffers, 4 KiB each, about 40 MB, plus tens of bytes of task overhead apiece per the spawn lesson. The thread version reserves 8 MiB of virtual stack per connection, about 80 GB of address space and hundreds of megabytes resident, and pays the kernel to schedule ten thousand of them. At the 30-second mark the timeouts fire and this server hangs them all up in one cheap burst of wakeups.
