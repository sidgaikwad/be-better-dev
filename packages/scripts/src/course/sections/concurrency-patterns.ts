import type { SectionSeed } from "../types"

export const concurrencyPatterns: SectionSeed = {
  slug: "concurrency-patterns",
  title: "Concurrency patterns",
  description: "Worker pools, actors, backpressure, graceful shutdown.",
  badgeIcon: "🧭",
  badgeTitle: "Patterns",
  units: [
    {
      slug: "distributing-work",
      title: "Distributing work",
      description: "One queue, many workers, and limits that hold under load.",
      lessons: [
        {
          slug: "conc-worker-pools",
          title: "The worker pool",
          summary: "N workers, one queue: parallelism with a fixed footprint.",
          contentFile: "conc-worker-pools.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does the thread pool wrap the mpsc `Receiver` in `Arc<Mutex<...>>`?",
              options: [
                "Receiving without a lock would be an undetectable data race",
                "std's Receiver is single-consumer and not Clone; the Mutex lets N workers take turns with the one receiver",
                "The Mutex is what makes the channel bounded",
                "To guarantee jobs are executed in FIFO order",
              ],
              answer: 1,
              explanation:
                "The channel is multi-producer, single-consumer by design, so the one receiver must be shared by turn-taking. crossbeam-channel removes the need entirely by making receivers multi-consumer and cloneable.",
            },
            {
              kind: "predict",
              prompt:
                "Workers are mid-job and 200 jobs are still queued when the last `Sender` is dropped. What happens?",
              options: [
                "Workers finish their current job; the 200 queued jobs are lost",
                "recv panics on the closed channel",
                "Workers drain the 200 queued jobs, then recv returns Err and each loop exits",
                "The pool deadlocks waiting for a sender that never comes",
              ],
              answer: 2,
              explanation:
                "Closing a channel stops new sends, not delivery of what is already queued. recv only errors once the buffer is empty with no senders left, which makes dropping the sender a clean drain-then-stop signal.",
            },
            {
              kind: "mcq",
              prompt:
                "tokio tasks cost hundreds of bytes, yet a pool can still beat task-per-job. Which situation argues for the pool?",
              options: [
                "Jobs arrive faster than one per millisecond",
                "Each job needs a database connection, and connections are expensive to open",
                "The jobs are async rather than blocking",
                "The runtime is multi-threaded",
              ],
              answer: 1,
              explanation:
                "A pooled worker opens its connection once and reuses it across every job it handles; task-per-job pays for one per job. Cheap tasks do not make the resources each task holds cheap.",
            },
          ],
        },
        {
          slug: "conc-backpressure",
          title: "Backpressure by design",
          summary: "Bounded channels and semaphores turn overload into waiting, not memory.",
          contentFile: "conc-backpressure.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "A bounded channel is full and `send(job).await` does not complete. What is that telling the producer?",
              options: [
                "The channel is broken and should be recreated",
                "The consumer is behind; the producer is being paced to the consumer's speed",
                "The runtime is out of tasks",
                "The item was dropped and should be retried",
              ],
              answer: 1,
              explanation:
                "A full queue is information about the consumer, and the waiting send delivers it upstream as delay. That pacing is the entire point of choosing a bound.",
            },
            {
              kind: "predict",
              prompt:
                "A producer feeds an unbounded channel 10x faster than the consumer drains it. Which symptom shows up first?",
              options: [
                "send() starts returning errors",
                "Memory grows steadily while the producer keeps reporting success",
                "The runtime automatically throttles the producer",
                "The channel drops the oldest items to keep up",
              ],
              answer: 1,
              explanation:
                "Unbounded send always succeeds instantly, so the overload is invisible to the producer and accumulates as live heap. The limit still exists; it has just been moved to the OOM killer.",
            },
            {
              kind: "mcq",
              prompt:
                "In the delivery loop that calls `limit.clone().acquire_owned().await` before each `tokio::spawn`, with `Semaphore::new(10)`, what exactly is capped at 10?",
              options: [
                "Jobs waiting in a queue",
                "Emails in flight at any moment",
                "Total emails sent per issue",
                "Worker threads in the runtime",
              ],
              answer: 1,
              explanation:
                "Each spawned task holds a permit for the duration of its send and releases it on drop, so the semaphore bounds concurrent in-flight work. Queued-versus-running is the channel-versus-semaphore distinction.",
            },
          ],
        },
      ],
    },
    {
      slug: "owning-state",
      title: "Owning state",
      description: "Actors, locks, sharding, and how to choose between them.",
      lessons: [
        {
          slug: "conc-actors",
          title: "The actor pattern",
          summary: "One task owns the state; everyone else sends it messages.",
          contentFile: "conc-actors.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "The mailer actor mutates `conn` and `stats` with no Mutex anywhere. Why is that sound?",
              options: [
                "tokio guarantees only one task runs at a time",
                "Only the actor task owns them, so exclusive access is enforced by ownership rather than a lock",
                "Channels insert memory fences that make concurrent access safe",
                "The state is Copy, so races cannot corrupt it",
              ],
              answer: 1,
              explanation:
                "The state never leaves the task, so a second &mut cannot exist. It is the one-owner rule doing at the architecture level what the borrow checker does inside a function.",
            },
            {
              kind: "predict",
              prompt:
                "Every `Mailer` handle is dropped while ten commands sit in the actor's inbox. What does the actor do?",
              options: [
                "Exits immediately, dropping the ten commands",
                "Processes the ten queued commands, then recv returns None and it exits",
                "Waits on recv forever, leaking the task",
                "Panics because the channel closed under it",
              ],
              answer: 1,
              explanation:
                "A closed channel still delivers what is queued, the same drain-then-stop you saw in the worker pool lesson. Replies may go to oneshot receivers that are already gone, which is why the actor ignores reply.send errors.",
            },
            {
              kind: "mcq",
              prompt: "For which of these is an actor pure ceremony?",
              options: [
                "An SMTP connection used by 40 tasks",
                "A global request counter",
                "An account balance where check and debit must be atomic and the debit awaits a database call",
                "A rate limiter that grants send slots",
              ],
              answer: 1,
              explanation:
                "A counter is one AtomicU64 instruction; a task, an enum, and two channel hops per increment add code and latency for nothing. The other three genuinely need exclusive, awaited access.",
            },
          ],
        },
        {
          slug: "conc-shared-state",
          title: "Sharing state: a judgment call",
          summary: "Arc<Mutex>, message passing, or sharding: what each costs and when each wins.",
          contentFile: "conc-shared-state.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does an uncontended Mutex lock-unlock pair actually cost?",
              options: [
                "Two syscalls into the kernel",
                "A few nanoseconds of atomic operations",
                "A thread park and a wakeup",
                "One cache flush of the protected data",
              ],
              answer: 1,
              explanation:
                "Uncontended locking is a compare-exchange each way, with no kernel involvement. The expensive cases are contention and long hold times, which is why you profile those instead of counting locks.",
            },
            {
              kind: "predict",
              prompt:
                "A task passed to `tokio::spawn` locks a `std::sync::Mutex` and calls `.await` while holding the guard. What happens?",
              options: [
                "It deadlocks at runtime",
                "It compiles but serializes all tasks",
                "It fails to compile: holding the guard makes the future not Send, and spawn rejects it",
                "The guard is silently released at the await point",
              ],
              answer: 2,
              explanation:
                "The guard becomes part of the future's stored state across the await (the pinning section showed futures keep live locals), and std's MutexGuard is not Send. The error is irritating and correct: it is pointing at a design problem.",
            },
            {
              kind: "mcq",
              prompt:
                "One `Mutex<HashMap>` is heavily contended, and profiling shows tasks touch unrelated keys. Which fix fits first?",
              options: [
                "Switch to tokio::sync::Mutex",
                "Shard the map across several locks (or use dashmap)",
                "Send every read through an actor",
                "Give each task its own clone of the map",
              ],
              answer: 1,
              explanation:
                "Independent keys mean the contention is an artifact of one lock, so splitting the data divides it away while keeping the code shape. Cloning the map is the clone lesson's 'cloning shared state to share it' smell: the copies diverge.",
            },
          ],
        },
      ],
    },
    {
      slug: "stopping-well",
      title: "Stopping well",
      description: "Shutdown that drains on a deadline, then every pattern composed.",
      lessons: [
        {
          slug: "conc-graceful-shutdown",
          title: "Graceful shutdown",
          summary: "Stop intake, drain with a deadline, and let kill -9 audit your durability.",
          contentFile: "conc-graceful-shutdown.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Graceful shutdown's steps, in order:",
              options: [
                "Cancel every task, close the channels, wait as long as it takes",
                "Stop taking new work, drain in-flight work under a deadline, exit",
                "Drain in-flight work, stop taking new work, exit",
                "Exit immediately and rely on Drop implementations",
              ],
              answer: 1,
              explanation:
                "Intake stops first so the drain can converge, and the drain gets a deadline because the platform enforces one of its own. Reversing the first two steps means draining a queue that is still filling.",
            },
            {
              kind: "predict",
              prompt: "The process receives SIGKILL. How much of its shutdown code runs?",
              options: [
                "Only the signal handler",
                "The handler plus Drop implementations",
                "None of it: the kernel reclaims the process without scheduling it again",
                "Only code registered with atexit",
              ],
              answer: 2,
              explanation:
                "SIGKILL is never delivered to user code; the process simply stops existing, exactly like power loss or an OOM kill. That is why correctness must come from durable state, not from drain logic.",
            },
            {
              kind: "mcq",
              prompt: "Why must the drain deadline be shorter than the platform's grace period?",
              options: [
                "tokio requires a timeout on tracker.wait()",
                "So the process exits on its own terms before the platform's SIGKILL lands mid-write",
                "Shorter deadlines reduce CPU usage during shutdown",
                "Because timeout cancels the remaining tasks cleanly",
              ],
              answer: 1,
              explanation:
                "If the drain outlives the grace period, the platform ends it with SIGKILL at an arbitrary moment. Finishing early keeps the final state one you chose; the timeout itself does not cancel anything.",
            },
          ],
        },
        {
          slug: "conc-delivery-capstone",
          title: "Capstone: the delivery worker",
          summary: "Pool, backpressure, actor, and shutdown composed into one worker.",
          xp: 25,
          contentFile: "conc-delivery-capstone.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "The subscriber list grows from 500 to 500,000. Which choice keeps the worker's memory flat?",
              options: [
                "The CancellationToken fan-out",
                "The bounded jobs channel: the producer parks instead of queueing everything",
                "Calling tracker.close() after spawning",
                "The Progress actor's oneshot replies",
              ],
              answer: 1,
              explanation:
                "With capacity 64 the heap holds at most the queued and in-flight jobs while the rest stay unread in the database cursor. That is the backpressure lesson doing the capstone's heavy lifting.",
            },
            {
              kind: "predict",
              prompt:
                "SIGTERM arrives while all 8 workers are mid-send and 64 jobs are queued. What does this design do?",
              options: [
                "Aborts the 8 in-flight sends immediately",
                "Finishes the 8 in-flight sends, abandons the 64 queued jobs, exits within the deadline",
                "Drains all 72 jobs before exiting",
                "Ignores the signal until the queue is empty",
              ],
              answer: 1,
              explanation:
                "Workers only check cancellation between jobs, so current sends complete while the queue is dropped, a policy the shutdown lesson made explicit. Chapter 11's durable queue is what makes that abandonment safe.",
            },
            {
              kind: "mcq",
              prompt:
                "After a kill -9 mid-issue, rerunning this sketch would double-send to some subscribers. Chapter 11 prevents that by:",
              options: [
                "Extending the drain deadline past the grace period",
                "Catching SIGKILL and flushing the queue",
                "Recording each delivery idempotently in Postgres so a restarted worker resumes without repeating",
                "Switching to an unbounded queue that survives restarts",
              ],
              answer: 2,
              explanation:
                "The in-memory channel becomes a database-backed task set with per-subscriber idempotency, so progress survives any death, including the uncatchable ones. The concurrency patterns stay; only the queue's substrate changes.",
            },
          ],
        },
      ],
    },
  ],
}
