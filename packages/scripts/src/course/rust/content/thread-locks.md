Channels remove sharing entirely. Sometimes sharing is the point: one delivery tally that all four workers bump. Here is the data race lesson's broken program, fixed the shared-memory way:

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let delivered = Arc::new(Mutex::new(0u64));

    let mut handles = Vec::new();
    for _ in 0..4 {
        let delivered = Arc::clone(&delivered);
        handles.push(thread::spawn(move || {
            for _ in 0..1_000_000 {
                *delivered.lock().unwrap() += 1;
            }
        }));
    }
    for handle in handles {
        handle.join().unwrap();
    }

    println!("{}", *delivered.lock().unwrap());   // 4000000, every run
}
```

`Arc` gives all five threads ownership of one allocation; `Mutex` makes the writes legal. Four million, deterministically.

## The lock owns the data

In C, Go, or Java, a mutex and the data it guards are separate things associated by convention, and forgetting to lock compiles fine. Rust's `Mutex<T>` contains the `T`. The only way to the data is `lock()`, which blocks until the lock is free and returns a `MutexGuard`: a smart pointer that derefs to the data and releases the lock in its `Drop` implementation. The "Drop: deterministic cleanup" lesson listed `MutexGuard` among the destructor-managed resources; this is that story in full. You cannot forget to lock, because the data is unreachable otherwise, and you cannot forget to unlock, because scope end does it on every path.

This also resolves a borrow checker puzzle: `lock()` takes `&self` yet hands out mutable access. Like `RefCell` from the smart pointers section, `Mutex` is interior mutability, but where `RefCell` panics on a second borrower, `Mutex` makes the second thread wait. Aliasing XOR mutation, enforced by blocking, which is exactly why `Mutex<T>` is `Sync` when plain `T` is not.

## Poisoning

If a thread panics while holding the guard, the data may be half-updated, its invariants broken mid-edit. The mutex is then poisoned: every later `lock()` returns `Err(PoisonError)`. The ubiquitous `.lock().unwrap()` is therefore a policy choice: if some thread died mid-update, panic here too rather than trust the data. To recover deliberately, `PoisonError::into_inner` yields the guard anyway. (The popular `parking_lot` crate skips poisoning entirely; std's futex-based `Mutex` has been fast since Rust 1.62 and is the right one to learn on.)

## The guard you held too long

The "Drop: deterministic cleanup" lesson's closing exercise was secretly about this section. With `queue: Arc<Mutex<VecDeque<String>>>`:

```rust
let guard = queue.lock().unwrap();
if let Some(email) = guard.front() {
    send_over_smtp(email);          // seconds pass; lock still held
}
```

Every other worker now waits out an SMTP round trip. Throughput collapses to single-threaded, with lock overhead added. The fix is scoping the guard to the memory work only:

```rust
let email = {
    let mut guard = queue.lock().unwrap();
    guard.pop_front()
};                                  // guard dropped, lock released
if let Some(email) = email {
    send_over_smtp(&email);
}
```

The rule: hold a lock for memory operations, never across I/O or anything slow. This exact bug returns with higher stakes in the async sections, where holding a std guard across an `.await` can stall a whole runtime.

## RwLock

`RwLock<T>` splits access the way the borrow checker does: `read()` guards may coexist in any number, `write()` is exclusive. The aliasing rule again, as a runtime protocol. Use it for read-mostly state, like a config that every request reads and a reload writes once a minute. It is not automatically faster: its bookkeeping costs more than `Mutex`'s, and fairness policies vary by OS, so writers can wait a long time under heavy read load. Default to `Mutex`; upgrade on evidence.

## Predict, then verify

```rust
let shared = Arc::new(Mutex::new(vec![1, 2, 3]));
let worker = Arc::clone(&shared);
let handle = std::thread::spawn(move || {
    let mut guard = worker.lock().unwrap();
    guard.push(4);
    panic!("worker crashed");
});
let _ = handle.join();
let result = shared.lock();
```

Is `result` `Ok` or `Err`? If the data is recoverable, does it contain the 4?

Answer: `Err`, because the worker panicked while holding the guard, poisoning the mutex. And yes: recovering with `into_inner` shows `[1, 2, 3, 4]`, because the push completed before the panic. Poisoning rolls nothing back; it flags "a thread died partway, the invariants are now your problem". Deciding whether half-finished state is usable is application logic, which is why std makes you type something explicit to get past it.
