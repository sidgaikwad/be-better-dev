You now know six ways to hold a value, and the honest failure mode of learning them is paralysis: staring at a struct field wondering if it should be `String`, `Box<String>`, `Rc<String>`, or something with three angle brackets. The cure is that the choice is mechanical. Three questions, asked in order, settle it.

## The three questions

**0. Do you need ownership at all?** If this code only reads (or briefly mutates) a value someone else keeps, the answer is `&T` or `&mut T` and you are done. From the shared references lesson: this covers most function parameters, and it is free.

**1. How many owners?** One owner: plain `T`, or `Box<T>` if the value must live on the heap (recursive, huge, or `dyn`). Several owners whose lifetimes only runtime knows: a counted pointer, `Rc` or `Arc`.

**2. Which threads see it?** One thread: `Rc`. More than one, or you cannot rule it out: `Arc`. The compiler backstops you here; `Rc` will not cross.

**3. Who mutates, and through what?** Mutation only via the single owner or `&mut`: nothing more needed. Mutation through shared handles: add an interior layer. `Copy` value: `Cell`. One thread: `RefCell`. Across threads: `Mutex` or `RwLock` (Part 2's subject).

## The table

| You need                            | Reach for                | It costs                                     |
| ----------------------------------- | ------------------------ | -------------------------------------------- |
| One owner, inline                   | `T`                      | nothing                                      |
| To read another's value             | `&T`                     | nothing; checked at compile time             |
| To mutate another's value           | `&mut T`                 | nothing; exclusivity checked at compile time |
| One owner, on the heap              | `Box<T>`                 | one allocation; one-word handle              |
| Many owners, one thread             | `Rc<T>`                  | count bump per clone; cycles can leak        |
| Many owners, any threads            | `Arc<T>`                 | atomic count bump per clone                  |
| Mutation through shares, `Copy`     | `Cell<T>`                | nothing; no references given out             |
| Mutation through shares, one thread | `RefCell<T>`             | runtime flag; panics on overlap              |
| Mutation through shares, threads    | `Mutex<T>` / `RwLock<T>` | lock traffic; blocking                       |

The layers compose by nesting, and you read the type inside out: `Rc<RefCell<Node>>` is "a node, mutable through shares, shared on one thread". Its thread-safe twin is `Arc<Mutex<Node>>`, same two answers with the thread question flipped. The pairs are not interchangeable in either direction: the single-threaded pair is cheaper, the threaded pair is legal everywhere.

## What the handles weigh

```rust
use std::mem::size_of;

size_of::<&u64>();             // 8
size_of::<Box<u64>>();         // 8
size_of::<Rc<u64>>();          // 8
size_of::<Option<Box<u64>>>(); // 8, the niche from the enums lesson
```

Every handle is one word; the differences live elsewhere. `Rc` and `Arc` add a two-count header to the value's allocation; `RefCell` adds a flag word beside the value. The real gradient is enforcement cost: compile-time checked (free), counted (cheap), locked (contended). Prefer the leftmost column the design permits.

## Defaults and smells

- The default is `T` owned and `&T` lent. Most Rust programs are overwhelmingly this, and every pointer in the table is for a shape ownership alone cannot express, not an upgrade.
- `Box` by habit is an allocation for nothing; box when size or `dyn` forces it.
- `Rc<RefCell<T>>` to make a borrow error go away is the same smell as the guilty clone from the clone-judgment lesson: it compiles today and hides a design problem. Fix signatures and data flow first.
- `Arc<Mutex<T>>` everywhere works but serializes every touch; Part 2 shows when channels or ownership transfer beat shared state outright.

## Predict, then verify

The newsletter service loads all email templates from disk at startup, never changes them afterward, and N worker threads read them on every send. What type holds the templates?

Answer: `Arc<HashMap<String, Template>>`. Many owners (each worker holds a handle): counted. Threads involved: `Arc`, not `Rc`. Mutation after startup: none, so no `Mutex` layer; wrapping it anyway would make every read acquire a lock to protect data nobody writes. If hot-reloading arrives later, the cheapest correct upgrades are `Arc<RwLock<...>>` or swapping the whole `Arc` behind an `arc-swap`. Ten seconds, three questions, and the type writes itself.
