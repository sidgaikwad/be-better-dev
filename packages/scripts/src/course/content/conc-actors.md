Forty tasks need to send email through one SMTP connection. The first instinct is `Arc<Mutex<SmtpConnection>>`, but the send is an `.await`, and the tokio section taught you the trap: a std mutex guard held across an await point either fails to compile (the future stops being `Send`) or, with `tokio::sync::Mutex`, compiles and quietly serializes everyone while scattering lock calls through the codebase. There is a shape with no locks at all: give the connection to one task, and talk to that task.

## Commands in, replies out

An actor is three parts: a task that owns state, an mpsc inbox of commands, and a oneshot channel per command that wants an answer.

```rust
use tokio::sync::{mpsc, oneshot};

enum Command {
    Deliver { email: Email, reply: oneshot::Sender<Result<(), SendError>> },
    Stats { reply: oneshot::Sender<DeliveryStats> },
}

async fn mailer(mut inbox: mpsc::Receiver<Command>, mut conn: SmtpConnection) {
    let mut stats = DeliveryStats::default();
    while let Some(cmd) = inbox.recv().await {
        match cmd {
            Command::Deliver { email, reply } => {
                let outcome = conn.send(&email).await;
                stats.record(&outcome);
                let _ = reply.send(outcome);
            }
            Command::Stats { reply } => {
                let _ = reply.send(stats.clone());
            }
        }
    }
}
```

Callers never see this plumbing; they see a handle:

```rust
#[derive(Clone)]
pub struct Mailer {
    tx: mpsc::Sender<Command>,
}

impl Mailer {
    pub async fn deliver(&self, email: Email) -> Result<(), SendError> {
        let (reply, rx) = oneshot::channel();
        self.tx.send(Command::Deliver { email, reply }).await.expect("mailer gone");
        rx.await.expect("mailer dropped the reply")
    }
}
```

Look at what is absent. `conn` and `stats` are plain `&mut` state with zero synchronization, because only one task can reach them. This is Part 1's one-owner lesson promoted to an architecture: exclusive access enforced by ownership instead of a lock. The actor can `.await` mid-command freely, since it holds no guard. And two earlier lessons compose in for free: a bounded inbox gives the backpressure lesson's pacing (callers wait when the mailer is behind), and dropping the last handle closes the inbox, so `recv` returns `None` and the actor drains and exits, the same ownership-driven shutdown as the worker pool.

## When actors earn their ceremony

An actor is the right shape when access must be exclusive and involves awaiting: one connection, one file, one rate limiter. When invariants span several fields and every mutation must be a transaction. When you want queueing, pacing, and shutdown to come from the channel rather than hand-rolled flags.

It is ceremony when the state is a counter (`AtomicU64`), a read-mostly config (share an immutable `Arc<Config>`, swap it on reload), or a map of independent entries touched for nanoseconds, where a plain `Arc<Mutex<HashMap>>` is fine, as the next lesson argues. The enum, the handle, and the task are real code to maintain; buy them when they replace locks you would otherwise hold wrong.

## One level deeper

Per request: the command enum is moved through the channel (a memcpy the size of the largest variant), the oneshot allocates once, and the round trip is two task wakeups, single-digit microseconds on a busy runtime. Against an I/O-scale command it vanishes; wrapped around a nanosecond HashMap read it multiplies the cost a thousandfold. Same calculus as the clone lesson: price the mechanism against the work inside it.

## Predict, then verify

`deliver` awaits the oneshot reply. Ten tasks call it concurrently, and each SMTP send takes 50 ms. What throughput does the system reach?

Answer: about 20 sends per second, because the actor processes commands one at a time; ten callers park while the mailer works through its inbox. If the resource truly is one connection, that serialization is correct, and the inbox is your smoothing buffer. If it is not, run N mailers consuming one shared inbox, which is exactly the worker pool lesson: a pool is N copies of an actor sharing an inbox. The pattern did not fail; it made the concurrency limit visible, and adjustable in one place.
