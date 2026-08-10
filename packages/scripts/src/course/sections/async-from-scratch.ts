import type { SectionSeed } from "../types"

// Part 2, section: async rebuilt from primitives. No tokio in this section;
// the runtime arrives next section, after every piece of it has been built by hand.

export const asyncFromScratch: SectionSeed = {
  slug: "async-from-scratch",
  title: "Async from scratch",
  description: "Future, poll, wakers; build a minimal executor before touching tokio.",
  badgeIcon: "⚙️",
  badgeTitle: "Futures",
  units: [
    {
      slug: "the-waiting-problem",
      title: "The waiting problem",
      description:
        "Why thread-per-connection collapses, and the trait that represents unfinished work.",
      lessons: [
        {
          slug: "future-why-async",
          title: "Why async exists",
          summary: "Thread-per-connection, C10K, and what a server actually waits on.",
          contentFile: "future-why-async.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "During the 300 ms wait in the delivery timeline, the blocked thread is:",
              options: [
                "Spinning on the CPU, checking the socket",
                "Asleep in the kernel: no CPU, but its stack, kernel structures, and scheduler slot stay claimed",
                "Freed and respawned when bytes arrive",
                "Processing other connections in the background",
              ],
              answer: 1,
              explanation:
                "A blocking read parks the thread until bytes arrive. The waste is not CPU; it is that an entire thread's worth of resources stands in for one pending wait.",
            },
            {
              kind: "mcq",
              prompt: "The core finding of the C10K problem was:",
              options: [
                "Ten thousand connections exceed what any single CPU can compute",
                "Networks cannot carry ten thousand concurrent sockets",
                "Dedicating a thread to each mostly-idle connection collapses long before compute runs out",
                "Kernels refuse to schedule more than ten thousand threads",
              ],
              answer: 2,
              explanation:
                "The arithmetic of stacks, kernel bookkeeping, and context switches fails first; the actual computation in ten thousand slow connections fits on a core or two.",
            },
            {
              kind: "predict",
              prompt:
                "Async replaces each waiting thread with a paused value that describes how to resume. Roughly what does one paused send cost in memory?",
              options: [
                "Megabytes, about the same as a thread stack",
                "Exactly one 4 KiB page",
                "Bytes to a few kilobytes: only the state that must survive the pause",
                "Nothing measurable",
              ],
              answer: 2,
              explanation:
                "A future stores exactly what resuming needs, and the state machine lesson shows which locals those are. The gap, bytes versus megabytes, is async's entire economic case.",
            },
          ],
        },
        {
          slug: "future-trait",
          title: "Future: a value, not a promise",
          summary: "poll, Ready or Pending, and why nothing happens until something polls.",
          contentFile: "future-trait.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "`let fut = send_confirmation(email);` runs, and the async fn's body starts with a `println!`. What has printed once this line completes?",
              options: [
                "The println output",
                "Nothing: calling an async fn only constructs a value",
                "The output appears after a runtime-dependent delay",
                "It does not compile without an executor in scope",
              ],
              answer: 1,
              explanation:
                "Calling an async fn moves the arguments into a new future value and runs none of the body. As the compiler's note puts it, futures do nothing unless polled.",
            },
            {
              kind: "mcq",
              prompt: "A well-behaved future returning `Poll::Pending` has already:",
              options: [
                "Blocked its thread until the data arrived",
                "Arranged, through the Context's waker, to trigger a re-poll when progress is possible",
                "Registered itself with the global runtime",
                "Cached a partial result in the Context",
              ],
              answer: 1,
              explanation:
                "Pending without a wake-up arrangement means no one ever has a reason to poll again. The waker lesson turns this obligation into runnable code.",
            },
            {
              kind: "mcq",
              prompt: "The sharpest difference between a Rust Future and a JavaScript Promise:",
              options: [
                "A Promise's work is already running when you hold one; a Future does nothing until polled",
                "Futures cannot represent failures",
                "Futures always allocate; Promises never do",
                "There is no real difference",
              ],
              answer: 0,
              explanation:
                "JS runs the promise's executor function eagerly and the runtime drives it to completion. A Rust future is inert data, which is what makes drop-as-cancellation and runtime-free composition possible.",
            },
          ],
        },
      ],
    },
    {
      slug: "what-the-compiler-builds",
      title: "What the compiler builds",
      description:
        "async fn desugared into a state machine, and the waker contract that re-polls it.",
      lessons: [
        {
          slug: "future-state-machine",
          title: "What async fn compiles to",
          summary: "An enum with one variant per await point; locals that survive become fields.",
          contentFile: "future-state-machine.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Each `.await` in an async fn's source corresponds, in the generated code, to:",
              options: [
                "A call into the runtime's scheduler",
                "A variant of the state enum where the machine can suspend, holding what must survive",
                "A heap allocation for the suspended frame",
                "A new OS thread parked on the result",
              ],
              answer: 1,
              explanation:
                "The compiler cuts the body at every await and gives each cut a variant that stores the live locals plus the child future, inline, with no allocation.",
            },
            {
              kind: "predict",
              prompt:
                "`let data = vec![0u8; 1_000_000]; process(&data).await;` While this future is Pending, where are the Vec's three header words, and where is the megabyte?",
              options: [
                "Both are copied into the future",
                "The header words are a field of the future's state; the megabyte stays on the heap where it always was",
                "Both stay on the executor's stack",
                "The header goes to thread-local storage and the buffer into the future",
              ],
              answer: 1,
              explanation:
                "Locals that live across an await move into the state machine, and a Vec's local part is the ptr/len/cap header from the stack-and-heap lesson. The heap buffer never moves.",
            },
            {
              kind: "mcq",
              prompt:
                "`deliver()` awaits `fetch_email()`, which awaits a socket read. What allocation does the nesting itself cost?",
              options: [
                "One Box per await point",
                "One Box per async fn in the chain",
                "None: child machines nest inline as fields, one flat value",
                "One Arc shared across the tree",
              ],
              answer: 2,
              explanation:
                "Future composition is struct composition: the parent's size grows to contain the child. A runtime typically boxes the whole task once at spawn, which the tokio section covers.",
            },
          ],
        },
        {
          slug: "future-waker",
          title: "Wakers: the readiness contract",
          summary: "How Pending futures get re-polled: Context, Waker, and the doorbell model.",
          contentFile: "future-waker.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Before returning `Pending`, a future must:",
              options: [
                "Sleep briefly so the executor is not overwhelmed",
                "Lodge a clone of the Context's waker with something that will call wake() when progress is possible",
                "Call wake() itself, so the executor knows it is alive",
                "Move its state to the heap",
              ],
              answer: 1,
              explanation:
                "Only the future knows what it is waiting for, so it plants the doorbell. The executor's half of the contract is to re-poll when, and only when, it rings.",
            },
            {
              kind: "mcq",
              prompt: "What does `wake()` deliver to the executor?",
              options: [
                "The completed Output value",
                "The future's updated state",
                "Only the fact that re-polling this task is now worthwhile",
                "A fresh Context for the next poll",
              ],
              answer: 2,
              explanation:
                "Wakes carry no payload; the value is produced by the next poll. That is the readiness model, and it is why spurious wakes are harmless: an extra poll just returns Pending again.",
            },
            {
              kind: "predict",
              prompt:
                "A hand-written future returns Pending but never stores the waker. Under a correct executor, the program:",
              options: [
                "Panics with a missing-waker error",
                "Spins at 100% CPU",
                "Hangs forever at roughly 0% CPU",
                "Completes, but more slowly",
              ],
              answer: 2,
              explanation:
                "The executor sleeps waiting for a wake that never comes. A sloppier executor that re-polls on a timer would mask the bug, which is why you program to the contract, not to one runtime's forgiveness.",
            },
          ],
        },
      ],
    },
    {
      slug: "an-executor-by-hand",
      title: "An executor by hand",
      description:
        "block_on from std alone, then the OS readiness machinery real reactors build on.",
      lessons: [
        {
          slug: "future-block-on",
          title: "block_on: an executor by hand",
          summary: "A complete executor from std alone: poll, park, unpark, repeat.",
          xp: 25,
          contentFile: "future-block-on.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In this lesson's block_on, calling `wake()` physically:",
              options: [
                "Re-runs poll from the sleeper thread",
                "Unparks the executor thread so its loop polls again",
                "Sends the output value through a channel",
                "Raises a signal handled by the kernel",
              ],
              answer: 1,
              explanation:
                "The waker is Thread::unpark behind the Waker vtable. Executors differ only in what wake means: tokio's pushes the task onto a run queue instead.",
            },
            {
              kind: "predict",
              prompt:
                "The sleeper thread calls `wake()` after poll returns Pending but before block_on reaches `thread::park()`. What happens?",
              options: [
                "The wakeup is lost and block_on parks forever",
                "park returns immediately: the early unpark left a token behind",
                "The program panics on double-unpark",
                "wake() blocks until the executor actually parks",
              ],
              answer: 1,
              explanation:
                "unpark on a not-yet-parked thread stores a token that the next park consumes. That token is exactly what makes the poll-then-park pattern race-free.",
            },
            {
              kind: "mcq",
              prompt: "What does this block_on lack that a server runtime needs?",
              options: [
                "The ability to return values from futures",
                "Tolerance of spurious wakeups",
                "Many tasks with a run queue, plus a reactor sharing one wait across all I/O sources",
                "Support for async blocks",
              ],
              answer: 2,
              explanation:
                "It drives exactly one task, and every waiting future costs a thread. The epoll lesson supplies the shared wait; the tokio section supplies the multi-task executor.",
            },
          ],
        },
        {
          slug: "future-epoll",
          title: "epoll: waiting on ten thousand sockets",
          summary: "Registered interest, ready lists, and why one thread can wait on them all.",
          contentFile: "future-epoll.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "`epoll_ctl(ep, ADD, socket_fd, readable)` does what?",
              options: [
                "Reads whatever bytes are currently buffered on the socket",
                "Blocks until the socket becomes readable",
                "Makes future reads on the socket non-blocking",
                "Durably registers interest, so every later epoll_wait reports this socket when it is readable",
              ],
              answer: 3,
              explanation:
                "Registration happens once and waiting happens forever after; data is still moved by ordinary non-blocking reads once readiness is reported.",
            },
            {
              kind: "predict",
              prompt:
                "10,000 sockets are registered, 3 hold unread data, and you call `epoll_wait`. What comes back, and at what cost?",
              options: [
                "All 10,000 entries with readiness flags, costing a full scan",
                "The 3 ready entries; the cost tracks the ready count because the kernel maintained a ready list as packets arrived",
                "Only the first ready socket",
                "Nothing: epoll_wait waits for a majority to be ready",
              ],
              answer: 1,
              explanation:
                "This is the improvement over select and poll, which rescan every watched fd per call. The kernel does its bookkeeping at packet arrival, so idle sockets add nothing to the price of asking.",
            },
            {
              kind: "mcq",
              prompt: "In a full runtime, who calls `wake()` for a future waiting on socket bytes?",
              options: [
                "The kernel, directly on the stored Waker",
                "The future itself, from inside poll",
                "The reactor: epoll_wait reports the fd, and the reactor fires the waker filed under it",
                "The executor, on a periodic maintenance timer",
              ],
              answer: 2,
              explanation:
                "The kernel only reports readiness to whoever calls epoll_wait. The reactor owns that call and completes the same contract Delay's sleeper thread honored in miniature.",
            },
          ],
        },
      ],
    },
  ],
}
