Locks let threads share memory and take turns; they arrive next lesson. Channels take the other road, the one Go made famous: "share memory by communicating" instead of communicating by sharing. In Rust the slogan gets teeth, because sending a value moves ownership.

## mpsc in one program

Four delivery workers report back to a coordinator:

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    for worker in 0..4 {
        let tx = tx.clone();
        thread::spawn(move || {
            let report = format!("worker {worker}: batch delivered");
            tx.send(report).unwrap();
        });
    }
    drop(tx);   // main's own sender, no longer needed

    for report in rx {
        println!("{report}");
    }
}
```

`mpsc` is multiple producer, single consumer: the `Sender` clones freely, the one `Receiver` does not. `send` puts a value in; `recv` (which the `for` loop calls) blocks until a value arrives, and the loop ends when the channel closes, that is, when every `Sender` is gone. The `drop(tx)` is load-bearing; hold that thought for the exercise.

## Ownership goes through the pipe

```rust
let (tx, rx) = mpsc::channel();
let email = String::from("Welcome to the newsletter");
tx.send(email).unwrap();
println!("{email}");    // error[E0382]: borrow of moved value: `email`
```

`send` takes its argument by value. This is the "Passing values into functions" lesson operating across threads: after the send, the sender's binding is dead at compile time, so there is no moment when two threads can both touch the `String`. No sharing, therefore no data race, and not a lock in sight. The move is cheap regardless of message size: as in the "Copy or move" lesson, the small header is copied and the heap buffer stays where it is; only permission travels.

The marker traits ride along, too: a `Sender<T>` can only move to another thread when `T: Send`, so a channel of `Rc`s is rejected exactly like last lesson's direct attempt.

## Unbounded channels and the memory bill

`mpsc::channel()` is unbounded: `send` never blocks, and the internal queue grows as needed. Now picture the newsletter at scale: one thread reads a million subscriber rows and sends them into the channel, while SMTP delivery drains ten per second. The channel becomes a balloon of undelivered `String`s inflating toward out-of-memory, and it bursts at peak traffic, the worst possible time.

`mpsc::sync_channel(64)` is the bounded alternative: with 64 messages queued, `send` blocks until the consumer drains one. The producer is forced down to the consumer's pace. That is backpressure, and it converts "the consumer is slow" from a crash into a throughput number. Bounded is the safer default in servers; choosing the capacity is a real design decision, and the tokio and concurrency patterns sections return to it.

## Predict, then verify

Delete the `drop(tx)` line from the first program. The four workers run and finish. What does the program print, and what does it do after that?

Answer: it prints the four reports, then hangs forever. The loop ends only when all senders are dropped. The four clones died with their worker threads (scope end, per the "Drop: deterministic cleanup" lesson), but the original `tx` is still alive in `main`, and `main` cannot reach its end because it is blocked inside the loop that is waiting for `tx` to die. A deadlock built from one forgotten line, no locks involved. This is the most common first channel bug in Rust; the fixes are `drop(tx)`, or arranging for the last worker to take `tx` by move instead of a clone.
