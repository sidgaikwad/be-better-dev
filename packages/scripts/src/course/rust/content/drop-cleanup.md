Ownership answers "who frees this". Drop answers "when, exactly".

## Scope end is the free

When an owner goes out of scope, Rust runs the value's destructor: the `Drop` implementation if it has one, then the recursive drop of its fields. For a `String`, that destructor hands the heap buffer back to the allocator. There is no garbage collector deciding later; the free happens at a fixed, known line of your program, inserted by the compiler.

```rust
fn main() {
    let a = String::from("first");
    {
        let b = String::from("second");
    }                       // b dropped here, buffer freed
    println!("{}", a);
}                           // a dropped here
```

Within one scope, values drop in _reverse declaration order_, last in, first out, mirroring the stack itself.

## Drop is for every resource, not just memory

`Drop` is Rust's general "on the way out" hook, and the standard library uses it everywhere:

- `File` closes its file descriptor.
- `MutexGuard` releases the lock.
- `TcpStream` closes the socket.
- a database transaction type can roll back if not explicitly committed.

This pattern (acquire in the constructor, release in the destructor) means resource cleanup cannot be forgotten, not on early returns, not on error paths. Where a Go function needs a `defer` and a JavaScript function a `finally`, a Rust function usually needs nothing at all; scope end is the finally.

You can see it run:

```rust
struct Noisy(&'static str);

impl Drop for Noisy {
    fn drop(&mut self) {
        println!("dropping {}", self.0);
    }
}

fn main() {
    let _a = Noisy("a");
    let _b = Noisy("b");
}   // prints: dropping b, then dropping a
```

## Moves change who drops, never how many times

Give a value away and the drop obligation travels with it:

```rust
fn consume(s: String) { }      // s dropped here, at consume's end

let x = String::from("hello");
consume(x);                    // ownership moved into the function
// x is dead; main drops nothing for it
```

Every value is dropped exactly once, at the scope end of wherever its ownership finally came to rest. The compiler proves this; double drops and forgotten drops are both compile-time impossibilities in safe Rust.

## Predict, then verify

The lock guard pattern, which you will meet again in the concurrency section:

```rust
let guard = mutex.lock().unwrap();
// ... use the data ...
process_something_slow();      // lock still held here?
```

Answer: yes. `guard` lives until the end of its scope, so the mutex stays locked through the slow call, and every other thread waits. The fix is to end the scope early, either with a block or an explicit `drop(guard)`. Holding guards across slow (or worse, async) operations is one of the most common real-world Rust performance bugs, and it is a pure Drop-timing bug: nothing is wrong except _when_ a destructor runs.
