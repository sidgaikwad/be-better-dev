tokio ships its own `tokio::sync::Mutex`, so the obvious rule would be: in async code, use the async mutex. The tokio documentation says the opposite: the ordinary `std::sync::Mutex` is fine, and often preferred, in async code. Untangling that gives you the actual decision rule.

Start with what is fine. The shared-state pattern from Threads, Send and Sync carries straight over:

```rust
let metrics = Arc::new(Mutex::new(HashMap::<String, u64>::new()));

// inside any task:
let mut m = metrics.lock().unwrap();
*m.entry(path.to_owned()).or_default() += 1;
// guard drops here
```

Lock, touch a map, unlock: tens of nanoseconds. Yes, `lock()` can briefly block the worker if contended, but the blocking lesson's budget was 10 to 100 microseconds, and this critical section sits three orders of magnitude under it. Short critical sections over plain data, with no `.await` while locked: std mutex, no apology.

## Across an await, everything changes

```rust
let mut m = metrics.lock().unwrap();
let extra = fetch_weights().await;   // guard is alive here
m.insert("weighted".into(), extra);
```

Two distinct failures live in those three lines.

The compiler catches the first. From the spawn lesson: locals alive across an `.await` become fields of the state machine, and `tokio::spawn` requires that state machine to be `Send`. `std::sync::MutexGuard` is deliberately `!Send` (many platforms require a mutex to be unlocked by the thread that locked it), so spawning this future fails with the familiar diagnostic: future cannot be sent between threads safely, the trait `Send` is not implemented for `MutexGuard<'_, ...>`.

The second failure lives where `Send` is not required, the future you hand to `block_on` itself, or local tasks on a `LocalSet`, and the compiler cannot see it. Task A locks, then hits `Pending` at the await. The thread, freed, picks up task B. B calls `lock()`, which blocks the OS thread until the mutex is free. But the mutex frees only when A resumes, and A can only resume on the thread B is now blocking. Deadlock: zero CPU, zero errors, program frozen. Scale the shape up and it degrades instead of freezing: every task stuck in `lock()` parks a whole worker, the cardinal sin again, one worker at a time.

## What the async mutex actually buys

```rust
let conn = Arc::new(tokio::sync::Mutex::new(db_connection));

let mut c = conn.lock().await;   // waiting yields; the worker stays free
c.execute(query).await;          // holding across an await is the designed use
```

`lock()` is async: a waiting task parks a waker, like every other `Pending` in this course, and the guard it returns is `Send`, so holding it across an await is legal and intended. The price is that every lock and unlock goes through queueing and waker machinery, measurably slower than the std mutex. Which is why the docs scope its use narrowly: shared mutable access to something you must hold while doing IO, the canonical example being one database connection shared by many tasks.

The rule, in full:

- Plain data, short critical section, no await while locked: `std::sync::Mutex`.
- The lock must live across an `.await`: `tokio::sync::Mutex`, and know what you bought: while one task holds it through a slow query, every other task queues behind that IO.
- You keep landing in the second case: usually neither mutex is right. Give the resource to one task that owns it outright, the one-owner rule from Part 1 in concurrency clothes, and talk to that task over channels. That is the next lesson.

## Predict, then verify

You scope the guard so it dies before the await:

```rust
let base = {
    let m = metrics.lock().unwrap();
    m.get("base").copied().unwrap_or(0)
};
let adjusted = rescale(base).await;
```

Does `tokio::spawn` accept a future containing this?

Answer: yes. The `Send` analysis counts values alive across await points; the guard dies at the closing brace, before the await, so it never becomes a field of the state machine. This scoping pattern (or an explicit `drop(guard)`) is the standard way to use std mutexes in async code, and it also dissolves the deadlock: nobody sleeps holding the lock, so nobody can be parked forever waiting for a sleeper.
