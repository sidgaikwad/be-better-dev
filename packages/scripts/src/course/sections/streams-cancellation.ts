import type { SectionSeed } from "../types"

// Part 2, section 5: streams, select, timeouts, and the cancellation model
// they all share. Builds on the Iterators and closures section (adapter
// vocabulary) and the tokio section (tasks, blocking pitfalls).

export const streamsCancellation: SectionSeed = {
  slug: "streams-cancellation",
  title: "Streams, select, cancellation",
  description: "Streams, timeouts, cancellation safety.",
  badgeIcon: "🌊",
  badgeTitle: "Streams",
  units: [
    {
      slug: "streams-and-select",
      title: "Streams and select",
      description: "Async sequences, and racing more than one source in a single loop.",
      lessons: [
        {
          slug: "stream-async-iterator",
          title: "Stream: the async Iterator",
          summary: "poll_next, the StreamExt adapters, and while let as the missing async for.",
          contentFile: "stream-async-iterator.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "`poll_next` returns `Poll::Ready(None)`. What is the stream telling you?",
              options: [
                "No item is ready yet; poll again after the waker fires",
                "The stream is finished and will yield no more items",
                "The current item was empty, but more may follow",
                "The stream hit an error",
              ],
              answer: 1,
              explanation:
                "Ready(None) is the async end-of-sequence, mirroring Iterator::next returning None. 'Not ready yet' is Poll::Pending, a different axis entirely.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does consuming a stream use `while let Some(x) = stream.next().await` instead of a `for` loop?",
              options: [
                "Streams cannot be moved into loops because of Pin",
                "`for` desugars to the synchronous Iterator protocol, and Rust has no async version of that desugaring yet",
                "`for` bodies cannot contain await expressions",
                "StreamExt::next is faster than IntoIterator",
              ],
              answer: 1,
              explanation:
                "for is hardwired to IntoIterator and a blocking next. Until async iteration syntax stabilizes, while let over next().await is the idiom.",
            },
            {
              kind: "predict",
              prompt:
                "The delivery worker's `while let` loop awaits `rows.next()`, but Postgres has not produced the next row yet. What does the task do?",
              options: [
                "It spins, calling poll_next in a busy loop",
                "It blocks its OS worker thread until data arrives",
                "It suspends; the reactor wakes it when the connection's socket becomes readable",
                "It receives None and exits the loop",
              ],
              answer: 2,
              explanation:
                "poll_next returns Pending after registering the waker, and the task yields the thread: the tokio section's scheduling, exactly. None would falsely signal end-of-stream.",
            },
          ],
        },
        {
          slug: "stream-select",
          title: "select!: racing futures",
          summary: "One loop, many sources; biased order; losing branches are cancelled.",
          contentFile: "stream-select.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "One branch of a `select!` completes. What happens to the other branches' futures?",
              options: [
                "They continue running in the background",
                "They are parked and resumed on the next loop iteration",
                "They are dropped, cancelling whatever progress they had made",
                "They are moved onto freshly spawned tasks",
              ],
              answer: 2,
              explanation:
                "select! destroys the losers on the spot; a loop rebuilds fresh futures next pass. Whether the discarded progress matters is the cancellation safety question.",
            },
            {
              kind: "predict",
              prompt:
                "A loop uses `select!` with `biased;`, listing the shutdown branch first and a `jobs.recv()` branch second. A job and the shutdown signal are both ready on the same pass. Which handler runs?",
              options: [
                "The jobs handler; work has priority",
                "The shutdown handler; biased polls top to bottom",
                "One of the two, at random",
                "Both, shutdown first",
              ],
              answer: 1,
              explanation:
                "biased; replaces the default random polling with strict source order, which is exactly why you list shutdown first. Exactly one branch wins per select!.",
            },
            {
              kind: "mcq",
              prompt: "Why does `select!` poll its branches in random order by default?",
              options: [
                "Randomness makes races resolve faster",
                "To spread load across worker threads",
                "So an always-ready branch cannot systematically starve the branches below it",
                "To defend against timing attacks",
              ],
              answer: 2,
              explanation:
                "Random polling is fairness insurance. Opting into biased; hands that responsibility back to you along with deterministic priority.",
            },
          ],
        },
      ],
    },
    {
      slug: "deadlines-and-cancellation",
      title: "Deadlines and cancellation",
      description: "Timeouts as races, and what dropping a future runs and skips.",
      lessons: [
        {
          slug: "stream-timeouts",
          title: "Timeouts are races",
          summary:
            "tokio::time::timeout wraps any await in a deadline; the losing side is dropped.",
          contentFile: "stream-timeouts.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "`timeout(Duration::from_secs(10), send_email(...)).await` returns `Ok(Err(e))`. What happened?",
              options: [
                "The deadline passed before the call finished",
                "The call finished within the deadline, and failed",
                "The call succeeded, but slowly",
                "The timer failed to start",
              ],
              answer: 1,
              explanation:
                "The outer Result reports the race (Ok means the operation beat the timer); the inner one is the operation's own verdict. A deadline miss would be Err(Elapsed).",
            },
            {
              kind: "predict",
              prompt:
                "On a single poll, the wrapped future and the timer have both become ready. What does the timeout report?",
              options: [
                "Err(Elapsed): the deadline takes precedence",
                "The completed value: the inner future is polled before the timer",
                "Whichever the runtime picks at random",
                "It panics; the state is ambiguous",
              ],
              answer: 1,
              explanation:
                "Timeout checks the inner future first on every poll, so finished work is never misreported as timed out.",
            },
            {
              kind: "mcq",
              prompt:
                "The email send timed out and its future was dropped. What do you know about the email?",
              options: [
                "It was not sent; cancellation undoes the request",
                "It was sent; the provider just responded slowly",
                "Nothing certain: the request may have reached the provider, and the timeout does not undo it",
                "reqwest will resend it automatically",
              ],
              answer: 2,
              explanation:
                "Dropping the future abandons the waiting, not bytes already on the wire. That uncertainty is why retry-after-timeout needs the idempotency work of the fault-tolerance material.",
            },
          ],
        },
        {
          slug: "stream-cancellation",
          title: "Cancellation: just drop the future",
          summary: "Dropping a future cancels it: what still runs, what never does.",
          contentFile: "stream-cancellation.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "`let g = m.lock().await; step().await; audit_log();` The future is cancelled while awaiting `step()`. What happens?",
              options: [
                "The lock stays held forever, and audit_log is skipped",
                "The lock is released, and audit_log runs",
                "The lock is released, and audit_log never runs",
                "The lock stays held, and audit_log runs at shutdown",
              ],
              answer: 2,
              explanation:
                "Cancellation drops the future's live values, so the guard's destructor releases the lock; but code after the await simply never executes. Values are cleaned up, code is skipped.",
            },
            {
              kind: "mcq",
              prompt: "What does dropping a tokio `JoinHandle` do to its task?",
              options: [
                "Aborts it at the next await point",
                "Nothing: the task detaches and keeps running",
                "Blocks until the task finishes",
                "Makes the runtime restart it",
              ],
              answer: 1,
              explanation:
                "Only abort() cancels through a handle; dropping merely gives up the ability to join. The JoinSet lesson turns that shrug into ownership.",
            },
            {
              kind: "mcq",
              prompt: "Where can cancellation land inside an async fn?",
              options: [
                "Anywhere, including halfway through a statement",
                "Only at .await points; a synchronous stretch always runs to the next await once entered",
                "Only where the author calls a cancellation check",
                "Only at the function's entry",
              ],
              answer: 1,
              explanation:
                "Cancelling means never polling again, and polls hand back control only at awaits. That is also why a never-yielding loop or a running spawn_blocking closure cannot be aborted.",
            },
          ],
        },
      ],
    },
    {
      slug: "cancel-safety-and-structure",
      title: "Cancel safety and structure",
      description: "Which awaits tolerate cancellation, and task groups that shut down cleanly.",
      lessons: [
        {
          slug: "stream-cancel-safety",
          title: "Cancellation safety",
          summary: "The property select loops demand: which awaits can be abandoned mid-flight.",
          xp: 25,
          contentFile: "stream-cancel-safety.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which of these is safe to use directly as a `select!` branch in a loop?",
              options: [
                "socket.read_exact(&mut buf)",
                "jobs.recv() on an mpsc receiver",
                "socket.write_all(&frame)",
                "reader.read_line(&mut line)",
              ],
              answer: 1,
              explanation:
                "recv only dequeues a message at the instant it completes, so a cancelled recv loses nothing. The other three keep partial progress in the future and are documented not cancel-safe.",
            },
            {
              kind: "predict",
              prompt:
                "A branch future is `async { let job = jobs.recv().await.unwrap(); deliver(job).await }`. Another branch wins while `deliver` is in flight. What happened to the job?",
              options: [
                "Still in the channel; recv is cancel-safe",
                "Delivered; deliver keeps running detached",
                "Gone: it was dequeued, and dropping the block destroyed the only copy",
                "Requeued automatically by the drop",
              ],
              answer: 2,
              explanation:
                "Each await was individually fine, but after recv completes the job lives only in the future's state, which the cancellation destroyed. Cancel safety does not compose.",
            },
            {
              kind: "mcq",
              prompt: "How do you determine whether a tokio operation is safe inside `select!`?",
              options: [
                "The compiler rejects unsafe ones",
                "clippy has a lint for it",
                "Read the method's documented Cancel safety section, and the list on the select! page",
                "Benchmark it under load",
              ],
              answer: 2,
              explanation:
                "Cancel safety is a semantic contract no tool checks; tokio documents it per method precisely because the compiler cannot.",
            },
          ],
        },
        {
          slug: "stream-joinset",
          title: "JoinSet and structured shutdown",
          summary: "Dynamic task groups, abort handles, and draining cleanly on shutdown.",
          contentFile: "stream-joinset.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Ten tasks are spawned onto a JoinSet. In what order does `join_next` return their results?",
              options: [
                "Spawn order",
                "Reverse spawn order",
                "Completion order",
                "Random order each call",
              ],
              answer: 2,
              explanation:
                "join_next yields whichever task finishes next, which lets a supervisor react to fast failures immediately instead of waiting behind a slow early task.",
            },
            {
              kind: "predict",
              prompt:
                "A JoinSet with tasks still running goes out of scope. What happens to those tasks?",
              options: [
                "They keep running detached, like dropped JoinHandles",
                "They are all aborted",
                "The drop blocks until they finish",
                "They are handed to the runtime's global set",
              ],
              answer: 1,
              explanation:
                "Dropping the set aborts every remaining task: children cannot outlive their owner. That reversal of JoinHandle's detach-on-drop is the structured half of structured concurrency.",
            },
            {
              kind: "mcq",
              prompt: "Why can `Some(res) = set.join_next()` sit inside a `select!` loop at all?",
              options: [
                "join_next is documented cancel-safe: losing the race never discards a finished task's result",
                "JoinSet is protected by an internal lock",
                "select! never cancels JoinSet futures",
                "It cannot; the pattern requires biased;",
              ],
              answer: 0,
              explanation:
                "A completed task's output is only handed over when the future completes, so a cancelled join_next loses nothing: the exact property the cancellation safety lesson demands of every branch.",
            },
          ],
        },
      ],
    },
  ],
}
