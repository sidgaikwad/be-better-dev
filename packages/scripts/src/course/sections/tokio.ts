import type { SectionSeed } from "../types"

// Part 2, section 3: tokio. Learners arrive having built a toy executor in
// Async from scratch and knowing threads and Send/Sync; this section maps
// those hand-built pieces onto the production runtime.

export const tokioSection: SectionSeed = {
  slug: "tokio",
  title: "tokio",
  description: "Runtime anatomy, tasks, work stealing, spawn_blocking, blocking pitfalls.",
  badgeIcon: "🌪️",
  badgeTitle: "tokio",
  units: [
    {
      slug: "inside-the-runtime",
      title: "Inside the runtime",
      description: "What #[tokio::main] builds, and what a spawned task actually costs.",
      lessons: [
        {
          slug: "tokio-runtime-anatomy",
          title: "What #[tokio::main] actually builds",
          summary: "Workers, run queues, the IO driver, and why work stealing balances load.",
          contentFile: "tokio-runtime-anatomy.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does `#[tokio::main]` do to your `main` function?",
              options: [
                "Enables a special compiler mode where main is allowed to be async",
                "Rewrites it into an ordinary sync main that builds a Runtime and calls block_on on your async body",
                "Spawns a daemon thread that polls your program forever",
                "Nothing at runtime; it is only a marker for cargo",
              ],
              answer: 1,
              explanation:
                "It is a plain macro expansion: Builder::new_multi_thread().enable_all().build() plus block_on. Knowing the expansion matters because you write it yourself the day you need a custom runtime configuration.",
            },
            {
              kind: "mcq",
              prompt:
                "Every task in the program is waiting on a socket. What is the runtime doing?",
              options: [
                "All workers spin, re-polling each future in turn",
                "One worker blocks in epoll_wait through the IO driver; the others park",
                "Each socket gets a dedicated OS thread blocked in read",
                "The process exits and the OS restarts it when data arrives",
              ],
              answer: 1,
              explanation:
                "Nothing runnable means no CPU burned: one worker holds the driver and sleeps in epoll_wait, with the next timer deadline as its timeout. It is the same shape as the executor from Async from scratch.",
            },
            {
              kind: "predict",
              prompt:
                "A worker's local queue runs empty while its peers are busy. What does it do first?",
              options: [
                "Park immediately and wait to be woken",
                "Drain the entire shared injection queue into its own queue",
                "Steal half of a random peer's local queue",
                "Round-robin poll the other workers' current tasks",
              ],
              answer: 2,
              explanation:
                "Stealing half of one victim's queue is the load-balancing move: the common path (your own queue) stays uncontended, and lumpy load still spreads across cores in microseconds.",
            },
          ],
        },
        {
          slug: "tokio-spawn-and-tasks",
          title: "tokio::spawn and the price of a task",
          summary: "JoinHandle, tasks versus threads, and why spawned futures are Send + 'static.",
          contentFile: "tokio-spawn-and-tasks.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "You build a future with `let f = deliver_email(id);` and the function returns without awaiting or spawning it. How much of deliver_email's body ran?",
              options: [
                "All of it",
                "Up to its first await",
                "None of it",
                "It runs later on a background thread",
              ],
              answer: 2,
              explanation:
                "Futures are inert values: construction builds a state machine and executes nothing. Only polling drives it, and only .await or tokio::spawn causes polling.",
            },
            {
              kind: "mcq",
              prompt: "Why does `tokio::spawn` require the future to be `Send`?",
              options: [
                "Every future in Rust must be Send",
                "Work stealing can move the task to a different worker thread at any await point",
                "JoinHandle implements Clone and may be shared",
                "Send is what lets the runtime catch panics at the task boundary",
              ],
              answer: 1,
              explanation:
                "A task parked at an await can be stolen and next polled on another thread; everything alive across that await travels with it, so those values must be Send.",
            },
            {
              kind: "mcq",
              prompt: "A spawned task panics while you are awaiting its JoinHandle. What happens?",
              options: [
                "The whole runtime aborts",
                "The worker thread dies and the runtime shrinks by one worker",
                "The panic is caught at the task boundary; your await returns Err(JoinError) and other tasks keep running",
                "Your awaiting task panics too, automatically",
              ],
              answer: 2,
              explanation:
                "The task is the failure boundary: the runtime catches the panic and hands it back as a JoinError (is_panic() distinguishes it from an abort). One crashing handler costs one request, not the server.",
            },
          ],
        },
      ],
    },
    {
      slug: "blocking-and-locks",
      title: "Blocking and locks",
      description: "How to stall a runtime by accident, and the rules for locks in async code.",
      lessons: [
        {
          slug: "tokio-blocking-the-executor",
          title: "The cardinal sin: blocking a worker",
          summary:
            "How one synchronous call becomes mystery latency, and spawn_blocking as the way out.",
          contentFile: "tokio-blocking-the-executor.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "The tokio guidance for how long a task should run between two `.await` points is roughly:",
              options: [
                "10 to 100 microseconds",
                "10 to 100 milliseconds",
                "1 second",
                "There is no limit; the scheduler preempts long polls",
              ],
              answer: 0,
              explanation:
                "A poll is just a function call on a worker and nothing can preempt it. Past roughly 100 microseconds you are visibly delaying every task queued behind you.",
            },
            {
              kind: "predict",
              prompt:
                "A service shows p99 latency spikes while CPU sits near idle and nothing errors. First suspect from this lesson?",
              options: [
                "Too few worker threads for the core count",
                "Blocking calls (sync IO, sleeps, long computations) holding workers inside polls",
                "Garbage collection pauses",
                "An unbounded mpsc channel",
              ],
              answer: 1,
              explanation:
                "Idle CPU plus latency means tasks are finished-and-ready but nothing is polling them: the signature of hostage workers. (Rust has no GC; that reflex belongs to another language.)",
            },
            {
              kind: "mcq",
              prompt:
                "argon2 verification performs no IO at all. Why does Zero to Production still wrap it in spawn_blocking?",
              options: [
                "argon2's API is not Send",
                "It reads salt files from disk under the hood",
                "Blocking is about holding a worker too long: tens to hundreds of ms of pure CPU starves the scheduler exactly like sync IO",
                "spawn_blocking raises the thread's priority for cryptography",
              ],
              answer: 2,
              explanation:
                "The worker cannot run anything else while the hash grinds, whatever the reason. Time over budget is time over budget; spawn_blocking moves it to a pool whose threads are allowed to be slow.",
            },
          ],
        },
        {
          slug: "tokio-mutex-across-await",
          title: "Two mutexes, one rule",
          summary:
            "std::sync::Mutex versus tokio::sync::Mutex, and what holding a lock across an await does.",
          contentFile: "tokio-mutex-across-await.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Per the tokio docs, when is `std::sync::Mutex` the right choice inside async code?",
              options: [
                "Never; async code must use the async mutex",
                "For short critical sections over plain data, with no .await while the lock is held",
                "Only on current_thread runtimes",
                "Only when the protected data is Copy",
              ],
              answer: 1,
              explanation:
                "Locking for nanoseconds sits far under the blocking budget and skips the async mutex's waker overhead. The async mutex earns its cost only when the lock must live across an await.",
            },
            {
              kind: "predict",
              prompt:
                "Single-threaded runtime. Task A holds a std MutexGuard and awaits; task B runs and calls lock() on the same mutex. What happens?",
              options: [
                "B waits a moment and proceeds when A resumes",
                "Deadlock: B blocks the only thread, so A can never be polled again to unlock",
                "The mutex is poisoned and B gets an Err",
                "The runtime detects the cycle and panics with a diagnostic",
              ],
              answer: 1,
              explanation:
                "B's lock() parks the OS thread itself, and that thread is the only one that could ever poll A to the point of unlocking. Nothing errors; the program just stops, which is why the guard must die before the await.",
            },
            {
              kind: "mcq",
              prompt:
                "What makes holding a std MutexGuard across an `.await` a compile error in a spawned task?",
              options: [
                "The borrow checker forbids guards inside async fn",
                "await implicitly drops all guards, so the code would not compile anyway",
                "MutexGuard is !Send, and values alive across an await become fields of the future, which spawn requires to be Send",
                "MutexGuard does not implement Unpin",
              ],
              answer: 2,
              explanation:
                "It is the spawn lesson's Send analysis again: state machine fields cross threads under work stealing, and pthread-style mutexes must be unlocked by the locking thread, so the guard is deliberately !Send.",
            },
          ],
        },
      ],
    },
    {
      slug: "coordination-in-practice",
      title: "Coordination in practice",
      description: "Channels between tasks, deadlines from the clock, and a working server.",
      lessons: [
        {
          slug: "tokio-channels",
          title: "Channels: mpsc, oneshot, watch",
          summary: "Three shapes of message passing and the job each one fits.",
          contentFile: "tokio-channels.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Many handler tasks need a single owning task to run queries, and each caller needs its own answer. The standard wiring is:",
              options: [
                "A watch channel per caller",
                "An mpsc of command values, each carrying a oneshot sender for the reply",
                "One broadcast channel used in both directions",
                "An Arc<tokio::sync::Mutex<Connection>> shared by all handlers",
              ],
              answer: 1,
              explanation:
                "That is the actor shape: mpsc gives ordered, backpressured requests to the single owner, and each command's oneshot routes the answer to exactly the caller who asked. The shared async mutex also works but serializes callers around locks held across IO, the mutex lesson's narrow case.",
            },
            {
              kind: "predict",
              prompt:
                "A bounded mpsc::channel(10) already holds 10 items when a producer calls send(item).await. What happens?",
              options: [
                "send returns Err immediately",
                "The oldest queued item is dropped to make room",
                "The producer task parks until the consumer makes room; its worker thread stays free",
                "The producer's worker thread blocks until there is room",
              ],
              answer: 2,
              explanation:
                "send returns Pending and registers a waker, the same mechanics as any await: the task waits, the thread does not. That parking is backpressure, and it is the whole argument for bounded over unbounded.",
            },
            {
              kind: "mcq",
              prompt: "Which job is `watch` designed for?",
              options: [
                "Delivering every newsletter email exactly once, in order",
                "Fanning each chat message out to every connected user",
                "Publishing the current config where readers only ever need the latest value",
                "Returning one query result to one caller",
              ],
              answer: 2,
              explanation:
                "watch keeps a single slot and overwrites it, so intermediate values are lost by design: right for current state, wrong for queues. The other three jobs belong to mpsc, broadcast, and oneshot respectively.",
            },
          ],
        },
        {
          slug: "tokio-echo-server",
          title: "Capstone: an echo server with deadlines",
          summary:
            "sleep, interval, and timeout wired into a TCP server built from this section's parts.",
          xp: 25,
          contentFile: "tokio-echo-server.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "`timeout(Duration::from_secs(30), socket.read(&mut buf))` expires. What happened to the read?",
              options: [
                "It keeps running on the blocking pool",
                "The read future is dropped, cancelling it; timeout returns Err(Elapsed)",
                "The socket is closed but the read future stays queued",
                "The read completes anyway and its bytes are discarded",
              ],
              answer: 1,
              explanation:
                "timeout races two futures and drops the loser; in async Rust, dropping a future is cancellation. What drop-cancellation is and is not safe for is the subject of Streams, select, cancellation.",
            },
            {
              kind: "predict",
              prompt:
                "10,000 clients connect to the echo server and go silent. Until the idle timeouts fire, what do CPU and memory look like?",
              options: [
                "CPU climbs roughly linearly with connection count",
                "Zero CPU: every task is parked and one thread sleeps in epoll_wait; memory is roughly the 10,000 buffers",
                "One core spins driving the timer wheel",
                "8 MiB per connection, since each task reserves a stack",
              ],
              answer: 1,
              explanation:
                "Parked tasks cost nothing until a waker fires, and a task has no stack of its own: just its state machine plus the 4 KiB buffer it owns. The thread-per-connection version reserves 8 MiB of virtual stack each, the comparison this whole section is about.",
            },
            {
              kind: "mcq",
              prompt:
                "The byte total lives in a dedicated task fed by mpsc instead of an Arc<Mutex<usize>>. What does the channel version buy?",
              options: [
                "Channels are always faster than mutexes",
                "It avoids the Send + 'static bounds on spawn",
                "Single ownership with backpressure, and the design survives the counter update growing an await (say, a database write)",
                "Mutexes cannot be shared between tokio tasks",
              ],
              answer: 2,
              explanation:
                "The mutex was legal here by the mutex lesson's rule (short critical section, no await), but the moment updating the state involves IO, the owner-and-channel shape keeps working while the mutex becomes hold-across-await. One owner is the Part 1 rule in concurrency clothes.",
            },
          ],
        },
      ],
    },
  ],
}
