import type { SectionSeed } from "../types"

export const threadsSendSync: SectionSeed = {
  slug: "threads-send-sync",
  title: "Threads, Send and Sync",
  description: "Real threads, atomics, channels, locks, and what data races corrupt.",
  badgeIcon: "🧵",
  badgeTitle: "Threads",
  units: [
    {
      slug: "threads-and-races",
      title: "Threads and the race",
      description: "Spawn real OS threads, then see exactly what unsynchronized sharing corrupts.",
      lessons: [
        {
          slug: "thread-spawn-join",
          title: "Spawning threads",
          summary:
            "thread::spawn, JoinHandle, why the closure needs move, and what a thread costs.",
          contentFile: "thread-spawn-join.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "`thread::spawn(f)` returns:",
              options: [
                "Nothing until f finishes, then f's return value",
                "A JoinHandle immediately, while f runs concurrently",
                "A Future you must await",
                "A thread id; return values are not retrievable",
              ],
              answer: 1,
              explanation:
                "spawn returns at once and both threads run from that point. The closure's return value is retrieved later through join, which blocks until the thread ends.",
            },
            {
              kind: "predict",
              prompt: "A spawned closure reads a local `Vec` without `move`. The compiler:",
              options: [
                "Accepts it; the borrow ends at join",
                "Rejects it: the closure may outlive the function (E0373), and the fix is move",
                "Accepts it with a warning",
                "Rejects it only if the closure mutates the Vec",
              ],
              answer: 1,
              explanation:
                "spawn requires 'static closures because nothing forces the child to finish before the parent's frame dies; a join call is invisible to the type system. thread::scope is the tool when borrowing is the point.",
            },
            {
              kind: "mcq",
              prompt: "A spawned thread panics. When does the panic reach the spawning thread?",
              options: [
                "Immediately; the whole process aborts",
                "Never; panics cannot cross threads",
                "At join, as the Err case of its Result",
                "At the end of main",
              ],
              answer: 2,
              explanation:
                "The panic is captured and delivered as a value when you join; handle.join() returning Err is how you learn a worker died. An unjoined panicked thread just disappears.",
            },
          ],
        },
        {
          slug: "thread-data-races",
          title: "The data race, dissected",
          summary:
            "Two unsynchronized accesses, one a write: lost updates, torn values, undefined behavior.",
          contentFile: "thread-data-races.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which situation is a data race?",
              options: [
                "Two threads read the same value with no synchronization",
                "Two threads access the same location, at least one writes, nothing synchronizes them",
                "Any concurrent access to shared memory, even through a Mutex",
                "One thread writing data only it can reach",
              ],
              answer: 1,
              explanation:
                "All three ingredients are required: sharing, a write, and no synchronization. All-readers is safe, and a lock or atomic removes the third ingredient.",
            },
            {
              kind: "predict",
              prompt:
                "The unsafe counter runs 4 threads doing 1,000,000 unsynchronized `+= 1` each. The printed total:",
              options: [
                "Is always 4,000,000; addition is a single operation",
                "Is usually far less, and formally the program has no defined behavior at all",
                "Is always exactly half",
                "Varies but stays above 3,900,000",
              ],
              answer: 1,
              explanation:
                "Each += is load, add, store, and interleavings silently drop updates. Because a data race is UB, the optimizer may also transform the code into something stranger than any interleaving.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does Rust classify data races as undefined behavior rather than 'unpredictable but bounded'?",
              options: [
                "To match C for FFI compatibility",
                "Because the optimizer transforms code assuming no unsynchronized access, so a racy program's meaning genuinely evaporates",
                "Because hardware traps on concurrent writes",
                "It is not UB, just nondeterminism",
              ],
              answer: 1,
              explanation:
                "Register caching, hoisting, and reordering are all licensed by 'nothing else touches this memory'. Under a race those rewrites produce results no interleaving of your source could, like a whole loop collapsing into one store.",
            },
          ],
        },
      ],
    },
    {
      slug: "fearless-sharing",
      title: "What may cross a thread boundary",
      description:
        "Send, Sync, and channels: the compiler's rules for moving and sharing across threads.",
      lessons: [
        {
          slug: "thread-send-sync",
          title: "Send and Sync: permission to cross",
          summary: "The two marker traits that turn the data race into a compile error.",
          xp: 25,
          contentFile: "thread-send-sync.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Precisely, `T: Sync` means:",
              options: [
                "T can be moved to another thread",
                "&T can be sent to another thread, so many threads may hold shared references at once",
                "T contains a Mutex",
                "T is 'static",
              ],
              answer: 1,
              explanation:
                "Sync is defined through Send: T is Sync exactly when &T is Send. Moving the value itself to another thread is Send's job.",
            },
            {
              kind: "predict",
              prompt:
                "struct Metrics { delivered: u64, failed: u64 } derives nothing. You share an Arc<Metrics> across 8 threads that only read it. Does it compile?",
              options: [
                "No: Metrics must derive Send first",
                "No: Arc requires a Mutex inside",
                "Yes: Send and Sync are auto traits, u64 is both, and shared read-only access is safe",
                "Yes, but it is UB at runtime",
              ],
              answer: 2,
              explanation:
                "Auto traits are implemented structurally with no annotation, and many readers with zero writers is the safe half of the aliasing rule. Locks only become necessary once someone writes.",
            },
            {
              kind: "mcq",
              prompt: "`Rc` is `!Send` because:",
              options: [
                "Its reference count is non-atomic, so cross-thread clones and drops race on the count itself",
                "It points to the stack",
                "It is deprecated in multithreaded code",
                "Its data is always mutable",
              ],
              answer: 0,
              explanation:
                "Two threads doing load-add-store on the shared count is exactly the lost-update race, corrupting the count toward a double free or a leak. Arc's atomic count is both the difference and the price.",
            },
          ],
        },
        {
          slug: "thread-channels",
          title: "Channels: share by sending",
          summary: "mpsc, ownership moving through the channel, and why unbounded queues bite.",
          contentFile: "thread-channels.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                'let email = String::from("hi"); tx.send(email).unwrap(); println!("{email}"); compiles?',
              options: [
                "Yes; send clones internally",
                "No: E0382 borrow of moved value, because send takes ownership",
                "Yes, but it prints an empty string",
                "No: Strings cannot cross threads",
              ],
              answer: 1,
              explanation:
                "send moves its argument into the channel, the same move semantics as passing to any by-value function. The receiver becomes the sole owner, which is why no lock is ever involved.",
            },
            {
              kind: "mcq",
              prompt: "`for msg in rx` stops looping when:",
              options: [
                "The channel is momentarily empty",
                "Any one sender is dropped",
                "Every sender, the original and all clones, has been dropped",
                "A timeout elapses",
              ],
              answer: 2,
              explanation:
                "An empty-but-open channel makes the loop block, not end. The channel closes only when the last Sender dies, which is why a forgotten tx in main hangs the loop forever.",
            },
            {
              kind: "mcq",
              prompt: "With `mpsc::sync_channel(64)`, a send while 64 messages are queued:",
              options: [
                "Returns Err",
                "Blocks the sender until the consumer drains one: backpressure",
                "Silently drops the newest message",
                "Panics",
              ],
              answer: 1,
              explanation:
                "A bounded channel makes a slow consumer slow the producer down, converting a memory balloon into a throughput limit. The unbounded channel() would just keep buffering toward out-of-memory.",
            },
          ],
        },
      ],
    },
    {
      slug: "shared-mutable-state",
      title: "Shared mutable state",
      description: "Mutex, RwLock, and atomics: synchronized mutation with honest costs.",
      lessons: [
        {
          slug: "thread-locks",
          title: "Mutex and RwLock",
          summary: "Locks that own their data, guard scope, poisoning, and the held-too-long bug.",
          contentFile: "thread-locks.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Rust's `Mutex<T>` contains the T. Compared with a separate lock-plus-data convention, this guarantees:",
              options: [
                "Freedom from deadlocks",
                "The data cannot be touched without holding the lock, and unlock cannot be forgotten",
                "Faster locking",
                "The lock is released in the same statement it was taken",
              ],
              answer: 1,
              explanation:
                "The only route to the data is lock(), and release is the guard's Drop at scope end, so unlocked access and forgotten unlocks are both impossible. Deadlocks remain your problem.",
            },
            {
              kind: "predict",
              prompt:
                "A worker takes a guard, then makes a 2-second network call before the guard's scope ends. Other workers:",
              options: [
                "Proceed; locks only guard writes",
                "Wait the full 2 seconds; throughput collapses to serial",
                "Panic with PoisonError",
                "Steal the lock after a timeout",
              ],
              answer: 1,
              explanation:
                "The guard releases at scope end, per the Drop lesson, so the lock is held across the slow call. Scope guards tightly around memory work and do I/O outside.",
            },
            {
              kind: "mcq",
              prompt: "`lock()` returns `Err(PoisonError)` when:",
              options: [
                "Two threads request the lock at the same time",
                "A thread panicked while holding the guard, so the data's invariants may be half-updated",
                "The Mutex was dropped",
                "The data is currently borrowed",
              ],
              answer: 1,
              explanation:
                "Poisoning is a flag, not a rollback: writes completed before the panic are still there. unwrap() spreads the panic as policy; into_inner() opts into trusting the data anyway.",
            },
          ],
        },
        {
          slug: "thread-atomics",
          title: "Atomics: lock-free counting",
          summary: "fetch_add, the atomic type family, and a working dose of Ordering.",
          contentFile: "thread-atomics.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "`fetch_add` never loses an update because:",
              options: [
                "It takes a hidden lock",
                "It compiles to a single indivisible read-modify-write instruction, so there is no window between load and store",
                "The OS schedules only one thread at a time",
                "Relaxed ordering prevents interleaving",
              ],
              answer: 1,
              explanation:
                "lock xadd on x86, or a load-exclusive/store-exclusive retry loop on ARM, makes the increment uninterruptible in hardware. Ordering is a separate axis entirely.",
            },
            {
              kind: "predict",
              prompt:
                "Thread A: DATA.store(42, Relaxed); READY.store(true, Relaxed). Thread B sees READY == true, then loads DATA with Relaxed. B reads:",
              options: [
                "Guaranteed 42",
                "42 or 0: Relaxed gives no cross-variable ordering, so the stores may be observed reversed",
                "Guaranteed 0",
                "Nothing; this is UB",
              ],
              answer: 1,
              explanation:
                "Each access is atomic, so there is no UB and no tearing, but Relaxed promises nothing about ordering between variables. Publishing data behind a flag needs Release/Acquire or SeqCst.",
            },
            {
              kind: "mcq",
              prompt:
                "The right tool for 'move 50 credits between two balances, atomically together':",
              options: [
                "Two AtomicU64s updated with SeqCst",
                "One AtomicU64 per balance, updated back to back",
                "A Mutex around both balances: atomics cannot update two locations as one transaction",
                "fetch_add with Relaxed on each",
              ],
              answer: 2,
              explanation:
                "Atomicity covers one machine word at a time, so a reader between two separate atomic updates sees credits vanish. Multi-field invariants are what locks are for.",
            },
          ],
        },
      ],
    },
  ],
}
