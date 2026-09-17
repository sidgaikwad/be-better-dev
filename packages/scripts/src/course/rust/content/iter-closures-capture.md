You have been writing closures since "Option: absence made visible": the `|s| s.name` inside `map` was one. This section leans on them everywhere, so first the real question about closures, which is not the syntax. It is: what happens to the variables the body mentions?

## Syntax is the small part

```rust
let add = |a: i32, b: i32| a + b;
let double = |n| n * 2;
let sum = add(2, 3);       // 5
let big = double(sum);     // 10; n's type inferred from this use
```

Parameter and return types are usually inferred, and a multi-statement body takes braces. So far, any language's lambda. The difference starts when the body uses a variable it did not declare.

## Three capture modes, chosen for you

A closure captures every outside variable it touches, and the compiler picks, per variable, the least demanding mode the body can get away with:

```rust
let log = vec![String::from("delivered to a@x.com")];
let read = || println!("last: {:?}", log.last());       // reads log: captures &log
read();

let mut queue = vec![String::from("b@y.com")];
let mut push = || queue.push(String::from("c@z.com"));  // mutates queue: captures &mut queue
push();

let report = String::from("2 delivered, 0 failed");
let finish = || drop(report);                           // consumes report: captures by value
finish();
```

Reading takes a shared borrow, the `&T` from "&T: look, don't touch". Mutating takes an exclusive borrow under the rules of "&mut T: one writer, no readers" (and `push` itself must be `mut`, a detail the next lesson explains). Consuming moves the value in, exactly as if it had been passed by value in "Passing values into functions".

No new rules were invented. The borrow checker treats a capture as an ordinary borrow that starts at the closure's definition and lasts through its last use:

```rust
let mut greeting = String::from("hello");
let print_it = || println!("{greeting}");
greeting.push_str(", world");   // rejected
print_it();
```

```text
error[E0502]: cannot borrow `greeting` as mutable
              because it is also borrowed as immutable
```

`print_it` still holds `&greeting` when `push_str` wants `&mut`, the exact conflict "What the borrow checker proves" rules out. Move the mutation below the last call of `print_it` and it compiles.

## move: capture by value, on purpose

Borrowing fails when the closure must outlive the variable it captured, say, because you return it:

```rust
fn make_greeter(name: String) -> impl Fn() -> String {
    move || format!("hello, {name}")    // name moves into the closure
}
```

Without `move`, the closure would borrow `name`, and returning it would create the dangling reference "No dangling: why lifetimes exist" forbids. `move` forces every captured variable in by value. One nuance from "Copy or move": `Copy` types are copied in, so the original stays usable; a `String` genuinely moves.

## What a closure is in memory

An anonymous struct with one field per capture, plus a call method. By-reference capture stores a reference; by-value capture stores the value:

```rust
let id = 42u64;
let name = String::from("newsletter");
let by_ref = || format!("{id}: {name}");
println!("{}", std::mem::size_of_val(&by_ref));   // 16: two references
let by_val = move || format!("{id}: {name}");
println!("{}", std::mem::size_of_val(&by_val));   // 32: a u64 plus String's 24-byte header
```

Either way the heap text behind `name` never moves ("Stack and heap, for real"): only the header does. A closure capturing nothing is zero-sized. There is no context object on a garbage-collected heap keeping environments alive, which is why the compiler must be this strict about who owns what, and why a closure costs exactly what the equivalent hand-written struct would.

## Predict, then verify

```rust
let attempts = 3u32;
let label = String::from("delivery");
let describe = move || format!("{label}: {attempts} attempts");
println!("{attempts}");
println!("{label}");
println!("{}", describe());
```

One of the two middle lines fails. Which, and why not the other?

Answer: `println!("{label}")` is rejected with borrow of moved value: `label`. The `move` closure took the `String` by value, so the original binding is dead, the standard error from "Copy or move". `attempts` survives because `u32` is `Copy`: the closure captured a copy and the original stays valid. Delete the `label` line and it prints 3, then `delivery: 3 attempts`.
